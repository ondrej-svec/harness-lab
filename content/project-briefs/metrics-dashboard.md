# Metrics Dashboard

## Problém

Týmy často data mají, ale chybí jim obrazovka, která z nich udělá rychle čitelný přehled. Bez toho se hůř rozhoduje, hůř diskutuje a každý si z čísel odnese něco jiného.

Vaším úkolem je navrhnout jednoduchý dashboard, který z několika metrik vytvoří srozumitelný společný pohled.

## User stories

- Jako tým chci zobrazit několik metrik na jedné obrazovce tak, aby z nich šlo rychle vyčíst stav.
- Jako facilitátor chci snadno měnit seed data bez zásahu do UI logiky.
- Jako tým po rotaci chci během několika minut pochopit strukturu dat, komponent i obrazovek.

## Architektonické poznámky

- Seed data a UI oddělte hned od prvního commitu.
- Mobile-first je výhoda, ale dashboard musí být dobře čitelný i na projekci.
- README a monitoring mají vysvětlit, co už funguje, co je mock a co zatím chybí.
- Myslete na to, aby přidání další metriky nevedlo k přepisování celé obrazovky.

## Hotovo když

- Dashboard ukáže alespoň 3 metriky a jeden trend nebo srovnání.
- Repo popisuje datové zdroje i mock fallback.
- Je jasné, kde se přidává nová metrika a jak se ověřuje layout.
- Nový tým zvládne rozšířit dashboard bez rozbití struktury.

## První krok pro agenta

Navrhni dashboard, který zvládne handoff. Nejdřív popiš datový model, komponenty a kritéria `Hotovo když`, teprve potom stav UI.