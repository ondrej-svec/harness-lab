# Facilitační průvodce

## Otevření a welcome

### Cíl

Nastavit energii dne a jasně pojmenovat, o čem workshop je.

### Klíčová message

> „Dnes nejde o to být nejrychlejší. Jde o to předat práci tak, aby ji cizí tým dokázal převzít a posunout dál.“

### Co potřebuje zaznít

- Nejde o soutěž v promptování.
- Jde o práci s agentem tak, aby po vás zůstával použitelný kontext.
- Odpolední část prověří, jestli repo opravdu unese převzetí dalším týmem.
- Pokud nějaké důležité pravidlo žije jen v hovoru u stolu, ještě neexistuje.

### Co má facilitátor průběžně vracet

- „Kde by to našel další tým bez vás?“
- „Co je tady skutečně ověřené?“
- „Je `AGENTS.md` mapa, nebo už se z něj stává dump?“
- „Jaký je další bezpečný krok pro cizího člověka nebo agenta?“

## Build fáze 1

### Viditelný milestone board

1. do 10:50 existuje repo
2. do 11:15 existuje `AGENTS.md`
3. do 11:30 existuje plan
4. do 11:45 existuje build/test command nebo tracer bullet
5. do 12:00 existuje první ověřený výstup

### Role facilitátora

- nejdřív coach — ptejte se, co tým potřebuje a kde je zaseknutý
- pak mentor — pomozte s workflow nebo s nástrojem
- učitel až jako poslední možnost — krátce vysvětlete princip a vraťte tým do práce
- vracejte týmům hlavně artefakty, ze kterých se dá opravdu pracovat, ne celý backstage Harness Lab

### Na co se při obcházení dívat

- Má tým jednu společnou představu o cíli?
- Přibývá kontext v repu, nebo zůstává jen v chatu a v hlavách?
- Ověřují si výstupy, nebo jen generují další text?
- Mají test, tracer bullet nebo jiné explicitní ověření, které drží agenta v mezích?
- Je z repa poznat, co je hotové, co je rozpracované a co je jen hypotéza?
- Uměl by jiný tým během pěti minut najít první bezpečný krok?

### Facilitační pointa k testům

- S coding agentem nestačí říct „tohle si pak projdeme“.
- Jakmile agent dostává větší autonomii, tým musí zvýšit kvalitu ověřování.
- Test-first přístup není dogma pro čistotu. Je to praktický způsob, jak převést záměr do formy, kterou agent umí opakovaně trefovat.
- Když tým žádné ověření nemá, facilitátor má tlačit na nejmenší možný test nebo tracer bullet, ne na další generování funkcí.
- U UI práce připomínejte pattern: rychlá agent exploration v izolovaném prostředí, potom browser test, potom lidské review.
- Pokud tým mluví o tom, že „agent to prostě nakliká v mém browseru“, vraťte debatu k sandboxu, nízkému riziku a explicitní kontrole.

### Co normalizovat

- `AGENTS.md` jako krátkou mapu, ne rostoucí skladiště všeho
- plan jako pracovní artefakt, ne ceremonii navíc
- malý průběžný úklid, když se začne šířit chaos nebo duplicity
- převod opakovaných připomínek do repa místo dalšího ústního mentoringu

## Intermezza

Každé intermezzo má tři kroky:

1. Týmy napíšou jednu větu: „Co jsme změnili a proč.“
2. Ondřej shrne, co vidí u stolů a co ukazuje monitoring.
3. Zazní jedna principová pointa navázaná na to, co se opravdu děje v místnosti.

Preferované checkpoint otázky:

- Co jste přesunuli z chatu nebo z hlavy do repa?
- Co dnes ověřujete pomocí spustitelného checku?
- Co by měl číst další tým jako první?

### Smysl intermezz

- zviditelnit učení napříč týmy
- udělat z průběhu dne sérii krátkých checkpointů
- připomenout, že workflow je stejně důležité jako samotný výsledek
- vracet týmy k tomu, že bez ověření jen akcelerují nejistotu

## Rotace

- Bez ústního handoffu.
- Prvních 10 minut nový tým jen čte repo a mapuje situaci.
- Frustrace není chyba workshopu. Je to signál kvality kontextu v repozitáři.

### Instrukce pro nový tým

- Začněte `README`, `AGENTS.md` a planem.
- Needitujte hned první soubor, který otevřete.
- Nejprve si udělejte mapu: co funguje, co chybí, co je rizikové.
- Nejdřív napište vlastní diagnózu: co pomáhá, co chybí, co je rizikové a jaký je další bezpečný krok.
- Když tým neví, po čem sáhnout, vraťte ho k learner kitu: `template-agents`, `reference`, `analyze-checklist` a challenge cards.

### Facilitační pointa k rotaci

- Frustrace je užitečný signál, pokud ukazuje na skrytý kontext nebo chybějící verifikaci.
- Nepomáhejte týmům ústním handoffem nahrazovat slabý signál v repu.
- Pomáhejte jim pojmenovat, co musí být po rotaci dopsáno, zpřesněno nebo ověřeno.

## Reveal a reflexe

### `1-2-4-All`

Otázky:

- Co vám pomohlo pokračovat?
- Co chybělo?
- Jaký signál v repu vám nejvíc ušetřil čas?

### `W³`

- `Co?` — co se dnes stalo bez hodnocení
- `A co?` — co to znamená pro práci s AI agenty
- `A teď?` — co uděláte jinak příští týden

### Rámec pro facilitaci

- Nehodnotíme, který tým byl lepší.
- Díváme se na systém: které signály pomáhají práci přežít handoff a které ji brzdí.
- Sbíráme konkrétní příklady, ne obecné dojmy.
- Každá opakující se bolest je kandidát na lepší template, challenge card nebo vodítko v blueprintu.
