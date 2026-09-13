import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";

/**
 * Resolves templates/<subdir> relative to the running module.
 *
 * This has to work in two very different layouts:
 *  - dev (`npm run dev`, tsx runs src/ directly): the caller lives at
 *    src/commands/<file>.ts, two directories below the project root.
 *  - prod (`npm run build`, tsup bundles everything into dist/index.js):
 *    every module's import.meta.url collapses to dist/index.js, one
 *    directory below the project root.
 *
 * Rather than hardcode one depth, we try both and pick whichever exists.
 */
export function resolveTemplatesRoot(
  importMetaUrl: string,
  subdir: string
): string {
  const dir = path.dirname(fileURLToPath(importMetaUrl));
  const candidates = [
    path.join(dir, "..", "..", "templates", subdir), // src/commands/*.ts
    path.join(dir, "..", "templates", subdir), // bundled dist/index.js
  ];
  return candidates.find((c) => fs.existsSync(c)) ?? candidates[0];
}
