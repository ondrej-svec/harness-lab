# Workshop Analyze Checklist

Když agent dělá `/workshop analyze`, měl by projít:

- existenci a kvalitu `AGENTS.md`
- jestli je `AGENTS.md` mapa nebo přerostlý dump
- jestli `AGENTS.md` říká, co číst jako první
- jestli `AGENTS.md` odkazuje na skutečné source-of-truth docs
- přítomnost build/test příkazů
- jestli repo rozlišuje hotové vs. rozpracované části
- jestli je v repu plán nebo runbook pro další tým
- jestli je dohledatelné, co bylo skutečně ověřeno
- jestli existuje záznam stavu session — co bylo ověřeno, co je rozpracované, jaký je další bezpečný krok
- kolik pravidel žije jen v promptu a ne v repu
- jak snadné by bylo pokračovat po rotaci bez ústního handoffu
- jestli je zřejmý další bezpečný krok

## Výstup

1. Co pomohlo pokračovat
2. Co chybělo
3. Co přidat před dalším handoffem
