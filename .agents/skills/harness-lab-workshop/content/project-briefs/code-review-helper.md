# Code Review Helper

## Problém

Code review bývá nevyrovnané. Některé změny projdou s dobrým checklistem a jasným popisem rizik, jiné bez společného rámce. Reviewer pak improvizuje, autor neví, co má ověřit předem, a tým ztrácí konzistenci.

Vaším úkolem je navrhnout nástroj, který z diffu nebo změny vytvoří použitelný review checklist.

## User stories

- Jako reviewer chci z diffu rychle získat checklist rizik, otázek a míst, na která se zaměřit.
- Jako autor změny chci vědět, co mám zkontrolovat ještě před samotným review.
- Jako tým po rotaci chci navázat na heuristiky, které původní tým objevil, místo abych je znovu vymýšlel.

## Architektonické poznámky

- Může jít o CLI, web nebo jednoduchý skript. Důležitý je jasný tok `diff → analýza → checklist`.
- Musí být zřejmé, jaké vstupy nástroj očekává a co naopak neumí spolehlivě vyhodnotit.
- Přidejte seed diff nebo `examples/`, aby šlo workflow lokálně ověřit.
- Jasně oddělte heuristiku od jistoty. Nástroj má pomáhat reviewerovi, ne předstírat neomylnost.

## Hotovo když

- Nástroj vytvoří review checklist ze seed diffu.
- Výstup odlišuje jistá zjištění od doporučení nebo hypotéz.
- Je jasné, jak přidat nové pravidlo nebo heuristiku bez dlouhého onboardingu.
- Další tým může během několika minut pokračovat v rozvoji bez chaosu.

## První krok pro agenta

Nezačínej kódem. Nejdřív napiš pravidla review, tok vstupů a definici toho, co znamená dobrý checklist. Teprve potom navrhni první implementační slice.