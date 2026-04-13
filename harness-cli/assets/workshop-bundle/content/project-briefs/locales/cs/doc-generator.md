# Doc Generator

## Problém

Dokumentace stárne skoro okamžitě. Jakmile je její údržba čistě ruční, tým ji začne odkládat a po pár iteracích už nikdo neví, jestli popisuje realitu. Po předání pak nový tým neví, čemu má věřit a co je jen odhad.

Vaším úkolem je navrhnout nástroj, který z projektu vygeneruje základní technickou dokumentaci nebo strukturovaný přehled tak, aby bylo zřejmé, co nástroj opravdu ví a co si jen domýšlí.

## User stories

- Jako vývojář chci z projektu rychle získat základní technickou dokumentaci bez ručního sepisování všeho od nuly.
- Jako reviewer chci během 5 minut pochopit strukturu modulů a hlavní vstupní body.
- Jako tým po rotaci chci objevit architekturu projektu bez dlouhého pátrání po souvislostech.

## Architektonické poznámky

- Vstup může být lokální repo, seed adresář nebo zjednodušený dataset.
- Výstup může být Markdown, HTML nebo jednoduchý textový report.
- Důležité je vysvětlit, co nástroj umí spolehlivě odvodit a co je jen heuristika.
- Od začátku navrhněte strukturu tak, aby šlo časem přidat další typ výstupu.
- Neřešte AI show. Řešte důvěryhodnost, dohledatelnost a to, aby další tým věděl, jak bezpečně pokračovat.

## Hotovo když

- Nástroj vytvoří aspoň jednu čitelnou dokumentační stránku nebo report.
- Je jasné, jak se nástroj spouští lokálně a nad jakým vstupem.
- Výstup odděluje fakta od odhadů nebo heuristik.
- Další tým umí přidat nový typ výstupu bez chaosu v repu.
- Reviewer během 10 minut pozná, odkud které tvrzení pochází.

## První krok pro agenta

Nejdřív napište, jaké signály budete z projektu číst, které výstupy budou jistota a které jen heuristika. Tu specifikaci vložte do `AGENTS.md`. Teprve potom navrhněte první implementační slice.
