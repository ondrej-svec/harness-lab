# Codex Demo Script

## Cíl

Jedna příběhová ukázka, ne seznam funkcí. Publikum má během 15 minut pochopit, jak vypadá dobrý workflow s agentem a proč tenhle repozitář drží pohromadě díky harnessu, ne díky improvizaci.

## Repo-Readiness Contrast (talk micro-exercise)

Facilitátor před samotným demo ukazuje krátký kontrast: **stejný prompt, dvě repa, jiný výsledek**.

### Two-Folder Setup

Prepare two folders before the workshop:

**Folder A: bare repo**
- Project brief only (a simple task description)
- No AGENTS.md
- No context files, no constraints, no plan
- Agent receives a simple prompt and drifts — makes plausible but wrong architectural decisions

**Folder B: repo with harness**
- Same project brief
- AGENTS.md with Goal, Context, Constraints, Done When
- A short plan or step list
- Workshop skill installed (`harness skill install`)
- Agent receives the same simple prompt and produces aligned output

### Narration flow

1. Show Folder A first. Run a simple prompt. Let the agent drift visibly.
2. Name what you see: "This is task drift. The agent made plausible decisions, but without constraints it went the wrong way."
3. Show Folder B. Run the exact same prompt. Let the agent produce aligned output.
4. Pause. Ask the room: "What changed?"
5. Let two voices answer before you name it.
6. Land the thesis: "The prompt didn't change. The repo did."

### Honest failure narration

When showing Variant A, name the failure mode explicitly:
- "The agent started without constraints and made plausible but wrong architectural decisions."
- "This is what happens in every repo without AGENTS.md — the agent fills in the blanks with its own assumptions."
- Use the term **task drift** — it names the pattern precisely.

### Tool-specific realities to mention during the demo

- Codex lacks rewind/undo — once the agent commits, you need git to go back
- MCP servers vs. skills: different packaging, same idea (structured capabilities)
- The principles are tool-agnostic: AGENTS.md works with Codex, Claude Code, Cursor, Copilot

### Open question

Whether `harness` CLI should have a `demo-setup` command that scaffolds both folders automatically.

## Flow (after contrast)

1. Otevři Folder B a ukaž `README`, `AGENTS.md`, rozpad práce do kroků a způsob kontroly změny.
2. Spusť `/plan`, aby agent rozpadl práci na kroky.
3. Krátce ukaž, jak se v repu propisuje záměr: kde je mapa, kde je další bezpečný krok a kde je vidět, že tenhle repozitář vznikal jako continuation-ready systém.
4. Nech agenta implementovat malý kus.
5. Spusť `/review` a ukaž, že kontrola je součást workflow, ne nouzová brzda na konci.
6. Krátce ukaž workshop skill:
   - jak se instaluje přes `harness skill install`
   - jak z něj plyne první použitelný krok v Codexu nebo v pi
7. Zavři to větou:
   - „Nástroj sám nestačí. Rozhoduje pracovní systém kolem něj."

## Fallbacky

- Když nefunguje CLI: přejdi na Codex App
- Když nefunguje App: použij web fallback
- Když je demo pomalé: měj připravený repo snapshot po každém kroku
- **If live contrast drags: use pre-prepared screenshots. The contrast matters more than live generation.**

## Co explicitně neukazovat

- pět různých režimů práce
- složitou přehlídku funkcí
- dlouhé čekání na generování
- demo odtržené od repa, ve kterém právě workshop běží

## Pointa pro místnost

Nejde o to ukázat „kouzelný výsledek". Jde o to ukázat, jak rychle roste kvalita, když přidáme kontext, plán, review a repozitář postavený tak, aby se v něm dalo pokračovat.
