/**
 * Generate the `inventory.briefs` section of workshop-content/agenda.json
 * from the canonical English markdowns at
 * content/project-briefs/locales/en/*.md and Czech counterparts at
 * content/project-briefs/*.md.
 *
 * Usage:
 *   bun scripts/content/generate-briefs-inventory.ts           # rewrite
 *   bun scripts/content/generate-briefs-inventory.ts --verify  # diff check
 */

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { BilingualProjectBrief } from "../../dashboard/lib/types/bilingual-agenda";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(MODULE_DIR, "../..");
const EN_BRIEFS_DIR = join(ROOT, "content/project-briefs/locales/en");
const CS_BRIEFS_DIR = join(ROOT, "content/project-briefs");
const AGENDA_PATH = join(ROOT, "workshop-content/agenda.json");
const HASH_LOCK_PATH = join(ROOT, "workshop-content/.brief-hashes.json");

type BriefLocale = "en" | "cs";

type ParsedBrief = {
  title: string;
  problem: string;
  userStories: string[];
  architectureNotes: string[];
  acceptanceCriteria: string[];
  firstAgentPrompt: string;
};

type SectionMap = Record<BriefLocale, Record<string, keyof ParsedBrief>>;

const SECTION_MAP: SectionMap = {
  en: {
    Problem: "problem",
    "User stories": "userStories",
    "Architecture notes": "architectureNotes",
    "Done when": "acceptanceCriteria",
    "First step for the agent": "firstAgentPrompt",
  },
  cs: {
    "Problém": "problem",
    "User stories": "userStories",
    "Architektonické poznámky": "architectureNotes",
    "Hotovo když": "acceptanceCriteria",
    "První krok pro agenta": "firstAgentPrompt",
  },
};

const LIST_KEYS: ReadonlySet<keyof ParsedBrief> = new Set([
  "userStories",
  "architectureNotes",
  "acceptanceCriteria",
]);

export function parseBriefMarkdown(source: string, locale: BriefLocale): ParsedBrief {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const result: ParsedBrief = {
    title: "",
    problem: "",
    userStories: [],
    architectureNotes: [],
    acceptanceCriteria: [],
    firstAgentPrompt: "",
  };

  const sections = SECTION_MAP[locale];
  let currentField: keyof ParsedBrief | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (!currentField) return;
    const text = buffer.join("\n").trim();
    if (LIST_KEYS.has(currentField)) {
      const items = text
        .split(/\n(?=\s*[-*]\s)/)
        .map((item) => item.replace(/^\s*[-*]\s+/, "").trim())
        .filter(Boolean);
      (result[currentField] as string[]) = items;
    } else {
      (result[currentField] as string) = text;
    }
    buffer = [];
  };

  for (const line of lines) {
    const h1 = /^#\s+(.+)$/.exec(line);
    if (h1) {
      if (!result.title) {
        result.title = h1[1].trim();
      }
      continue;
    }
    const h2 = /^##\s+(.+)$/.exec(line);
    if (h2) {
      flush();
      const key = h2[1].trim();
      currentField = sections[key] ?? null;
      continue;
    }
    if (currentField) {
      buffer.push(line);
    }
  }
  flush();

  return result;
}

export function loadBriefs(): BilingualProjectBrief[] {
  if (!existsSync(EN_BRIEFS_DIR)) {
    throw new Error(`English briefs directory missing: ${EN_BRIEFS_DIR}`);
  }
  const enFiles = readdirSync(EN_BRIEFS_DIR)
    .filter((name) => name.endsWith(".md"))
    .sort();

  return enFiles.map((filename) => {
    const id = filename.replace(/\.md$/, "");
    const enPath = join(EN_BRIEFS_DIR, filename);
    const csPath = join(CS_BRIEFS_DIR, filename);
    const enSource = readFileSync(enPath, "utf-8");
    const csSource = existsSync(csPath) ? readFileSync(csPath, "utf-8") : enSource;
    const en = parseBriefMarkdown(enSource, "en");
    const cs = parseBriefMarkdown(csSource, "cs");
    // When Czech source is missing, fall back to English content so the
    // schema stays populated. The cs_reviewed lockfile flags such drift.
    if (!existsSync(csPath)) {
      cs.title = en.title;
      cs.problem = en.problem;
      cs.userStories = [...en.userStories];
      cs.architectureNotes = [...en.architectureNotes];
      cs.acceptanceCriteria = [...en.acceptanceCriteria];
      cs.firstAgentPrompt = en.firstAgentPrompt;
    }
    return { id, en, cs };
  });
}

type HashLock = Record<string, { en: string; cs: string; cs_reviewed: boolean }>;

function hashContent(text: string): string {
  return createHash("sha1").update(text).digest("hex");
}

function readHashLock(): HashLock {
  if (!existsSync(HASH_LOCK_PATH)) return {};
  try {
    return JSON.parse(readFileSync(HASH_LOCK_PATH, "utf-8")) as HashLock;
  } catch {
    return {};
  }
}

export function computeNextHashLock(previous: HashLock): HashLock {
  const enFiles = readdirSync(EN_BRIEFS_DIR)
    .filter((name) => name.endsWith(".md"))
    .sort();
  const next: HashLock = {};
  for (const filename of enFiles) {
    const id = filename.replace(/\.md$/, "");
    const enSource = readFileSync(join(EN_BRIEFS_DIR, filename), "utf-8");
    const csPath = join(CS_BRIEFS_DIR, filename);
    const csSource = existsSync(csPath) ? readFileSync(csPath, "utf-8") : "";
    const enHash = hashContent(enSource);
    const csHash = hashContent(csSource);
    const prior = previous[id];
    let csReviewed = prior?.cs_reviewed ?? true;
    if (prior) {
      const enChanged = prior.en !== enHash;
      const csChanged = prior.cs !== csHash;
      if (enChanged && !csChanged) {
        csReviewed = false;
      }
    } else {
      csReviewed = csSource ? true : false;
    }
    next[id] = { en: enHash, cs: csHash, cs_reviewed: csReviewed };
  }
  return next;
}

function stableStringify(value: unknown, indent = 2): string {
  return `${JSON.stringify(value, null, indent)}\n`;
}

function rewriteAgendaBriefs(briefs: BilingualProjectBrief[]): string {
  const agenda = JSON.parse(readFileSync(AGENDA_PATH, "utf-8")) as {
    inventory: { briefs: BilingualProjectBrief[] };
  };
  agenda.inventory.briefs = briefs;
  return stableStringify(agenda);
}

function main() {
  const verify = process.argv.includes("--verify");
  const briefs = loadBriefs();
  const nextAgenda = rewriteAgendaBriefs(briefs);
  const previousLock = readHashLock();
  const nextLock = computeNextHashLock(previousLock);
  const nextLockText = stableStringify(nextLock);

  if (verify) {
    const currentAgenda = readFileSync(AGENDA_PATH, "utf-8");
    const currentLock = existsSync(HASH_LOCK_PATH) ? readFileSync(HASH_LOCK_PATH, "utf-8") : "";
    const issues: string[] = [];
    if (currentAgenda !== nextAgenda) {
      issues.push("workshop-content/agenda.json inventory.briefs is out of sync with markdown sources");
    }
    if (currentLock !== nextLockText) {
      issues.push("workshop-content/.brief-hashes.json is out of sync with markdown sources");
    }
    if (issues.length > 0) {
      for (const issue of issues) console.error(`  - ${issue}`);
      console.error("Run `npm run generate:briefs` to update.");
      process.exit(1);
    }
    console.log("briefs inventory is in sync");
    return;
  }

  writeFileSync(AGENDA_PATH, nextAgenda);
  writeFileSync(HASH_LOCK_PATH, nextLockText);
  console.log(`Wrote ${briefs.length} briefs to ${AGENDA_PATH}`);
}

const invokedDirectly = process.argv[1]
  ? resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;
if (invokedDirectly) {
  main();
}
