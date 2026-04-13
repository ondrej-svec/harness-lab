# DevToolbox CLI

## Problém

Ve skoro každém týmu vznikají malé jednorázové skripty: na čištění logů, převody JSONu, dohledání podezřelých commitů nebo rychlé kontroly nad repem. Fungují chvíli, často jen u jednoho člověka, a po pár dnech už nikdo neví, jak je spustit nebo rozšířit.

Vaším úkolem je navrhnout CLI nástroj, který řeší několik běžných developerských úloh tak, aby přežil předání na jiný tým a nerozsypal se po přidání dalšího commandu.

## User stories

- Jako vývojář chci jedním příkazem převést log nebo JSON do čitelné podoby.
- Jako vývojář chci rychle dohledat podezřelé commity, větve nebo změny bez ručního skládání git příkazů.
- Jako tým chci mít příkazy i způsob práce popsané tak, aby po rotaci mohl bez zmatku pokračovat někdo jiný.

## Architektonické poznámky

- Jazyk i framework si zvolte sami, ale CLI musí být snadno spustitelné a snadno objevitelné.
- Od začátku oddělte samotné příkazy od pomocných utilit a konfigurace.
- `AGENTS.md` má popsat build/test flow, konvence pro výstupy a pravidla pro další rozšiřování.
- Stejně důležitý jako funkční příkaz je i runbook pro tým, který projekt převezme po obědě.
- Nejde o pytel skriptů. Jde o malý systém, ve kterém je jasné, kde přibude další command, test a dokumentace.

## Hotovo když

- Existují alespoň 3 užitečné příkazy nebo subcommands.
- `README` i `AGENTS.md` popisují lokální spuštění a způsob ověření.
- Je jasné, kde přidat další příkaz bez rozbití struktury projektu.
- Nový tým zvládne během 10 minut přidat nebo opravit další command.
- Každý command má aspoň jednu čitelnou ukázku vstupu a výstupu.

## První krok pro agenta

Nejdřív navrhněte minimální architekturu, která přežije předání. Začněte `AGENTS.md`, flow pro přidání dalšího commandu a prvním ověřením. Teprve pak implementujte první command.
