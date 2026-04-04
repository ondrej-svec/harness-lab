# DevToolbox CLI

## Problém

Vývojáři opakovaně řeší malé pomocné úlohy ručně: čistí logy, převádějí JSON, hledají poslední problematické commity nebo skládají ad-hoc shell skripty. Výsledek je pomalý a těžko přenositelný mezi lidmi.

## User stories

- Jako vývojář chci převést log nebo JSON do čitelné podoby jedním příkazem.
- Jako vývojář chci rychle dohledat podezřelé commity nebo větve bez ručního skládání git příkazů.
- Jako tým chci mít příkazy i pravidla zdokumentované tak, aby po rotaci mohl pokračovat jiný tým.

## Architektonické poznámky

- Jazyk je volný, ale CLI musí být snadno objevitelné a spustitelné.
- `AGENTS.md` má obsahovat build/test flow a pravidla pro styl výstupů.
- Runbook pro další tým je stejně důležitý jako samotné funkce.

## Hotovo když

- Existují alespoň 3 užitečné příkazy.
- `README` i `AGENTS.md` popisují lokální spuštění.
- Nový tým zvládne během 10 minut přidat nebo opravit další příkaz.

## První krok pro agenta

Nejprve navrhni minimální architekturu, která přežije handoff. Začni `AGENTS.md`, potom plánem, až pak implementací.
