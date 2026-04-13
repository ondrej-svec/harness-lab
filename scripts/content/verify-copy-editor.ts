#!/usr/bin/env bun
/**
 * Verify the copy-editor gate as part of `npm run verify:content`.
 *
 * Discovers the copy-audit script from the marvin plugin (installed
 * either as a sibling repo, via the `HEART_OF_GOLD_TOOLKIT` env var,
 * or from the default Claude plugin marketplace cache) and runs it on
 * the reviewed Czech locale markdown scope. The current copy-audit
 * engine is not locale-aware inside the mixed `en`/`cs` branches of
 * `workshop-content/agenda.json`; running Czech typography over that
 * bilingual JSON binds English strings as if they were Czech and
 * produces false positives. The CI gate therefore audits the reviewed
 * Czech locale files directly and leaves agenda Czech to generated-view
 * sync plus human Czech signoff in the review notes. The gate fails if
 * any included file:
 *
 *   - has no lockfile entry,
 *   - has a stale contentHash (file changed since segmentation),
 *   - has `reviewedBy: null` (segmentation was produced but never
 *     signed off by a human),
 *   - produces any error-severity typography findings.
 *
 * This is how harness-lab enforces Czech typography at the content
 * CI layer. The copy-editor lockfile (.copy-editor.lock.json) is the
 * committed artefact that makes the gate reproducible.
 *
 * Exit codes:
 *   0 = gate passed
 *   1 = gate failed (typography errors or unreviewed entries)
 *   2 = could not locate copy-audit script
 */

import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "..", "..");
const reviewedMarkdownPaths = [
  "materials/locales/cs/**/*.md",
  "content/project-briefs/locales/cs/**/*.md",
  "content/challenge-cards/locales/cs/**/*.md",
  "content/facilitation/locales/cs/**/*.md",
  "content/talks/locales/cs/**/*.md",
  "content/style-guide.md",
  "content/style-examples.md",
  "content/czech-editorial-review-checklist.md",
  "content/czech-reject-list.md",
].join(",");

function candidatePaths(): string[] {
  const relFromRepo =
    "plugins/marvin/skills/copy-editor/scripts/copy-audit.ts";
  const candidates: string[] = [];

  // 1. Explicit env var — highest priority for CI.
  if (process.env.HEART_OF_GOLD_TOOLKIT) {
    candidates.push(resolve(process.env.HEART_OF_GOLD_TOOLKIT, relFromRepo));
  }

  // 2. Sibling repo (typical developer layout).
  candidates.push(
    resolve(repoRoot, "..", "heart-of-gold-toolkit", relFromRepo),
  );

  // 3. Claude Code plugin marketplace cache.
  candidates.push(
    resolve(
      homedir(),
      ".claude/plugins/marketplaces/heart-of-gold-toolkit",
      relFromRepo,
    ),
  );

  return candidates;
}

function findCopyAudit(): string | null {
  for (const path of candidatePaths()) {
    if (existsSync(path)) return path;
  }
  return null;
}

function runAudit(script: string, args: string[]): number {
  const result = spawnSync("bun", [script, ...args], { stdio: "inherit" });

  if (result.error) {
    console.error(`verify-copy-editor: failed to spawn bun: ${result.error.message}`);
    return 2;
  }

  return result.status ?? 1;
}

function main(): void {
  const script = findCopyAudit();
  if (!script) {
    console.error("verify-copy-editor: could not locate copy-audit.ts.");
    console.error("Tried:");
    for (const path of candidatePaths()) console.error(`  ${path}`);
    console.error("");
    console.error(
      "Set HEART_OF_GOLD_TOOLKIT to the toolkit repo root, or clone it as a sibling of harness-lab.",
    );
    process.exit(2);
  }

  const configPath = resolve(repoRoot, ".copy-editor.yaml");
  if (!existsSync(configPath)) {
    console.error(`verify-copy-editor: config not found at ${configPath}`);
    process.exit(2);
  }

  console.log(`verify-copy-editor: using ${script}`);
  const status = runAudit(script, [
    "--config",
    configPath,
    "--paths",
    reviewedMarkdownPaths,
    "--require-reviewed",
  ]);

  process.exit(status);
}

main();
