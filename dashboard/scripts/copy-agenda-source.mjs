/**
 * Copy `workshop-content/agenda.json` (the bilingual authoring source)
 * into `dashboard/lib/__generated__/agenda-source.json` so Turbopack
 * can resolve the import during `next build`. Turbopack does not
 * honour `experimental.externalDir` the way Webpack does.
 *
 * The destination is gitignored; production and preview deploys get
 * a fresh copy on each build. Dashboard tests re-import the same
 * local path, so the generator's content-drift guard
 * (`scripts/content/generate-views.ts --verify`) continues to cover
 * the authoring source.
 *
 * Runs via the `prebuild` npm hook; also invoked from vitest's
 * globalSetup so tests don't need a separate bootstrap.
 */

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const DASHBOARD_ROOT = resolve(MODULE_DIR, "..");
const SOURCE = resolve(DASHBOARD_ROOT, "../workshop-content/agenda.json");
const DEST_DIR = resolve(DASHBOARD_ROOT, "lib/__generated__");
const DEST = resolve(DEST_DIR, "agenda-source.json");

if (!existsSync(SOURCE)) {
  console.error(`[copy-agenda-source] Missing authoring source: ${SOURCE}`);
  process.exit(1);
}

mkdirSync(DEST_DIR, { recursive: true });
copyFileSync(SOURCE, DEST);
console.log(`[copy-agenda-source] ${SOURCE} → ${DEST}`);
