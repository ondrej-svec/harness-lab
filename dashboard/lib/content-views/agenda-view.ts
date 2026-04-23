/**
 * Pure transforms from the bilingual authoring source
 * (`workshop-content/agenda.json`) into language/mode-specific views.
 *
 * Extracted from `scripts/content/generate-views.ts` so that both the
 * build-time generator and dashboard tests can materialize views from
 * the same logic. Runtime code (workshop-data.ts) does NOT import from
 * here — instances receive their blueprint via `externalBlueprint`
 * supplied by `blueprintRecordToAgenda` in workshop-store.
 *
 * Retired the compiled CS/EN JSON bundle (`dashboard/lib/generated/agenda-*.json`)
 * in the 2026-04-23 topbar-cleanup plan, Part B.
 */

import type {
  BilingualAgenda,
  BilingualPhase,
  BilingualScene,
  BilingualParticipantMoment,
  BilingualProjectBrief,
  BilingualChallenge,
} from "../types/bilingual-agenda";

export type AgendaMode = "facilitator" | "participant";

/**
 * Pick a field from a language content object, letting a
 * participant-mode override take precedence when generating a
 * participant view. Overrides are declared on the language content
 * object itself (e.g. `scene.cs.participantVariant.body`). Any field
 * not overridden falls back to the facilitator/canonical value.
 */
function pickField<C extends { participantVariant?: Partial<C> }, K extends keyof C>(
  content: C,
  key: K,
  mode: AgendaMode,
): C[K] {
  if (mode === "participant" && content.participantVariant) {
    const override = content.participantVariant[key];
    if (override !== undefined) return override as C[K];
  }
  return content[key];
}

/**
 * Parse "HH:MM" to minutes since midnight; null on bad input.
 */
function parseClockToMinutes(clock: string | undefined): number | null {
  if (typeof clock !== "string") return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(clock.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

/**
 * Derive durationMinutes per phase from successive startTime deltas.
 * The last phase's duration is left undefined (no way to infer without a
 * trailing anchor). Phases missing startTime also stay undefined.
 */
function computeDurationsFromStartTimes(
  phases: BilingualPhase[],
): Array<number | undefined> {
  return phases.map((phase, index) => {
    const next = phases[index + 1];
    const start = parseClockToMinutes(phase.startTime);
    const nextStart = parseClockToMinutes(next?.startTime);
    if (start === null || nextStart === null) return undefined;
    return nextStart > start ? nextStart - start : undefined;
  });
}

function generatePhaseView(
  phase: BilingualPhase,
  lang: "en" | "cs",
  mode: AgendaMode = "facilitator",
  durationMinutes?: number,
) {
  const content = phase[lang];
  return {
    id: phase.id,
    order: phase.order,
    label: pickField(content, "label", mode),
    ...(typeof durationMinutes === "number" ? { durationMinutes } : {}),
    kind: phase.kind,
    intent: phase.intent,
    goal: pickField(content, "goal", mode),
    roomSummary: pickField(content, "roomSummary", mode),
    facilitatorPrompts: pickField(content, "facilitatorPrompts", mode),
    watchFors: pickField(content, "watchFors", mode),
    checkpointQuestions: pickField(content, "checkpointQuestions", mode),
    sourceRefs: pickField(content, "sourceRefs", mode),
    facilitatorRunner: pickField(content, "facilitatorRunner", mode),
    defaultSceneId: phase.defaultSceneId,
    scenes: phase.scenes.map((scene) => generateSceneView(scene, lang, mode)),
    participantMoments: (phase.participantMoments ?? []).map((moment) =>
      generateParticipantMomentView(moment, lang, mode),
    ),
  };
}

function generateSceneView(scene: BilingualScene, lang: "en" | "cs", mode: AgendaMode = "facilitator") {
  const content = scene[lang];
  const result: Record<string, unknown> = {
    id: scene.id,
    label: pickField(content, "label", mode),
    sceneType: scene.sceneType,
    intent: scene.intent,
    chromePreset: scene.chromePreset,
    title: pickField(content, "title", mode),
    body: pickField(content, "body", mode),
    facilitatorNotes: pickField(content, "facilitatorNotes", mode),
    sourceRefs: pickField(content, "sourceRefs", mode),
    blocks: pickField(content, "blocks", mode),
  };

  if (scene.surface) result.surface = scene.surface;
  const ctaLabel = pickField(content, "ctaLabel", mode);
  const ctaHref = pickField(content, "ctaHref", mode);
  if (ctaLabel != null) result.ctaLabel = ctaLabel;
  if (ctaHref != null) result.ctaHref = ctaHref;

  return result;
}

function generateParticipantMomentView(
  moment: BilingualParticipantMoment,
  lang: "en" | "cs",
  mode: AgendaMode = "facilitator",
) {
  const content = moment[lang];
  const result: Record<string, unknown> = {
    id: moment.id,
    label: pickField(content, "label", mode),
    title: pickField(content, "title", mode),
    body: pickField(content, "body", mode),
    blocks: pickField(content, "blocks", mode),
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
  const ctaLabel = pickField(content, "ctaLabel", mode);
  const ctaHref = pickField(content, "ctaHref", mode);
  if (ctaLabel != null) result.ctaLabel = ctaLabel;
  if (ctaHref != null) result.ctaHref = ctaHref;

  return result;
}

function generateBriefView(brief: BilingualProjectBrief, lang: "en" | "cs", mode: AgendaMode = "facilitator") {
  const content = brief[lang];
  return {
    id: brief.id,
    title: pickField(content, "title", mode),
    problem: pickField(content, "problem", mode),
    userStories: pickField(content, "userStories", mode),
    architectureNotes: pickField(content, "architectureNotes", mode),
    acceptanceCriteria: pickField(content, "acceptanceCriteria", mode),
    firstAgentPrompt: pickField(content, "firstAgentPrompt", mode),
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

function generateInventoryView(source: BilingualAgenda, lang: "en" | "cs", mode: AgendaMode = "facilitator") {
  return {
    briefs: source.inventory.briefs.map((brief) => generateBriefView(brief, lang, mode)),
    challenges: source.inventory.challenges.map((challenge) => generateChallengeView(challenge, lang)),
  };
}

/**
 * Materialize a language/mode-specific agenda view from the bilingual
 * source. Shape matches the `BlueprintAgenda` runtime contract.
 *
 * Participant mode:
 *   1. Strips phases whose `kind` is "team" (rotation, team-specific
 *      build blocks — meaningless when teams are invisible).
 *   2. Applies per-field `participantVariant` overrides declared on
 *      the surviving phases, scenes, and participant moments. Any
 *      field without an override falls back to the facilitator copy.
 *      See dashboard/lib/types/bilingual-agenda.ts and the voice
 *      guard `dashboard/lib/workshop-data.agenda-voice.test.ts`.
 */
export function generateAgendaView(
  source: BilingualAgenda,
  lang: "en" | "cs",
  mode: AgendaMode = "facilitator",
) {
  const phases = source.phases.filter((phase) => {
    if (mode === "participant" && phase.kind === "team") {
      return false;
    }
    return true;
  });

  const durations = computeDurationsFromStartTimes(phases);

  return {
    version: 2,
    blueprintId: source.blueprintId,
    startTime: phases[0]?.startTime,
    title: source.meta[lang].title,
    subtitle: source.meta[lang].subtitle,
    principles: source.meta[lang].principles,
    phases: phases.map((phase, index) =>
      generatePhaseView(phase, lang, mode, durations[index]),
    ),
    inventory: generateInventoryView(source, lang, mode),
  };
}

/**
 * Simplified English-only agenda view for the public blueprint mirror.
 * Emitted to `workshop-blueprint/agenda.json` by the content generator.
 */
export function generatePublicBlueprint(source: BilingualAgenda) {
  const durations = computeDurationsFromStartTimes(source.phases);
  return {
    version: 2,
    blueprintId: source.blueprintId,
    startTime: source.phases[0]?.startTime,
    title: source.meta.en.title,
    subtitle: "Public-readable 10-phase mirror of the Harness Lab workshop day",
    presentationMode: "public-readable-mirror",
    sourceNote: "Generated from workshop-content/agenda.json. Do not edit by hand.",
    principles: source.meta.en.principles,
    phases: source.phases.map((phase, index) => ({
      id: phase.id,
      order: phase.order,
      label: phase.en.label,
      ...(typeof durations[index] === "number" ? { durationMinutes: durations[index] } : {}),
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
