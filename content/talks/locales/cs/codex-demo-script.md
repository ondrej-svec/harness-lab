# Codex Demo Script

## Cíl

Jedna příběhová ukázka, ne seznam funkcí. Publikum má během 15 minut pochopit, jak vypadá dobrý workflow s agentem a proč tenhle repozitář drží pohromadě díky harnessu, ne díky improvizaci.

## Repo-Readiness Contrast (talk micro-exercise)

Facilitátor před samotným demo ukazuje krátký kontrast: **stejný prompt, dvě repa, jiný výsledek**.

### Two-Folder Setup

Připravte si před workshopem dvě složky:

**Folder A: holé repo**
- Jen zadání projektu (krátký popis úkolu)
- Žádný AGENTS.md
- Žádné kontextové soubory, žádné mantinely, žádný plán
- Agent dostane jednoduchý prompt a driftuje — udělá věrohodná, ale špatná architektonická rozhodnutí.

**Folder B: repo s harnessem**
- Stejné zadání projektu
- AGENTS.md s Goal, Context, Constraints, Done When
- Krátký plán nebo seznam kroků
- Workshop skill nainstalovaný (`harness skill install`)
- Agent dostane stejný prompt a vytvoří zarovnaný výstup.

### Narration flow

1. Nejdřív ukažte Folder A. Spusťte jednoduchý prompt. Nechte agenta viditelně driftovat.
2. Pojmenujte, co vidíte: „Tohle je **task drift**. Agent udělal věrohodná rozhodnutí, ale bez mantinelů se vydal špatným směrem."
3. Ukažte Folder B. Spusťte přesně ten stejný prompt. Nechte agenta vytvořit zarovnaný výstup.
4. Pauza. Zeptejte se místnosti: „Co se změnilo?"
5. Nechte odpovědět dva hlasy, teprve potom to pojmenujte.
6. Doručte tezi: „Prompt se nezměnil. Repo ano."

### Honest failure narration

Když ukazujete Variantu A, explicitně pojmenujte způsob, jakým to selhalo:
- „Agent začal bez mantinelů a udělal věrohodná, ale špatná architektonická rozhodnutí."
- „Tohle se stane v každém repu bez AGENTS.md — agent si doplní mezery vlastními předpoklady."
- Používejte termín **task drift** — přesně pojmenovává ten vzor.

### Tool-specific realities to mention during the demo

- Codex nemá rewind/undo — jakmile agent commitne, musíte zpátky přes git.
- MCP servery vs. skills: jiné balení, stejná myšlenka (strukturované schopnosti).
- Principy jsou tool-agnostic: AGENTS.md funguje s Codexem, Claude Codem, Cursorem i Copilotem.

### Open question

Jestli má `harness` CLI mít `demo-setup` příkaz, který obě složky vygeneruje automaticky.

## Flow (after contrast)

1. Otevřete Folder B a ukažte `README`, `AGENTS.md`, rozpad práce do kroků a způsob kontroly změny.
2. Spusťte `/plan`, aby agent rozpadl práci na kroky.
3. Krátce ukažte, jak se v repu propisuje záměr: kde je mapa, kde je další bezpečný krok a kde je vidět, že tenhle repozitář vznikal jako continuation-ready systém.
4. Nechte agenta napsat malý kus.
5. Spusťte `/review` a ukažte, že kontrola je součást workflow, ne nouzová brzda na konci.
6. Krátce ukažte workshop skill:
   - jak se instaluje přes `harness skill install`
   - jak z něj plyne první použitelný krok v Codexu nebo v pi
7. Zavřete to větou:
   - „Nástroj sám nestačí. Rozhoduje pracovní systém kolem něj."

## Fallbacky

- Když nefunguje CLI: přejděte na Codex App.
- Když nefunguje App: použijte web fallback.
- Když je demo pomalé: mějte připravený repo snapshot po každém kroku.
- **Pokud živý kontrast vázne: použijte připravené screenshoty. Kontrast je důležitější než živé generování.**

## Co explicitně neukazovat

- pět různých režimů práce
- složitou přehlídku funkcí
- dlouhé čekání na generování
- demo odtržené od repa, ve kterém právě workshop běží

## Pointa pro místnost

Nejde o to ukázat „zázračný výsledek". Jde o to ukázat, jak rychle roste kvalita, když přidáte kontext, plán, review a repo, ve kterém se dá pokračovat.
