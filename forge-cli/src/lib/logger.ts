import chalk from "chalk";

export type LogLevel = "silent" | "normal" | "verbose";

/**
 * Small dependency-free logger with three levels:
 *  - silent:  only errors
 *  - normal:  info / success / warn / error (default)
 *  - verbose: everything, including debug()
 *
 * The level is set once at CLI startup (from --verbose / --quiet flags)
 * and read by every command via getLogger().
 */
class Logger {
  private level: LogLevel = "normal";

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  debug(message: string): void {
    if (this.level !== "verbose") return;
    console.log(chalk.gray(`  • ${message}`));
  }

  info(message: string): void {
    if (this.level === "silent") return;
    console.log(chalk.cyan("info"), message);
  }

  success(message: string): void {
    if (this.level === "silent") return;
    console.log(chalk.green("✔"), message);
  }

  warn(message: string): void {
    if (this.level === "silent") return;
    console.warn(chalk.yellow("warn"), message);
  }

  error(message: string, err?: unknown): void {
    console.error(chalk.red("error"), message);
    if (err && this.level === "verbose") {
      console.error(err instanceof Error ? err.stack : err);
    }
  }
}

// Singleton — every command imports the same instance.
export const logger = new Logger();
