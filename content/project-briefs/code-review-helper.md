# Code Review Helper

## Problém

Code review bývá nekonzistentní. Některé změny projdou bez checklistu, bez explicitních rizik a bez jasné představy, co má reviewer ověřit.

## User stories

- Jako reviewer chci z diffu získat checklist rizik a otázek.
- Jako autor změny chci vědět, co mám otestovat ještě před review.
- Jako inheriting tým chci rychle navázat na heuristiky, které původní tým objevil.

## Architektonické poznámky

- Může jít o CLI, web nebo skript. Hlavní je tok diff → checklist.
- Musí být jasně popsáno, jaké vstupy nástroj očekává.
- Přidejte seed diff nebo `examples/`, aby šlo workflow lokálně ověřit.

## Hotovo když

- Nástroj vytvoří review checklist ze seed diffu.
- Je jasně odlišená heuristika od jistoty.
- Další tým může přidat nové pravidlo bez dlouhého onboardingu.

## První krok pro agenta

Nezačínej kódem. Nejdřív napiš pravidla review, tok vstupů a definici toho, co znamená dobrý checklist.
