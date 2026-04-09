# AGENTS.md Starter

Použijte to jako krátkou mapu repa. Ne jako encyklopedii. Když detail patří jinam, odkažte na konkrétní soubor místo kopírování dlouhého textu.

Nejdůležitější pravidlo:
- napište, kam má agent sáhnout jako první
- napište, co je zdroj pravdy
- napište, jak se práce ověří
- když se text nafukuje, přidejte navazující dokument a odkažte na něj

## Goal

Popiš, co má agent v tomto repozitáři vytvořit nebo udržovat.

## Context

- Klíčové soubory a složky
- Rozhodnutí, která už padla
- Systémy nebo integrace, na které se navazuje
- Kam má agent sáhnout jako první
- Které docs nebo runbooky jsou zdroj pravdy

## Constraints

- Build/test/lint příkazy
- Jazykové, architektonické a bezpečnostní standardy
- Co agent nesmí dělat bez explicitního souhlasu
- Public/private nebo auth boundary, pokud existuje

## Done When

- Jak poznáme, že je práce hotová
- Jaké ověření musí proběhnout
- Jak má vypadat handoff pro dalšího člověka nebo agenta
- Jaký bude další bezpečný krok, pokud práce zůstane rozdělaná
