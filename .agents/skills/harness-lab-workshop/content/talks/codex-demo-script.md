# Codex Demo Script

## Cíl

Jedna příběhová ukázka, ne seznam feature. Publikum má během 15 minut pochopit, jak vypadá dobrý workflow s agentem.

## Příběh

„Jsem vývojář, dostal jsem malý úkol a nechci být s agentem jen někdo, kdo zkouší další prompt. Chci postavit pracovní systém, který unese další iterace.“

## Flow

1. Otevři jednoduchý repozitář nebo sandbox projekt.
2. Ukaž, že bez kontextu agent rychle tápe.
3. Vytvoř `AGENTS.md` se 4 prvky:
   - Goal
   - Context
   - Constraints
   - Done When
4. Spusť `/plan`, aby agent rozpadl práci na kroky.
5. Nech agenta implementovat malý kus.
6. Spusť `/review` a ukaž, že kontrola je součást workflow, ne nouzová brzda na konci.
7. Krátce ukaž skill:
   - instalovaný skill
   - nebo jednoduchý command z workshop skillu
8. Zavři to větou:
   - „Nástroj sám nestačí. Rozhoduje pracovní systém kolem něj.“

## Fallbacky

- Když nefunguje CLI: přejdi na Codex App
- Když nefunguje App: použij web fallback
- Když je demo pomalé: měj připravený repo snapshot po každém kroku

## Co explicitně neukazovat

- pět různých režimů práce
- složitou feature tour
- dlouhé čekání na generování

## Pointa pro místnost

Nejde o to ukázat „kouzelný output“. Jde o to ukázat, jak rychle roste kvalita, když přidáme kontext, plán a review.
