# Karty výzev

Karty nejsou body navíc. Jsou to malé zásahy, které zlepšují způsob práce s agentem i kvalitu handoffu.

## Kde začít

- Nemáte ještě `AGENTS.md`? Začněte první kartou z „Před obědem".
- Máte `AGENTS.md`, ale žádné spustitelné ověření? Začněte druhou kartou.
- Máte obojí? Vyberte si libovolnou kartu, která vás posune dál.

## Před obědem: postavte pracovní systém

- `AGENTS.md jako mapa` — Váš agent právě dostal úkol, ale nezná architekturu, pravidla ani co testovat. Vytvořte AGENTS.md se čtyřmi sekcemi: Goal / Context / Constraints / Done When. [Habit: Map before motion]

- `Build/test příkazy` — Agent napsal kód, ale neumí ho ověřit bez vašeho ručního dovysvětlování. Přidejte build a test příkazy tak, aby si agent i další tým kontrolu spustili sami. [Habit: Verification is the trust boundary]

- `Skill pro code review` — Tým opakuje v review vždy stejné připomínky. Formalizujte jednu review rutinu do skillu nebo checklistu, který by uměl použít i cizí tým. [Habit: Cleanup is part of build]

- `Pravidlo z hovoru do repa` — Tým právě řekl nahlas nějaké pravidlo podruhé. Převeďte ho do AGENTS.md, README, runbooku nebo testu — co není v repu, neexistuje. [Habit: If it is not in the repo, it does not exist]

## Po rotaci: opravte signál, ne jen feature

- `Diagnóza po handoffu` — Právě jste zdědili repo, které jste nikdy neviděli. Napište, co vám pomohlo, co chybělo, co je rizikové a jaký je další bezpečný krok. [Habit: Map before motion]

- `/plan před kódováním` — Tým se chce rovnou pustit do kódu, ale nikdo nevidí celkový plán. Použijte /plan, ukažte kroky, co právě děláte a jaký je další bezpečný krok. [Habit: Boundaries create speed]

- `Rozdělte práci do více vláken` — Všichni v týmu pracují na jedné věci najednou. Zkuste dvě nezávislé linie práce a jednoho člověka na integraci. [Habit: Boundaries create speed]

- `Delegujte a kontrolujte výsledek` — Skáčete agentovi do každého kroku. Dejte mu úkol s jasnými mantinely a vraťte se za 10 minut zkontrolovat výsledek, ne proces. [Habit: Verification is the trust boundary]

- `Nejmenší užitečné ověření` — Agent říká, že je hotovo, ale nemáte jak to ověřit. Zapište definici hotovo jako spustitelný check (tracer bullet, end-to-end check nebo browser test) dřív, než agent dostane víc autonomie. Holisticky: dokažte, že drží celek. [Habit: Verification is the trust boundary]

- `Opravte jeden slabý signál` — Přebírající tým musel hádat, co je hotové a co ne. Opravte jedno místo v README, AGENTS.md, plánu, runbooku nebo checku, které by to příště vyjasnilo. [Habit: Cleanup is part of build]

## Pokročilé

- `2 paralelní sessions` — Máte velký problém a jednu session. Rozdělte ho na dvě nezávislé části, paralelně je zpracujte a porovnejte výstupy. [Habit: Boundaries create speed]

- `Runbook pro deployment` — Nikdo v týmu neví, jak by se výsledek nasadil. Vytvořte runbook pro deployment — i kdyby deploy zůstal jen simulovaný. [Habit: If it is not in the repo, it does not exist]

- `AGENTS.md pro podsložku` — Hlavní AGENTS.md je příliš obecné pro konkrétní část projektu. Napište lokální AGENTS.md pro jednu podsložku, které přidá přesný kontext. [Habit: Map before motion]

- `Garbage collection` — Stejný typ chaosu se v repu opakuje podruhé. Najděte ho a proměňte v check, template nebo pravidlo. [Habit: Cleanup is part of build]

## Meta

- `Pravidlo z promptu do AGENTS.md` — Opakovaně píšete stejné omezení do promptu. Přesuňte ho do AGENTS.md, kde ho agent najde automaticky. [Habit: If it is not in the repo, it does not exist]

- `Done When ke každému tasku` — Váš úkol nemá jasné done criteria. Přidejte sekci Done When, aby agent i review věděli, kdy je hotovo. [Habit: Verification is the trust boundary]

- `README pro tým po rotaci` — Váš README popisuje, co jste udělali vy, ne co potřebuje vědět další tým. Přepište ho pro přebírající, ne pro sebe. [Habit: Map before motion]

- `Co je skutečně ověřené` — Nevíte, co je hotové, co je rozpracované a co jen předpokládané. Zapište, co je skutečně ověřeno, a odlište to od zbytku. [Habit: Verification is the trust boundary]

## Jak s kartami pracovat

- Před obědem má každý tým splnit aspoň jednu kartu z části „Před obědem: postavte pracovní systém".
- Před rotací má být v repu dohledatelné, co bylo opravdu ověřeno a jaký je další bezpečný krok.
- Po rotaci má každý tým splnit aspoň jednu kartu z „Po rotaci: opravte signál, ne jen feature".
- Ostatní karty jsou dobrovolné. Berte je jako ambicióznější cíle nebo inspiraci, když nevíte, co zlepšit dál.
