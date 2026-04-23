/**
 * Generate language-specific views from the bilingual source.
 *
 * Usage:
 *   bun scripts/content/generate-views.ts           # generate views
 *   bun scripts/content/generate-views.ts --verify   # verify committed views match source
 */

import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type {
  BilingualAgenda,
  BilingualPhase,
  BilingualScene,
  BilingualParticipantMoment,
  BilingualSceneContent,
  BilingualPhaseContent,
  BilingualProjectBrief,
  BilingualChallenge,
  BilingualTickerItem,
  BilingualSetupPath,
  PresenterBlock,
  WorkshopSourceRef,
  FacilitatorRunner,
} from "../../dashboard/lib/types/bilingual-agenda";
import {
  generateAgendaView,
  generatePublicBlueprint,
  type AgendaMode,
} from "../../dashboard/lib/content-views/agenda-view";
import type {
  BilingualReferenceSource,
  BilingualReferenceGroup,
  BilingualReferenceItem,
  GeneratedReferenceView,
  GeneratedReferenceGroup,
  GeneratedReferenceItem,
} from "../../dashboard/lib/types/bilingual-reference";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = resolve(import.meta.dir, "../..");
const SOURCE_PATH = join(ROOT, "workshop-content/agenda.json");
const REFERENCE_SOURCE_PATH = join(ROOT, "workshop-content/reference.json");
const GENERATED_DIR = join(ROOT, "dashboard/lib/generated");
const BLUEPRINT_DIR = join(ROOT, "workshop-blueprint");

// ---------------------------------------------------------------------------
// Read and validate source
// ---------------------------------------------------------------------------

function readSource(): BilingualAgenda {
  if (!existsSync(SOURCE_PATH)) {
    console.error(`Source not found: ${SOURCE_PATH}`);
    process.exit(1);
  }
  const text = require("node:fs").readFileSync(SOURCE_PATH, "utf-8");
  return JSON.parse(text) as BilingualAgenda;
}

type ValidationError = { path: string; message: string };

function validate(source: BilingualAgenda): ValidationError[] {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  if (source.schemaVersion !== 3) {
    errors.push({ path: "schemaVersion", message: `Expected 3, got ${source.schemaVersion}` });
  }

  for (const phase of source.phases) {
    for (const lang of ["en", "cs"] as const) {
      const content = phase[lang];
      if (!content.label) errors.push({ path: `phases.${phase.id}.${lang}.label`, message: "Empty label" });
      if (!content.goal) errors.push({ path: `phases.${phase.id}.${lang}.goal`, message: "Empty goal" });
    }

    if (!phase.cs_reviewed) {
      warnings.push(`phases.${phase.id}: cs_reviewed = false`);
    }

    for (const scene of phase.scenes) {
      for (const lang of ["en", "cs"] as const) {
        const content = scene[lang];
        if (!content.label) errors.push({ path: `phases.${phase.id}.scenes.${scene.id}.${lang}.label`, message: "Empty label" });
        if (!content.title) errors.push({ path: `phases.${phase.id}.scenes.${scene.id}.${lang}.title`, message: "Empty title" });
      }

      if (!scene.cs_reviewed) {
        warnings.push(`phases.${phase.id}.scenes.${scene.id}: cs_reviewed = false`);
      }
    }
  }

  if (warnings.length > 0) {
    console.warn(`\nWarnings (cs_reviewed = false):`);
    for (const w of warnings) {
      console.warn(`  - ${w}`);
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// View transforms live in `dashboard/lib/content-views/agenda-view.ts`
// so they can be shared between this generator and dashboard tests.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Write helpers
// ---------------------------------------------------------------------------

function writeJson(filePath: string, data: unknown) {
  const dir = filePath.substring(0, filePath.lastIndexOf("/"));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  require("node:fs").writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function filesMatch(pathA: string, pathB: string): boolean {
  if (!existsSync(pathA) || !existsSync(pathB)) return false;
  const a = require("node:fs").readFileSync(pathA, "utf-8");
  const b = require("node:fs").readFileSync(pathB, "utf-8");
  return a === b;
}

// ---------------------------------------------------------------------------
// Reference catalog: read, validate, generate
// ---------------------------------------------------------------------------

function readReferenceSource(): BilingualReferenceSource {
  if (!existsSync(REFERENCE_SOURCE_PATH)) {
    console.error(`Reference source not found: ${REFERENCE_SOURCE_PATH}`);
    process.exit(1);
  }
  const text = require("node:fs").readFileSync(REFERENCE_SOURCE_PATH, "utf-8");
  return JSON.parse(text) as BilingualReferenceSource;
}

function validateReference(source: BilingualReferenceSource): ValidationError[] {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  if (source.schemaVersion !== 1) {
    errors.push({
      path: "reference.schemaVersion",
      message: `Expected 1, got ${source.schemaVersion}`,
    });
  }

  const seenGroupIds = new Set<string>();
  for (const group of source.groups) {
    if (seenGroupIds.has(group.id)) {
      errors.push({ path: `reference.groups.${group.id}`, message: "Duplicate group id" });
    }
    seenGroupIds.add(group.id);

    for (const lang of ["en", "cs"] as const) {
      const content = group[lang];
      if (!content.title) {
        errors.push({ path: `reference.groups.${group.id}.${lang}.title`, message: "Empty title" });
      }
      if (!content.description) {
        errors.push({
          path: `reference.groups.${group.id}.${lang}.description`,
          message: "Empty description",
        });
      }
    }
    if (!group.cs_reviewed) {
      warnings.push(`reference.groups.${group.id}: cs_reviewed = false`);
    }

    const seenItemIds = new Set<string>();
    for (const item of group.items) {
      const path = `reference.groups.${group.id}.items.${item.id}`;
      if (seenItemIds.has(item.id)) {
        errors.push({ path, message: "Duplicate item id" });
      }
      seenItemIds.add(item.id);

      for (const lang of ["en", "cs"] as const) {
        const content = item[lang];
        if (!content.label) {
          errors.push({ path: `${path}.${lang}.label`, message: "Empty label" });
        }
        if (!content.description) {
          errors.push({ path: `${path}.${lang}.description`, message: "Empty description" });
        }
      }
      if (!item.cs_reviewed) {
        warnings.push(`${path}: cs_reviewed = false`);
      }

      switch (item.kind) {
        case "external":
          if (!item.href) {
            errors.push({ path: `${path}.href`, message: "Empty href on external item" });
          }
          break;
        case "repo-blob":
        case "repo-tree":
          if (!item.path) {
            errors.push({ path: `${path}.path`, message: `Empty path on ${item.kind} item` });
          }
          break;
        case "repo-root":
          break;
        case "hosted":
          if (!item.bodyPath) {
            errors.push({ path: `${path}.bodyPath`, message: "Empty bodyPath on hosted item" });
          } else {
            const absoluteBodyPath = join(ROOT, item.bodyPath);
            if (!existsSync(absoluteBodyPath)) {
              errors.push({
                path: `${path}.bodyPath`,
                message: `Hosted item bodyPath does not exist: ${item.bodyPath}`,
              });
            }
          }
          break;
        case "artifact":
          // `artifact` kind is override-only. Cohort-scoped artifacts
          // live in `workshop_artifacts` and are referenced only via a
          // per-instance `reference_groups` override — never via the
          // bilingual source. See types/bilingual-reference.ts.
          errors.push({
            path: `${path}.kind`,
            message:
              "`artifact` kind is override-only and cannot appear in the bilingual source; attach uploaded artifacts via `harness workshop artifact attach` instead",
          });
          break;
        default:
          errors.push({
            path: `${path}.kind`,
            message: `Unknown kind: ${(item as { kind: string }).kind}`,
          });
      }
    }
  }

  if (warnings.length > 0) {
    console.warn(`\nReference warnings (cs_reviewed = false):`);
    for (const w of warnings) console.warn(`  - ${w}`);
  }

  return errors;
}

function generateReferenceItem(
  item: BilingualReferenceItem,
  lang: "en" | "cs",
): GeneratedReferenceItem {
  const content = item[lang];
  // Structural fields (kind + path/href) come from the item; label/description
  // come from the locale-specific content. Spread order matters: kind wins
  // over any accidental override from content.
  const base = { id: item.id, label: content.label, description: content.description };
  switch (item.kind) {
    case "external":
      return { ...base, kind: "external", href: item.href };
    case "repo-blob":
      return { ...base, kind: "repo-blob", path: item.path };
    case "repo-tree":
      return { ...base, kind: "repo-tree", path: item.path };
    case "repo-root":
      return { ...base, kind: "repo-root" };
    case "hosted": {
      // Inline the MD body from bodyPath; validated non-missing by
      // validateReference above. bodyPath is stripped from the generated
      // view (build-time only). sourceUrl passes through unchanged when
      // provided.
      const body = require("node:fs").readFileSync(join(ROOT, item.bodyPath!), "utf-8") as string;
      return {
        ...base,
        kind: "hosted",
        body,
        ...(item.sourceUrl ? { sourceUrl: item.sourceUrl } : {}),
      };
    }
  }
}

function generateReferenceGroup(
  group: BilingualReferenceGroup,
  lang: "en" | "cs",
): GeneratedReferenceGroup {
  const content = group[lang];
  return {
    id: group.id,
    title: content.title,
    description: content.description,
    items: group.items.map((item) => generateReferenceItem(item, lang)),
  };
}

function generateReferenceView(
  source: BilingualReferenceSource,
  lang: "en" | "cs",
): GeneratedReferenceView {
  return {
    schemaVersion: 1,
    groups: source.groups.map((group) => generateReferenceGroup(group, lang)),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const isVerify = process.argv.includes("--verify");
const source = readSource();
const referenceSource = readReferenceSource();

// Validate
const errors = [...validate(source), ...validateReference(referenceSource)];
if (errors.length > 0) {
  console.error("\nValidation errors:");
  for (const e of errors) {
    console.error(`  ${e.path}: ${e.message}`);
  }
  process.exit(1);
}

const csView = generateAgendaView(source, "cs", "facilitator");
const enView = generateAgendaView(source, "en", "facilitator");
const csParticipantView = generateAgendaView(source, "cs", "participant");
const enParticipantView = generateAgendaView(source, "en", "participant");
const publicBlueprint = generatePublicBlueprint(source);
const csReferenceView = generateReferenceView(referenceSource, "cs");
const enReferenceView = generateReferenceView(referenceSource, "en");

if (isVerify) {
  // Verify mode: generate to temp dir and compare
  const tmpDir = mkdtempSync(join(tmpdir(), "content-verify-"));
  try {
    const tmpCsPath = join(tmpDir, "agenda-cs.json");
    const tmpEnPath = join(tmpDir, "agenda-en.json");
    const tmpCsParticipantPath = join(tmpDir, "agenda-cs-participant.json");
    const tmpEnParticipantPath = join(tmpDir, "agenda-en-participant.json");
    const tmpBpPath = join(tmpDir, "blueprint-agenda.json");
    const tmpCsReferencePath = join(tmpDir, "reference-cs.json");
    const tmpEnReferencePath = join(tmpDir, "reference-en.json");

    writeJson(tmpCsPath, csView);
    writeJson(tmpEnPath, enView);
    writeJson(tmpCsParticipantPath, csParticipantView);
    writeJson(tmpEnParticipantPath, enParticipantView);
    writeJson(tmpBpPath, publicBlueprint);
    writeJson(tmpCsReferencePath, csReferenceView);
    writeJson(tmpEnReferencePath, enReferenceView);

    const csMatch = filesMatch(tmpCsPath, join(GENERATED_DIR, "agenda-cs.json"));
    const enMatch = filesMatch(tmpEnPath, join(GENERATED_DIR, "agenda-en.json"));
    const csPMatch = filesMatch(tmpCsParticipantPath, join(GENERATED_DIR, "agenda-cs-participant.json"));
    const enPMatch = filesMatch(tmpEnParticipantPath, join(GENERATED_DIR, "agenda-en-participant.json"));
    const bpMatch = filesMatch(tmpBpPath, join(BLUEPRINT_DIR, "agenda.json"));
    const csRefMatch = filesMatch(tmpCsReferencePath, join(GENERATED_DIR, "reference-cs.json"));
    const enRefMatch = filesMatch(tmpEnReferencePath, join(GENERATED_DIR, "reference-en.json"));

    const mismatches: string[] = [];
    if (!csMatch) mismatches.push("dashboard/lib/generated/agenda-cs.json");
    if (!enMatch) mismatches.push("dashboard/lib/generated/agenda-en.json");
    if (!csPMatch) mismatches.push("dashboard/lib/generated/agenda-cs-participant.json");
    if (!enPMatch) mismatches.push("dashboard/lib/generated/agenda-en-participant.json");
    if (!bpMatch) mismatches.push("workshop-blueprint/agenda.json");
    if (!csRefMatch) mismatches.push("dashboard/lib/generated/reference-cs.json");
    if (!enRefMatch) mismatches.push("dashboard/lib/generated/reference-en.json");

    if (mismatches.length > 0) {
      console.error("\nGenerated content files are out of date:");
      for (const m of mismatches) {
        console.error(`  - ${m}`);
      }
      console.error('\nRun `npm run generate:content` first, or edit `workshop-content/agenda.json` instead of the generated files.');
      process.exit(1);
    }

    console.log("Content verification passed. Generated files match source.");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
} else {
  // Generate mode: write to actual locations
  writeJson(join(GENERATED_DIR, "agenda-cs.json"), csView);
  writeJson(join(GENERATED_DIR, "agenda-en.json"), enView);
  writeJson(join(GENERATED_DIR, "agenda-cs-participant.json"), csParticipantView);
  writeJson(join(GENERATED_DIR, "agenda-en-participant.json"), enParticipantView);
  writeJson(join(BLUEPRINT_DIR, "agenda.json"), publicBlueprint);
  writeJson(join(GENERATED_DIR, "reference-cs.json"), csReferenceView);
  writeJson(join(GENERATED_DIR, "reference-en.json"), enReferenceView);

  console.log("Generated views:");
  console.log(`  dashboard/lib/generated/agenda-cs.json`);
  console.log(`  dashboard/lib/generated/agenda-en.json`);
  console.log(`  dashboard/lib/generated/agenda-cs-participant.json`);
  console.log(`  dashboard/lib/generated/agenda-en-participant.json`);
  console.log(`  dashboard/lib/generated/reference-cs.json`);
  console.log(`  dashboard/lib/generated/reference-en.json`);
  console.log(`  workshop-blueprint/agenda.json (public blueprint)`);
}
