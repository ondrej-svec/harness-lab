# Codex Demo Script

## Cíl

Jedna příběhová ukázka, ne seznam funkcí. Publikum má během 15 minut pochopit, jak vypadá dobrý workflow s agentem a proč tenhle repozitář drží pohromadě díky harnessu, ne díky improvizaci.

## Příběh

„Jsem vývojář, dostal jsem malý úkol a nechci být s agentem jen někdo, kdo zkouší další prompt. Chci postavit pracovní systém, který unese další iterace, review i převzetí jiným člověkem.“

## Flow

1. Otevři jednoduchý repozitář nebo přímo Harness Lab slice, na kterém je vidět `README`, `AGENTS.md`, rozpad práce do kroků a způsob kontroly změny.
2. Ukaž, že bez kontextu agent rychle tápe.
3. Vytvoř `AGENTS.md` se 4 prvky:
   - Goal
   - Context
   - Constraints
   - Done When
4. Spusť `/plan`, aby agent rozpadl práci na kroky.
5. Krátce ukaž, jak se v repu propisuje záměr: kde je mapa, kde je další safe move a kde je vidět, že tenhle repozitář vznikal jako continuation-ready systém.
6. Nech agenta implementovat malý kus.
7. Spusť `/review` a ukaž, že kontrola je součást workflow, ne nouzová brzda na konci.
8. Krátce ukaž workshop skill:
   - jak se instaluje přes `harness skill install`
   - jak z něj plyne první použitelný krok v Codexu nebo v pi
9. Zavři to větou:
   - „Nástroj sám nestačí. Rozhoduje pracovní systém kolem něj.“

## Fallbacky

- Když nefunguje CLI: přejdi na Codex App
- Když nefunguje App: použij web fallback
- Když je demo pomalé: měj připravený repo snapshot po každém kroku

## Co explicitně neukazovat

- pět různých režimů práce
- složitou přehlídku funkcí
- dlouhé čekání na generování
- demo odtržené od repa, ve kterém právě workshop běží

## Pointa pro místnost

Nejde o to ukázat „kouzelný výsledek“. Jde o to ukázat, jak rychle roste kvalita, když přidáme kontext, plán, review a repozitář postavený tak, aby se v něm dalo pokračovat.
