# Challenge Cards

Karty nejsou body navíc. Jsou to malé zásahy, které zlepšují způsob práce s agentem i kvalitu handoffu.

## Context Engineering

- `Vytvořte AGENTS.md jako mapu` — sepište cíl, build/test příkazy, trvalá pravidla a kam má další tým sáhnout jako první.
- `Přidejte build/test příkazy` — agent musí umět ověřit výsledek bez ručního dovysvětlování.
- `Napište skill pro code review` — formalizujte jednu review rutinu, kterou by uměl použít i cizí tým.
- `Přesuňte pravidlo z hovoru do repa` — vše, co už tým řekl dvakrát nahlas, převeďte do `AGENTS.md`, README, runbooku nebo testu.

## Workflow

- `Použijte /plan před kódováním` — ukažte, z jakého plánu tým vycházel, co z něj opravdu plní a jaký je další bezpečný krok.
- `Rozdělte práci do více vláken` — zkuste dvě nezávislé linie práce a jednoho člověka na integraci.
- `Delegujte úkol a vraťte se ke kontrole za 10 minut` — neskákejte agentovi do každého kroku, kontrolujte až výsledek.
- `Přidejte nejmenší užitečné ověření` — vytvořte RED test, tracer bullet nebo jednoduchý browser check dřív, než agent dostane víc autonomie.

## Advanced

- `Spusťte 2 paralelní Codex sessions` — rozdělte problém na dvě nezávislé části a porovnejte výstupy.
- `Vytvořte runbook pro deployment` — i kdyby deploy zůstal jen simulovaný.
- `Napište AGENTS.md pro podsložku` — ukažte, že kontext může být globální i lokální.
- `Zaveďte garbage collection` — najděte jednu opakující se formu chaosu a proměňte ji v check, template nebo pravidlo.

## Meta

- `Přesuňte trvalé pravidlo z promptu do AGENTS.md`.
- `Přidejte sekci Done When ke každému tasku`.
- `Napište README pro tým po rotaci, ne pro sebe`.
- `Zapište, co je skutečně ověřené` — odlište hotové, rozpracované a jen předpokládané.

## Jak s kartami pracovat

- Před obědem má každý tým splnit aspoň jednu kartu z části `Context Engineering`.
- Před rotací má být v repu dohledatelné, co bylo opravdu ověřeno a jaký je další bezpečný krok.
- Po rotaci má každý tým splnit aspoň jednu kartu z `Workflow`.
- Ostatní karty jsou dobrovolné. Berte je jako stretch cíle nebo inspiraci, když nevíte, co zlepšit dál.
