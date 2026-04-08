import blueprintAgenda from "./workshop-blueprint-agenda.json";

export type AgendaItem = {
  id: string;
  title: string;
  time: string;
  description: string;
  order: number;
  sourceBlueprintPhaseId: string | null;
  kind: "blueprint" | "custom";
  status: "done" | "current" | "upcoming";
  defaultPresenterSceneId: string | null;
  presenterScenes: PresenterScene[];
};

export type PresenterSceneType =
  | "briefing"
  | "demo"
  | "participant-view"
  | "checkpoint"
  | "reflection"
  | "custom";

export type PresenterScene = {
  id: string;
  label: string;
  sceneType: PresenterSceneType;
  title: string;
  body: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  order: number;
  enabled: boolean;
  sourceBlueprintSceneId: string | null;
  kind: "blueprint" | "custom";
};

const presenterSceneTypes = [
  "briefing",
  "demo",
  "participant-view",
  "checkpoint",
  "reflection",
  "custom",
] as const satisfies PresenterSceneType[];

function normalizePresenterSceneType(value: string): PresenterSceneType {
  return presenterSceneTypes.includes(value as PresenterSceneType) ? (value as PresenterSceneType) : "custom";
}

export type Team = {
  id: string;
  name: string;
  city: string;
  members: string[];
  repoUrl: string;
  projectBriefId: string;
  checkpoint: string;
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
  teamId: string;
  text: string;
  at: string;
};

export type SetupPath = {
  id: string;
  label: string;
  audience: string;
  summary: string;
};

export type WorkshopMeta = {
  title: string;
  subtitle: string;
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
  workshopId: string;
  workshopMeta: WorkshopMeta;
  agenda: AgendaItem[];
  teams: Team[];
  briefs: ProjectBrief[];
  challenges: Challenge[];
  rotation: RotationPlan;
  ticker: TickerItem[];
  monitoring: MonitoringSnapshot[];
  sprintUpdates: SprintUpdate[];
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

export type WorkshopInstanceStatus = "created" | "prepared" | "running" | "archived" | "removed";

export type WorkshopInstanceRecord = {
  id: string;
  templateId: string;
  status: WorkshopInstanceStatus;
  blueprintId: string;
  blueprintVersion: number;
  importedAt: string;
  removedAt: string | null;
  workshopMeta: WorkshopMeta;
};

function createSampleWorkshopMeta(input: {
  eventTitle: string;
  city: string;
  room: string;
  addressLine: string;
  locationDetails: string;
  facilitatorLabel?: string;
}) {
  return {
    title: blueprintAgenda.title,
    subtitle: blueprintAgenda.subtitle,
    eventTitle: input.eventTitle,
    city: input.city,
    dateRange: "Ukázkový workshop den",
    venueName: input.city,
    roomName: input.room,
    addressLine: input.addressLine,
    locationDetails: input.locationDetails,
    facilitatorLabel: input.facilitatorLabel ?? "facilitator crew",
    currentPhaseLabel: blueprintAgenda.phases[0]?.label ?? "Úvod a naladění",
    adminHint:
      "Repo používá ukázková data. Reálné workshop instance mají být načítané z privátní vrstvy mimo veřejný template repo.",
  } satisfies WorkshopMeta;
}

function createAgendaFromBlueprint(currentPhaseId?: string): AgendaItem[] {
  const phaseId = currentPhaseId ?? blueprintAgenda.phases[2]?.id ?? blueprintAgenda.phases[0]?.id;
  const currentIndex = Math.max(
    blueprintAgenda.phases.findIndex((phase) => phase.id === phaseId),
    0,
  );

  return blueprintAgenda.phases.map((phase, index) => ({
    id: phase.id,
    title: phase.label,
    time: phase.startTime,
    description: phase.goal,
    order: phase.order,
    sourceBlueprintPhaseId: phase.id,
    kind: "blueprint" as const,
    status: index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming",
    defaultPresenterSceneId: phase.defaultSceneId ?? phase.scenes[0]?.id ?? null,
    presenterScenes: (phase.scenes ?? []).map((scene, sceneIndex) => ({
      id: scene.id,
      label: scene.label,
      sceneType: normalizePresenterSceneType(scene.sceneType),
      title: scene.title,
      body: scene.body,
      ctaLabel: scene.ctaLabel ?? null,
      ctaHref: scene.ctaHref ?? null,
      order: sceneIndex + 1,
      enabled: true,
      sourceBlueprintSceneId: scene.id,
      kind: "blueprint" as const,
    })),
  }));
}

function createWorkshopMetaFromTemplate(template: WorkshopTemplate): WorkshopMeta {
  return {
    title: blueprintAgenda.title,
    subtitle: blueprintAgenda.subtitle,
    eventTitle: template.defaultEventTitle,
    city: template.city,
    dateRange: template.dateLabel,
    venueName: template.city,
    roomName: template.room,
    addressLine: "Adresa nebo orientační bod",
    locationDetails: "Doplňte konkrétní venue, room a organizační poznámky pro tuto akci.",
    facilitatorLabel: "facilitator crew",
    currentPhaseLabel: blueprintAgenda.phases[0]?.label ?? "Úvod a naladění",
    adminHint:
      "Repo používá ukázková data. Reálné workshop instance mají být načítané z privátní vrstvy mimo veřejný template repo.",
  };
}

export function getWorkshopTemplateVariantLabel(template: WorkshopTemplate, lang: "cs" | "en") {
  if (template.scenario === "20-participants") {
    return lang === "cs" ? "větší skupina • cca 18-20 lidí" : "larger group • about 18-20 people";
  }

  return lang === "cs" ? "menší skupina • cca 15-17 lidí" : "smaller group • about 15-17 people";
}

export const workshopTemplates: WorkshopTemplate[] = [
  {
    id: "blueprint-standard",
    label: "Celodenní hackathon",
    defaultEventTitle: "Harness Lab workshop",
    city: "Workshop venue",
    dateLabel: "Workshop day",
    room: "Main room",
    scenario: "20-participants",
  },
  {
    id: "blueprint-compact",
    label: "Kompaktní varianta",
    defaultEventTitle: "Harness Lab workshop",
    city: "Workshop venue",
    dateLabel: "Workshop day",
    room: "Main room",
    scenario: "17-participants",
  },
];

export const sampleWorkshopInstances: WorkshopInstanceRecord[] = [
  createWorkshopInstanceRecord({
    id: "sample-studio-a",
    templateId: "blueprint-standard",
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
    templateId: "blueprint-standard",
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
    templateId: "blueprint-compact",
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
    templateId: "blueprint-compact",
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

export const seedWorkshopState: WorkshopState = {
  workshopId: "sample-studio-a",
  workshopMeta: {
    ...(sampleWorkshopInstances[0]?.workshopMeta ?? createWorkshopMetaFromTemplate(workshopTemplates[0])),
    eventTitle: "Ukázkový workshop Harness Lab",
    currentPhaseLabel: "Build Phase 1",
  },
  agenda: createAgendaFromBlueprint(),
  teams: [
    {
      id: "t1",
      name: "Tým 1",
      city: "Studio A",
      members: ["Anna", "David", "Eva", "Marek", "Tomáš"],
      repoUrl: "https://github.com/example/standup-bot",
      projectBriefId: "standup-bot",
      checkpoint: "AGENTS.md je hotové jako krátká mapa, build flow je popsaný a další safe move je dopsat první ověření.",
    },
    {
      id: "t2",
      name: "Tým 2",
      city: "Studio B",
      members: ["Jana", "Karel", "Lucie", "Petr", "Veronika"],
      repoUrl: "https://github.com/example/devtoolbox-cli",
      projectBriefId: "devtoolbox-cli",
      checkpoint: "První slash command flow funguje, ale chybí jasné ověření a runbook pro tým po rotaci.",
    },
    {
      id: "t3",
      name: "Tým 3",
      city: "Lab C",
      members: ["Adam", "Barbora", "Filip", "Lenka"],
      repoUrl: "https://github.com/example/code-review-helper",
      projectBriefId: "code-review-helper",
      checkpoint: "Skill kostra hotová, heuristiky jsou sepsané a další safe move je dopsat runbook pro další tým.",
    },
    {
      id: "t4",
      name: "Tým 4",
      city: "Lab D",
      members: ["Daniel", "Hana", "Jakub", "Zuzana"],
      repoUrl: "https://github.com/example/metrics-dashboard",
      projectBriefId: "metrics-dashboard",
      checkpoint: "Dashboard žije, ale zatím není dohledatelné, co je skutečně ověřené a jak spustit seed data lokálně.",
    },
  ],
  briefs: [
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
      problem: "Review bývá nekonzistentní, některé změny projdou bez checklistu a bez znalosti rizik.",
      userStories: [
        "Jako reviewer chci z diffu získat checklist rizik a otázek.",
        "Jako autor změny chci vidět, co mám otestovat před requestem na review.",
        "Jako inheriting tým chci rychle navázat na heuristiky, které původní tým objevil.",
      ],
      architectureNotes: [
        "Může jít o CLI, web nebo jednoduchý script, hlavní je tok diff -> checklist.",
        "Uveďte jasně, jaké vstupy nástroj očekává.",
        "Doplňte examples folder nebo seed diff pro lokální testování.",
      ],
      acceptanceCriteria: [
        "Nástroj vytvoří review checklist ze seed diffu.",
        "Je popsáno, co je heuristika a co jistota.",
        "Další tým může přidat nové pravidlo bez dlouhého onboarding callu.",
      ],
      firstAgentPrompt:
        "Nezačínej generováním kódu. Nejprve napiš pravidla review, tok vstupů a co přesně znamená 'dobrý checklist'.",
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
  ],
  challenges: [
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
  ],
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
  ticker: [
    { id: "tick-1", label: "Tým 3 právě přidal první vlastní skill.", tone: "highlight" },
    { id: "tick-2", label: "Tým 1 má 6 commitů za posledních 30 minut.", tone: "signal" },
    { id: "tick-3", label: "Intermezzo za 12 minut: napište co jste změnili, co to ověřuje a co má další tým číst jako první.", tone: "info" },
  ],
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
  setupPaths: [
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
  ],
};

export function getTeamName(teamId: string, teams: Team[]) {
  return teams.find((team) => team.id === teamId)?.name ?? teamId;
}

export function createWorkshopInstanceRecord(input: {
  id: string;
  templateId: string;
  workshopMeta?: WorkshopMeta;
  status?: WorkshopInstanceStatus;
  blueprintId?: string;
  blueprintVersion?: number;
  importedAt?: string;
  removedAt?: string | null;
}): WorkshopInstanceRecord {
  const template = workshopTemplates.find((item) => item.id === input.templateId) ?? workshopTemplates[0];

  return {
    id: input.id,
    templateId: template.id,
    status: input.status ?? "prepared",
    blueprintId: input.blueprintId ?? blueprintAgenda.blueprintId,
    blueprintVersion: input.blueprintVersion ?? blueprintAgenda.version,
    importedAt: input.importedAt ?? new Date().toISOString(),
    removedAt: input.removedAt ?? null,
    workshopMeta: input.workshopMeta ?? createWorkshopMetaFromTemplate(template),
  };
}

export function createWorkshopStateFromInstance(instance: WorkshopInstanceRecord): WorkshopState {
  const template = workshopTemplates.find((item) => item.id === instance.templateId) ?? workshopTemplates[0];

  return {
    ...seedWorkshopState,
    workshopId: instance.id,
    workshopMeta: instance.workshopMeta,
    rotation: {
      ...seedWorkshopState.rotation,
      revealed: false,
      scenario: template.scenario,
    },
    teams: [],
    monitoring: [],
    sprintUpdates: [],
    challenges: seedWorkshopState.challenges.map((challenge) => ({ ...challenge, completedBy: [] })),
    agenda: createAgendaFromBlueprint(blueprintAgenda.phases[0]?.id),
    ticker: [
      {
        id: "tick-reset",
        label: `Instance ${template.label} je připravená. Zaregistrujte týmy a spusťte první checkpoint.`,
        tone: "info",
      },
    ],
  };
}

export function createWorkshopStateFromTemplate(templateId: string, instanceId?: string): WorkshopState {
  const template = workshopTemplates.find((item) => item.id === templateId) ?? workshopTemplates[0];
  return createWorkshopStateFromInstance(
    createWorkshopInstanceRecord({
      id: instanceId ?? template.id,
      templateId: template.id,
      workshopMeta: createWorkshopMetaFromTemplate(template),
    }),
  );
}
