import { Command } from "commander";
import { createRequire } from "node:module";
import { logger } from "./lib/logger.js";
import { registerInitCommand } from "./commands/init.js";
import { registerGenerateCommand } from "./commands/generate.js";
import { registerConfigCommand } from "./commands/config.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { version: string; description: string };

export function buildProgram(): Command {
  const program = new Command();

  program
    .name("forge")
    .description(pkg.description)
    .version(pkg.version)
    .option("-v, --verbose", "print debug output")
    .option("-q, --quiet", "suppress non-error output")
    .option("--dry-run", "show what would happen without writing any files")
    .hook("preAction", (thisCommand) => {
      const opts = thisCommand.optsWithGlobals<{
        verbose?: boolean;
        quiet?: boolean;
      }>();
      if (opts.quiet) logger.setLevel("silent");
      else if (opts.verbose) logger.setLevel("verbose");
    });

  registerInitCommand(program);
  registerGenerateCommand(program);
  registerConfigCommand(program);

  return program;
}

export async function run(argv: string[]): Promise<void> {
  const program = buildProgram();
  await program.parseAsync(argv);
}
