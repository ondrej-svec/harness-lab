import type { ParticipantTeamLookup } from "./event-access";
import type { ParticipantSession } from "./runtime-contracts";
import { buildRepoBlobUrl, getBlueprintRepoUrl, getPublicRepoUrl, resolveRepoLinkedHref } from "./repo-links";
import type {
  Challenge,
  ParticipantPollDefinition,
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
type LiveMoment = WorkshopState["liveMoment"];

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
  participantMomentId: string | null;
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
  activePoll: ParticipantPollDefinition | null;
  feedbackEnabled: boolean;
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
  const currentAgendaItem =
    agenda.find((item) => item.status === "current") ??
    agenda[0];
  const nextAgendaItem = agenda.find((item) => item.status === "upcoming");

  return {
    currentAgendaItem,
    nextAgendaItem,
    participantNotes: ticker,
    rotationRevealed: rotation.revealed,
    liveMoment: state.liveMoment,
    workshopMeta,
  };
}

export function resolveActiveParticipantMoment(
  currentAgendaItem: AgendaItem | undefined,
  liveMoment: LiveMoment | undefined,
) {
  if (!currentAgendaItem) {
    return null;
  }

  if (liveMoment?.agendaItemId === currentAgendaItem.id && liveMoment.participantMomentId) {
    const targeted = currentAgendaItem.participantMoments.find(
      (moment) => moment.enabled && moment.id === liveMoment.participantMomentId,
    );
    if (targeted) {
      return targeted;
    }
  }

  return currentAgendaItem.participantMoments.find((moment) => moment.enabled) ?? null;
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
  liveMoment: LiveMoment | undefined;
  participantSession: ParticipantSession;
  rotationRevealed: boolean;
}): ParticipantPanelState {
  const { copy, lang, currentAgendaItem, nextAgendaItem, liveMoment, participantSession, rotationRevealed } = options;
  const currentTitle = currentAgendaItem?.title ?? copy.participantTitleFallback;
  const participantMoment = resolveActiveParticipantMoment(currentAgendaItem, liveMoment);
  const fallbackGuidance = buildFallbackParticipantGuidance({ currentAgendaItem, copy });
  const sessionUntilValue = formatSessionExpiry(participantSession.expiresAt, lang);
  const nextPhaseTitle = nextAgendaItem ? `${nextAgendaItem.time} • ${nextAgendaItem.title}` : null;

  return {
    participantMomentId: participantMoment?.id ?? null,
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
    guidanceLabel: participantMoment?.label ?? fallbackGuidance.label,
    guidanceCtaLabel: participantMoment?.ctaLabel ?? null,
    guidanceCtaHref: participantMoment?.ctaHref ?? null,
    guidanceBlocks: participantMoment?.blocks ?? fallbackGuidance.blocks,
    activePoll: participantMoment?.poll ?? null,
    feedbackEnabled: participantMoment?.feedbackEnabled ?? true,
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
        : "Držte tady jen to, co právě potřebujete. Tahle stránka má pomoct s dalším krokem, ne nahrazovat týmovou plochu."
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
          { href: "#reference", label: "Open resources" },
        ]
      : [
          { href: "#build-briefs", label: "Otevřít zadání" },
          { href: "#build-materials", label: "Dostat se k materiálům týmu" },
          { href: "#reference", label: "Otevřít podklady" },
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

function buildParticipantResourceCatalog(lang: UiLanguage) {
  const isEnglish = lang === "en";

  const repoMaterials: ParticipantReferenceEntry[] = [
    {
      id: "participant-resource-kit",
      label: isEnglish ? "Participant resource kit" : "Participant resource kit",
      description:
        isEnglish
          ? "The shortest portable takeaway: AGENTS.md, one trust anchor, and the next safe move."
          : "Nejkratší přenositelný základ: `AGENTS.md`, jeden trust anchor a další bezpečný krok.",
      href: resolveRepoLinkedHref("materials/participant-resource-kit.md"),
      external: true,
    },
    {
      id: "workshop-reference",
      label: isEnglish ? "Workshop reference" : "Workshop reference",
        description:
          isEnglish
            ? "Commands, defaults, and workshop framing collected in one repo-native reference."
            : "Příkazy, výchozí postupy a rámec workshopu v jednom repo-native přehledu.",
      href: resolveRepoLinkedHref("workshop-skill/reference.md"),
      external: true,
    },
    {
      id: "template-agents",
      label: isEnglish ? "AGENTS.md template" : "Šablona `AGENTS.md`",
      description:
        isEnglish
          ? "The starter map you can copy into a real repo today."
          : "Výchozí mapa, kterou si můžete ještě dnes zkopírovat do reálného repa.",
      href: resolveRepoLinkedHref("workshop-skill/template-agents.md"),
      external: true,
    },
    {
      id: "learner-gallery",
      label: isEnglish ? "Learner reference gallery" : "Galerie navazujících zdrojů",
      description:
        isEnglish
          ? "A short curation of official docs, public repos, and next-step references."
          : "Krátký výběr oficiálních docs, veřejných rep a navazujících zdrojů.",
      href: resolveRepoLinkedHref("docs/learner-reference-gallery.md"),
      external: true,
    },
    {
      id: "harness-cli",
      label: isEnglish ? "Harness CLI" : "Harness CLI",
      description:
        isEnglish
          ? "Install path for the workshop skill and the participant bootstrap."
          : "Instalační cesta pro workshop skill a participant bootstrap.",
      href: resolveRepoLinkedHref("harness-cli/README.md"),
      external: true,
    },
  ];

  const setupAndPlugins: ParticipantReferenceEntry[] = [
    {
      id: "codex-skills-docs",
      label: isEnglish ? "OpenAI Codex skills" : "OpenAI Codex skills",
      description:
        isEnglish
          ? "Official docs for repo-native skills."
          : "Oficiální docs pro repo-native skills.",
      href: "https://developers.openai.com/codex/skills",
      external: true,
    },
    {
      id: "codex-plugins-docs",
      label: isEnglish ? "OpenAI Codex plugins" : "OpenAI Codex plugins",
      description:
        isEnglish
          ? "When a plugin makes more sense than another skill file."
          : "Kdy dává plugin větší smysl než další skill soubor.",
      href: "https://developers.openai.com/codex/plugins",
      external: true,
    },
    {
      id: "codex-build-plugins-docs",
      label: isEnglish ? "Build Codex plugins" : "Build Codex plugins",
      description:
        isEnglish
          ? "Plugin packaging and marketplace model."
          : "Balení pluginů a marketplace model.",
      href: "https://developers.openai.com/codex/plugins/build",
      external: true,
    },
    {
      id: "mcp-intro",
      label: isEnglish ? "Model Context Protocol" : "Model Context Protocol",
      description:
        isEnglish
          ? "Getting started with MCP servers and tool wiring."
          : "Rychlý vstup do MCP serverů a zapojení nástrojů.",
      href: "https://modelcontextprotocol.io/docs/getting-started/intro",
      external: true,
    },
    {
      id: "agent-skills-catalog",
      label: isEnglish ? "agentskills.io" : "agentskills.io",
      description:
        isEnglish
          ? "External skill catalog for more workflow building blocks."
          : "Externí katalog skills pro další workflow stavebnice.",
      href: "https://agentskills.io/home",
      external: true,
    },
  ];

  const sharedArtifactsAndReads: ParticipantReferenceEntry[] = [
    {
      id: "agents-md",
      label: isEnglish ? "agents.md" : "agents.md",
      description:
        isEnglish
          ? "The emerging standard around AGENTS.md files."
          : "Vznikající standard kolem souborů `AGENTS.md`.",
      href: "https://agents.md/",
      external: true,
    },
    {
      id: "fowler-harness",
      label: isEnglish ? "Martin Fowler on harness engineering" : "Martin Fowler o harness engineeringu",
      description:
        isEnglish
          ? "Guides, sensors, feedforward, feedback."
          : "Guides, sensors, feedforward a feedback.",
      href: "https://martinfowler.com/articles/harness-engineering.html",
      external: true,
    },
    {
      id: "openai-harness",
      label: isEnglish ? "OpenAI on harness engineering" : "OpenAI o harness engineeringu",
      description:
        isEnglish
          ? "The observability-stack end state and the closing loop."
          : "Ambiciózní end-state s observability stackem a uzavřenou smyčkou.",
      href: "https://openai.com/index/harness-engineering/",
      external: true,
    },
    {
      id: "artifact-model-picker",
      label: isEnglish ? "HTML: picking a GPT-5 model" : "HTML: výběr GPT-5 modelu",
      description:
        isEnglish
          ? "Repo-hosted HTML reference for choosing a GPT-5 model during coding work."
          : "Repo-hosted HTML přehled pro výběr GPT-5 modelu při práci s kódem.",
      href: resolveRepoLinkedHref("materials/html/codex-model-guide.html"),
      external: true,
    },
    {
      id: "artifact-meta-analysis",
      label: isEnglish ? "HTML: coding-agent working loop" : "HTML: pracovní loop s coding agenty",
      description:
        isEnglish
          ? "Repo-hosted HTML artifact on how to keep the coding-agent loop healthy."
          : "Repo-hosted HTML artefakt o tom, jak udržet zdravý loop s coding agenty.",
      href: resolveRepoLinkedHref("materials/html/coding-agent-working-loop.html"),
      external: true,
    },
    {
      id: "artifact-identify-flow",
      label: isEnglish ? "HTML: participant identify flow" : "HTML: participant identify flow",
      description:
        isEnglish
          ? "Repo-hosted HTML preview of the participant sign-in and identify flow."
          : "Repo-hosted HTML náhled participant sign-in a identify flow.",
      href: resolveRepoLinkedHref("materials/html/participant-identify-flow-preview.html"),
      external: true,
    },
  ];

  return {
    repoMaterials,
    setupAndPlugins,
    sharedArtifactsAndReads,
  };
}

export function buildParticipantReferenceGroups(options: {
  lang: UiLanguage;
  setupPaths: SetupPath[];
}) {
  const { lang, setupPaths } = options;
  const catalog = buildParticipantResourceCatalog(lang);

  const defaults: ParticipantReferenceGroup = {
    id: "defaults",
    title: lang === "en" ? "Workshop materials" : "Workshopové materiály",
    description:
      lang === "en"
        ? "Start with the repo-native workshop materials before you browse outward."
        : "Začněte u repo-native workshopových materiálů a až potom choďte dál.",
    items: [
      ...catalog.repoMaterials,
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
    ],
  };

  const accelerators: ParticipantReferenceGroup = {
    id: "accelerators",
    title: lang === "en" ? "Setup, skills, plugins" : "Setup, skills a pluginy",
    description:
      lang === "en"
        ? "Useful when you want to keep going after the workshop or tighten your local toolkit."
        : "Hodí se ve chvíli, kdy chcete po workshopu pokračovat nebo si zpřesnit lokální toolkit.",
    items: [
      ...setupPaths.map((path) => ({
        id: path.id,
        label: path.label,
        description: `${path.audience} · ${path.summary}`,
        href: buildParticipantReferenceHref(path.id),
        external: true,
      })),
      ...catalog.setupAndPlugins,
    ],
  };

  const explore: ParticipantReferenceGroup = {
    id: "explore",
    title: lang === "en" ? "Published HTML and external reads" : "Publikované HTML a externí čtení",
    description:
      lang === "en"
        ? "Open these when the immediate room move is already clear and you want deeper context."
        : "Otevírejte je ve chvíli, kdy už je jasné, co máte udělat teď, a chcete jít víc do hloubky.",
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
      ...catalog.sharedArtifactsAndReads,
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
    case "rate_limited":
      return copy.rateLimitedCode;
    case "untrusted_origin":
      return copy.unknownCodeError;
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
