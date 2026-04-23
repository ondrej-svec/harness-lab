/**
 * Pure transform from the bilingual agenda source
 * (`workshop-content/agenda.json`) into a language/mode-specific view.
 *
 * Ported to JS from `dashboard/lib/content-views/agenda-view.ts` so
 * the CLI's `--from-local` flag can materialize a blueprint without
 * depending on the retired `dashboard/lib/generated/agenda-*.json`
 * runtime views (see 2026-04-23 topbar-cleanup plan, Part B).
 *
 * Keep this file in sync with the TS original. The shape returned is
 * contractually equivalent to the old generated JSONs.
 */

function pickField(content, key, mode) {
  if (mode === "participant" && content && content.participantVariant) {
    const override = content.participantVariant[key];
    if (override !== undefined) return override;
  }
  return content ? content[key] : undefined;
}

function parseClockToMinutes(clock) {
  if (typeof clock !== "string") return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(clock.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function computeDurationsFromStartTimes(phases) {
  return phases.map((phase, index) => {
    const next = phases[index + 1];
    const start = parseClockToMinutes(phase.startTime);
    const nextStart = parseClockToMinutes(next ? next.startTime : undefined);
    if (start === null || nextStart === null) return undefined;
    return nextStart > start ? nextStart - start : undefined;
  });
}

function generateSceneView(scene, lang, mode) {
  const content = scene[lang];
  const result = {
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

function generateParticipantMomentView(moment, lang, mode) {
  const content = moment[lang];
  const result = {
    id: moment.id,
    label: pickField(content, "label", mode),
    title: pickField(content, "title", mode),
    body: pickField(content, "body", mode),
    blocks: pickField(content, "blocks", mode),
    feedbackEnabled: moment.feedbackEnabled !== undefined ? moment.feedbackEnabled : true,
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

function generatePhaseView(phase, lang, mode, durationMinutes) {
  const content = phase[lang];
  const view = {
    id: phase.id,
    order: phase.order,
    label: pickField(content, "label", mode),
  };
  if (typeof durationMinutes === "number") view.durationMinutes = durationMinutes;
  view.kind = phase.kind;
  view.intent = phase.intent;
  view.goal = pickField(content, "goal", mode);
  view.roomSummary = pickField(content, "roomSummary", mode);
  view.facilitatorPrompts = pickField(content, "facilitatorPrompts", mode);
  view.watchFors = pickField(content, "watchFors", mode);
  view.checkpointQuestions = pickField(content, "checkpointQuestions", mode);
  view.sourceRefs = pickField(content, "sourceRefs", mode);
  view.facilitatorRunner = pickField(content, "facilitatorRunner", mode);
  view.defaultSceneId = phase.defaultSceneId;
  view.scenes = phase.scenes.map((scene) => generateSceneView(scene, lang, mode));
  view.participantMoments = (phase.participantMoments || []).map((moment) =>
    generateParticipantMomentView(moment, lang, mode),
  );
  return view;
}

function generateBriefView(brief, lang, mode) {
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

function generateChallengeView(challenge, lang) {
  const content = challenge[lang];
  return {
    id: challenge.id,
    title: content.title,
    category: challenge.category,
    phaseHint: challenge.phaseHint,
    description: content.description,
  };
}

function generateInventoryView(source, lang, mode) {
  return {
    briefs: source.inventory.briefs.map((brief) => generateBriefView(brief, lang, mode)),
    challenges: source.inventory.challenges.map((challenge) => generateChallengeView(challenge, lang)),
  };
}

/**
 * Materialize a language/mode-specific agenda view from the bilingual
 * source. `mode` is "facilitator" (default) or "participant".
 */
export function generateAgendaView(source, lang, mode) {
  const resolvedMode = mode || "facilitator";
  const phases = source.phases.filter((phase) => {
    if (resolvedMode === "participant" && phase.kind === "team") return false;
    return true;
  });
  const durations = computeDurationsFromStartTimes(phases);
  return {
    version: 2,
    blueprintId: source.blueprintId,
    startTime: phases[0] ? phases[0].startTime : undefined,
    title: source.meta[lang].title,
    subtitle: source.meta[lang].subtitle,
    principles: source.meta[lang].principles,
    phases: phases.map((phase, index) => generatePhaseView(phase, lang, resolvedMode, durations[index])),
    inventory: generateInventoryView(source, lang, resolvedMode),
  };
}

