import path from "node:path";
import fs from "fs-extra";
import ejs from "ejs";
import ora from "ora";
import { Command } from "commander";
import { logger } from "../lib/logger.js";
import { loadProjectConfig } from "../lib/config.js";
import { isValidName, toPascalCase, toKebabCase } from "../lib/utils.js";
import { resolveTemplatesRoot } from "../lib/paths.js";
import type { GlobalOptions } from "../types.js";

const TEMPLATES_ROOT = resolveTemplatesRoot(import.meta.url, "generate");

async function listGenerators(): Promise<string[]> {
  if (!(await fs.pathExists(TEMPLATES_ROOT))) return [];
  const entries = await fs.readdir(TEMPLATES_ROOT, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

interface GenerateOptions extends GlobalOptions {
  out?: string;
}

export function registerGenerateCommand(program: Command): void {
  program
    .command("generate <type> <name>")
    .alias("g")
    .description("Generate boilerplate files (e.g. component, service)")
    .option("-o, --out <dir>", "override the output directory for this run")
    .action(
      async (
        type: string,
        name: string,
        cmdOptions: GenerateOptions,
        cmd: Command
      ) => {
        const global = cmd.optsWithGlobals<GlobalOptions>();
        const options = { ...global, ...cmdOptions };

        const available = await listGenerators();
        if (!available.includes(type)) {
          logger.error(
            `Unknown generator "${type}". Available: ${available.join(", ") || "(none found)"}`
          );
          process.exitCode = 1;
          return;
        }
        if (!isValidName(name)) {
          logger.error(`"${name}" is not a valid name.`);
          process.exitCode = 1;
          return;
        }

        const config = await loadProjectConfig();
        const outDir = path.resolve(
          process.cwd(),
          options.out ?? config.generatePaths[type] ?? "."
        );

        const srcDir = path.join(TEMPLATES_ROOT, type);
        const files = (await fs.readdir(srcDir)).filter((f) =>
          f.endsWith(".ejs")
        );

        const data = {
          name,
          pascalName: toPascalCase(name),
          kebabName: toKebabCase(name),
          author: config.author,
        };

        const spinner = ora(`Generating "${type}" for "${name}"`).start();
        const written: string[] = [];
        try {
          for (const file of files) {
            const raw = await fs.readFile(path.join(srcDir, file), "utf8");
            const rendered = ejs.render(raw, data);
            // e.g. "Component.tsx.ejs" -> "MyButton.tsx"
            const destFileName = file
              .replace(/\.ejs$/, "")
              .replace(/Component|Service/, data.pascalName);
            const destPath = path.join(outDir, destFileName);

            if (!options.dryRun) {
              await fs.ensureDir(outDir);
              await fs.writeFile(destPath, rendered);
            }
            written.push(destPath);
            logger.debug(`wrote ${destPath}`);
          }
          spinner.succeed(
            options.dryRun
              ? `Dry run — would write ${written.length} file(s).`
              : `Generated ${written.length} file(s) in ${outDir}`
          );
          written.forEach((f) => logger.info(`  ${f}`));
        } catch (err) {
          spinner.fail(`Failed to generate "${type}"`);
          logger.error("See details below", err);
          process.exitCode = 1;
        }
      }
    );
}
