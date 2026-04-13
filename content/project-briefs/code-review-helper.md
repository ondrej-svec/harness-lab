# Code Review Helper

## Problém

Code review bývá nevyrovnané. Některé změny projdou s dobrým checklistem a jasným popisem rizik, jiné bez společného rámce. Reviewer pak improvizuje, autor neví, co má ověřit předem, a tým ztrácí konzistenci právě tam, kde by měl být nejpřesnější.

Vaším úkolem je navrhnout nástroj, který z diffu nebo změny vytvoří použitelný review checklist a zároveň jasně oddělí jistotu, heuristiku a místa, kde je pořád potřeba lidský úsudek.

## User stories

- Jako reviewer chci z diffu rychle získat checklist změněných hranic, rizik, otázek a míst, na která se zaměřit.
- Jako autor změny chci vědět, co mám ověřit ještě před samotným review.
- Jako tým po rotaci chci navázat na heuristiky, které původní tým objevil, místo abych je znovu vymýšlel.

## Architektonické poznámky

- Může jít o CLI, web nebo jednoduchý skript. Důležitý je jasný tok `diff → hodnoticí schéma → checklist`.
- Musí být zřejmé, jaké vstupy nástroj očekává, co umí označit jistě a co naopak zůstává heuristické.
- Přidejte seed diff nebo `examples/`, aby šlo workflow lokálně ověřit a další tým rychle přidal nové pravidlo.
- Nástroj má pomáhat reviewerovi, ne předstírat neomylnost.

## Hotovo když

- Nástroj vytvoří review checklist ze seed diffu.
- Výstup odlišuje jistá zjištění od doporučení, hypotéz a bodů pro lidský úsudek.
- Je jasné, jak přidat nové pravidlo nebo heuristiku bez dlouhého onboardingu.
- Další tým může během 10 minut pokračovat v rozvoji bez chaosu.

## První krok pro agenta

Nezačínej kódem. Nejdřív napiš review hodnoticí schéma, tok vstupů a definici toho, co znamená dobrý checklist. Ukaž, kde je jistota, kde heuristika a co musí posoudit člověk. Teprve potom navrhni první implementační slice.
