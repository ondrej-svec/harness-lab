# Context is King

## Mikro-cvičení

Tohle je krátká facilitátorova ukázka, ne práce pro celou místnost.

Vezmeme stejný malý task ve dvou podmínkách. Jedna varianta bude prompt blob. Druhá varianta bude krátké zadání se 4 prvky a s odkazem na kontext zapsaný v repu. Pak porovnáme výsledky. Nehledáme „nejhezčí prompt". Hledáme způsob práce, který přenese záměr, omezení a done criteria i do dalšího kroku.

4 prvky pro druhou variantu:

- Goal
- Context
- Constraints
- Done When

## Co jste právě viděli

Tenhle workshop skill i dashboard vznikly stejným způsobem, jakým dnes budeme pracovat my: s AI agentem, ale s důrazem na kontext. Nejde mi o prodej nástroje. Jde mi o to ukázat disciplínu, která z nástroje dělá použitelného spolupracovníka.

Rámec pro dnešek:

- dnes nezačínáme tool demo ani soutěž v promptování
- budeme se učit, stavět, předávat i přebírat
- odpoledne se ukáže, co z práce přežije bez nás

## Analogický beat

Když dáte lidem stejné kostky, nevznikne jedna správná kachna. Stejně tak ze stejného modelu nevzniká jedna správná práce. Rozdíl nedělá jen model. Rozdíl dělá kontext, mantinely, ověřování a představivost týmu.

Pointa analogie:

- stejný agent neznamená stejný výsledek
- kvalitu neurčuje samotný model
- pracovní systém kolem agenta je součást výsledku

Harness engineering je práce s instrukcemi, kontextem a workflow tak, aby agent dělal správné věci opakovaně a předvídatelně. Team lead přece neříká každých třicet sekund jednomu vývojáři, co má dělat. Staví systém, ve kterém tým funguje. A přesně tohle dnes budeme dělat pro agenty.

## Hlavní teze

### Kontext je páka

- Kontext je páka, ne kosmetika.
- `AGENTS.md`, skills a runbooky jsou týmová infrastruktura.
- `AGENTS.md` nemá být encyklopedie. Má to být mapa, která ukáže, kam sáhnout dál.
- Co není v repu, neexistuje. Slack, ústní dovysvětlení a „to si pamatujeme" se rozpadne, jakmile práci někdo převezme.

### Ověření je hranice důvěry

- Testy jsou hranice důvěry. Když agent pracuje samostatněji, musíte mnohem líp ověřovat, že udělal právě to, co jste chtěli.
- Jednoduché mantinely zrychlují práci. Agentovi pomáhá jasný build/test flow, viditelné hranice a předvídatelná struktura.
- U UI práce je výchozí pattern: agent exploration, potom repeatable browser test, potom lidské review.
- „Nech model jezdit v mém běžném přihlášeném browseru" není výchozí doporučení. Bezpečnější je izolované lokální prostředí a jasné mantinely.
- Ověření napsané dřív, než pustíte agenta do většího kusu práce, není test-first dogma. Znamená to zapsat done criteria v takové formě, aby je agent i další tým uměl zkontrolovat. Iteraci to zrychluje, protože agent dostane přesné mantinely, ne další prompt.

### Repo se udržuje, ne jen plní

- Úklid není bonus po workshopu. Když narazíte na opakující se chaos, je čas ho proměnit v lepší template, ověření nebo runbook.
- Odpolední návaznost prověří, jestli váš kontext funguje i bez vás.

## Co chci, aby si adoptovali

- Než začnu generovat další funkci, udělám z repa místo, kde se dá orientovat.
- Když řekneme nějaké pravidlo dvakrát nahlas, patří do repa.
- Když agent dělá víc, já musím lépe ověřovat.
- Handoff není závěr dne. Je to průběžná podmínka celé práce.

## Co si odnesete do build fáze

Po tomhle talku se tým nemá vracet k repu s pocitem, že potřebuje jen chytřejší prompt. Má se vracet s jedním jasným očekáváním:

- pokud ještě nemá workshop skill, teď je chvíle na `harness skill install`, pak `Codex: $workshop setup` nebo `pi: /skill:workshop`
- nejdřív krátká mapa v repu
- potom krátký plán kroků
- potom první explicitní ověření, že agent dělá, co jste čekali
- teprve potom další feature motion

## Klíčová linka

> Neučíme se „lépe promptovat". Učíme se postavit repo a workflow, ve kterém agent i cizí tým dokážou bezpečně pokračovat.

Odpoledne nezažijete jen to, že „AI někdy funguje a někdy ne". Zažijete, jak moc výsledek závisí na kvalitě pracovního systému, který kolem agenta postavíte.
