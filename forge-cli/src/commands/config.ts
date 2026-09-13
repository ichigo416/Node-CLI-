import { Command } from "commander";
import { logger } from "../lib/logger.js";
import {
  readGlobalConfig,
  setGlobalConfigValue,
  getGlobalConfigValue,
} from "../lib/config.js";

export function registerConfigCommand(program: Command): void {
  const config = program
    .command("config")
    .description("Read or write persistent user configuration (~/.forgerc.json)");

  config
    .command("get <key>")
    .description("Print the value of a config key")
    .action(async (key: string) => {
      const value = await getGlobalConfigValue(key);
      if (value === undefined) {
        logger.warn(`"${key}" is not set.`);
        return;
      }
      console.log(value);
    });

  config
    .command("set <key> <value>")
    .description("Set a config key to a value")
    .action(async (key: string, value: string) => {
      await setGlobalConfigValue(key, value);
      logger.success(`${key} = ${value}`);
    });

  config
    .command("list")
    .description("Print all config key/value pairs")
    .action(async () => {
      const all = await readGlobalConfig();
      if (Object.keys(all).length === 0) {
        logger.info("No config set yet. Try: forge config set author \"Your Name\"");
        return;
      }
      for (const [key, value] of Object.entries(all)) {
        console.log(`${key} = ${JSON.stringify(value)}`);
      }
    });
}
