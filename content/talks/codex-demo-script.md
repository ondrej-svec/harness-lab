# Codex Demo Script

## Cíl

Jedna příběhová ukázka, ne seznam feature. Publikum má během 15 minut pochopit, jak vypadá dobrý pracovní tok s agentem.

## Příběh

„Jsem vývojář, dostal jsem malý úkol, ale nechci být s agentem jen prompt monkey. Chci postavit pracovní systém, který unese další iterace.“

## Flow

1. Otevři jednoduchý repozitář nebo sandbox projekt.
2. Ukaž, že bez kontextu agent tápe.
3. Vytvoř `AGENTS.md` se 4 prvky:
   - Goal
   - Context
   - Constraints
   - Done When
4. Spusť `/plan`, aby agent rozpadl práci na kroky.
5. Nech agenta implementovat malý kus.
6. Spusť `/review` a ukaž, že kontrola je součást workflow, ne poslední omluva.
7. Krátce ukaž skill:
   - instalovaný skill
   - nebo jednoduchý workshop skill command
8. Zavři to větou:
   - „Nástroj sám nestačí. Rozhoduje pracovní systém kolem něj.“

## Fallbacky

- Když nefunguje CLI: použij Codex App
- Když nefunguje App: web fallback
- Když je demo pomalé: měj připravený repo snapshot po každém kroku

## Co explicitně neukazovat

- pět různých režimů práce
- složité feature tour
- dlouhé čekání na generování

## Pointa pro místnost

Nejde o to vidět „kouzelný output“. Jde o to vidět, jak rychle roste kvalita, když přidáme kontext, plán a review.
