# Standup Bot

## Problém

Denní standupy v chatu bývají dlouhé, nekonzistentní a bez jasného výstupu. Tým pak těžko dohledává blokery nebo návaznosti mezi lidmi.

## User stories

- Jako team lead chci sesbírat standup odpovědi do jednoho přehledu.
- Jako vývojář chci rychle vidět blokery a dependency.
- Jako nový tým po rotaci chci pochopit datový tok a integrační body bez ústního handoffu.

## Architektonické poznámky

- Upřednostněte jasný datový model před komplikovanou integrací.
- Mock data jsou v pořádku, pokud workflow působí realisticky.
- Prompty, runbooky a rozhodnutí musí být v repu.

## Hotovo když

- Bot umí ingestovat seed data a vytvořit souhrn.
- Repo obsahuje instrukce pro rozšíření na reálný chat kanál.
- Po rotaci lze navázat bez dalšího vysvětlování.

## První krok pro agenta

Rozděl práci na ingest, sumarizaci a kontext pro další tým. Nejdřív napiš dokumentaci, kterou nový tým otevře jako první.
