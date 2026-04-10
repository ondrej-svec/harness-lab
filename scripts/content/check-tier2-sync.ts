/**
 * Tier 2 sync checker: verify Czech/English markdown pairs exist
 * and surface cs_reviewed staleness.
 *
 * For every Czech file in content/, workshop-skill/, materials/
 * (excluding locales/en/), verify a matching English file in locales/en/.
 * For every English file, verify a matching Czech file.
 *
 * Usage: bun scripts/content/check-tier2-sync.ts
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "../..");

// Directories to scan for Tier 2 content
const TIER2_DIRS = ["content", "workshop-skill", "materials"];

// Files/directories to skip entirely
const SKIP_PATTERNS = [
  "locales",
  "node_modules",
  ".next",
  "SKILL.md", // workshop-skill internal, not bilingual
];

// Files that are genuinely Czech-only (no English counterpart needed)
const CZECH_ONLY = new Set([
  "content/czech-reject-list.md",
  "content/czech-editorial-review-checklist.md",
  "content/style-guide.md",
  "content/style-examples.md",
  "content/codex-craft.md",
  "workshop-skill/closing-skill.md",
  "workshop-skill/facilitator.md",
  "workshop-skill/template-agents.md",
  "workshop-skill/install.md",
  "workshop-skill/analyze-checklist.md",
  "materials/README.md",
  "materials/coaching-codex.md",
  "content/challenge-cards/print-spec.md",
]);

type SyncResult = {
  missingEnglish: string[];
  missingCzech: string[];
  staleNodes: string[];
  ok: string[];
};

function collectMarkdownFiles(dir: string, skipLocales = true): string[] {
  const results: string[] = [];
  const absDir = resolve(ROOT, dir);

  if (!existsSync(absDir)) return results;

  function walk(current: string) {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      const rel = relative(ROOT, full);

      // Skip non-content directories (node_modules, .next, SKILL.md, etc.)
      if (SKIP_PATTERNS.some((p) => entry === p) && entry !== "locales") continue;
      // Skip locales directory when collecting Czech (non-locale) files
      if (entry === "locales" && skipLocales) continue;

      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (entry.endsWith(".md")) {
        results.push(rel);
      }
    }
  }

  walk(absDir);
  return results;
}

function collectEnglishFiles(dir: string): string[] {
  const results: string[] = [];
  const localeDir = resolve(ROOT, dir, "locales/en");

  if (!existsSync(localeDir)) return results;

  function walk(current: string) {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (entry.endsWith(".md")) {
        results.push(relative(ROOT, full));
      }
    }
  }

  walk(localeDir);
  return results;
}

function czechPathToEnglishPath(czechPath: string): string {
  // content/talks/context-is-king.md -> content/talks/locales/en/context-is-king.md
  const dir = dirname(czechPath);
  const file = basename(czechPath);
  return join(dir, "locales/en", file);
}

function englishPathToCzechPath(englishPath: string): string {
  // content/talks/locales/en/context-is-king.md -> content/talks/context-is-king.md
  const parts = englishPath.split("/");
  const localeIdx = parts.indexOf("locales");
  if (localeIdx === -1) return englishPath;
  // Remove "locales/en" from the path
  const before = parts.slice(0, localeIdx);
  const after = parts.slice(localeIdx + 2);
  return [...before, ...after].join("/");
}

function readCsReviewed(filePath: string): boolean | null {
  const absPath = resolve(ROOT, filePath);
  if (!existsSync(absPath)) return null;

  const content = readFileSync(absPath, "utf-8");
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return true; // No frontmatter = assume reviewed (backwards compatible)

  const frontmatter = frontmatterMatch[1];
  const reviewedMatch = frontmatter.match(/cs_reviewed:\s*(true|false)/);
  if (!reviewedMatch) return true; // No cs_reviewed field = assume reviewed

  return reviewedMatch[1] === "true";
}

function checkSync(): SyncResult {
  const result: SyncResult = {
    missingEnglish: [],
    missingCzech: [],
    staleNodes: [],
    ok: [],
  };

  for (const dir of TIER2_DIRS) {
    // Collect Czech files (non-locale)
    const czechFiles = collectMarkdownFiles(dir, true);
    const englishFiles = collectEnglishFiles(dir);

    // Check each Czech file has an English counterpart
    for (const czFile of czechFiles) {
      if (CZECH_ONLY.has(czFile)) continue;

      const expectedEnPath = czechPathToEnglishPath(czFile);
      if (!existsSync(resolve(ROOT, expectedEnPath))) {
        result.missingEnglish.push(czFile);
      } else {
        const reviewed = readCsReviewed(czFile);
        if (reviewed === false) {
          result.staleNodes.push(czFile);
        } else {
          result.ok.push(czFile);
        }
      }
    }

    // Check each English file has a Czech counterpart
    for (const enFile of englishFiles) {
      const expectedCzPath = englishPathToCzechPath(enFile);
      if (!existsSync(resolve(ROOT, expectedCzPath))) {
        result.missingCzech.push(enFile);
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const result = checkSync();

console.log("\nTier 2 Sync Check");
console.log("=================\n");

if (result.ok.length > 0) {
  console.log(`Synced pairs: ${result.ok.length}`);
}

if (result.staleNodes.length > 0) {
  console.warn(`\nStale (cs_reviewed: false): ${result.staleNodes.length}`);
  for (const f of result.staleNodes) {
    console.warn(`  - ${f}`);
  }
}

if (result.missingEnglish.length > 0) {
  console.error(`\nMissing English counterpart: ${result.missingEnglish.length}`);
  for (const f of result.missingEnglish) {
    console.error(`  - ${f} -> ${czechPathToEnglishPath(f)}`);
  }
}

if (result.missingCzech.length > 0) {
  console.error(`\nMissing Czech counterpart: ${result.missingCzech.length}`);
  for (const f of result.missingCzech) {
    console.error(`  - ${f} -> ${englishPathToCzechPath(f)}`);
  }
}

const hasHardErrors = result.missingEnglish.length > 0 || result.missingCzech.length > 0;

if (hasHardErrors) {
  console.error("\nSync check FAILED. Missing counterparts must be created.");
  process.exit(1);
} else if (result.staleNodes.length > 0) {
  console.warn("\nSync check PASSED with warnings. Stale nodes need review.");
} else {
  console.log("\nSync check PASSED. All pairs in sync.");
}
