import type { ParticipantTeamLookup } from "./event-access";
import type { ParticipantSession } from "./runtime-contracts";
import { buildRepoBlobUrl, getBlueprintRepoUrl, getPublicRepoUrl } from "./repo-links";
import type {
  Challenge,
  PresenterBlock,
  ProjectBrief,
  SetupPath,
  Team,
  TeamCheckIn,
  TickerItem,
  WorkshopMeta,
  WorkshopState,
} from "./workshop-data";
import { publicCopy, type UiLanguage, withLang } from "./ui-language";

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
  nextPhaseTitle: string | null;
  sessionUntilLabel: string;
  sessionUntilValue: string;
  guidanceLabel: string | null;
  guidanceCtaLabel: string | null;
  guidanceCtaHref: string | null;
  guidanceBlocks: PresenterBlock[];
};

export type ParticipantPrimaryAction = {
  href: string;
  label: string;
};

export type ParticipantWorkingContext = {
  modeLabel: string;
  modeValue: string;
  teamLabel: string | null;
  participantLabel: string | null;
  note: string;
};

export type ParticipantHomeState = {
  showBuildPhaseOneProofSlice: boolean;
  primaryActions: ParticipantPrimaryAction[];
  highlightedBrief: ProjectBrief | null;
  visibleBriefs: ProjectBrief[];
  visibleChallenges: Challenge[];
  teamCards: Array<ParticipantTeamLookup["items"][number]>;
  workingContext: ParticipantWorkingContext;
};

export type ParticipantCheckpointFeedScope = "room" | "phase" | "team" | "mine";

export type ParticipantCheckpointFeedItem = {
  id: string;
  teamId: string;
  teamName: string;
  phaseId: string;
  phaseTitle: string;
  writtenAt: string;
  writtenAtLabel: string;
  writtenBy: string | null;
  participantId: string | null;
  content: string;
  changed: string | null;
  verified: string | null;
  nextStep: string | null;
  isCurrentPhase: boolean;
  isMyTeam: boolean;
  isMine: boolean;
};

export type ParticipantReferenceEntry = {
  id: string;
  label: string;
  description: string;
  href: string | null;
  external?: boolean;
};

export type ParticipantReferenceGroup = {
  id: "defaults" | "accelerators" | "explore";
  title: string;
  description: string;
  items: ParticipantReferenceEntry[];
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
  const { agenda, rotation, ticker, workshopMeta } = state;
  const currentAgendaItem = agenda.find((item) => item.status === "current") ?? agenda[0];
  const nextAgendaItem = agenda.find((item) => item.status === "upcoming");

  return {
    currentAgendaItem,
    nextAgendaItem,
    participantNotes: ticker,
    rotationRevealed: rotation.revealed,
    workshopMeta,
  };
}

export function buildWorkshopContextLine(meta: WorkshopMeta): string {
  const parts = [
    meta.eventTitle ?? meta.title,
    meta.dateRange,
    meta.venueName ?? meta.city,
    meta.roomName,
  ].filter(Boolean);
  return parts.join(" · ").toLowerCase();
}

export function buildSiteHeaderNavLinks(options: {
  isParticipant: boolean;
  lang: UiLanguage;
  copy: PublicCopy;
}): HeaderNavLink[] {
  const { isParticipant, lang, copy } = options;
  if (isParticipant) {
    return [
      { href: "#next", label: copy.navNext },
      { href: "#build", label: copy.navBuild },
      { href: "#reference", label: copy.navReference },
    ];
  }

  const repoLinks = [
    getBlueprintRepoUrl() ? { href: getBlueprintRepoUrl()!, label: copy.navBlueprint, external: true } : null,
    getPublicRepoUrl() ? { href: getPublicRepoUrl()!, label: copy.navRepo, external: true } : null,
  ].filter(Boolean) as HeaderNavLink[];

  return [
    { href: "#overview", label: copy.navOverview },
    { href: "#principles", label: copy.navPrinciples },
    { href: "#structure", label: copy.structureEyebrow },
    { href: "#access", label: copy.navParticipantAccess },
    ...repoLinks,
    { href: withLang("/admin", lang), label: copy.navFacilitatorLogin },
  ];
}

export function buildPublicFooterLinks(lang: UiLanguage, copy: PublicCopy): HeaderNavLink[] {
  return [
    { href: "#overview", label: copy.footerTop },
    { href: "#structure", label: copy.structureEyebrow },
    { href: "#access", label: copy.footerParticipantAccess },
    ...(getBlueprintRepoUrl() ? [{ href: getBlueprintRepoUrl()!, label: copy.footerBlueprint, external: true }] : []),
    ...(getPublicRepoUrl() ? [{ href: getPublicRepoUrl()!, label: copy.navRepo, external: true }] : []),
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
    (scene) => scene.enabled && scene.surface === "participant",
  );
  const fallbackGuidance = buildFallbackParticipantGuidance({ currentAgendaItem, copy });
  const sessionUntilValue = formatSessionExpiry(participantSession.expiresAt, lang);
  const nextPhaseTitle = nextAgendaItem ? `${nextAgendaItem.time} • ${nextAgendaItem.title}` : null;

  return {
    title: currentTitle,
    body: rotationRevealed ? copy.participantBodyRevealed : copy.participantBodyHidden,
    metrics: [
      { label: copy.metricCurrentPhase, value: currentTitle },
      { label: copy.metricNext, value: nextAgendaItem?.title ?? copy.metricReflection },
      { label: copy.metricSessionUntil, value: sessionUntilValue },
    ],
    currentPhaseLabel: copy.metricCurrentPhase,
    currentPhaseTitle: `${currentAgendaItem?.time ?? ""}${currentAgendaItem ? " • " : ""}${currentTitle}`.trim(),
    currentPhaseDescription: currentAgendaItem?.description ?? null,
    nextPhaseLabel: nextPhaseTitle ? `${copy.metricNext}: ${nextPhaseTitle}` : null,
    nextPhaseTitle,
    sessionUntilLabel: copy.metricSessionUntil,
    sessionUntilValue,
    guidanceLabel: participantScene?.label ?? fallbackGuidance.label,
    guidanceCtaLabel: participantScene?.ctaLabel ?? null,
    guidanceCtaHref: participantScene?.ctaHref ?? null,
    guidanceBlocks: participantScene?.blocks ?? fallbackGuidance.blocks,
  };
}

function buildParticipantWorkingContext(options: {
  lang: UiLanguage;
  activeParticipantTeam: Team | null;
  activeParticipantName?: string | null;
}) {
  const { lang, activeParticipantTeam, activeParticipantName } = options;
  const teamSize = activeParticipantTeam?.members.length ?? 0;

  let modeValue: string;
  if (teamSize <= 1) {
    modeValue = lang === "en" ? "solo run" : "samostatná práce";
  } else if (teamSize === 2) {
    modeValue = lang === "en" ? "pair" : "dvojice";
  } else {
    modeValue = lang === "en" ? `team of ${teamSize}` : `tým o ${teamSize} lidech`;
  }

  return {
    modeLabel: lang === "en" ? "working mode" : "pracovní režim",
    modeValue: activeParticipantTeam ? modeValue : lang === "en" ? "room view" : "přehled místnosti",
    teamLabel: activeParticipantTeam ? activeParticipantTeam.name : null,
    participantLabel: activeParticipantName ?? null,
    note: activeParticipantTeam
      ? lang === "en"
        ? "Keep the room context compact. The page should help you move, not manage your whole team."
        : "Držte tady jen to, co právě potřebujete. Tahle stránka má pomoct s dalším krokem, ne nahrazovat týmový board."
      : lang === "en"
        ? "No bound team yet. Use the room materials below and move to the matching repo when your team is clear."
        : "Ještě nemáte přiřazený tým. Vezměte si materiály z místnosti níže a jakmile bude tým jasný, přesuňte se k odpovídajícímu repu.",
  } satisfies ParticipantWorkingContext;
}

export function buildParticipantHomeState(options: {
  lang: UiLanguage;
  currentAgendaItem: AgendaItem | undefined;
  participantTeams: ParticipantTeamLookup | null;
  activeParticipantTeam: Team | null;
  activeParticipantName?: string | null;
  briefs: ProjectBrief[];
  challenges: Challenge[];
}) {
  const { lang, currentAgendaItem, participantTeams, activeParticipantTeam, activeParticipantName, briefs, challenges } = options;
  const teamCards = buildParticipantTeamCards(participantTeams);
  const highlightedBrief = activeParticipantTeam
    ? briefs.find((brief) => brief.id === activeParticipantTeam.projectBriefId) ?? null
    : null;
  const showBuildPhaseOneProofSlice = currentAgendaItem?.id === "build-1";

  const primaryActions: ParticipantPrimaryAction[] =
    lang === "en"
      ? [
          { href: "#build-briefs", label: "Open the brief" },
          { href: "#build-materials", label: "Get team materials" },
          { href: "#checkpoint-capture", label: "Capture a checkpoint" },
        ]
      : [
          { href: "#build-briefs", label: "Otevřít zadání" },
          { href: "#build-materials", label: "Dostat se k materiálům týmu" },
          { href: "#checkpoint-capture", label: "Zapsat checkpoint" },
        ];

  return {
    showBuildPhaseOneProofSlice,
    primaryActions,
    highlightedBrief,
    visibleBriefs: highlightedBrief ? [highlightedBrief] : briefs.slice(0, 3),
    visibleChallenges: challenges
      .filter((challenge) => challenge.phaseHint === "before-lunch" || challenge.phaseHint === "anytime")
      .slice(0, 3),
    teamCards,
    workingContext: buildParticipantWorkingContext({
      lang,
      activeParticipantTeam,
      activeParticipantName,
    }),
  } satisfies ParticipantHomeState;
}

function buildParticipantReferenceHref(id: string) {
  switch (id) {
    case "cli":
      return buildRepoBlobUrl("harness-cli/README.md");
    case "app":
      return buildRepoBlobUrl("workshop-skill/reference.md");
    case "web":
      return buildRepoBlobUrl("README.md");
    default:
      return null;
  }
}

export function buildParticipantReferenceGroups(options: {
  lang: UiLanguage;
  setupPaths: SetupPath[];
}) {
  const { lang, setupPaths } = options;

  const defaults: ParticipantReferenceGroup = {
    id: "defaults",
    title: lang === "en" ? "Curated defaults" : "Základní podklady",
    description:
      lang === "en"
        ? "Start here when you need the workshop path, not more options."
        : "Začněte tady, když potřebujete workshopovou cestu, ne další volby.",
    items: [
      {
        id: "blueprint",
        label: lang === "en" ? "Workshop blueprint" : "Blueprint workshopu",
        description:
          lang === "en"
            ? "The public method: how the day works and what belongs in the repo."
            : "Veřejná metoda: jak funguje den a co patří do repa.",
        href: getBlueprintRepoUrl() ?? buildRepoBlobUrl("workshop-blueprint/control-surfaces.md"),
        external: true,
      },
      {
        id: "skill-reference",
        label: lang === "en" ? "Workshop reference" : "Workshopové podklady",
        description:
          lang === "en"
            ? "Repo-native prompts, commands, and support material for the day."
            : "Prompty, příkazy a podpůrné materiály pro dnešní práci.",
        href: buildRepoBlobUrl("workshop-skill/reference.md"),
        external: true,
      },
    ],
  };

  const accelerators: ParticipantReferenceGroup = {
    id: "accelerators",
    title: lang === "en" ? "Optional accelerators" : "Když chcete zrychlit",
    description:
      lang === "en"
        ? "Useful when local setup is ready, but never required for workshop progress."
        : "Hodí se, když už máte připravený lokální setup, ale nejsou nutné, abyste se ve workshopu posunuli dál.",
    items: setupPaths.map((path) => ({
      id: path.id,
      label: path.label,
      description: `${path.audience} · ${path.summary}`,
      href: buildParticipantReferenceHref(path.id),
      external: true,
    })),
  };

  const explore: ParticipantReferenceGroup = {
    id: "explore",
    title: lang === "en" ? "Explore more" : "Do hloubky",
    description:
      lang === "en"
        ? "Deeper repo-native references when the immediate workshop move is already clear."
        : "Hlubší materiály ve chvíli, kdy už je jasné, co máte udělat právě teď.",
    items: [
      {
        id: "public-repo",
        label: lang === "en" ? "Public repo" : "Veřejné repo",
        description:
          lang === "en"
            ? "Browse the template repo directly."
            : "Projděte si přímo veřejné ukázkové repo.",
        href: getPublicRepoUrl(),
        external: true,
      },
      {
        id: "control-surfaces",
        label: lang === "en" ? "Control surfaces" : "Oddělené vrstvy",
        description:
          lang === "en"
            ? "Why the browser surface, skill, CLI, and facilitator layer stay separate."
            : "Proč zůstávají oddělené prohlížeč, skill, CLI a facilitátorská vrstva.",
        href: buildRepoBlobUrl("workshop-blueprint/control-surfaces.md"),
        external: true,
      },
    ],
  };

  return [defaults, accelerators, explore] satisfies ParticipantReferenceGroup[];
}

export function buildParticipantCheckpointFeed(options: {
  agenda: WorkshopState["agenda"];
  lang: UiLanguage;
  participantTeams: ParticipantTeamLookup | null;
  activeParticipantTeam: Team | null;
  activeParticipantId?: string | null;
  activeParticipantName?: string | null;
  currentPhaseId?: string | null;
}) {
  const { agenda, lang, participantTeams, activeParticipantTeam, activeParticipantId, activeParticipantName, currentPhaseId } = options;
  const phaseTitles = new Map(agenda.map((item) => [item.id, item.title]));
  const normalizedParticipantName = activeParticipantName?.trim().toLocaleLowerCase() ?? null;

  return (participantTeams?.items ?? [])
    .flatMap((team) =>
      team.checkIns.map((entry, index) =>
        buildParticipantCheckpointFeedItem({
          entry,
          index,
          lang,
          phaseTitles,
          team,
          activeParticipantId,
          normalizedParticipantName,
          activeParticipantTeamId: activeParticipantTeam?.id ?? null,
          currentPhaseId: currentPhaseId ?? null,
        }),
      ),
    )
    .sort((left, right) => Date.parse(right.writtenAt) - Date.parse(left.writtenAt));
}

function buildParticipantCheckpointFeedItem(options: {
  entry: TeamCheckIn;
  index: number;
  lang: UiLanguage;
  phaseTitles: Map<string, string>;
  team: ParticipantTeamLookup["items"][number];
  activeParticipantId?: string | null;
  normalizedParticipantName?: string | null;
  activeParticipantTeamId: string | null;
  currentPhaseId: string | null;
}) {
  const {
    entry,
    index,
    lang,
    phaseTitles,
    team,
    activeParticipantId,
    normalizedParticipantName,
    activeParticipantTeamId,
    currentPhaseId,
  } = options;
  const entryName = entry.writtenBy?.trim().toLocaleLowerCase() ?? null;
  const writtenAtLabel =
    Number.isNaN(Date.parse(entry.writtenAt)) ? entry.writtenAt : formatDateTime(entry.writtenAt, lang);

  return {
    id: `${team.id}-${entry.phaseId}-${entry.writtenAt}-${index}`,
    teamId: team.id,
    teamName: team.name,
    phaseId: entry.phaseId,
    phaseTitle: phaseTitles.get(entry.phaseId) ?? entry.phaseId,
    writtenAt: entry.writtenAt,
    writtenAtLabel,
    writtenBy: entry.writtenBy ?? null,
    participantId: entry.participantId ?? null,
    content: entry.content,
    changed: entry.changed ?? null,
    verified: entry.verified ?? null,
    nextStep: entry.nextStep ?? null,
    isCurrentPhase: currentPhaseId ? entry.phaseId === currentPhaseId : false,
    isMyTeam: activeParticipantTeamId ? team.id === activeParticipantTeamId : false,
    isMine:
      (activeParticipantId ? entry.participantId === activeParticipantId : false) ||
      (normalizedParticipantName ? entryName === normalizedParticipantName : false),
  } satisfies ParticipantCheckpointFeedItem;
}

export function filterParticipantCheckpointFeed(
  items: ParticipantCheckpointFeedItem[],
  scope: ParticipantCheckpointFeedScope,
) {
  switch (scope) {
    case "phase":
      return items.filter((item) => item.isCurrentPhase);
    case "team":
      return items.filter((item) => item.isMyTeam);
    case "mine":
      return items.filter((item) => item.isMine);
    case "room":
    default:
      return items;
  }
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

export function formatSessionExpiry(value: string, lang: UiLanguage) {
  const locale = lang === "en" ? "en-US" : "cs-CZ";
  const expiryDate = new Date(value);
  const now = new Date();
  const isToday =
    expiryDate.getFullYear() === now.getFullYear() &&
    expiryDate.getMonth() === now.getMonth() &&
    expiryDate.getDate() === now.getDate();

  if (isToday) {
    return new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(expiryDate);
  }

  const isTomorrow =
    expiryDate.getFullYear() === now.getFullYear() &&
    expiryDate.getMonth() === now.getMonth() &&
    expiryDate.getDate() === now.getDate() + 1;

  if (isTomorrow) {
    const time = new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(expiryDate);
    return lang === "en" ? `tomorrow ${time}` : `zítra ${time}`;
  }

  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(expiryDate);
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

export function buildAgentPrompt(): string {
  const blueprintUrl = getBlueprintRepoUrl();
  const parts = [
    "Explain what Harness Lab is — a workshop about working with AI coding agents in teams.",
    "Use the workshop blueprint for context:",
  ];
  if (blueprintUrl) {
    parts.push(blueprintUrl);
  }
  return parts.join(" ");
}

export { getBlueprintRepoUrl, getPublicRepoUrl };
