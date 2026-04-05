# Doc Generator

## Problém

Dokumentace rychle zastarává, protože nikdo nechce ručně popisovat strukturu projektu po každé změně.

## User stories

- Jako vývojář chci z projektu vygenerovat základní technickou dokumentaci.
- Jako reviewer chci rychle pochopit strukturu modulů a vstupních bodů.
- Jako nový tým po rotaci chci objevit architekturu bez dlouhého pátrání.

## Architektonické poznámky

- Vstup může být lokální repozitář nebo seed adresář.
- Výstup může být Markdown, HTML nebo jednoduchý textový report.
- Důležité je vysvětlit, co nástroj umí spolehlivě odvodit a co je heuristika.

## Hotovo když

- Nástroj vytvoří aspoň jednu čitelnou dokumentační stránku nebo report.
- Je jasné, jak se nástroj spouští lokálně.
- Další tým umí přidat nový typ výstupu bez chaosu v repu.

## První krok pro agenta

Nejprve popiš, jaké signály budeš z projektu číst a jak budeš oddělovat fakta od heuristik.
