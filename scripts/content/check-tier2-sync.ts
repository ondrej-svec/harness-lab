/**
 * Tier 2 sync checker: verify English/Czech markdown pairs exist
 * and surface cs_reviewed staleness.
 *
 * Post-2026-04-13 layout: English is canonical (at root), Czech is the
 * reviewed delivery locale (in `locales/cs/`). For every English file
 * at the root of content/ and materials/ (excluding `locales/`), verify
 * a matching Czech file in `locales/cs/`.
 *
 * Usage: bun scripts/content/check-tier2-sync.ts
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "../..");

// Directories to scan for Tier 2 content.
// workshop-skill/ is excluded as of 2026-04-12: skill reference docs are
// English-canonical per docs/adr/2026-04-12-skill-docs-english-canonical.md
// and the agent translates on the fly. No bilingual pair to sync.
const TIER2_DIRS = ["content", "materials"];

// Files/directories to skip entirely
const SKIP_PATTERNS = [
  "locales",
  "node_modules",
  ".next",
  "SKILL.md", // workshop-skill internal, not bilingual
];

// Files at the root that are genuinely single-language (no bilingual
// counterpart needed). After the 2026-04-13 layout flip, the root holds
// English-canonical content with two exceptions:
//   1. Czech style references — meta-documents *about* Czech writing that
//      would be nonsensical in English.
//   2. `content/codex-craft.md` — facilitator-internal Czech reference.
//   3. `materials/README.md` — directory index, Czech-only by design.
const SINGLE_LANGUAGE_ROOT = new Set([
  "content/czech-reject-list.md",
  "content/czech-editorial-review-checklist.md",
  "content/style-guide.md",
  "content/style-examples.md",
  "content/codex-craft.md",
  "materials/README.md",
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

function collectCzechFiles(dir: string): string[] {
  const results: string[] = [];
  const localeDir = resolve(ROOT, dir);

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

  // Walk every subdirectory named "cs" under a "locales" parent.
  function findCsDirs(current: string) {
    if (!existsSync(current)) return;
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (!statSync(full).isDirectory()) continue;
      if (entry === "cs" && basename(current) === "locales") {
        walk(full);
      } else {
        findCsDirs(full);
      }
    }
  }

  findCsDirs(localeDir);
  return results;
}

function englishPathToCzechPath(englishPath: string): string {
  // content/talks/context-is-king.md -> content/talks/locales/cs/context-is-king.md
  const dir = dirname(englishPath);
  const file = basename(englishPath);
  return join(dir, "locales/cs", file);
}

function czechPathToEnglishPath(czechPath: string): string {
  // content/talks/locales/cs/context-is-king.md -> content/talks/context-is-king.md
  const parts = czechPath.split("/");
  const localeIdx = parts.indexOf("locales");
  if (localeIdx === -1) return czechPath;
  // Remove "locales/cs" from the path
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
    // Collect English-canonical files at the root (non-locale)
    const englishFiles = collectMarkdownFiles(dir, true);
    // Collect Czech translations under locales/cs/
    const czechFiles = collectCzechFiles(dir);

    // Check each English file has a Czech counterpart
    for (const enFile of englishFiles) {
      if (SINGLE_LANGUAGE_ROOT.has(enFile)) continue;

      const expectedCzPath = englishPathToCzechPath(enFile);
      if (!existsSync(resolve(ROOT, expectedCzPath))) {
        result.missingCzech.push(enFile);
      } else {
        const reviewed = readCsReviewed(expectedCzPath);
        if (reviewed === false) {
          result.staleNodes.push(expectedCzPath);
        } else {
          result.ok.push(enFile);
        }
      }
    }

    // Check each Czech file has an English canonical at the root
    for (const czFile of czechFiles) {
      const expectedEnPath = czechPathToEnglishPath(czFile);
      if (!existsSync(resolve(ROOT, expectedEnPath))) {
        result.missingEnglish.push(czFile);
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

void basename; // keep import alive for future use

const hasHardErrors = result.missingEnglish.length > 0 || result.missingCzech.length > 0;

if (hasHardErrors) {
  console.error("\nSync check FAILED. Missing counterparts must be created.");
  process.exit(1);
} else if (result.staleNodes.length > 0) {
  console.warn("\nSync check PASSED with warnings. Stale nodes need review.");
} else {
  console.log("\nSync check PASSED. All pairs in sync.");
}
