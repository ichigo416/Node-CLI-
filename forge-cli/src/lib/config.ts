import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import { cosmiconfig } from "cosmiconfig";
import { logger } from "./logger.js";

export interface ForgeConfig {
  /** Default template used by `forge init` when --template isn't passed. */
  defaultTemplate: string;
  /** Where `forge generate <type>` writes files, keyed by type. */
  generatePaths: Record<string, string>;
  /** Author name interpolated into generated templates. */
  author: string;
}

export const DEFAULT_CONFIG: ForgeConfig = {
  defaultTemplate: "basic",
  generatePaths: {
    component: "src/components",
    service: "src/services",
  },
  author: "",
};

const MODULE_NAME = "forge";

/**
 * Resolves project-level config by searching upward from cwd for:
 * .forgerc, .forgerc.json, .forgerc.{js,cjs,mjs}, forge.config.js, or a
 * "forge" key in package.json. Falls back to DEFAULT_CONFIG when none found.
 */
export async function loadProjectConfig(
  cwd: string = process.cwd()
): Promise<ForgeConfig> {
  const explorer = cosmiconfig(MODULE_NAME);
  try {
    const result = await explorer.search(cwd);
    if (!result || result.isEmpty) {
      logger.debug("no project config found, using defaults");
      return { ...DEFAULT_CONFIG };
    }
    logger.debug(`loaded project config from ${result.filepath}`);
    return { ...DEFAULT_CONFIG, ...result.config };
  } catch (err) {
    logger.warn("failed to parse project config, falling back to defaults");
    logger.debug(String(err));
    return { ...DEFAULT_CONFIG };
  }
}

// ---- Global (per-user) config, used by `forge config get/set/list` ----

function globalConfigPath(): string {
  return path.join(os.homedir(), ".forgerc.json");
}

export async function readGlobalConfig(): Promise<Record<string, unknown>> {
  const file = globalConfigPath();
  if (!(await fs.pathExists(file))) return {};
  try {
    return await fs.readJson(file);
  } catch {
    logger.warn(`could not parse ${file}; treating it as empty`);
    return {};
  }
}

export async function writeGlobalConfig(
  data: Record<string, unknown>
): Promise<void> {
  await fs.writeJson(globalConfigPath(), data, { spaces: 2 });
}

export async function setGlobalConfigValue(
  key: string,
  value: string
): Promise<void> {
  const current = await readGlobalConfig();
  current[key] = coerce(value);
  await writeGlobalConfig(current);
}

export async function getGlobalConfigValue(
  key: string
): Promise<unknown> {
  const current = await readGlobalConfig();
  return current[key];
}

/** Turns "true"/"false"/numeric strings into real types when saving config. */
function coerce(value: string): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value !== "" && !Number.isNaN(Number(value))) return Number(value);
  return value;
}
