# AGENTS.md Starter

Použijte to jako krátkou mapu repa. Ne jako encyklopedii. Když detail patří jinam, odkažte na konkrétní soubor místo kopírování dlouhého textu.

Nejdůležitější pravidlo:
- napište, kam má agent sáhnout jako první
- napište, co je source of truth
- napište, jak se práce ověří
- když se text nafukuje, přidejte deeper doc a odkažte na něj

## Goal

Popiš, co má agent v tomto repozitáři vytvořit nebo udržovat.

## Context

- Klíčové soubory a složky
- Rozhodnutí, která už padla
- Systémy nebo integrace, na které se navazuje
- Kam má agent sáhnout jako první
- Které docs nebo runbooky jsou source of truth

## Constraints

- Build/test/lint příkazy
- Jazykové, architektonické a bezpečnostní standardy
- Co agent nesmí dělat bez explicitního souhlasu
- Public/private nebo auth boundary, pokud existuje

## Done When

- Jak poznáme, že je práce hotová
- Jaké ověření musí proběhnout
- Jak má vypadat handoff pro dalšího člověka nebo agenta
- Jaký bude další safe move, pokud práce zůstane rozdělaná
