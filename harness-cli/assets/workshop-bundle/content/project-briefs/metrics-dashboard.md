# Metrics Dashboard

## Problém

Týmy často data mají, ale chybí jim obrazovka, která z nich udělá rychle čitelný přehled. Bez toho se hůř rozhoduje, hůř diskutuje a každý si z čísel odnese něco jiného.

Vaším úkolem je navrhnout jednoduchý dashboard, který z několika metrik vytvoří srozumitelný společný pohled a zůstane čitelný i po předání na jiný tým.

## User stories

- Jako tým chci zobrazit několik metrik na jedné obrazovce tak, aby z nich šlo rychle vyčíst stav.
- Jako facilitátor chci snadno měnit vzorová data bez zásahu do UI logiky.
- Jako tým po rotaci chci během 10 minut pochopit strukturu dat, komponent i obrazovek.

## Architektonické poznámky

- Vzorová data a UI oddělte hned od prvního commitu.
- Mobile-first je výhoda, ale dashboard musí být dobře čitelný i na projekci.
- README a monitoring mají vysvětlit, co už funguje, co je mock a co zatím chybí.
- Myslete na to, aby přidání další metriky nevedlo k přepisování celé obrazovky.
- Neoptimalizujte jen vzhled. Hlídejte, aby nový tým rychle pochopil datový model, layout pravidla a způsob ověření.

## Hotovo když

- Dashboard ukáže alespoň 3 metriky a jeden trend nebo srovnání.
- Repo popisuje datové zdroje i záložní vzorová data.
- Je jasné, kde se přidává nová metrika a jak se ověřuje layout.
- Nový tým zvládne rozšířit dashboard bez rozbití struktury.
- Layout je čitelný na mobilu i na větší obrazovce a je jasné, jak to ověřit.

## První krok pro agenta

Navrhněte dashboard, který zvládne předání. Nejdřív popište datový model, komponenty, layout pravidla a kritéria `Hotovo když`, teprve potom stavte UI.
