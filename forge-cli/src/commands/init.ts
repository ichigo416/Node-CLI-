import path from "node:path";
import fs from "fs-extra";
import ejs from "ejs";
import inquirer from "inquirer";
import ora from "ora";
import { Command } from "commander";
import { logger } from "../lib/logger.js";
import { loadProjectConfig } from "../lib/config.js";
import { isValidName } from "../lib/utils.js";
import { resolveTemplatesRoot } from "../lib/paths.js";
import type { GlobalOptions } from "../types.js";

// Templates ship inside the package under templates/init/<name>/
const TEMPLATES_ROOT = resolveTemplatesRoot(import.meta.url, "init");

async function listTemplates(): Promise<string[]> {
  if (!(await fs.pathExists(TEMPLATES_ROOT))) return [];
  const entries = await fs.readdir(TEMPLATES_ROOT, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

interface InitOptions extends GlobalOptions {
  template?: string;
  force?: boolean;
}

async function renderTemplateDir(
  srcDir: string,
  destDir: string,
  data: Record<string, unknown>,
  dryRun: boolean
): Promise<void> {
  const entries = await fs.readdir(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destName = entry.name.replace(/\.ejs$/, "");
    const destPath = path.join(destDir, destName);

    if (entry.isDirectory()) {
      if (!dryRun) await fs.ensureDir(destPath);
      logger.debug(`created directory ${destPath}`);
      await renderTemplateDir(srcPath, destPath, data, dryRun);
      continue;
    }

    if (entry.name.endsWith(".ejs")) {
      const raw = await fs.readFile(srcPath, "utf8");
      const rendered = ejs.render(raw, data);
      logger.debug(`render ${srcPath} -> ${destPath}`);
      if (!dryRun) {
        await fs.ensureDir(path.dirname(destPath));
        await fs.writeFile(destPath, rendered);
      }
    } else {
      logger.debug(`copy ${srcPath} -> ${destPath}`);
      if (!dryRun) {
        await fs.ensureDir(path.dirname(destPath));
        await fs.copy(srcPath, destPath);
      }
    }
  }
}

export function registerInitCommand(program: Command): void {
  program
    .command("init <name>")
    .description("Scaffold a new project from a template")
    .option("-t, --template <name>", "template to use (skips the prompt)")
    .option("-f, --force", "overwrite the target directory if it exists")
    .action(async (name: string, cmdOptions: InitOptions, cmd: Command) => {
      const global = cmd.optsWithGlobals<GlobalOptions>();
      const options = { ...global, ...cmdOptions };

      if (!isValidName(name)) {
        logger.error(
          `"${name}" is not a valid project name (letters, numbers, - and _ only, must start with a letter).`
        );
        process.exitCode = 1;
        return;
      }

      const targetDir = path.resolve(process.cwd(), name);
      const config = await loadProjectConfig();
      const available = await listTemplates();

      if (available.length === 0) {
        logger.error(
          `No templates found under ${TEMPLATES_ROOT}. Is the package installed correctly?`
        );
        process.exitCode = 1;
        return;
      }

      let template = options.template ?? config.defaultTemplate;
      if (options.template && !available.includes(options.template)) {
        logger.error(
          `Unknown template "${options.template}". Available: ${available.join(", ")}`
        );
        process.exitCode = 1;
        return;
      }
      if (!options.template) {
        const answer = await inquirer.prompt<{ template: string }>([
          {
            type: "list",
            name: "template",
            message: "Which template do you want to use?",
            choices: available,
            default: available.includes(config.defaultTemplate)
              ? config.defaultTemplate
              : available[0],
          },
        ]);
        template = answer.template;
      }

      if ((await fs.pathExists(targetDir)) && !options.force) {
        logger.error(
          `Directory "${name}" already exists. Use --force to overwrite.`
        );
        process.exitCode = 1;
        return;
      }

      const spinner = ora(`Scaffolding "${name}" with "${template}"`).start();
      try {
        await renderTemplateDir(
          path.join(TEMPLATES_ROOT, template),
          targetDir,
          {
            projectName: name,
            author: config.author || process.env.USER || "",
            year: new Date().getFullYear(),
          },
          Boolean(options.dryRun)
        );
        spinner.succeed(
          options.dryRun
            ? `Dry run complete — no files were written for "${name}".`
            : `Project "${name}" created.`
        );
        if (!options.dryRun) {
          logger.info(`Next steps:`);
          logger.info(`  cd ${name}`);
          logger.info(`  npm install`);
        }
      } catch (err) {
        spinner.fail(`Failed to scaffold "${name}"`);
        logger.error("See details below", err);
        process.exitCode = 1;
      }
    });
}
