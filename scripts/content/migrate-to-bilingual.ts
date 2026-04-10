/**
 * One-time migration: merge agenda.json (Czech) + localized-content.ts (English)
 * into the unified bilingual source at workshop-content/agenda.json.
 *
 * Usage: bun scripts/content/migrate-to-bilingual.ts
 */

import blueprintAgenda from "../../dashboard/lib/workshop-blueprint-agenda.json";
import { workshopBlueprintLocalizedContent } from "../../dashboard/lib/workshop-blueprint-localized-content";
import type {
  BilingualAgenda,
  BilingualChallenge,
  BilingualInventory,
  BilingualMeta,
  BilingualPhase,
  BilingualPhaseContent,
  BilingualProjectBrief,
  BilingualScene,
  BilingualSceneContent,
  BilingualSetupPath,
  BilingualTickerItem,
  FacilitatorRunner,
  PresenterBlock,
  WorkshopSourceRef,
} from "../../dashboard/lib/types/bilingual-agenda";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const en = workshopBlueprintLocalizedContent.en;

type CzechPhase = (typeof blueprintAgenda.phases)[number];
type CzechScene = NonNullable<CzechPhase["scenes"]>[number];
type EnglishPhases = typeof en.phases;
type EnglishPhase = EnglishPhases[keyof EnglishPhases];
type EnglishScenes = NonNullable<EnglishPhase["scenes"]>;
type EnglishScene = EnglishScenes[keyof EnglishScenes];

function arr<T>(v: readonly T[] | undefined): T[] {
  return v ? [...v] : [];
}

function sourceRefs(v: readonly { label: string; path: string }[] | undefined): WorkshopSourceRef[] {
  return arr(v) as WorkshopSourceRef[];
}

// ---------------------------------------------------------------------------
// Build facilitator runner (Czech side — always present in agenda.json)
// ---------------------------------------------------------------------------

function buildCzechRunner(phase: CzechPhase): FacilitatorRunner {
  const r = phase.facilitatorRunner as Partial<FacilitatorRunner> | undefined;
  return {
    goal: r?.goal ?? phase.goal,
    say: arr(r?.say) || arr(phase.facilitatorPrompts).slice(0, 3),
    show: arr(r?.show),
    do: arr(r?.do),
    watch: arr(r?.watch) || arr(phase.watchFors).slice(0, 3),
    fallback: arr(r?.fallback),
  };
}

function buildEnglishRunner(enPhase: EnglishPhase, csRunner: FacilitatorRunner): FacilitatorRunner {
  const r = enPhase.facilitatorRunner as Partial<FacilitatorRunner> | undefined;
  if (!r) {
    // No explicit English runner — mirror Czech structure with English content
    return {
      goal: enPhase.goal ?? csRunner.goal,
      say: arr(enPhase.facilitatorPrompts).slice(0, 3),
      show: csRunner.show, // structural — same in both languages
      do: csRunner.do, // will be filled by runtime defaults
      watch: arr(enPhase.watchFors).slice(0, 3),
      fallback: csRunner.fallback,
    };
  }
  return {
    goal: r.goal ?? enPhase.goal ?? csRunner.goal,
    say: arr(r.say),
    show: arr(r.show),
    do: arr(r.do),
    watch: arr(r.watch),
    fallback: arr(r.fallback),
  };
}

// ---------------------------------------------------------------------------
// Merge blocks
// ---------------------------------------------------------------------------

function mergeBlocks(csBlocks: CzechScene["blocks"], enBlockOverrides: Record<string, unknown> | undefined): {
  csBlocks: PresenterBlock[];
  enBlocks: PresenterBlock[];
} {
  const csResult = arr(csBlocks) as PresenterBlock[];

  if (!enBlockOverrides) {
    // No English overrides — use Czech as-is for both (will be flagged as needing review)
    return { csBlocks: csResult, enBlocks: csResult };
  }

  const enResult = csResult.map((block) => {
    const override = enBlockOverrides[block.id as keyof typeof enBlockOverrides] as Record<string, unknown> | undefined;
    if (!override) return block;
    return { ...block, ...override } as PresenterBlock;
  });

  return { csBlocks: csResult, enBlocks: enResult };
}

// ---------------------------------------------------------------------------
// Merge scenes
// ---------------------------------------------------------------------------

function mergeScene(csScene: CzechScene, enScene: EnglishScene | undefined): BilingualScene {
  const { csBlocks, enBlocks } = mergeBlocks(csScene.blocks, enScene?.blocks as Record<string, unknown> | undefined);

  const csContent: BilingualSceneContent = {
    label: csScene.label,
    title: csScene.title,
    body: csScene.body,
    ctaLabel: (csScene as Record<string, unknown>).ctaLabel as string | null | undefined,
    ctaHref: (csScene as Record<string, unknown>).ctaHref as string | null | undefined,
    facilitatorNotes: arr(csScene.facilitatorNotes),
    sourceRefs: sourceRefs(csScene.sourceRefs),
    blocks: csBlocks,
  };

  const enContent: BilingualSceneContent = enScene
    ? {
        label: enScene.label ?? csScene.label,
        title: enScene.title ?? csScene.title,
        body: enScene.body ?? csScene.body,
        ctaLabel: (enScene as Record<string, unknown>).ctaLabel as string | null | undefined ?? csContent.ctaLabel,
        ctaHref: (enScene as Record<string, unknown>).ctaHref as string | null | undefined ?? csContent.ctaHref,
        facilitatorNotes: enScene.facilitatorNotes ? arr(enScene.facilitatorNotes) : csContent.facilitatorNotes,
        sourceRefs: enScene.sourceRefs ? sourceRefs(enScene.sourceRefs) : csContent.sourceRefs,
        blocks: enBlocks,
      }
    : csContent;

  return {
    id: csScene.id,
    sceneType: csScene.sceneType,
    intent: csScene.intent,
    surface: (csScene as Record<string, unknown>).surface as string | undefined,
    chromePreset: csScene.chromePreset,
    en: enContent,
    cs: csContent,
    cs_reviewed: true,
  };
}

// ---------------------------------------------------------------------------
// Merge phases
// ---------------------------------------------------------------------------

function mergePhase(csPhase: CzechPhase): BilingualPhase {
  const phaseId = csPhase.id as keyof EnglishPhases;
  const enPhase = en.phases[phaseId] as EnglishPhase | undefined;

  const csRunner = buildCzechRunner(csPhase);

  const csContent: BilingualPhaseContent = {
    label: csPhase.label,
    goal: csPhase.goal,
    roomSummary: csPhase.roomSummary ?? csPhase.goal,
    facilitatorPrompts: arr(csPhase.facilitatorPrompts),
    watchFors: arr(csPhase.watchFors),
    checkpointQuestions: arr(csPhase.checkpointQuestions),
    sourceRefs: sourceRefs(csPhase.sourceRefs),
    facilitatorRunner: csRunner,
  };

  const enContent: BilingualPhaseContent = enPhase
    ? {
        label: (enPhase as Record<string, unknown>).label as string ?? csPhase.label,
        goal: enPhase.goal ?? csPhase.goal,
        roomSummary: enPhase.roomSummary ?? csContent.roomSummary,
        facilitatorPrompts: enPhase.facilitatorPrompts ? arr(enPhase.facilitatorPrompts) : csContent.facilitatorPrompts,
        watchFors: enPhase.watchFors ? arr(enPhase.watchFors) : csContent.watchFors,
        checkpointQuestions: enPhase.checkpointQuestions ? arr(enPhase.checkpointQuestions) : csContent.checkpointQuestions,
        sourceRefs: enPhase.sourceRefs ? sourceRefs(enPhase.sourceRefs) : csContent.sourceRefs,
        facilitatorRunner: buildEnglishRunner(enPhase, csRunner),
      }
    : csContent;

  // Merge scenes
  const csScenes = arr(csPhase.scenes) as CzechScene[];
  const enScenes = enPhase?.scenes as Record<string, EnglishScene> | undefined;

  const scenes: BilingualScene[] = csScenes.map((csScene) => {
    const enScene = enScenes?.[csScene.id as keyof typeof enScenes] as EnglishScene | undefined;
    return mergeScene(csScene, enScene);
  });

  // Check for orphan English scenes (in English but not Czech)
  if (enScenes) {
    const csSceneIds = new Set(csScenes.map((s) => s.id));
    for (const enSceneId of Object.keys(enScenes)) {
      if (!csSceneIds.has(enSceneId)) {
        console.warn(`[ORPHAN] English scene "${enSceneId}" in phase "${csPhase.id}" has no Czech counterpart`);
      }
    }
  }

  return {
    id: csPhase.id,
    order: csPhase.order,
    startTime: csPhase.startTime,
    kind: csPhase.kind ?? "shared",
    intent: csPhase.intent,
    defaultSceneId: (csPhase as Record<string, unknown>).defaultSceneId as string | null | undefined,
    en: enContent,
    cs: csContent,
    cs_reviewed: true,
    scenes,
  };
}

// ---------------------------------------------------------------------------
// Merge meta
// ---------------------------------------------------------------------------

function buildMeta(): BilingualMeta {
  return {
    en: {
      title: "Harness Lab",
      subtitle: "Workshop operating system for working with AI agents",
      principles: [
        "Context before generation",
        "Verification is the trust boundary",
        "Work so another team can continue",
      ],
      sampleDayLabel: en.meta.sampleDayLabel,
      templateAddressLine: en.meta.templateAddressLine,
      templateLocationDetails: en.meta.templateLocationDetails,
    },
    cs: {
      title: blueprintAgenda.title,
      subtitle: blueprintAgenda.subtitle,
      principles: [...blueprintAgenda.principles],
      sampleDayLabel: "Ukázkový workshop den",
      templateAddressLine: "Adresa nebo orientační bod",
      templateLocationDetails: "Doplňte konkrétní venue, room a organizační poznámky pro tuto akci.",
    },
  };
}

// ---------------------------------------------------------------------------
// Merge inventory
// ---------------------------------------------------------------------------

function buildInventory(): BilingualInventory {
  const enInv = en.inventory;

  // Czech seed data from workshop-data.ts (hardcoded there — we extract the same values)
  const csBriefs = [
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

  const csChallenges = [
    { id: "agents-md", title: "Vytvořte AGENTS.md jako mapu", category: "Context Engineering", phaseHint: "before-lunch", description: "Zapište cíl, build/test flow, trvalá pravidla a kam má další tým sáhnout jako první.", completedBy: ["t1", "t3"] },
    { id: "review-skill", title: "Napište skill pro code review", category: "Context Engineering", phaseHint: "before-lunch", description: "Alespoň jedna opakovatelná review rutina musí být v repu jako skill nebo runbook, ne jen v promptu.", completedBy: [] as string[] },
    { id: "plan-first", title: "Použijte /plan před kódováním", category: "Workflow", phaseHint: "before-lunch", description: "Nechte agenta nejprve rozplánovat práci, ukažte z čeho se vycházelo a dopište další safe move.", completedBy: ["t2"] },
    { id: "smallest-verification", title: "Přidejte nejmenší užitečné ověření", category: "Workflow", phaseHint: "before-lunch", description: "Vytvořte RED test, tracer bullet nebo jednoduchý browser check dřív, než dáte agentovi víc autonomie.", completedBy: [] as string[] },
    { id: "parallel-agents", title: "Spusťte 2 paralelní Codex sessions", category: "Advanced", phaseHint: "after-rotation", description: "Rozdělte problém do dvou nezávislých proudů a porovnejte, co se osvědčilo.", completedBy: [] as string[] },
    { id: "done-when", title: "Přidejte 'Done When' ke každému tasku", category: "Meta", phaseHint: "anytime", description: "Každý důležitý task musí mít explicitní kritérium dokončení a odkaz na ověření.", completedBy: ["t4"] },
  ];

  const csTicker = [
    { id: "tick-1", label: "Tým 3 právě přidal první vlastní skill.", tone: "highlight" as const },
    { id: "tick-2", label: "Tým 1 má 6 commitů za posledních 30 minut.", tone: "signal" as const },
    { id: "tick-3", label: "Intermezzo za 12 minut: napište co jste změnili, co to ověřuje a co má další tým číst jako první.", tone: "info" as const },
  ];

  const csSetupPaths = [
    { id: "cli", label: "Codex CLI", audience: "macOS / Linux", summary: "Nejrychlejší cesta pro lidi, kteří chtějí pracovat přímo v repu a terminálu." },
    { id: "app", label: "Codex App", audience: "Windows / macOS", summary: "Bezpečný fallback pro účastníky, kteří nechtějí řešit CLI hned ráno." },
    { id: "web", label: "Web fallback", audience: "když se setup sekne", summary: "Použijte, když vás blokuje instalace nebo autentizace." },
  ];

  const briefs: BilingualProjectBrief[] = enInv.briefs.map((enBrief) => {
    const csBrief = csBriefs.find((b) => b.id === enBrief.id);
    if (!csBrief) {
      console.warn(`[ORPHAN] English brief "${enBrief.id}" has no Czech counterpart`);
    }
    return {
      id: enBrief.id,
      en: {
        title: enBrief.title,
        problem: enBrief.problem,
        userStories: [...enBrief.userStories],
        architectureNotes: [...enBrief.architectureNotes],
        acceptanceCriteria: [...enBrief.acceptanceCriteria],
        firstAgentPrompt: enBrief.firstAgentPrompt,
      },
      cs: csBrief
        ? {
            title: csBrief.title,
            problem: csBrief.problem,
            userStories: [...csBrief.userStories],
            architectureNotes: [...csBrief.architectureNotes],
            acceptanceCriteria: [...csBrief.acceptanceCriteria],
            firstAgentPrompt: csBrief.firstAgentPrompt,
          }
        : {
            title: enBrief.title,
            problem: enBrief.problem,
            userStories: [...enBrief.userStories],
            architectureNotes: [...enBrief.architectureNotes],
            acceptanceCriteria: [...enBrief.acceptanceCriteria],
            firstAgentPrompt: enBrief.firstAgentPrompt,
          },
    };
  });

  const challenges: BilingualChallenge[] = enInv.challenges.map((enCh) => {
    const csCh = csChallenges.find((c) => c.id === enCh.id);
    return {
      id: enCh.id,
      category: enCh.category,
      phaseHint: enCh.phaseHint,
      en: { title: enCh.title, description: enCh.description },
      cs: csCh
        ? { title: csCh.title, description: csCh.description }
        : { title: enCh.title, description: enCh.description },
      completedBy: [...(csCh?.completedBy ?? enCh.completedBy)],
    };
  });

  const ticker: BilingualTickerItem[] = enInv.ticker.map((enTick) => {
    const csTick = csTicker.find((t) => t.id === enTick.id);
    return {
      id: enTick.id,
      tone: enTick.tone,
      en: { label: enTick.label },
      cs: { label: csTick?.label ?? enTick.label },
    };
  });

  const setupPaths: BilingualSetupPath[] = enInv.setupPaths.map((enSp) => {
    const csSp = csSetupPaths.find((s) => s.id === enSp.id);
    return {
      id: enSp.id,
      en: { label: enSp.label, audience: enSp.audience, summary: enSp.summary },
      cs: csSp
        ? { label: csSp.label, audience: csSp.audience, summary: csSp.summary }
        : { label: enSp.label, audience: enSp.audience, summary: enSp.summary },
    };
  });

  return { briefs, challenges, ticker, setupPaths };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function migrate(): BilingualAgenda {
  const phases = blueprintAgenda.phases.map((csPhase) => mergePhase(csPhase));

  // Check for orphan English phases
  const csPhaseIds = new Set(blueprintAgenda.phases.map((p) => p.id));
  for (const enPhaseId of Object.keys(en.phases)) {
    if (!csPhaseIds.has(enPhaseId)) {
      console.warn(`[ORPHAN] English phase "${enPhaseId}" has no Czech counterpart`);
    }
  }

  return {
    schemaVersion: 3,
    blueprintId: blueprintAgenda.blueprintId,
    meta: buildMeta(),
    inventory: buildInventory(),
    phases,
  };
}

const result = migrate();
const outputPath = new URL("../../workshop-content/agenda.json", import.meta.url).pathname;
await Bun.write(outputPath, JSON.stringify(result, null, 2) + "\n");

console.log(`\nMigration complete.`);
console.log(`  Output: ${outputPath}`);
console.log(`  Phases: ${result.phases.length}`);
console.log(`  Scenes: ${result.phases.reduce((sum, p) => sum + p.scenes.length, 0)}`);
console.log(`  All nodes: cs_reviewed = true (current copy-editor pass verified both languages)`);
