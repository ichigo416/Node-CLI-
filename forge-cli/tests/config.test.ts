import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  loadProjectConfig,
  DEFAULT_CONFIG,
  setGlobalConfigValue,
  getGlobalConfigValue,
} from "../src/lib/config.js";

describe("loadProjectConfig", () => {
  it("falls back to defaults when no config file exists", async () => {
    const emptyDir = await fs.mkdtemp(path.join(os.tmpdir(), "forge-test-"));
    const config = await loadProjectConfig(emptyDir);
    expect(config).toEqual(DEFAULT_CONFIG);
    await fs.remove(emptyDir);
  });

  it("merges a project .forgerc.json over the defaults", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "forge-test-"));
    await fs.writeJson(path.join(dir, ".forgerc.json"), {
      author: "Ada Lovelace",
    });
    const config = await loadProjectConfig(dir);
    expect(config.author).toBe("Ada Lovelace");
    expect(config.defaultTemplate).toBe(DEFAULT_CONFIG.defaultTemplate);
    await fs.remove(dir);
  });
});

describe("global config", () => {
  const originalHome = os.homedir();
  let tmpHome: string;

  beforeEach(async () => {
    tmpHome = await fs.mkdtemp(path.join(os.tmpdir(), "forge-home-"));
    vi.spyOn(os, "homedir").mockReturnValue(tmpHome);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.remove(tmpHome);
    void originalHome;
  });

  it("round-trips a string value", async () => {
    await setGlobalConfigValue("author", "Grace Hopper");
    expect(await getGlobalConfigValue("author")).toBe("Grace Hopper");
  });

  it("coerces booleans and numbers on write", async () => {
    await setGlobalConfigValue("telemetry", "false");
    await setGlobalConfigValue("retries", "3");
    expect(await getGlobalConfigValue("telemetry")).toBe(false);
    expect(await getGlobalConfigValue("retries")).toBe(3);
  });
});
