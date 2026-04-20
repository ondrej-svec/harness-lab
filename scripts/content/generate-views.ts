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

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = resolve(import.meta.dir, "../..");
const SOURCE_PATH = join(ROOT, "workshop-content/agenda.json");
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
// Generate language-specific phase view (same shape as current agenda.json)
// ---------------------------------------------------------------------------

function generatePhaseView(phase: BilingualPhase, lang: "en" | "cs") {
  const content = phase[lang];
  return {
    id: phase.id,
    order: phase.order,
    label: content.label,
    startTime: phase.startTime,
    kind: phase.kind,
    intent: phase.intent,
    goal: content.goal,
    roomSummary: content.roomSummary,
    facilitatorPrompts: content.facilitatorPrompts,
    watchFors: content.watchFors,
    checkpointQuestions: content.checkpointQuestions,
    sourceRefs: content.sourceRefs,
    facilitatorRunner: content.facilitatorRunner,
    defaultSceneId: phase.defaultSceneId,
    scenes: phase.scenes.map((scene) => generateSceneView(scene, lang)),
    participantMoments: (phase.participantMoments ?? []).map((moment) =>
      generateParticipantMomentView(moment, lang),
    ),
  };
}

function generateSceneView(scene: BilingualScene, lang: "en" | "cs") {
  const content = scene[lang];
  const result: Record<string, unknown> = {
    id: scene.id,
    label: content.label,
    sceneType: scene.sceneType,
    intent: scene.intent,
    chromePreset: scene.chromePreset,
    title: content.title,
    body: content.body,
    facilitatorNotes: content.facilitatorNotes,
    sourceRefs: content.sourceRefs,
    blocks: content.blocks,
  };

  if (scene.surface) result.surface = scene.surface;
  if (content.ctaLabel != null) result.ctaLabel = content.ctaLabel;
  if (content.ctaHref != null) result.ctaHref = content.ctaHref;

  return result;
}

function generateParticipantMomentView(moment: BilingualParticipantMoment, lang: "en" | "cs") {
  const content = moment[lang];
  const result: Record<string, unknown> = {
    id: moment.id,
    label: content.label,
    title: content.title,
    body: content.body,
    blocks: content.blocks,
    feedbackEnabled: moment.feedbackEnabled ?? true,
  };

  if (Array.isArray(moment.roomSceneIds) && moment.roomSceneIds.length > 0) {
    result.roomSceneIds = moment.roomSceneIds;
  }
  if (moment.poll) {
    const pollContent = moment.poll[lang];
    result.poll = {
      id: moment.poll.id,
      prompt: pollContent.prompt,
      options: pollContent.options,
    };
  }
  if (content.ctaLabel != null) result.ctaLabel = content.ctaLabel;
  if (content.ctaHref != null) result.ctaHref = content.ctaHref;

  return result;
}

function generateBriefView(brief: BilingualProjectBrief, lang: "en" | "cs") {
  const content = brief[lang];
  return {
    id: brief.id,
    title: content.title,
    problem: content.problem,
    userStories: content.userStories,
    architectureNotes: content.architectureNotes,
    acceptanceCriteria: content.acceptanceCriteria,
    firstAgentPrompt: content.firstAgentPrompt,
  };
}

function generateChallengeView(challenge: BilingualChallenge, lang: "en" | "cs") {
  const content = challenge[lang];
  return {
    id: challenge.id,
    title: content.title,
    category: challenge.category,
    phaseHint: challenge.phaseHint,
    description: content.description,
  };
}

function generateInventoryView(source: BilingualAgenda, lang: "en" | "cs") {
  return {
    briefs: source.inventory.briefs.map((brief) => generateBriefView(brief, lang)),
    challenges: source.inventory.challenges.map((challenge) => generateChallengeView(challenge, lang)),
  };
}

function generateAgendaView(source: BilingualAgenda, lang: "en" | "cs") {
  return {
    version: 2,
    blueprintId: source.blueprintId,
    title: source.meta[lang].title,
    subtitle: source.meta[lang].subtitle,
    principles: source.meta[lang].principles,
    phases: source.phases.map((phase) => generatePhaseView(phase, lang)),
    inventory: generateInventoryView(source, lang),
  };
}

// ---------------------------------------------------------------------------
// Generate public blueprint agenda (English-only, simplified)
// ---------------------------------------------------------------------------

function generatePublicBlueprint(source: BilingualAgenda) {
  return {
    version: 2,
    blueprintId: source.blueprintId,
    title: source.meta.en.title,
    subtitle: "Public-readable 10-phase mirror of the Harness Lab workshop day",
    presentationMode: "public-readable-mirror",
    sourceNote: "Generated from workshop-content/agenda.json. Do not edit by hand.",
    principles: source.meta.en.principles,
    phases: source.phases.map((phase) => ({
      id: phase.id,
      order: phase.order,
      label: phase.en.label,
      startTime: phase.startTime,
      kind: phase.kind,
      goal: phase.en.goal,
    })),
    inventory: generateInventoryView(source, "en"),
    runtimeImport: {
      copiedIntoInstance: ["title", "subtitle", "phases", "inventory"],
      instanceLocalOnly: [
        "currentPhaseId",
        "continuationRevealed",
        "realDate",
        "venue",
        "room",
        "teamRegistry",
        "checkpoints",
        "monitoringSnapshots",
      ],
    },
  };
}

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
// Main
// ---------------------------------------------------------------------------

const isVerify = process.argv.includes("--verify");
const source = readSource();

// Validate
const errors = validate(source);
if (errors.length > 0) {
  console.error("\nValidation errors:");
  for (const e of errors) {
    console.error(`  ${e.path}: ${e.message}`);
  }
  process.exit(1);
}

const csView = generateAgendaView(source, "cs");
const enView = generateAgendaView(source, "en");
const publicBlueprint = generatePublicBlueprint(source);

if (isVerify) {
  // Verify mode: generate to temp dir and compare
  const tmpDir = mkdtempSync(join(tmpdir(), "content-verify-"));
  try {
    const tmpCsPath = join(tmpDir, "agenda-cs.json");
    const tmpEnPath = join(tmpDir, "agenda-en.json");
    const tmpBpPath = join(tmpDir, "blueprint-agenda.json");

    writeJson(tmpCsPath, csView);
    writeJson(tmpEnPath, enView);
    writeJson(tmpBpPath, publicBlueprint);

    const csMatch = filesMatch(tmpCsPath, join(GENERATED_DIR, "agenda-cs.json"));
    const enMatch = filesMatch(tmpEnPath, join(GENERATED_DIR, "agenda-en.json"));
    const bpMatch = filesMatch(tmpBpPath, join(BLUEPRINT_DIR, "agenda.json"));

    const mismatches: string[] = [];
    if (!csMatch) mismatches.push("dashboard/lib/generated/agenda-cs.json");
    if (!enMatch) mismatches.push("dashboard/lib/generated/agenda-en.json");
    if (!bpMatch) mismatches.push("workshop-blueprint/agenda.json");

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
  writeJson(join(BLUEPRINT_DIR, "agenda.json"), publicBlueprint);

  console.log("Generated views:");
  console.log(`  dashboard/lib/generated/agenda-cs.json`);
  console.log(`  dashboard/lib/generated/agenda-en.json`);
  console.log(`  workshop-blueprint/agenda.json (public blueprint)`);
}
