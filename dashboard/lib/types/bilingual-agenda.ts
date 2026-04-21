/**
 * Bilingual workshop agenda schema (v3).
 *
 * Single source of truth for structured workshop content.
 * English is canonical; Czech is a reviewed adaptation.
 * Generated views (agenda-cs.json, agenda-en.json) are emitted
 * by scripts/content/generate-views.ts — never hand-edited.
 */

// ---------------------------------------------------------------------------
// Shared (language-independent) types
// ---------------------------------------------------------------------------

export type WorkshopSourceRef = {
  label: string;
  path: string;
};

export type FacilitatorRunner = {
  goal: string;
  say: string[];
  show: string[];
  do: string[];
  watch: string[];
  fallback: string[];
};

// ---------------------------------------------------------------------------
// Presenter blocks — discriminated union by `type`
// ---------------------------------------------------------------------------

type BlockBase = { id: string };

export type PresenterBlock =
  | (BlockBase & {
      type: "hero";
      eyebrow?: string;
      title: string;
      body?: string;
    })
  | (BlockBase & {
      type: "rich-text";
      content: string;
    })
  | (BlockBase & {
      type: "bullet-list";
      title?: string;
      items: string[];
    })
  | (BlockBase & {
      type: "quote";
      quote: string;
      attribution?: string;
    })
  | (BlockBase & {
      type: "steps";
      title?: string;
      items: Array<{ title: string; body?: string }>;
    })
  | (BlockBase & {
      type: "checklist";
      title?: string;
      items: string[];
    })
  | (BlockBase & {
      type: "image";
      src: string;
      alt: string;
      caption?: string;
      sourceLabel?: string;
      sourceHref?: string | null;
    })
  | (BlockBase & {
      type: "link-list";
      title?: string;
      items: Array<{
        label: string;
        href?: string | null;
        description?: string;
      }>;
    })
  | (BlockBase & {
      type: "callout";
      tone: "info" | "warning" | "success";
      title?: string;
      body: string;
    })
  | (BlockBase & {
      type: "participant-preview";
      body?: string;
    });

// ---------------------------------------------------------------------------
// Language-specific content within a scene
// ---------------------------------------------------------------------------

export type BilingualSceneContent = {
  label: string;
  title: string;
  body: string;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  facilitatorNotes: string[];
  sourceRefs: WorkshopSourceRef[];
  blocks: PresenterBlock[];
  participantVariant?: Partial<Omit<BilingualSceneContent, "participantVariant">>;
};

export type BilingualPollOption = {
  id: string;
  label: string;
};

export type BilingualPollContent = {
  prompt: string;
  options: BilingualPollOption[];
};

export type BilingualPollDefinition = {
  id: string;
  en: BilingualPollContent;
  cs: BilingualPollContent;
  cs_reviewed: boolean;
};

export type BilingualParticipantMomentContent = {
  label: string;
  title: string;
  body: string;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  blocks: PresenterBlock[];
  participantVariant?: Partial<Omit<BilingualParticipantMomentContent, "participantVariant">>;
};

// ---------------------------------------------------------------------------
// Scene — structural fields + per-language content
// ---------------------------------------------------------------------------

export type BilingualScene = {
  id: string;
  sceneType: string;
  intent?: string;
  surface?: string;
  chromePreset?: string;

  en: BilingualSceneContent;
  cs: BilingualSceneContent;
  cs_reviewed: boolean;
};

export type BilingualParticipantMoment = {
  id: string;
  roomSceneIds?: string[];
  feedbackEnabled?: boolean;
  poll?: BilingualPollDefinition | null;

  en: BilingualParticipantMomentContent;
  cs: BilingualParticipantMomentContent;
  cs_reviewed: boolean;
};

// ---------------------------------------------------------------------------
// Language-specific content within a phase
// ---------------------------------------------------------------------------

export type BilingualPhaseContent = {
  label: string;
  goal: string;
  roomSummary: string;
  facilitatorPrompts: string[];
  watchFors: string[];
  checkpointQuestions: string[];
  sourceRefs: WorkshopSourceRef[];
  facilitatorRunner: FacilitatorRunner;
  participantVariant?: Partial<Omit<BilingualPhaseContent, "participantVariant">>;
};

// ---------------------------------------------------------------------------
// Phase — structural fields + per-language content + scenes
// ---------------------------------------------------------------------------

export type BilingualPhase = {
  id: string;
  order: number;
  startTime: string;
  kind: string;
  intent?: string;
  defaultSceneId?: string | null;

  en: BilingualPhaseContent;
  cs: BilingualPhaseContent;
  cs_reviewed: boolean;

  scenes: BilingualScene[];
  participantMoments?: BilingualParticipantMoment[];
};

// ---------------------------------------------------------------------------
// Meta — workshop-level bilingual metadata
// ---------------------------------------------------------------------------

export type BilingualMeta = {
  en: {
    title: string;
    subtitle: string;
    principles: string[];
    sampleDayLabel: string;
    templateAddressLine: string;
    templateLocationDetails: string;
  };
  cs: {
    title: string;
    subtitle: string;
    principles: string[];
    sampleDayLabel: string;
    templateAddressLine: string;
    templateLocationDetails: string;
  };
};

// ---------------------------------------------------------------------------
// Inventory — bilingual project briefs, challenges, ticker, setup paths
// ---------------------------------------------------------------------------

type BilingualProjectBriefContent = {
  title: string;
  problem: string;
  userStories: string[];
  architectureNotes: string[];
  acceptanceCriteria: string[];
  firstAgentPrompt: string;
  participantVariant?: Partial<Omit<BilingualProjectBriefContent, "participantVariant">>;
};

export type BilingualProjectBrief = {
  id: string;
  en: BilingualProjectBriefContent;
  cs: BilingualProjectBriefContent;
};

export type BilingualChallenge = {
  id: string;
  category: string;
  phaseHint: string;
  en: {
    title: string;
    description: string;
  };
  cs: {
    title: string;
    description: string;
  };
  completedBy: string[];
};

export type BilingualTickerItem = {
  id: string;
  tone: "info" | "signal" | "highlight";
  en: { label: string };
  cs: { label: string };
};

export type BilingualSetupPath = {
  id: string;
  en: {
    label: string;
    audience: string;
    summary: string;
  };
  cs: {
    label: string;
    audience: string;
    summary: string;
  };
};

export type BilingualInventory = {
  briefs: BilingualProjectBrief[];
  challenges: BilingualChallenge[];
  ticker: BilingualTickerItem[];
  setupPaths: BilingualSetupPath[];
};

// ---------------------------------------------------------------------------
// Root schema
// ---------------------------------------------------------------------------

export type BilingualAgenda = {
  schemaVersion: 3;
  blueprintId: string;
  meta: BilingualMeta;
  inventory: BilingualInventory;
  phases: BilingualPhase[];
};
