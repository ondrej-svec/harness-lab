import blueprintAgendaCs from "./generated/agenda-cs.json";
import blueprintAgendaEn from "./generated/agenda-en.json";
import blueprintAgendaCsParticipant from "./generated/agenda-cs-participant.json";
import blueprintAgendaEnParticipant from "./generated/agenda-en-participant.json";
import { resolveRepoLinkedHref } from "./repo-links";
import type { FeedbackFormTemplate } from "./runtime-contracts";

export type BlueprintInventory = {
  briefs?: ProjectBrief[];
  challenges?: Omit<Challenge, "completedBy">[];
};

export type BlueprintAgenda = {
  version: number;
  blueprintId: string;
  title: string;
  subtitle: string;
  principles?: string[];
  phases: WorkshopBlueprintPhase[];
  inventory?: BlueprintInventory;
};

/**
 * Mode selects which generated agenda to load. "facilitator" (default)
 * returns the full agenda including kind:"team" phases (build blocks,
 * rotation). "participant" returns the variant with team-only phases
 * filtered out — used when a workshop instance has team_mode_enabled
 * set to false. Substantive editorial rewrite of per-scene copy for
 * team/tým language is still a follow-up task.
 */
export type AgendaMode = "facilitator" | "participant";

function getBlueprintAgenda(
  contentLang: WorkshopContentLanguage,
  mode: AgendaMode = "facilitator",
): BlueprintAgenda {
  if (mode === "participant") {
    return contentLang === "en"
      ? (blueprintAgendaEnParticipant as BlueprintAgenda)
      : (blueprintAgendaCsParticipant as BlueprintAgenda);
  }
  return contentLang === "en" ? (blueprintAgendaEn as BlueprintAgenda) : (blueprintAgendaCs as BlueprintAgenda);
}

export type WorkshopContentLanguage = "cs" | "en";

function resolveWorkshopContentLanguage(value: string | undefined): WorkshopContentLanguage {
  return value === "en" ? "en" : "cs";
}

export function getBlueprintWorkshopMetaCopy(contentLang: WorkshopContentLanguage) {
  const agenda = getBlueprintAgenda(contentLang);
  return {
    title: agenda.title,
    subtitle: agenda.subtitle,
    adminHint:
      contentLang === "en"
        ? "This repo uses sample data. Real workshop instances should be loaded from the private runtime layer outside the public template repo."
        : "Repo používá ukázková data. Reálné workshop instance mají být načítané z privátní vrstvy mimo veřejný template repo.",
  };
}

type WorkshopBlueprintScene = {
  id: string;
  label: string;
  sceneType: string;
  surface?: string;
  intent?: string;
  chromePreset?: string;
  title: string;
  body: string;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  facilitatorNotes?: string[];
  sourceRefs?: WorkshopSourceRef[];
  blocks?: PresenterBlock[];
};

type WorkshopBlueprintPollOption = {
  id: string;
  label: string;
};

type WorkshopBlueprintPollDefinition = {
  id: string;
  prompt: string;
  options: WorkshopBlueprintPollOption[];
};

type WorkshopBlueprintParticipantMoment = {
  id: string;
  label: string;
  title: string;
  body: string;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  blocks?: PresenterBlock[];
  roomSceneIds?: string[];
  feedbackEnabled?: boolean;
  poll?: WorkshopBlueprintPollDefinition | null;
};

type WorkshopBlueprintPhase = {
  id: string;
  order: number;
  label: string;
  startTime: string;
  kind?: string;
  intent?: string;
  goal: string;
  roomSummary?: string;
  facilitatorPrompts?: string[];
  watchFors?: string[];
  checkpointQuestions?: string[];
  facilitatorRunner?: Partial<FacilitatorRunner>;
  sourceRefs?: WorkshopSourceRef[];
  defaultSceneId?: string | null;
  scenes?: WorkshopBlueprintScene[];
  participantMoments?: WorkshopBlueprintParticipantMoment[];
};

export type FacilitatorRunner = {
  goal: string;
  say: string[];
  show: string[];
  do: string[];
  watch: string[];
  fallback: string[];
};

export type AgendaItem = {
  id: string;
  title: string;
  time: string;
  description: string;
  intent: AgendaItemIntent;
  goal: string;
  roomSummary: string;
  facilitatorPrompts: string[];
  watchFors: string[];
  checkpointQuestions: string[];
  facilitatorRunner: FacilitatorRunner;
  sourceRefs: WorkshopSourceRef[];
  order: number;
  sourceBlueprintPhaseId: string | null;
  kind: "blueprint" | "custom";
  status: "done" | "current" | "upcoming";
  defaultPresenterSceneId: string | null;
  presenterScenes: PresenterScene[];
  participantMoments: ParticipantMoment[];
};

export type WorkshopSourceRef = {
  label: string;
  path: string;
};

export type AgendaItemIntent =
  | "framing"
  | "teaching"
  | "demo"
  | "build"
  | "checkpoint"
  | "transition"
  | "break"
  | "handoff"
  | "reflection"
  | "closeout"
  | "custom";

export type PresenterSceneType =
  | "briefing"
  | "demo"
  | "participant-view"
  | "checkpoint"
  | "reflection"
  | "transition"
  | "custom";

export type PresenterSceneSurface = "room" | "participant";

export type PresenterSceneIntent =
  | "framing"
  | "teaching"
  | "demo"
  | "walkthrough"
  | "checkpoint"
  | "transition"
  | "reflection"
  | "custom";

export type PresenterChromePreset =
  | "minimal"
  | "agenda"
  | "checkpoint"
  | "participant"
  | "team-trail";

export type ParticipantPollOption = {
  id: string;
  label: string;
};

export type ParticipantPollDefinition = {
  id: string;
  prompt: string;
  options: ParticipantPollOption[];
};

export type ParticipantMoment = {
  id: string;
  label: string;
  title: string;
  body: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  blocks: PresenterBlock[];
  roomSceneIds: string[];
  feedbackEnabled: boolean;
  poll: ParticipantPollDefinition | null;
  order: number;
  enabled: boolean;
  sourceBlueprintMomentId: string | null;
  kind: "blueprint" | "custom";
};

export type LiveWorkshopMoment = {
  agendaItemId: string | null;
  roomSceneId: string | null;
  participantMomentId: string | null;
  participantMode: "auto" | "manual";
  activePollId: string | null;
};

function getDefaultRunnerDoSteps(intent: AgendaItemIntent, contentLang: WorkshopContentLanguage) {
  if (contentLang === "en") {
    switch (intent) {
      case "framing":
        return ["Keep the pace crisp and tie each beat back to what the room will build today."];
      case "teaching":
        return ["Land the main contrast, then bridge immediately into the first build move."];
      case "demo":
        return ["Narrate the workflow, not feature trivia, and stop only where context or review changes the outcome."];
      case "build":
        return ["Send teams back to the repo with one explicit next move and one concrete verification target."];
      case "checkpoint":
        return ["Collect one short room signal, then name the one pattern every table should keep."];
      case "transition":
      case "break":
        return ["State clearly what changes now and what should be true when the room comes back together."];
      case "handoff":
        return ["Start with silent repo reading. Diagnosis comes before editing."];
      case "reflection":
      case "closeout":
        return ["Pull concrete examples from the room and turn them into one reusable practice to carry forward."];
      default:
        return [];
    }
  }

  switch (intent) {
    case "framing":
      return ["Drž krátké tempo a po každém beatu vrať místnost k tomu, co dnes bude skutečně stavět."];
    case "teaching":
      return ["Usaď hlavní kontrast a hned ho převeď do prvního build kroku."];
    case "demo":
      return ["Komentuj workflow, ne fígle nástroje, a zastavuj se jen tam, kde kontext nebo review mění výsledek."];
    case "build":
      return ["Pošli týmy zpátky do repa s jedním explicitním next step a jedním konkrétním checkem."];
    case "checkpoint":
      return ["Sesbírej jeden krátký signál z místnosti a pojmenuj pattern, který si mají odnést všechny stoly."];
    case "transition":
    case "break":
      return ["Řekni jasně, co se teď mění a co má být pravda, až se místnost znovu potká."];
    case "handoff":
      return ["Začni tichým čtením repa. Diagnóza má přijít dřív než první editace."];
    case "reflection":
    case "closeout":
      return ["Táhni z místnosti konkrétní příklady a překlop je do jedné přenositelné praxe."];
    default:
      return [];
  }
}

function getDefaultRunnerFallbackSteps(intent: AgendaItemIntent, contentLang: WorkshopContentLanguage) {
  if (contentLang === "en") {
    switch (intent) {
      case "framing":
      case "teaching":
      case "demo":
        return ["If time slips, keep the main line, one supporting beat, and move the room forward."];
      case "build":
        return ["If the room is scattered, reduce the ask to one next move and one proof check before more generation."];
      case "checkpoint":
        return ["If reporting gets fluffy, ask for one change, one proof, and one next step."];
      case "handoff":
        return ["If teams ask for oral rescue, send them back to the repo and ask what is still missing there."];
      case "reflection":
      case "closeout":
        return ["If energy drops, collect one example that saved time and one signal that failed."];
      default:
        return ["Return to the goal, name the next move, and keep the room moving."];
    }
  }

  switch (intent) {
    case "framing":
    case "teaching":
    case "demo":
      return ["Když čas klouže, nech hlavní větu, jeden podpůrný beat a pošli místnost dál."];
    case "build":
      return ["Když se místnost rozpadá, zmenši zadání na jeden next step a jeden proof check před dalším generováním."];
    case "checkpoint":
      return ["Když report sklouzává do mlhy, vrať ho na jednu změnu, jedno ověření a jeden další krok."];
    case "handoff":
      return ["Když si týmy říkají o ústní rescue, vrať je k repu a k tomu, co tam ještě chybí."];
    case "reflection":
    case "closeout":
      return ["Když energie padá, vytáhni jeden signál, který šetřil čas, a jeden, který selhal."];
    default:
      return ["Vrať se k cíli, pojmenuj další krok a drž místnost v pohybu."];
  }
}

function buildFacilitatorRunner(args: {
  contentLang: WorkshopContentLanguage;
  intent: AgendaItemIntent;
  goal: string;
  facilitatorPrompts: string[];
  watchFors: string[];
  checkpointQuestions: string[];
  roomSceneLabels: string[];
  runner?: Partial<FacilitatorRunner> | null;
}) {
  const {
    contentLang,
    intent,
    goal,
    facilitatorPrompts,
    watchFors,
    checkpointQuestions,
    roomSceneLabels,
    runner,
  } = args;

  return {
    goal: runner?.goal?.trim() || goal,
    say: runner?.say ? [...runner.say] : facilitatorPrompts.slice(0, 3),
    show: runner?.show ? [...runner.show] : roomSceneLabels.slice(0, 3),
    do: runner?.do ? [...runner.do] : getDefaultRunnerDoSteps(intent, contentLang),
    watch: runner?.watch ? [...runner.watch] : watchFors.slice(0, 3),
    fallback:
      runner?.fallback
        ? [...runner.fallback]
        : checkpointQuestions.length > 0
          ? checkpointQuestions.slice(0, 1).concat(getDefaultRunnerFallbackSteps(intent, contentLang))
          : getDefaultRunnerFallbackSteps(intent, contentLang),
  } satisfies FacilitatorRunner;
}

type PresenterBlockBase = {
  id: string;
};

export type PresenterBlock =
  | (PresenterBlockBase & {
      type: "hero";
      eyebrow?: string;
      title: string;
      body?: string;
    })
  | (PresenterBlockBase & {
      type: "rich-text";
      content: string;
    })
  | (PresenterBlockBase & {
      type: "bullet-list";
      title?: string;
      items: string[];
    })
  | (PresenterBlockBase & {
      type: "quote";
      quote: string;
      attribution?: string;
    })
  | (PresenterBlockBase & {
      type: "steps";
      title?: string;
      items: Array<{
        title: string;
        body?: string;
      }>;
    })
  | (PresenterBlockBase & {
      type: "checklist";
      title?: string;
      items: string[];
    })
  | (PresenterBlockBase & {
      type: "image";
      src: string;
      alt: string;
      caption?: string;
      sourceLabel?: string;
      sourceHref?: string | null;
    })
  | (PresenterBlockBase & {
      type: "link-list";
      title?: string;
      items: Array<{
        label: string;
        href?: string | null;
        description?: string;
      }>;
    })
  | (PresenterBlockBase & {
      type: "callout";
      tone: "info" | "warning" | "success";
      title?: string;
      body: string;
    })
  | (PresenterBlockBase & {
      type: "participant-preview";
      body?: string;
    });

export type PresenterScene = {
  id: string;
  label: string;
  sceneType: PresenterSceneType;
  surface: PresenterSceneSurface;
  intent: PresenterSceneIntent;
  chromePreset: PresenterChromePreset;
  title: string;
  body: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  facilitatorNotes: string[];
  sourceRefs: WorkshopSourceRef[];
  blocks: PresenterBlock[];
  order: number;
  enabled: boolean;
  sourceBlueprintSceneId: string | null;
  kind: "blueprint" | "custom";
};

const agendaItemIntents = [
  "framing",
  "teaching",
  "demo",
  "build",
  "checkpoint",
  "transition",
  "break",
  "handoff",
  "reflection",
  "closeout",
  "custom",
] as const satisfies AgendaItemIntent[];

const presenterSceneTypes = [
  "briefing",
  "demo",
  "participant-view",
  "checkpoint",
  "reflection",
  "transition",
  "custom",
] as const satisfies PresenterSceneType[];

const presenterSceneSurfaces = [
  "room",
  "participant",
] as const satisfies PresenterSceneSurface[];

const presenterSceneIntents = [
  "framing",
  "teaching",
  "demo",
  "walkthrough",
  "checkpoint",
  "transition",
  "reflection",
  "custom",
] as const satisfies PresenterSceneIntent[];

const presenterChromePresets = [
  "minimal",
  "agenda",
  "checkpoint",
  "participant",
  "team-trail",
] as const satisfies PresenterChromePreset[];

function buildFallbackPresenterBlocks(scene: {
  sceneType: PresenterSceneType;
  title: string;
  body: string;
}): PresenterBlock[] {
  if (scene.sceneType === "participant-view") {
    return [
      {
        id: `${scene.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "participant"}-preview`,
        type: "participant-preview",
        body: scene.body,
      },
    ];
  }

  const blocks: PresenterBlock[] = [
    {
      id: `${scene.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "scene"}-hero`,
      type: "hero",
      title: scene.title,
      body: scene.body || undefined,
    },
  ];

  if (scene.body.trim().length > 0) {
    blocks.push({
      id: `${scene.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "scene"}-body`,
      type: "rich-text",
      content: scene.body,
    });
  }

  return blocks;
}

function normalizePresenterBlocks(value: unknown, fallback: PresenterBlock[] = []) {
  return Array.isArray(value) ? (value as PresenterBlock[]) : fallback;
}

export function normalizeParticipantPollDefinition(value: unknown): ParticipantPollDefinition | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const poll = value as Partial<ParticipantPollDefinition>;
  if (typeof poll.id !== "string" || typeof poll.prompt !== "string" || !Array.isArray(poll.options)) {
    return null;
  }

  const options = poll.options
    .filter((option): option is ParticipantPollOption => {
      return Boolean(option) && typeof option.id === "string" && typeof option.label === "string";
    })
    .map((option) => ({ id: option.id, label: option.label }));

  if (options.length === 0) {
    return null;
  }

  return {
    id: poll.id,
    prompt: poll.prompt,
    options,
  };
}

function resolvePresenterBlockLinks(blocks: PresenterBlock[]) {
  return blocks.map((block) => {
    if (block.type === "link-list") {
      return {
        ...block,
        items: block.items.map((item) => ({
          ...item,
          href: resolveRepoLinkedHref(item.href ?? null),
        })),
      } satisfies PresenterBlock;
    }

    if (block.type === "image") {
      return {
        ...block,
        sourceHref: resolveRepoLinkedHref(block.sourceHref ?? null),
      } satisfies PresenterBlock;
    }

    return block;
  });
}

function normalizeAgendaItemIntent(value: string): AgendaItemIntent {
  return agendaItemIntents.includes(value as AgendaItemIntent) ? (value as AgendaItemIntent) : "custom";
}

function normalizePresenterSceneType(value: string): PresenterSceneType {
  return presenterSceneTypes.includes(value as PresenterSceneType) ? (value as PresenterSceneType) : "custom";
}

function derivePresenterSceneSurface(sceneType: PresenterSceneType): PresenterSceneSurface {
  return sceneType === "participant-view" ? "participant" : "room";
}

function normalizePresenterSceneSurface(value: string | undefined, sceneType: PresenterSceneType): PresenterSceneSurface {
  if (value && presenterSceneSurfaces.includes(value as PresenterSceneSurface)) {
    return value as PresenterSceneSurface;
  }

  return derivePresenterSceneSurface(sceneType);
}

function normalizePresenterSceneIntent(value: string): PresenterSceneIntent {
  return presenterSceneIntents.includes(value as PresenterSceneIntent) ? (value as PresenterSceneIntent) : "custom";
}

function normalizePresenterChromePreset(value: string): PresenterChromePreset {
  return presenterChromePresets.includes(value as PresenterChromePreset) ? (value as PresenterChromePreset) : "minimal";
}

function resolveParticipantMomentBlocks(moment: {
  title: string;
  body: string;
  blocks?: PresenterBlock[];
}) {
  const baseBlocks = normalizePresenterBlocks(moment.blocks, []);
  if (baseBlocks.length > 0) {
    return resolvePresenterBlockLinks(baseBlocks);
  }

  return buildFallbackPresenterBlocks({
    sceneType: "participant-view",
    title: moment.title,
    body: moment.body,
  });
}

function buildParticipantMomentFromScene(scene: PresenterScene, index: number): ParticipantMoment {
  return {
    id: `${scene.id}-moment`,
    label: scene.label,
    title: scene.title,
    body: scene.body,
    ctaLabel: scene.ctaLabel,
    ctaHref: scene.ctaHref,
    blocks: scene.blocks,
    roomSceneIds: [],
    feedbackEnabled: true,
    poll: null,
    order: index + 1,
    enabled: scene.enabled,
    sourceBlueprintMomentId: scene.sourceBlueprintSceneId ? `${scene.sourceBlueprintSceneId}-moment` : null,
    kind: scene.kind,
  };
}

export function resolveParticipantMomentForRoomScene(
  moments: ParticipantMoment[],
  roomSceneId: string | null | undefined,
): ParticipantMoment | null {
  const enabledMoments = moments.filter((moment) => moment.enabled);
  if (enabledMoments.length === 0) {
    return null;
  }

  if (roomSceneId) {
    const targeted = enabledMoments.find((moment) => moment.roomSceneIds.includes(roomSceneId));
    if (targeted) {
      return targeted;
    }
  }

  const untargeted = enabledMoments.find((moment) => moment.roomSceneIds.length === 0);
  return untargeted ?? enabledMoments[0] ?? null;
}

export function createLiveMomentState(agenda: AgendaItem[], requestedAgendaItemId?: string | null): LiveWorkshopMoment {
  const activeAgendaItem =
    agenda.find((item) => item.id === requestedAgendaItemId) ??
    agenda.find((item) => item.status === "current") ??
    agenda[0] ??
    null;

  if (!activeAgendaItem) {
    return {
      agendaItemId: null,
      roomSceneId: null,
      participantMomentId: null,
      participantMode: "auto",
      activePollId: null,
    };
  }

  const roomScene =
    activeAgendaItem.presenterScenes.find(
      (scene) => scene.enabled && scene.surface === "room" && scene.id === activeAgendaItem.defaultPresenterSceneId,
    ) ??
    activeAgendaItem.presenterScenes.find((scene) => scene.enabled && scene.surface === "room") ??
    null;
  const participantMoment = resolveParticipantMomentForRoomScene(
    activeAgendaItem.participantMoments,
    roomScene?.id ?? null,
  );

  return {
    agendaItemId: activeAgendaItem.id,
    roomSceneId: roomScene?.id ?? null,
    participantMomentId: participantMoment?.id ?? null,
    participantMode: "auto",
    activePollId: participantMoment?.poll?.id ?? null,
  };
}

export type TeamCheckIn = {
  phaseId: string;
  content: string;
  writtenAt: string;
  writtenBy: string | null;
  participantId?: string | null;
  changed?: string | null;
  verified?: string | null;
  nextStep?: string | null;
};

export type Team = {
  id: string;
  name: string;
  city: string;
  members: string[];
  repoUrl: string;
  projectBriefId: string;
  checkIns: TeamCheckIn[];
  anchor: string | null;
};

export type ProjectBrief = {
  id: string;
  title: string;
  problem: string;
  userStories: string[];
  architectureNotes: string[];
  acceptanceCriteria: string[];
  firstAgentPrompt: string;
};

export type ChallengeCategory =
  | "Context Engineering"
  | "Workflow"
  | "Advanced"
  | "Meta";

export type Challenge = {
  id: string;
  title: string;
  category: ChallengeCategory;
  phaseHint: "before-lunch" | "after-rotation" | "anytime";
  description: string;
  completedBy: string[];
};

export type RotationSlot = {
  fromTeam: string;
  toTeam: string;
  note: string;
};

export type RotationPlan = {
  revealed: boolean;
  scenario: "17-participants" | "20-participants";
  slots: RotationSlot[];
};

export type TickerItem = {
  id: string;
  label: string;
  tone: "info" | "signal" | "highlight";
};

export type MonitoringSnapshot = {
  teamId: string;
  agentsFile: boolean;
  skillsCount: number;
  commitsLast30Min: number;
  testsVisible: number;
};

export type SprintUpdate = {
  id: string;
  /** Team subject for team-mode sprint updates. Null for participant-mode. */
  teamId: string | null;
  /** Participant subject for participant-mode sprint updates. Null for team-mode. */
  participantId?: string | null;
  text: string;
  at: string;
};

export type SetupPath = {
  id: string;
  label: string;
  audience: string;
  summary: string;
};

function cloneProjectBrief(brief: ProjectBrief): ProjectBrief {
  return {
    ...brief,
    userStories: [...brief.userStories],
    architectureNotes: [...brief.architectureNotes],
    acceptanceCriteria: [...brief.acceptanceCriteria],
  };
}

function cloneChallenge(challenge: Challenge): Challenge {
  return {
    ...challenge,
    completedBy: [...challenge.completedBy],
  };
}

function cloneTickerItem(item: TickerItem): TickerItem {
  return { ...item };
}

function cloneSetupPath(path: SetupPath): SetupPath {
  return { ...path };
}

export type WorkshopMeta = {
  title: string;
  subtitle: string;
  contentLang: WorkshopContentLanguage;
  eventTitle?: string;
  city: string;
  dateRange: string;
  venueName?: string;
  roomName?: string;
  addressLine?: string;
  locationDetails?: string;
  facilitatorLabel?: string;
  currentPhaseLabel: string;
  adminHint: string;
};

export type WorkshopState = {
  version: number;
  workshopId: string;
  workshopMeta: WorkshopMeta;
  agenda: AgendaItem[];
  liveMoment: LiveWorkshopMoment;
  teams: Team[];
  briefs: ProjectBrief[];
  challenges: Challenge[];
  rotation: RotationPlan;
  ticker: TickerItem[];
  monitoring: MonitoringSnapshot[];
  sprintUpdates: SprintUpdate[];
  /**
   * Participant-scoped check-ins (participant mode only). Parallel
   * storage to `teams[].checkIns`: team-mode writes go there, participant-
   * mode writes go here. Each entry must have `participantId` set.
   * See appendParticipantCheckIn in workshop-store.ts.
   */
  participantCheckIns: TeamCheckIn[];
  setupPaths: SetupPath[];
};

export type WorkshopTemplate = {
  id: string;
  label: string;
  defaultEventTitle: string;
  city: string;
  dateLabel: string;
  room: string;
  scenario: "17-participants" | "20-participants";
};

export type WorkshopInstanceStatus =
  | "created"
  | "prepared"
  | "running"
  | "ended"
  | "archived"
  | "removed";

export type WorkshopInstanceRecord = {
  id: string;
  templateId: string;
  status: WorkshopInstanceStatus;
  blueprintId: string;
  blueprintVersion: number;
  importedAt: string;
  removedAt: string | null;
  allowWalkIns: boolean;
  teamModeEnabled: boolean;
  /**
   * Per-instance override of the default post-workshop feedback template.
   * Null means "use the built-in default" (see getDefaultFeedbackTemplate).
   * Authoring UI is deferred to v2; v1 edits are hand-edits of this JSONB.
   */
  feedbackForm: FeedbackFormTemplate | null;
  workshopMeta: WorkshopMeta;
};

function createSampleWorkshopMeta(input: {
  eventTitle: string;
  city: string;
  room: string;
  addressLine: string;
  locationDetails: string;
  facilitatorLabel?: string;
  contentLang?: WorkshopContentLanguage;
}) {
  const contentLang = resolveWorkshopContentLanguage(input.contentLang);
  const agenda = getBlueprintAgenda(contentLang);
  const blueprintMetaCopy = getBlueprintWorkshopMetaCopy(contentLang);
  return {
    title: blueprintMetaCopy.title,
    subtitle: blueprintMetaCopy.subtitle,
    contentLang,
    eventTitle: input.eventTitle,
    city: input.city,
    dateRange: contentLang === "en" ? "Sample workshop day" : "Ukázkový workshop den",
    venueName: input.city,
    roomName: input.room,
    addressLine: input.addressLine,
    locationDetails: input.locationDetails,
    facilitatorLabel: input.facilitatorLabel ?? "facilitator crew",
    currentPhaseLabel: agenda.phases[0]?.label ?? "Opening",
    adminHint: blueprintMetaCopy.adminHint,
  } satisfies WorkshopMeta;
}

export function createAgendaFromBlueprint(
  contentLang: WorkshopContentLanguage,
  currentPhaseId?: string,
  externalBlueprint?: BlueprintAgenda,
): AgendaItem[] {
  const agenda = externalBlueprint ?? getBlueprintAgenda(contentLang);
  const phases = agenda.phases as WorkshopBlueprintPhase[];
  const phaseId =
    currentPhaseId ??
    phases.find((phase) => phase.id === "build-1")?.id ??
    phases[0]?.id;
  const currentIndex = Math.max(
    phases.findIndex((phase) => phase.id === phaseId),
    0,
  );

  return phases.map((phase, index) => {
    const goal = phase.goal;
    const roomSummary = phase.roomSummary ?? goal;
    const facilitatorPrompts = phase.facilitatorPrompts ?? [];
    const watchFors = phase.watchFors ?? [];
    const checkpointQuestions = phase.checkpointQuestions ?? [];
    const roomSceneLabels = (phase.scenes ?? [])
      .filter((scene) => normalizePresenterSceneSurface(scene.surface, normalizePresenterSceneType(scene.sceneType)) === "room")
      .map((scene) => scene.label);
    const presenterScenes = (phase.scenes ?? []).map((scene, sceneIndex) => {
      const normalizedSceneType = normalizePresenterSceneType(scene.sceneType);
      const baseBlocks = normalizePresenterBlocks(scene.blocks);
      const resolvedBlocks =
        baseBlocks.length > 0
          ? resolvePresenterBlockLinks(baseBlocks)
          : buildFallbackPresenterBlocks({
              sceneType: normalizedSceneType,
              title: scene.title,
              body: scene.body,
            });

      return {
        id: scene.id,
        label: scene.label,
        sceneType: normalizedSceneType,
        surface: normalizePresenterSceneSurface(scene.surface, normalizedSceneType),
        intent: normalizePresenterSceneIntent(scene.intent ?? scene.sceneType ?? "custom"),
        chromePreset: normalizePresenterChromePreset(scene.chromePreset ?? "minimal"),
        title: scene.title,
        body: scene.body,
        ctaLabel: scene.ctaLabel ?? null,
        ctaHref: resolveRepoLinkedHref(scene.ctaHref ?? null),
        facilitatorNotes: scene.facilitatorNotes ?? [],
        sourceRefs: scene.sourceRefs ? [...scene.sourceRefs] : [],
        blocks: resolvePresenterBlockLinks(resolvedBlocks),
        order: sceneIndex + 1,
        enabled: true,
        sourceBlueprintSceneId: scene.id,
        kind: "blueprint" as const,
      } satisfies PresenterScene;
    });
    const explicitParticipantMoments = (phase.participantMoments ?? []).map((moment, momentIndex) => ({
      id: moment.id,
      label: moment.label,
      title: moment.title,
      body: moment.body,
      ctaLabel: moment.ctaLabel ?? null,
      ctaHref: resolveRepoLinkedHref(moment.ctaHref ?? null),
      blocks: resolveParticipantMomentBlocks(moment),
      roomSceneIds: Array.isArray(moment.roomSceneIds) ? [...moment.roomSceneIds] : [],
      feedbackEnabled: moment.feedbackEnabled ?? true,
      poll: normalizeParticipantPollDefinition(moment.poll),
      order: momentIndex + 1,
      enabled: true,
      sourceBlueprintMomentId: moment.id,
      kind: "blueprint" as const,
    }));
    const participantMoments =
      explicitParticipantMoments.length > 0
        ? explicitParticipantMoments
        : presenterScenes
            .filter((scene) => scene.surface === "participant")
            .map((scene, momentIndex) => ({
              ...buildParticipantMomentFromScene(scene, momentIndex),
              sourceBlueprintMomentId: scene.id,
            }));

    return {
      id: phase.id,
      title: phase.label,
      time: phase.startTime,
      description: roomSummary,
      intent: normalizeAgendaItemIntent(phase.intent ?? phase.kind ?? "custom"),
      goal,
      roomSummary,
      facilitatorPrompts: [...facilitatorPrompts],
      watchFors: [...watchFors],
      checkpointQuestions: [...checkpointQuestions],
      facilitatorRunner: buildFacilitatorRunner({
        contentLang,
        intent: normalizeAgendaItemIntent(phase.intent ?? phase.kind ?? "custom"),
        goal,
        facilitatorPrompts: [...facilitatorPrompts],
        watchFors: [...watchFors],
        checkpointQuestions: [...checkpointQuestions],
        roomSceneLabels,
        runner: phase.facilitatorRunner ?? null,
      }),
      sourceRefs: phase.sourceRefs ? [...phase.sourceRefs] : [],
      order: phase.order,
      sourceBlueprintPhaseId: phase.id,
      kind: "blueprint" as const,
      status: index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming",
      defaultPresenterSceneId: phase.defaultSceneId ?? phase.scenes?.[0]?.id ?? null,
      presenterScenes,
      participantMoments,
    };
  });
}

const seedWorkshopBriefs: ProjectBrief[] = [
  {
    id: "devtoolbox-cli",
    title: "DevToolbox CLI",
    problem: "Vývojáři ztrácejí čas opakovanými drobnými utilitami, které jsou rozseté po wiki, shellech a poznámkách.",
    userStories: [
      "Jako vývojář chci převést log nebo JSON do čitelnější podoby jedním příkazem.",
      "Jako vývojář chci rychle vypsat poslední problematické commity nebo větve.",
      "Jako tým chci mít jasně zdokumentované příkazy, aby nástroj mohl převzít jiný tým po rotaci.",
    ],
    architectureNotes: [
      "CLI může být v libovolném jazyce, ale příkazy musí být snadno objevitelné.",
      "AGENTS.md musí obsahovat build/test flow a očekávaný styl výstupů.",
      "Runbook pro další tým je důležitější než šířka feature setu.",
    ],
    acceptanceCriteria: [
      "Existují alespoň 3 užitečné příkazy.",
      "README a AGENTS.md vysvětlují lokální spuštění.",
      "Nový tým zvládne do 10 minut přidat nebo opravit další příkaz.",
    ],
    firstAgentPrompt:
      "Navrhni minimální CLI architekturu, která přežije handoff. Začni AGENTS.md, pak plánem, teprve potom implementací.",
  },
  {
    id: "standup-bot",
    title: "Standup Bot",
    problem: "Denní standupy v chatu bývají dlouhé, nekonzistentní a těžko dohledatelné.",
    userStories: [
      "Jako team lead chci sesbírat standup odpovědi do jednoho přehledu.",
      "Jako vývojář chci vidět blokery a dependency mezi lidmi na jednom místě.",
      "Jako nový tým po rotaci chci rychle pochopit datový tok a integrační body.",
    ],
    architectureNotes: [
      "Preferujte jasný datový model před složitou integrací.",
      "Mock data jsou v pořádku, pokud workflow působí realisticky.",
      "Prompty a runbooky musí být součástí řešení, ne bokem.",
    ],
    acceptanceCriteria: [
      "Bot umí ingestovat aspoň seed data a vytvořit souhrn.",
      "Repo obsahuje instrukce pro rozšíření na reálný chat kanál.",
      "Po rotaci lze navázat bez verbálního vysvětlování.",
    ],
    firstAgentPrompt:
      "Rozděl práci na ingest, sumarizaci a kontext pro další tým. Před implementací vytvoř dokumentaci, kterou nový tým otevře jako první.",
  },
  {
    id: "code-review-helper",
    title: "Code Review Helper",
    problem:
      "Code review často závisí na tom, kdo se zrovna dívá do diffu. Rizikové změny pak procházejí bez společného jazyka pro jistotu, heuristiku a nutný follow-up.",
    userStories: [
      "Jako reviewer chci z diffu získat checklist změněných hranic, rizik a follow-up otázek.",
      "Jako autor změny chci vědět, co mám ověřit před requestem na review.",
      "Jako inheriting tým chci navázat na heuristiky prvního týmu místo toho, abych je znovu vymýšlel.",
    ],
    architectureNotes: [
      "Může jít o CLI, web nebo jednoduchý script, hlavní je čistý tok diff -> rubric -> checklist.",
      "Výstup musí oddělit jistotu od heuristického podezření.",
      "Doplňte seed diff nebo examples folder, aby další tým rychle otestoval nové pravidlo.",
    ],
    acceptanceCriteria: [
      "Nástroj vytvoří review checklist ze seed diffu.",
      "Je popsáno, co je jistota, co je heuristika a co pořád potřebuje lidský úsudek.",
      "Další tým může přidat nové pravidlo bez dlouhého onboarding callu.",
    ],
    firstAgentPrompt:
      "Nezačínej generováním kódu. Nejdřív navrhni review rubric, ukaž kde je jistota versus heuristika a definuj seed diff flow, na který může po rotaci navázat další tým.",
  },
  {
    id: "metrics-dashboard",
    title: "Metrics Dashboard",
    problem: "Týmy mají data, ale neumí z nich vytvořit sdílený přehled, který podporuje rozhodování.",
    userStories: [
      "Jako tým chci zobrazit několik metrik na jedné obrazovce.",
      "Jako facilitátor chci snadno měnit seed data bez zásahu do UI logiky.",
      "Jako nový tým po rotaci chci pochopit strukturu obrazovek a dat během pár minut.",
    ],
    architectureNotes: [
      "Seed data a UI oddělte už od prvního commitu.",
      "Mobile-first je plus, ale desktop projekce musí být čitelná.",
      "Monitoring a README mají vysvětlit, co se už povedlo a co ne.",
    ],
    acceptanceCriteria: [
      "Dashboard ukáže aspoň 3 metriky a jeden trend.",
      "Repo popisuje datové zdroje i mock fallback.",
      "Nový tým umí přidat další metriku bez rozbití layoutu.",
    ],
    firstAgentPrompt:
      "Navrhni dashboard, který zvládne handoff. Nejprve popiš datový model, komponenty a kritéria hotovo, až pak piš UI.",
  },
];

const seedWorkshopChallenges: Challenge[] = [
  {
    id: "agents-md",
    title: "Vytvořte AGENTS.md jako mapu",
    category: "Context Engineering",
    phaseHint: "before-lunch",
    description: "Zapište cíl, build/test flow, trvalá pravidla a kam má další tým sáhnout jako první.",
    completedBy: ["t1", "t3"],
  },
  {
    id: "review-skill",
    title: "Napište skill pro code review",
    category: "Context Engineering",
    phaseHint: "before-lunch",
    description: "Alespoň jedna opakovatelná review rutina musí být v repu jako skill nebo runbook, ne jen v promptu.",
    completedBy: [],
  },
  {
    id: "plan-first",
    title: "Použijte /plan před kódováním",
    category: "Workflow",
    phaseHint: "before-lunch",
    description: "Nechte agenta nejprve rozplánovat práci, ukažte z čeho se vycházelo a dopište další safe move.",
    completedBy: ["t2"],
  },
  {
    id: "smallest-verification",
    title: "Přidejte nejmenší užitečné ověření",
    category: "Workflow",
    phaseHint: "before-lunch",
    description: "Vytvořte RED test, tracer bullet nebo jednoduchý browser check dřív, než dáte agentovi víc autonomie.",
    completedBy: [],
  },
  {
    id: "parallel-agents",
    title: "Spusťte 2 paralelní Codex sessions",
    category: "Advanced",
    phaseHint: "after-rotation",
    description: "Rozdělte problém do dvou nezávislých proudů a porovnejte, co se osvědčilo.",
    completedBy: [],
  },
  {
    id: "done-when",
    title: "Přidejte 'Done When' ke každému tasku",
    category: "Meta",
    phaseHint: "anytime",
    description: "Každý důležitý task musí mít explicitní kritérium dokončení a odkaz na ověření.",
    completedBy: ["t4"],
  },
];

const seedWorkshopTicker: TickerItem[] = [
  { id: "tick-1", label: "Tým 3 právě přidal první vlastní skill.", tone: "highlight" },
  { id: "tick-2", label: "Tým 1 má 6 commitů za posledních 30 minut.", tone: "signal" },
  {
    id: "tick-3",
    label: "Intermezzo za 12 minut: napište co jste změnili, co to ověřuje a co má další tým číst jako první.",
    tone: "info",
  },
];

const seedWorkshopSetupPaths: SetupPath[] = [
  {
    id: "cli",
    label: "Codex CLI",
    audience: "macOS / Linux",
    summary: "Nejrychlejší cesta pro lidi, kteří chtějí pracovat přímo v repu a terminálu.",
  },
  {
    id: "app",
    label: "Codex App",
    audience: "Windows / macOS",
    summary: "Bezpečný fallback pro účastníky, kteří nechtějí řešit CLI hned ráno.",
  },
  {
    id: "web",
    label: "Web fallback",
    audience: "když se setup sekne",
    summary: "Použijte, když vás blokuje instalace nebo autentizace.",
  },
];

const seedWorkshopBriefsEn: ProjectBrief[] = [
  {
    id: "devtoolbox-cli",
    title: "DevToolbox CLI",
    problem: "Developers lose time on repeated small utilities that are scattered across wiki pages, shell history, and private notes.",
    userStories: [
      "As a developer, I want to turn a log or JSON blob into a readable format with one command.",
      "As a developer, I want a fast way to list the last problematic commits or branches.",
      "As a team, I want the commands documented clearly so another team can continue after the handoff.",
    ],
    architectureNotes: [
      "The CLI can be written in any language, but commands must stay easy to discover.",
      "AGENTS.md must explain the build and test flow and the expected output style.",
      "A handoff runbook matters more than a wide feature set.",
    ],
    acceptanceCriteria: [
      "There are at least 3 useful commands.",
      "README and AGENTS.md explain how to run the tool locally.",
      "A new team can add or fix another command within 10 minutes.",
    ],
    firstAgentPrompt:
      "Design a minimal CLI architecture that survives handoff. Start with AGENTS.md, then a plan, and only then implementation.",
  },
  {
    id: "standup-bot",
    title: "Standup Bot",
    problem: "Daily standups in chat often become long, inconsistent, and hard to review later.",
    userStories: [
      "As a team lead, I want standup replies collected into one overview.",
      "As a developer, I want blockers and dependencies visible in one place.",
      "As the next team after rotation, I want to understand the data flow and integration points quickly.",
    ],
    architectureNotes: [
      "Prefer a clear data model over a complicated integration.",
      "Mock data is fine if the workflow still feels realistic.",
      "Prompts and runbooks must be part of the solution, not a side note.",
    ],
    acceptanceCriteria: [
      "The bot can ingest at least seed data and produce a summary.",
      "The repo explains how to extend the solution to a real chat channel.",
      "After rotation, another team can continue without verbal explanation.",
    ],
    firstAgentPrompt:
      "Split the work into ingest, summarization, and context for the next team. Before implementation, create the documentation the next team should open first.",
  },
  {
    id: "code-review-helper",
    title: "Code Review Helper",
    problem:
      "Code review often depends on who looked at the diff, which means risky changes slip through without a shared language for certainty, heuristics, and required follow-up.",
    userStories: [
      "As a reviewer, I want a checklist of changed boundaries, risks, and follow-up questions extracted from a diff.",
      "As the author of a change, I want to know what I should verify before I ask for review.",
      "As the inheriting team, I want the first team's review heuristics recorded so I can extend them instead of rediscovering them.",
    ],
    architectureNotes: [
      "This can be a CLI, a web tool, or a simple script. The key is a clean diff -> rubric -> checklist flow.",
      "Make the output separate certainty from heuristic suspicion.",
      "Add a seed diff or examples folder so another team can test new rules quickly.",
    ],
    acceptanceCriteria: [
      "The tool produces a review checklist from a seed diff.",
      "It explains what is certain, what is heuristic, and what still needs human judgment.",
      "Another team can add a new rule without a long onboarding call.",
    ],
    firstAgentPrompt:
      "Do not start by generating code. First define the review rubric, the certainty model, and the seed diff flow another team should open first.",
  },
  {
    id: "metrics-dashboard",
    title: "Metrics Dashboard",
    problem: "Teams have data but struggle to turn it into a shared view that actually supports decisions.",
    userStories: [
      "As a team, I want several metrics on one screen.",
      "As a facilitator, I want to change seed data without touching UI logic.",
      "As the next team after rotation, I want to understand the screen and data structure within minutes.",
    ],
    architectureNotes: [
      "Separate seed data from UI from the first commit.",
      "Mobile-first is a plus, but projected desktop view still needs to stay readable.",
      "Monitoring and README should explain what already works and what does not.",
    ],
    acceptanceCriteria: [
      "The dashboard shows at least 3 metrics and one trend.",
      "The repo describes both data sources and mock fallbacks.",
      "A new team can add another metric without breaking the layout.",
    ],
    firstAgentPrompt:
      "Design a dashboard that survives handoff. First describe the data model, components, and done criteria, and only then write the UI.",
  },
];

const seedWorkshopChallengesEn: Challenge[] = [
  {
    id: "agents-md",
    title: "Create AGENTS.md as a map",
    category: "Context Engineering",
    phaseHint: "before-lunch",
    description: "Write down the goal, build and test flow, durable rules, and where the next team should look first.",
    completedBy: ["t1", "t3"],
  },
  {
    id: "review-skill",
    title: "Write a code review skill",
    category: "Context Engineering",
    phaseHint: "before-lunch",
    description: "At least one repeatable review routine must live in the repo as a skill or runbook, not only in a prompt.",
    completedBy: [],
  },
  {
    id: "plan-first",
    title: "Use /plan before coding",
    category: "Workflow",
    phaseHint: "before-lunch",
    description: "Let the agent plan the work first, show what the plan was based on, and record the next safe move.",
    completedBy: ["t2"],
  },
  {
    id: "smallest-verification",
    title: "Add the smallest useful verification",
    category: "Workflow",
    phaseHint: "before-lunch",
    description: "Create a RED test, tracer bullet, or simple browser check before you give the agent more autonomy.",
    completedBy: [],
  },
  {
    id: "parallel-agents",
    title: "Run 2 parallel Codex sessions",
    category: "Advanced",
    phaseHint: "after-rotation",
    description: "Split the problem into two independent streams and compare what actually worked.",
    completedBy: [],
  },
  {
    id: "done-when",
    title: "Add 'Done When' to every task",
    category: "Meta",
    phaseHint: "anytime",
    description: "Every important task needs an explicit completion criterion and a link to verification.",
    completedBy: ["t4"],
  },
];

const seedWorkshopTickerEn: TickerItem[] = [
  { id: "tick-1", label: "Team 3 just added its first custom skill.", tone: "highlight" },
  { id: "tick-2", label: "Team 1 has made 6 commits in the last 30 minutes.", tone: "signal" },
  {
    id: "tick-3",
    label: "Intermezzo in 12 minutes: write what changed, what verifies it, and what the next team should read first.",
    tone: "info",
  },
];

const seedWorkshopSetupPathsEn: SetupPath[] = [
  {
    id: "cli",
    label: "Codex CLI",
    audience: "macOS / Linux",
    summary: "The fastest path for people who want to work directly in the repo and terminal.",
  },
  {
    id: "app",
    label: "Codex App",
    audience: "Windows / macOS",
    summary: "A safe fallback for participants who do not want to solve CLI setup first thing in the morning.",
  },
  {
    id: "web",
    label: "Web fallback",
    audience: "when setup gets blocked",
    summary: "Use this when installation or authentication is blocking you.",
  },
];

export function createWorkshopInventory(contentLang: WorkshopContentLanguage, externalBlueprint?: BlueprintAgenda) {
  const seedBriefs = contentLang === "en" ? seedWorkshopBriefsEn : seedWorkshopBriefs;
  const seedChallenges = contentLang === "en" ? seedWorkshopChallengesEn : seedWorkshopChallenges;
  const seedTickerItems = contentLang === "en" ? seedWorkshopTickerEn : seedWorkshopTicker;
  const seedSetupPathItems = contentLang === "en" ? seedWorkshopSetupPathsEn : seedWorkshopSetupPaths;

  const briefs = externalBlueprint?.inventory?.briefs ?? seedBriefs;
  const challenges = externalBlueprint?.inventory?.challenges
    ? externalBlueprint.inventory.challenges.map((c) => ({ ...c, completedBy: [] as string[] }))
    : seedChallenges;

  return {
    briefs: briefs.map(cloneProjectBrief),
    challenges: challenges.map(cloneChallenge),
    ticker: seedTickerItems.map(cloneTickerItem),
    setupPaths: seedSetupPathItems.map(cloneSetupPath),
  };
}

export function createPreparedInstanceTicker(templateLabel: string, contentLang: WorkshopContentLanguage): TickerItem[] {
  return [
    {
      id: "tick-reset",
      label:
        contentLang === "en"
          ? "Instance is ready. Register teams and start the first checkpoint."
          : `Instance ${templateLabel} je připravená. Zaregistrujte týmy a spusťte první checkpoint.`,
      tone: "info",
    },
  ];
}

function createWorkshopMetaFromTemplate(
  template: WorkshopTemplate,
  contentLang: WorkshopContentLanguage = "cs",
): WorkshopMeta {
  const resolvedContentLang = resolveWorkshopContentLanguage(contentLang);
  const agenda = getBlueprintAgenda(resolvedContentLang);
  const blueprintMetaCopy = getBlueprintWorkshopMetaCopy(resolvedContentLang);
  return {
    title: blueprintMetaCopy.title,
    subtitle: blueprintMetaCopy.subtitle,
    contentLang: resolvedContentLang,
    eventTitle: template.defaultEventTitle,
    city: template.city,
    dateRange: template.dateLabel,
    venueName: template.city,
    roomName: template.room,
    addressLine:
      resolvedContentLang === "en" ? "Address or waypoint" : "Adresa nebo orientační bod",
    locationDetails:
      resolvedContentLang === "en"
        ? "Add the concrete venue, room, and logistics notes for this event."
        : "Doplňte konkrétní venue, room a organizační poznámky pro tuto akci.",
    facilitatorLabel: "facilitator crew",
    currentPhaseLabel: agenda.phases[0]?.label ?? "Opening",
    adminHint: blueprintMetaCopy.adminHint,
  };
}

function normalizeWorkshopMeta(meta: WorkshopMeta | undefined, template: WorkshopTemplate): WorkshopMeta {
  if (!meta) {
    return createWorkshopMetaFromTemplate(template);
  }

  const contentLang = resolveWorkshopContentLanguage(meta.contentLang);
  const blueprintMetaCopy = getBlueprintWorkshopMetaCopy(contentLang);

  return {
    ...meta,
    title: meta.title || blueprintMetaCopy.title,
    subtitle: meta.subtitle || blueprintMetaCopy.subtitle,
    contentLang,
    adminHint: meta.adminHint || blueprintMetaCopy.adminHint,
  };
}

export function getWorkshopTemplateVariantLabel(template: WorkshopTemplate, lang: "cs" | "en") {
  void template;
  return lang === "cs" ? "střední skupina • cca 15-20 lidí" : "medium group • about 15-20 people";
}

export const workshopTemplates: WorkshopTemplate[] = [
  {
    id: "blueprint-default",
    label: "Výchozí blueprint",
    defaultEventTitle: "Harness Lab workshop",
    city: "Workshop venue",
    dateLabel: "Workshop day",
    room: "Main room",
    scenario: "20-participants",
  },
];

export const sampleWorkshopInstances: WorkshopInstanceRecord[] = [
  createWorkshopInstanceRecord({
    id: "sample-studio-a",
    templateId: "blueprint-default",
    importedAt: "2026-04-07T09:00:00.000Z",
    workshopMeta: createSampleWorkshopMeta({
      eventTitle: "Ukázková instance A",
      city: "Studio A",
      room: "Demo room",
      addressLine: "Lab D campus, Studio A",
      locationDetails: "Sample/demo workshop metadata",
    }),
  }),
  createWorkshopInstanceRecord({
    id: "sample-studio-b",
    templateId: "blueprint-default",
    importedAt: "2026-04-07T09:30:00.000Z",
    workshopMeta: createSampleWorkshopMeta({
      eventTitle: "Ukázková instance B",
      city: "Studio B",
      room: "Breakout room",
      addressLine: "Studio B campus, Breakout wing",
      locationDetails: "Sample/demo workshop metadata",
    }),
  }),
  createWorkshopInstanceRecord({
    id: "sample-lab-c",
    templateId: "blueprint-default",
    importedAt: "2026-04-07T10:00:00.000Z",
    workshopMeta: createSampleWorkshopMeta({
      eventTitle: "Ukázková instance C",
      city: "Lab C",
      room: "Project room",
      addressLine: "Lab C campus, Lab C",
      locationDetails: "Sample/demo workshop metadata",
    }),
  }),
  createWorkshopInstanceRecord({
    id: "sample-lab-d",
    templateId: "blueprint-default",
    importedAt: "2026-04-07T10:30:00.000Z",
    workshopMeta: createSampleWorkshopMeta({
      eventTitle: "Ukázková instance D",
      city: "Lab D",
      room: "Review room",
      addressLine: "Lab D campus, Lab D",
      locationDetails: "Sample/demo workshop metadata",
    }),
  }),
];

const seedAgenda = createAgendaFromBlueprint("cs");

export const seedWorkshopState: WorkshopState = {
  version: 1,
  workshopId: "sample-studio-a",
  workshopMeta: {
    ...(sampleWorkshopInstances[0]?.workshopMeta ?? createWorkshopMetaFromTemplate(workshopTemplates[0])),
    eventTitle: "Ukázkový workshop Harness Lab",
    currentPhaseLabel: "Build Phase 1",
  },
  agenda: seedAgenda,
  liveMoment: createLiveMomentState(seedAgenda),
  teams: [
    {
      id: "t1",
      name: "Tým 1",
      city: "Studio A",
      members: ["Anna", "David", "Eva", "Marek", "Tomáš"],
      repoUrl: "https://github.com/example/standup-bot",
      projectBriefId: "standup-bot",
      checkIns: [],
      anchor: null,
    },
    {
      id: "t2",
      name: "Tým 2",
      city: "Studio B",
      members: ["Jana", "Karel", "Lucie", "Petr", "Veronika"],
      repoUrl: "https://github.com/example/devtoolbox-cli",
      projectBriefId: "devtoolbox-cli",
      checkIns: [],
      anchor: null,
    },
    {
      id: "t3",
      name: "Tým 3",
      city: "Lab C",
      members: ["Adam", "Barbora", "Filip", "Lenka"],
      repoUrl: "https://github.com/example/code-review-helper",
      projectBriefId: "code-review-helper",
      checkIns: [],
      anchor: null,
    },
    {
      id: "t4",
      name: "Tým 4",
      city: "Lab D",
      members: ["Daniel", "Hana", "Jakub", "Zuzana"],
      repoUrl: "https://github.com/example/metrics-dashboard",
      projectBriefId: "metrics-dashboard",
      checkIns: [],
      anchor: null,
    },
  ],
  briefs: seedWorkshopBriefs.map(cloneProjectBrief),
  challenges: seedWorkshopChallenges.map(cloneChallenge),
  rotation: {
    revealed: false,
    scenario: "20-participants",
    slots: [
      { fromTeam: "Tým 1", toTeam: "Tým 3", note: "Nikdo nezůstává u svého původního stolu." },
      { fromTeam: "Tým 2", toTeam: "Tým 4", note: "Přesuňte se i s laptopem, ale bez ústního handoffu." },
      { fromTeam: "Tým 3", toTeam: "Tým 1", note: "Otevřete nejdřív README, AGENTS.md a plán. Hledejte další safe move." },
      { fromTeam: "Tým 4", toTeam: "Tým 2", note: "První 10 minut jen čtěte, mapujte repo a napište vlastní diagnózu." },
    ],
  },
  ticker: seedWorkshopTicker.map(cloneTickerItem),
  monitoring: [
    { teamId: "t1", agentsFile: true, skillsCount: 1, commitsLast30Min: 6, testsVisible: 2 },
    { teamId: "t2", agentsFile: false, skillsCount: 0, commitsLast30Min: 3, testsVisible: 0 },
    { teamId: "t3", agentsFile: true, skillsCount: 2, commitsLast30Min: 4, testsVisible: 1 },
    { teamId: "t4", agentsFile: true, skillsCount: 0, commitsLast30Min: 5, testsVisible: 0 },
  ],
  sprintUpdates: [
    {
      id: "u1",
      teamId: "t1",
      text: "Vyjasnili jsme build flow, přesunuli trvalá pravidla z promptu do AGENTS.md a doplnili další safe move.",
      at: "10:47",
    },
    {
      id: "u2",
      teamId: "t3",
      text: "Rozdělili jsme agentovi práci na ingest diffu a tvorbu checklistu a přidali první ověřitelný check.",
      at: "10:52",
    },
    {
      id: "u3",
      teamId: "t4",
      text: "Seed data jsme oddělili od UI a dopsali, co je hotové, co je hypotéza a co má další tým číst jako první.",
      at: "10:58",
    },
  ],
  participantCheckIns: [],
  setupPaths: seedWorkshopSetupPaths.map(cloneSetupPath),
};

export function getTeamName(teamId: string, teams: Team[]) {
  return teams.find((team) => team.id === teamId)?.name ?? teamId;
}

/**
 * Default 9-question feedback template used when an instance has no
 * feedback_form override (feedback_form column is NULL). The copy here
 * is a v1 placeholder intended to be replaced during Phase 6 of
 * docs/plans/2026-04-21-feat-post-workshop-feedback-plan.md after the
 * HTML mockup + copy table preview review. CS and EN must both read
 * clean against the participant-mode voice triad (Rule 2b) and the
 * defocus-rescue rule (Rule 1) from feedback_participant_copy_voice.md.
 *
 * Per-instance overrides live in `workshop_instances.feedback_form`
 * (hand-edit JSONB in v1; authoring UI is v2).
 */
export function getDefaultFeedbackTemplate(): FeedbackFormTemplate {
  return {
    version: 1,
    questions: [
      {
        id: "overall",
        type: "likert",
        scale: 5,
        prompt: {
          cs: "Jak to celkově dopadlo?",
          en: "Overall, how was the workshop?",
        },
        anchorMin: { cs: "vůbec", en: "not really" },
        anchorMax: { cs: "výborně", en: "excellent" },
      },
      {
        id: "theme",
        type: "likert",
        scale: 5,
        prompt: {
          cs: "Jak vám sedlo téma?",
          en: "How well did the theme land?",
        },
        anchorMin: { cs: "vůbec", en: "not really" },
        anchorMax: { cs: "výborně", en: "excellent" },
      },
      {
        id: "facilitation",
        type: "likert",
        scale: 5,
        prompt: {
          cs: "Jak vám sedla facilitace?",
          en: "How was the facilitation?",
        },
        anchorMin: { cs: "vůbec", en: "not really" },
        anchorMax: { cs: "výborně", en: "excellent" },
      },
      {
        id: "takeaway",
        type: "open-text",
        prompt: {
          cs: "Jedna věc, kterou si z dneška odnášíte?",
          en: "One thing you're taking with you from today?",
        },
        placeholder: {
          cs: "Jedna věta, která vám zůstane.",
          en: "One sentence that stays with you.",
        },
        rows: 2,
      },
      {
        id: "valuable",
        type: "open-text",
        prompt: {
          cs: "Co pro vás bylo nejcennější?",
          en: "What was the most valuable part?",
        },
        rows: 3,
      },
      {
        id: "better",
        type: "open-text",
        prompt: {
          cs: "Co by šlo udělat líp?",
          en: "What could be better?",
        },
        rows: 3,
      },
      {
        id: "recommend",
        type: "single-choice",
        prompt: {
          cs: "Doporučili byste to kolegovi nebo kolegyni?",
          en: "Would you recommend this to a colleague?",
        },
        options: [
          { id: "yes", label: { cs: "ano", en: "yes" } },
          { id: "maybe", label: { cs: "možná", en: "maybe" } },
          { id: "no", label: { cs: "ne", en: "no" } },
        ],
      },
      {
        id: "testimonial",
        type: "open-text",
        optional: true,
        prompt: {
          cs: "Můžeme z toho citovat? Pár vět, které bychom mohli použít.",
          en: "A sentence or two we could quote as a testimonial?",
        },
        placeholder: {
          cs: "Jen pokud chcete.",
          en: "Only if you'd like.",
        },
        rows: 3,
      },
      {
        id: "quote-ok",
        type: "checkbox",
        defaultChecked: false,
        prompt: {
          cs: "Můžete mě jmenovitě citovat v marketingových materiálech.",
          en: "You can quote me by name in marketing materials.",
        },
      },
    ],
  };
}

/**
 * Resolve the effective feedback template for an instance — per-instance
 * override if set, otherwise the default. Used by the participant form
 * renderer and the admin summary aggregator.
 */
export function resolveEffectiveFeedbackTemplate(
  instance: Pick<WorkshopInstanceRecord, "feedbackForm">,
): FeedbackFormTemplate {
  return instance.feedbackForm ?? getDefaultFeedbackTemplate();
}

export function createWorkshopInstanceRecord(input: {
  id: string;
  templateId: string;
  contentLang?: WorkshopContentLanguage;
  workshopMeta?: WorkshopMeta;
  status?: WorkshopInstanceStatus;
  blueprintId?: string;
  blueprintVersion?: number;
  importedAt?: string;
  removedAt?: string | null;
  allowWalkIns?: boolean;
  teamModeEnabled?: boolean;
  feedbackForm?: FeedbackFormTemplate | null;
}): WorkshopInstanceRecord {
  const template = workshopTemplates.find((item) => item.id === input.templateId) ?? workshopTemplates[0];

  return {
    id: input.id,
    templateId: template.id,
    status: input.status ?? "prepared",
    blueprintId: input.blueprintId ?? blueprintAgendaCs.blueprintId,
    blueprintVersion: input.blueprintVersion ?? blueprintAgendaCs.version,
    importedAt: input.importedAt ?? new Date().toISOString(),
    removedAt: input.removedAt ?? null,
    allowWalkIns: input.allowWalkIns ?? true,
    teamModeEnabled: input.teamModeEnabled ?? true,
    feedbackForm: input.feedbackForm ?? null,
    workshopMeta: normalizeWorkshopMeta(
      input.workshopMeta ?? createWorkshopMetaFromTemplate(template, input.contentLang),
      template,
    ),
  };
}

export function createWorkshopStateFromInstance(instance: WorkshopInstanceRecord, externalBlueprint?: BlueprintAgenda): WorkshopState {
  const template = workshopTemplates.find((item) => item.id === instance.templateId) ?? workshopTemplates[0];
  const agendaMode: AgendaMode = instance.teamModeEnabled ? "facilitator" : "participant";
  const blueprintSource = externalBlueprint ?? getBlueprintAgenda(instance.workshopMeta.contentLang, agendaMode);
  const agenda = createAgendaFromBlueprint(instance.workshopMeta.contentLang, blueprintSource.phases[0]?.id, externalBlueprint);
  const inventory = createWorkshopInventory(instance.workshopMeta.contentLang, externalBlueprint);
  const currentPhaseLabel = agenda.find((item) => item.status === "current")?.title ?? instance.workshopMeta.currentPhaseLabel;

  return {
    ...seedWorkshopState,
    version: 1,
    workshopId: instance.id,
    workshopMeta: {
      ...instance.workshopMeta,
      currentPhaseLabel,
    },
    rotation: {
      ...seedWorkshopState.rotation,
      revealed: false,
      scenario: template.scenario,
    },
    teams: [],
    monitoring: [],
    sprintUpdates: [],
    briefs: inventory.briefs,
    challenges: inventory.challenges.map((challenge) => ({ ...challenge, completedBy: [] })),
    agenda,
    liveMoment: createLiveMomentState(agenda),
    ticker: createPreparedInstanceTicker(template.label, instance.workshopMeta.contentLang),
    setupPaths: inventory.setupPaths,
  };
}

export function createWorkshopStateFromTemplate(
  templateId: string,
  instanceId?: string,
  contentLang?: WorkshopContentLanguage,
  externalBlueprint?: BlueprintAgenda,
): WorkshopState {
  const template = workshopTemplates.find((item) => item.id === templateId) ?? workshopTemplates[0];
  return createWorkshopStateFromInstance(
    createWorkshopInstanceRecord({
      id: instanceId ?? template.id,
      templateId: template.id,
      contentLang,
      workshopMeta: createWorkshopMetaFromTemplate(template, contentLang),
    }),
    externalBlueprint,
  );
}
