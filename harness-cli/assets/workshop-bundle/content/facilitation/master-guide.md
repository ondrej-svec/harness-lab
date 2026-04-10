# Facilitační průvodce

## Otevření a welcome

### Cíl

Spustit den jako společný start pro celý workshop, ne jako provozní brief k dopoledni.

### Klíčová message

> „Dnes nejde o to být nejrychlejší. Jde o to postavit práci tak, aby ji cizí tým dokázal převzít a posunout dál.“

### Co potřebuje zaznít

- Nezačínáme tool demo ani soutěž v promptování.
- Budeme se učit, stavět, předávat i přebírat. Ten oblouk dne je záměr workshopu.
- Jde o práci s agentem tak, aby po vás zůstával použitelný kontext.
- Odpolední část prověří, jestli repo opravdu unese převzetí dalším týmem.
- Pokud nějaké důležité pravidlo žije jen v hovoru u stolu, ještě neexistuje.

### Doporučený sled beatů

1. day-opening promise
2. proč na tom záleží právě teď
3. analogie typu Lego duck: stejné ingredience, různé použitelné výsledky
4. krátká pohybová aktivace podle zkušenosti s AI agenty
5. první pracovní kontrakt pro build fázi 1

### Lego-duck analogie

Použijte ji krátce a věcně.

Pointa:

- stejný agent neznamená stejný výsledek
- kvalitu neurčuje samotný model
- kontext, mantinely a ověřování jsou součást výsledku

Nevést jako zábavnou odbočku. Vést jako vysvětlení, proč je harness engineering tvůrčí a inženýrská disciplína zároveň.

### Pohybová aktivace

Použijte krátké rozdělení místnosti podle aktuální zkušenosti s AI agenty:

- používám skoro denně
- používám, ale opatrně
- jsem spíš na startu
- jsem skeptický, ale chci vidět, že to funguje

Pravidla:

- ne dělat z toho networking kolo
- stačí přesun a 2 krátké hlasy
- pointa není seniorita, ale kalibrace místnosti a signál, že den je participativní

### Co má facilitátor průběžně vracet

- „Kde by to našel další tým bez vás?“
- „Co je tady skutečně ověřené?“
- „Je `AGENTS.md` mapa, nebo už se z něj stává dump?“
- „Jaký je další bezpečný krok pro cizího člověka nebo agenta?“

### První pracovní kontrakt

Po otevření dne potřebuje místnost ještě jednu konkrétní věc:

- co má být po prvním build bloku opravdu vidět v repu
- co nestačí jen slíbit nebo dovysvětlit u stolu

Do oběda má být vidět:

- `README`, které dává smysl cizímu člověku
- `AGENTS.md` jako krátká mapa, ne sklad všeho
- plán kroků nebo jasně vedená implementační stopa, ze které je poznat další bezpečný krok
- první explicitní ověření před dalším generováním

## Context is King talk

### Cíl

Proměnit energii z openingu v přesnou tezi a čistý most do build fáze 1.

### Klíčová message

> „Kontext je páka, ne kosmetika.“

### Co potřebuje zaznít

- Neučíme se lépe promptovat. Učíme se postavit repo a workflow, ve kterém agent i cizí tým dokážou bezpečně pokračovat.
- `AGENTS.md`, skills, runbooky a ověřovací kroky jsou týmová infrastruktura, ne polish navíc.
- Team lead nestojí modelu za zády a nediktuje další větu každých třicet sekund.
- Po talku se tým vrací k repu s mapou, plánem kroků a prvním ověřením, ne s lovem na chytřejší prompt.

### Mikro-cvičení

Tohle je krátká facilitátorova ukázka, ne zadání pro celý room.

Použijte stejný malý task ve dvou podmínkách:

1. prompt blob
2. krátké zadání s `Goal`, `Context`, `Constraints`, `Done When`

Nenechte to sklouznout do debaty o tom, který model je chytřejší.

Pointa:

- přenos záměru
- přenos mantinelů
- přenos done criteria

### Co si odnesete do build fáze

Na konci talku má být jasné:

- teorie tím končí
- tým se vrací k repu
- pokud tým ještě nemá workshop skill, teď je chvíle na `harness skill install`, pak `Codex: $workshop setup` nebo `pi: /skill:workshop`
- nejdřív vzniká mapa a první explicitní ověření
- teprve potom dává smysl další feature motion

## Build fáze 1

### Viditelný milestone board

Do oběda má být v repu vidět pět základních věcí:

1. `README`, které dává smysl cizímu člověku
2. `AGENTS.md` jako krátká mapa
3. plán, ze kterého je poznat další bezpečný krok
4. build/test command nebo tracer bullet
5. první opravdu ověřený posun

### Role facilitátora

- nejdřív coach — ptejte se, co tým potřebuje a kde je zaseknutý
- pak mentor — pomozte s workflow nebo s nástrojem
- učitel až jako poslední možnost — krátce vysvětlete princip a vraťte tým do práce
- vracejte týmům hlavně artefakty, ze kterých se dá opravdu pracovat, ne celý backstage Harness Lab
- když se tým zasekne, vraťte ho k ověření, ne k delšímu promptu

### Na co se při obcházení dívat

- Má tým jednu společnou představu o cíli?
- Přibývá kontext v repu, nebo zůstává jen v chatu a v hlavách?
- Ověřují si výstupy, nebo jen generují další text?
- Mají test, tracer bullet nebo jiné explicitní ověření, které drží agenta v mezích?
- Je z repa poznat, co je hotové, co je rozpracované a co je jen hypotéza?
- Uměl by jiný tým během pěti minut najít první bezpečný krok?

### Facilitační pointa k testům

- S coding agentem nestačí říct „tohle si pak projdeme“.
- Jakmile agent dostává větší autonomii, tým musí zvýšit kvalitu ověřování.
- Test-first přístup není dogma pro čistotu. Je to praktický způsob, jak převést záměr do formy, kterou agent umí opakovaně trefovat.
- Když tým žádné ověření nemá, facilitátor má tlačit na nejmenší možný test nebo tracer bullet, ne na další generování funkcí.
- U UI práce připomínejte pattern: rychlá agent exploration v izolovaném prostředí, potom browser test, potom lidské review.
- Pokud tým mluví o tom, že „agent to prostě nakliká v mém browseru“, vraťte debatu k sandboxu, nízkému riziku a explicitní kontrole.

### Co normalizovat

- `AGENTS.md` jako krátkou mapu, ne rostoucí skladiště všeho
- plán jako pracovní artefakt, ne ceremonii navíc
- malý průběžný úklid, když se začne šířit chaos nebo duplicity
- převod opakovaných připomínek do repa místo dalšího ústního mentoringu

## Codex demo

### Cíl

Ukázat Codex jako součást pracovního systému, ne jako samostatné kouzlo. Demo má vysvětlit i to, proč tenhle repo drží pohromadě: protože v repu žije záměr, mantinely, rozpad práce do kroků i způsob kontroly, ne jen v hlavě facilitátora.

### Co má být vidět

- jedna příběhová linka, ne přehlídka funkcí
- repozitář, ve kterém je vidět `README`, `AGENTS.md`, rozpad práce do kroků a způsob, jak změnu zkontrolujete
- kontrast mezi slabým startem bez kontextu a prací, která má mapu a další bezpečný krok
- krátké ukotvení workshop skillu: `harness skill install`, první command a proč to šetří ústní rescue

### Co explicitně říct

- „Tohle není demo pro demo. Tohle je způsob, jak vznikal i tenhle workshopový repo systém.“
- „Když z repa není poznat, proč se změna dělá, jaký je další krok a podle čeho ji zkontrolujete, další člověk ani další agent nenaváže bezpečně.“
- „Codex je v tomhle důležitý, ale není to pointa sám o sobě. Pointa je harness kolem něj.“

### Co neukazovat

- pět různých módů Codexu za sebou
- dlouhé čekání na generování bez komentáře
- repo, které není continuation-ready a slouží jen jako jednorázový sandbox

## Intermezza

Každé intermezzo má tři kroky:

1. Týmy napíšou jednu větu: „Co jsme změnili a proč.“
2. Ondřej shrne, co vidí u stolů a co ukazuje monitoring.
3. Zazní jedna principová pointa navázaná na to, co se opravdu děje v místnosti.

Preferované checkpoint otázky:

- Co jste přesunuli z chatu nebo z hlavy do repa?
- Co dnes ověřujete pomocí spustitelného ověření?
- Co by měl číst další tým jako první?

### Smysl intermezz

- zviditelnit učení napříč týmy
- udělat z průběhu dne sérii krátkých checkpointů
- připomenout, že workflow je stejně důležité jako samotný výsledek
- vracet týmy k tomu, že bez ověření jen akcelerují nejistotu

Nevést intermezzo jako status meeting.
Vést ho jako krátký checkpoint, ze kterého si týmy odnesou jednu věc, kterou ještě ten den dopíšou, zpřesní nebo ověří.

## Oběd a příprava na handoff

- Oběd není pauza od handoffu.
- Než týmy vstanou od stolu, musí být z repa poznat:
  - co se změnilo
  - co je hotové
  - co je stále hypotéza
  - jaký je další bezpečný krok
- Když něco z toho zůstane jen v hovoru, odpoledne se to vrátí jako tření.

## Rotace

- Bez ústního handoffu.
- Prvních 10 minut nový tým jen čte repo a mapuje situaci.
- Frustrace není chyba workshopu. Je to signál kvality kontextu v repozitáři.

### Instrukce pro nový tým

- Začněte `README`, `AGENTS.md` a planem.
- Needitujte hned první soubor, který otevřete.
- Nejdřív napište vlastní diagnózu: co pomáhá, co chybí, co je rizikové a jaký je další bezpečný krok.
- Když tým neví, po čem sáhnout, vraťte ho k learner kitu: `template-agents`, `reference`, `analyze-checklist` a challenge cards.

### Facilitační pointa k rotaci

- Frustrace je užitečný signál, pokud ukazuje na skrytý kontext nebo chybějící verifikaci.
- Nepomáhejte týmům ústním handoffem nahrazovat slabý signál v repu.
- Pomáhejte jim pojmenovat, co musí být po rotaci dopsáno, zpřesněno nebo ověřeno.

## Build fáze 2

- Po rotaci neopravujeme jen feature. Opravujeme i signál, který převzetí zbrzdil.
- Každá opakující se bolest je kandidát na lepší mapu, pravidlo, runbook nebo ověření.
- Další větší změna má přijít až po nové explicitní verifikaci.

## Reveal a reflexe

### `1-2-4-All`

Otázky:

- Co vám pomohlo pokračovat?
- Co chybělo?
- Jaký signál v repu vám nejvíc ušetřil čas?

### `W³`

- `Co?` — co se dnes stalo bez hodnocení
- `A co?` — co to znamená pro práci s AI agenty
- `A teď?` — co uděláte jinak příští týden

### Rámec pro facilitaci

- Nehodnotíme, který tým byl lepší.
- Díváme se na systém: které signály pomáhají práci přežít handoff a které ji brzdí.
- Sbíráme konkrétní příklady, ne obecné dojmy.
- Každá opakující se bolest je kandidát na lepší template, challenge card nebo vodítko v blueprintu.

Na konci dne chceme, aby si lidé odnesli tři věci:

1. jeden signál, který chtějí zavést natrvalo
2. jednu slabinu, kterou už příště nenechají jen v hovoru
3. jeden konkrétní tah pro příští týden

### `Monday commitments` — sdílený artefakt

Reflexe bez zápisu se do pondělí většinou neudrží. Proto na samém konci dne:

- každý účastník napíše jednu větu ve tvaru: **„Příští týden udělám [X], protože [důvod z dnešního dne]."**
- věty se napíší na papírek, sticky note nebo přímo do sdíleného dokumentu
- facilitátor je sesbírá a udělá z nich jeden krátký sdílený seznam, který si tým odnese
- seznam není hodnocení ani soutěž. Je to jediný artefakt z dnešního dne, který prokáže, že reflexe skutečně něco změnila

Facilitátorův tah:
- věty vybízejte k tomu, aby byly konkrétní (ne „budu lépe pracovat s agenty“, ale „do AGENTS.md svého hlavního repa napíšu 4 elementy: goal, context, constraints, done when“)
- když někdo napíše něco velmi obecného, zeptejte se: „Jaký je první konkrétní tah, který to spustí?"
- commitmenty nepublikujte jmenovitě mimo room; artefakt patří týmu, ne marketingu
