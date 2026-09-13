import { run } from "./cli.js";
import { logger } from "./lib/logger.js";

run(process.argv).catch((err) => {
  logger.error("Unexpected error", err);
  process.exitCode = 1;
});
