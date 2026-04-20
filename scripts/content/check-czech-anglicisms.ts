/**
 * Czech anglicism reject-list checker for workshop content.
 *
 * Scans all Czech strings in the bilingual agenda source and flags
 * English words that have natural Czech equivalents. Technical terms
 * that live in Czech developer vocabulary (workflow, feature, review,
 * runbook, checkpoint, etc.) are explicitly allowed.
 *
 * Usage:
 *   bun scripts/content/check-czech-anglicisms.ts
 */

import { existsSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = resolve(import.meta.dir, "../..");
const SOURCE_PATH = join(ROOT, "workshop-content/agenda.json");

// ---------------------------------------------------------------------------
// Reject list: English words that should not appear in Czech prose.
// Each entry has the regex pattern and a suggested Czech replacement.
// ---------------------------------------------------------------------------

const REJECT_LIST: Array<{ pattern: RegExp; word: string; suggestion: string }> = [
  { pattern: /\brescue\b/gi, word: "rescue", suggestion: "záchrana / pomoc" },
  { pattern: /\bhandoff[uůemy]?\b/gi, word: "handoff", suggestion: "předání" },
  { pattern: /\bReveal\b/g, word: "Reveal", suggestion: "Závěr / Závěr a reflexe" },
  { pattern: /(?<![/-])\breveal\b/gi, word: "reveal", suggestion: "závěr / závěr dne" },
  { pattern: /\bbridge\b/gi, word: "bridge", suggestion: "přechod / přemostění" },
  { pattern: /\bbeat[uy]?\b/gi, word: "beat", suggestion: "krok / okamžik" },
  { pattern: /\bonboarding\b/gi, word: "onboarding", suggestion: "zaučení / uvítání" },
  { pattern: /\btool demo\b/gi, word: "tool demo", suggestion: "ukázka nástroje" },
  { pattern: /\bcontest\b/gi, word: "contest", suggestion: "soutěž" },
  { pattern: /\bfeature race\b/gi, word: "feature race", suggestion: "závod ve funkcích" },
  { pattern: /\bfeature motion\b/gi, word: "feature motion", suggestion: "práce na funkcích" },
  { pattern: /\bfeature tour\b/gi, word: "feature tour", suggestion: "přehlídka funkcí" },
  { pattern: /\bstatus update\b/gi, word: "status update", suggestion: "přehled stavu" },
  { pattern: /\bseed data\b/gi, word: "seed data", suggestion: "vzorová data" },
  { pattern: /\bmock fallback\b/gi, word: "mock fallback", suggestion: "záložní vzorová data" },
  { pattern: /\brubric\b/gi, word: "rubric", suggestion: "hodnoticí schéma" },
  { pattern: /\b[Ff]allback[yůs]?\b/g, word: "fallback", suggestion: "záložní varianta / náhradní řešení" },
  { pattern: /\bbrief\b/gi, word: "brief", suggestion: "zadání / souhrn" },
];

// ---------------------------------------------------------------------------
// Walk all Czech strings in the agenda JSON
// ---------------------------------------------------------------------------

type Finding = {
  path: string;
  word: string;
  suggestion: string;
  snippet: string;
};

function isIdOrCodeField(key: string): boolean {
  return ["id", "path", "href", "ctaHref", "chromePreset", "sceneType", "intent", "kind", "surface", "defaultSceneId", "roomSceneIds"].includes(key);
}

function scanValue(value: unknown, path: string, findings: Finding[]): void {
  if (typeof value === "string") {
    for (const entry of REJECT_LIST) {
      const matches = value.match(entry.pattern);
      if (matches) {
        findings.push({
          path,
          word: matches[0],
          suggestion: entry.suggestion,
          snippet: value.length > 120 ? value.slice(0, 120) + "…" : value,
        });
      }
    }
  } else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      scanValue(value[i], `${path}[${i}]`, findings);
    }
  } else if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      // Skip English content entirely
      if (key === "en") continue;
      // Skip code identifier fields
      if (isIdOrCodeField(key)) continue;
      scanValue(child, path ? `${path}.${key}` : key, findings);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

if (!existsSync(SOURCE_PATH)) {
  console.error(`Source not found: ${SOURCE_PATH}`);
  process.exit(1);
}

const source = JSON.parse(require("node:fs").readFileSync(SOURCE_PATH, "utf-8"));
const findings: Finding[] = [];
scanValue(source, "", findings);

if (findings.length === 0) {
  console.log("Czech anglicism check PASSED. No rejected words found.");
  process.exit(0);
}

console.error(`\nCzech anglicism check FAILED. Found ${findings.length} rejected word(s):\n`);
for (const f of findings) {
  console.error(`  "${f.word}" at ${f.path}`);
  console.error(`    → use: ${f.suggestion}`);
  console.error(`    text: ${f.snippet}\n`);
}
console.error("Fix the Czech text or update the reject list in scripts/content/check-czech-anglicisms.ts");
process.exit(1);
