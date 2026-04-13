# Standup Bot

## Problém

Denní standupy v chatu často končí jako dlouhé vlákno bez struktury. Blokery zapadnou, návaznosti mezi lidmi nejsou vidět a po pár hodinách už se těžko dohledává, co se vlastně domluvilo.

Vaším úkolem je navrhnout nástroj, který ze standup vstupů vytvoří přehled, se kterým se dá dál pracovat i bez původního autora nebo bez otevřeného původního vlákna.

## User stories

- Jako team lead chci sesbírat standup odpovědi do jednoho přehledného souhrnu.
- Jako vývojář chci rychle vidět blokery, dependency a témata, která potřebují domluvu.
- Jako tým po rotaci chci pochopit datový tok i integrační body bez ústního předání.

## Architektonické poznámky

- Upřednostněte jasný datový model před složitou integrací.
- Mock data jsou v pořádku, pokud workflow působí realisticky a je dobře popsané.
- Oddělte ingest, zpracování a prezentaci výstupu.
- Prompty, runbooky a rozhodnutí musí být uložené v repu, ne jen v hlavách původního týmu.
- Neřešte „hezký summary text“ dřív než to, jestli jsou vidět blokery, dependency a další safe move.

## Hotovo když

- Nástroj umí ingestovat vzorová data a vytvořit čitelný souhrn.
- Výstup zvýrazní blokery nebo položky, které potřebují pozornost.
- Repo obsahuje instrukce, jak řešení napojit na reálný chat nebo jiný vstupní kanál.
- Po rotaci může nový tým pokračovat v práci z README a `AGENTS.md` bez ústního předání.
- Výstup jasně odliší, co nástroj ví jistě a co je jen heuristický návrh.

## První krok pro agenta

Rozdělte práci na ingest, sumarizaci a kontext pro další tým. Nejdřív napište datový model, jistoty vs. heuristiky a `AGENTS.md`, který nový tým otevře jako první. Až potom navrhněte implementační kroky.
