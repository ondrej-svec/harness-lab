import type { ParticipantTeamLookup } from "./event-access";
import type { ParticipantSession } from "./runtime-contracts";
import type { PresenterBlock, TickerItem, WorkshopState } from "./workshop-data";
import { publicCopy, type UiLanguage, withLang } from "./ui-language";

const publicRepoUrl = "https://github.com/ondrej-svec/harness-lab";
const blueprintRepoUrl = "https://github.com/ondrej-svec/harness-lab/tree/main/workshop-blueprint";

type PublicCopy = (typeof publicCopy)[UiLanguage];
type AgendaItem = WorkshopState["agenda"][number];

export type HeaderNavLink = {
  href: string;
  label: string;
  external?: boolean;
};

export type ParticipantMetric = {
  label: string;
  value: string;
};

export type ParticipantPanelState = {
  title: string;
  body: string;
  metrics: ParticipantMetric[];
  currentPhaseLabel: string;
  currentPhaseTitle: string;
  currentPhaseDescription: string | null;
  nextPhaseLabel: string | null;
  guidanceLabel: string | null;
  guidanceBlocks: PresenterBlock[];
};

function buildFallbackParticipantGuidance(options: {
  currentAgendaItem: AgendaItem | undefined;
  copy: PublicCopy;
}): { label: string | null; blocks: PresenterBlock[] } {
  const { currentAgendaItem, copy } = options;

  if (!currentAgendaItem) {
    return { label: null, blocks: [] };
  }

  const blocks: PresenterBlock[] = [
    {
      id: `${currentAgendaItem.id}-participant-hero`,
      type: "hero",
      eyebrow: currentAgendaItem.title,
      title: currentAgendaItem.goal || currentAgendaItem.title,
      body: currentAgendaItem.roomSummary || currentAgendaItem.description || undefined,
    },
    {
      id: `${currentAgendaItem.id}-participant-preview`,
      type: "participant-preview",
      body: copy.participantGuidancePreviewBody,
    },
  ];

  const focusItems =
    currentAgendaItem.checkpointQuestions.length > 0
      ? currentAgendaItem.checkpointQuestions.slice(0, 3)
      : [currentAgendaItem.roomSummary || currentAgendaItem.description].filter(Boolean);

  if (focusItems.length > 0) {
    blocks.splice(1, 0, {
      id: `${currentAgendaItem.id}-participant-focus`,
      type: "bullet-list",
      title: copy.participantGuidanceFocusTitle,
      items: focusItems,
    });
  }

  return {
    label: copy.participantGuidanceFallbackLabel,
    blocks,
  };
}

export type PublicAccessPanelState = {
  eventCodeDefaultValue: string;
  showSampleHint: boolean;
  errorMessage: string | null;
};

export function deriveHomePageState(state: WorkshopState) {
  const { agenda, rotation, ticker } = state;
  const currentAgendaItem = agenda.find((item) => item.status === "current") ?? agenda[0];
  const nextAgendaItem = agenda.find((item) => item.status === "upcoming");

  return {
    currentAgendaItem,
    nextAgendaItem,
    participantNotes: ticker.slice(0, 3),
    rotationRevealed: rotation.revealed,
  };
}

export function buildSiteHeaderNavLinks(options: {
  isParticipant: boolean;
  lang: UiLanguage;
  copy: PublicCopy;
}): HeaderNavLink[] {
  const { isParticipant, lang, copy } = options;
  const links = isParticipant
    ? [
        { href: "#room", label: copy.navRoom },
        { href: "#teams", label: copy.navTeams },
        { href: "#notes", label: copy.navNotes },
      ]
    : [
        { href: "#overview", label: copy.navOverview },
        { href: "#principles", label: copy.navPrinciples },
        { href: "#details", label: copy.navDetails },
        { href: blueprintRepoUrl, label: copy.navBlueprint, external: true },
        { href: "#access", label: copy.navParticipantAccess },
        { href: publicRepoUrl, label: copy.navRepo, external: true },
      ];

  return [
    ...links,
    { href: withLang("/admin", lang), label: copy.navFacilitatorLogin },
  ];
}

export function buildPublicFooterLinks(lang: UiLanguage, copy: PublicCopy): HeaderNavLink[] {
  return [
    { href: "#overview", label: copy.footerTop },
    { href: "#access", label: copy.footerParticipantAccess },
    { href: blueprintRepoUrl, label: copy.footerBlueprint, external: true },
    { href: publicRepoUrl, label: copy.navRepo, external: true },
    { href: withLang("/admin", lang), label: copy.facilitatorLogin },
  ];
}

export function buildPublicAccessPanelState(options: {
  configuredEventCode: { isSample?: boolean; sampleCode?: string } | null;
  eventAccessError?: string;
  copy: PublicCopy;
}): PublicAccessPanelState {
  const { configuredEventCode, eventAccessError, copy } = options;

  return {
    eventCodeDefaultValue: configuredEventCode?.isSample ? (configuredEventCode.sampleCode ?? "") : "",
    showSampleHint: Boolean(configuredEventCode?.isSample),
    errorMessage: eventAccessError ? formatEventAccessError(eventAccessError, copy) : null,
  };
}

export function buildParticipantPanelState(options: {
  copy: PublicCopy;
  lang: UiLanguage;
  currentAgendaItem: AgendaItem | undefined;
  nextAgendaItem: AgendaItem | undefined;
  participantSession: ParticipantSession;
  rotationRevealed: boolean;
}): ParticipantPanelState {
  const { copy, lang, currentAgendaItem, nextAgendaItem, participantSession, rotationRevealed } = options;
  const currentTitle = currentAgendaItem?.title ?? copy.participantTitleFallback;
  const participantScene = currentAgendaItem?.presenterScenes.find(
    (scene) => scene.enabled && scene.sceneType === "participant-view",
  );
  const fallbackGuidance = buildFallbackParticipantGuidance({ currentAgendaItem, copy });

  return {
    title: currentTitle,
    body: rotationRevealed ? copy.participantBodyRevealed : copy.participantBodyHidden,
    metrics: [
      { label: copy.metricCurrentPhase, value: currentTitle },
      { label: copy.metricNext, value: nextAgendaItem?.title ?? copy.metricReflection },
      { label: copy.metricSessionUntil, value: formatDateTime(participantSession.expiresAt, lang) },
    ],
    currentPhaseLabel: copy.metricCurrentPhase,
    currentPhaseTitle: `${currentAgendaItem?.time ?? ""}${currentAgendaItem ? " • " : ""}${currentTitle}`.trim(),
    currentPhaseDescription: currentAgendaItem?.description ?? null,
    nextPhaseLabel: nextAgendaItem ? `${copy.metricNext}: ${nextAgendaItem.time} • ${nextAgendaItem.title}` : null,
    guidanceLabel: participantScene?.label ?? fallbackGuidance.label,
    guidanceBlocks: participantScene?.blocks ?? fallbackGuidance.blocks,
  };
}

export function buildParticipantTeamCards(participantTeams: ParticipantTeamLookup | null) {
  return participantTeams?.items ?? [];
}

export function buildSharedRoomNotes(publicNotes: TickerItem[]) {
  return publicNotes.map((item) => item.label);
}

export function formatDateTime(value: string, lang: UiLanguage) {
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatEventAccessError(value: string, copy: PublicCopy) {
  switch (value) {
    case "invalid_code":
      return copy.invalidCode;
    case "expired_code":
      return copy.expiredCode;
    default:
      return copy.unknownCodeError;
  }
}

export function getPublicRepoUrl() {
  return publicRepoUrl;
}

export function getBlueprintRepoUrl() {
  return blueprintRepoUrl;
}
