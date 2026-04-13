# Context is King — Facilitator Delivery Script

## Jak tento script číst

Tenhle soubor není samostatný obsah talku. Je to delivery script pro facilitátora — to, co říkáte mezi scénami, pacing a watch-fors. Plný text titulků, body a callouts je v `workshop-content/agenda.json`, scény `talk-argued-about-prompts`, `talk-got-a-name`, `talk-how-to-build`, `talk-humans-steer`, `talk-sitting-inside`. Agenda je source of truth; tento soubor je stage manager.

Kanonická slovní zásoba, kterou tady používáte, je v `docs/workshop-content-canonical-vocabulary.md`. Když nevíte, jestli nějaké slovo „smíte" použít, podívejte se tam.

## Rámec talku

- Pět scén, cíl 8–10 minut, hlavní čára je scéna 4.
- Jedna věta, kterou chráníte nade vše ostatní: **Lidé řídí. Agenti vykonávají.**
- Talk nekončí tezí. Končí mostem do dema (scéna 5). Demo pak běží podle `content/talks/codex-demo-script.md` — tam žije repo-readiness contrast, tady ne.
- Nejhustší scéna je scéna 1 (pět hlasů). Nejdůležitější je scéna 4. Nejhubenější je scéna 5.

## Scéna 1 — Zatímco jsme se přeli o prompty

**Agenda scéna:** `talk-argued-about-prompts`

### Co říct

Otevřete větou, kterou má scéna v hero bloku: „Před šesti měsíci se konverzace pořád točila kolem promptů. Dnes je o tom, co agent vidí, když otevře vaše repo."

Pak čtěte pět hlasů jako příběh, ne jako seznam odrážek. Po každém jméně záměrná pauza:

1. **Ryan Lopopolo (OpenAI Frontier & Symphony, únor).** Milion řádků za pět měsíců, nula ručně. Jeho první princip — „Lidé řídí. Agenti vykonávají." — řekněte ho pomalu a bez důrazu. Až ho řeknete v scéně 4, bude to poprvé s důrazem.
2. **Birgitta Böckeler (Thoughtworks, před deseti dny).** Pojmenovala to: harness engineering. Rozdělila to na **guides** a **sensors**. Tohle jsou dva termíny, které dnes zazní ještě mnohokrát. Nechte je zaznít teď poprvé a nevysvětlujte je — jen je zasaďte.
3. **Charlie Guo (OpenAI, taky únor).** „Přecházím od chatování s AI k jejich řízení." To je jeho celá věta. Nepřidávejte k ní komentář.
4. **Mitchell Hashimoto (HashiCorp, začátkem roku).** Jeho test řemesla: „Pokaždé, když agent udělá chybu, vezmi si čas a postav řešení, aby tu chybu už nikdy neudělal." Řekněte, že tohle je jednovětná definice sensoru. (Druhá poloviční vazba k Böckeler, propojte.)
5. **Stripe Minions.** Přes tisíc PR týdně, žádný člověk mezi úkolem a PR. „Není to demo. Je to produkce." Tohle je jediné místo v scéně, kde můžete mírně zvýšit hlas.

Pak callout o počasí (Simon Willison, analytické firmy, „nikdo neví, jak bude vypadat prosinec"). Tohle je nejslabší beat scény — je první na řadě, pokud je místnost unavená. V tu chvíli přeskočte rovnou do scény 2.

### Jak to načasovat

- Scéna 1 cílí na 3 minuty. Pět hlasů po ~20–30 vteřinách, počasí ~30 vteřin.
- Pokud jdete přes 4 minuty, jste moc pomalí. Zrychlete.
- Pauzy mezi jmény jsou drahé — stojí za to. Bez pauz je to seznam, s pauzami je to příběh.

### Co hlídat

- Místnost začne chtít odpovědi na „jak". Ještě ne. Scéna 1 staví jen tezi, že se něco změnilo. Mechaniku dostanou ve scéně 3.
- Pokud někdo přeruší otázkou „a co vy/my/Codex/Claude", odpovězte „k tomu se dostaneme za chvíli" a pokračujte. Nerozbíjejte rytmus scény.
- Hlídejte si, abyste neskončili v módu „tool tour". Scéna 1 není o nástrojích.

## Scéna 2 — Minulý týden to dostalo jméno

**Agenda scéna:** `talk-got-a-name`

### Co říct

Tahle scéna má jednu rovnici a jednu analogii. Udělejte je obě jednou a pořádně.

Nejdřív rovnice: **Agent = Model + Harness.** Napište ji tak, jak ji Böckeler napsala — jako rovnici, ne jako větu. „Model má sílu. Harness je to, co tu sílu mění v užitečnou práci místo v drift."

Pak Böckeler citát z hero bloku: „Dobrý harness neusiluje o to, aby odstranil lidský vstup. Směruje lidský vstup tam, kde nejvíc záleží." Čtěte přímo z hero bloku — citát je cizí slova, ne vaše.

### Analogie s motorem a podvozkem

Tohle je jediná analogie v celém talku, kterou můžete protáhnout. Ostatní mají být rychlé.

Klíč je kontrast: motor o 400 koních přišroubovaný k nákupnímu vozíku vs. ke dobře navrženému podvozku. Ne „motor je špatný" — motor je silný. Podvozek tu sílu **zpřístupňuje**. Ta sílu dělá dostupnou, předvídatelnou, přežitelnou. Model je motor. Harness je podvozek.

Když analogii použijete jednou, držte ji. Nepoužívejte druhou analogii („je to jako tým, je to jako kuchyně, je to jako…"). Jedna analogie, pořádně.

Pak callout: **Mezera mezi modely se zužuje. Mezera mezi harnessy se prohlubuje.** Tohle je druhá nejdůležitější věta talku. Řekněte ji pomalu. Nechte ji dosednout dřív, než přejdete na scénu 3.

### Co hlídat

- Pokud začnete analogii rozšiřovat o „a brzdy jsou…" nebo „a pneumatiky jsou…", utněte to. Jedna analogie, jedno porovnání, dál.
- „Mezera mezi modely se zužuje" může místnost začít chtít rozebírat. Nenechte se vtáhnout. „O tom se můžeme bavit o přestávce. Teď, jak ten harness postavit."

## Scéna 3 — Jak ho skutečně postavit

**Agenda scéna:** `talk-how-to-build` — nejhustší scéna talku.

### Co říct

Otevřete tím, že existuje víc rámování — Fowler ho dělí na guides a sensors, OpenAI na context/constraints/feedback, Guo na managing místo chatování — a vy dáte čtyři sloupy, které fungují napříč.

Pak **čtyři sloupy.** Každý sloup čtěte z agendy, ale přidejte jednu konkrétní větu navíc — jakou, to záleží na scéně a místnosti. Návrhy:

1. **Kontext jako infrastruktura.** Repo je agentova paměť. Hlavní věta navíc: **„AGENTS.md jako mapa, ne encyklopedie."** Tohle je kanonická věta — řekněte ji jednou, přesně.
2. **Guides — směrování dřív, než agent jedná.** Architektonická pravidla, šablony, constraints. Hlavní věta navíc: **„Boundaries create speed."** V češtině: **„Mantinely jsou důvod, proč se práce hne rychleji, ne proč se hne pomaleji."**
3. **Sensors — zachycení potom, co agent jedná.** Tracer bullets, end-to-end testy, holistické ověření. Hlavní věta navíc: **„Když agent dělá víc, vaše ověření musí dokázat, že drží celek, ne že jedna funkce vrátila 4."** Tohle je místo, kde si místnost poprvé uvědomí, že granularita je problém, ne cíl.
4. **Managing, ne chatování.** „Přestáváte být pair-programmer a stáváte se režisérem s týmem." Tohle je ta nejkratší z čtyř scén — neprotahujte.

Pak callout **„Team lead staví systém, ve kterém tým běží."** Tohle je most k vaší roli — vy jako facilitátor, oni jako team leads pro své agenty. Analogie dopadne, pokud v místnosti jsou seniorní inženýři; s juniorní místností ji můžete zkrátit.

Scéna končí checklistem čtyř věcí k adopci. Ty jsou v agendě — neříkejte je nahlas celé, nechte je jen zobrazené. Řekněte jen „Tohle jsou čtyři pohyby, které budete dnes trénovat."

### Jak to načasovat

- Cíl 6–8 minut. Přednastavená zkrácená verze spojuje sloupy 2 a 3 do jednoho — udělejte to, pokud jste přes 9 minut.
- Pozor: je to nejhustší scéna, ale nejhustší neznamená nejpomalejší. Projděte to s energií.

### Co hlídat

- Místnost vás bude chtít zastavit otázkou uvnitř sloupu 1 nebo 2. „Dobrá otázka, dostaneme se k tomu za chvíli." Sloup 3 (sensors) je, kde sbíráte otázky, ne dřív.
- „Guides" a „sensors" zazní poprvé plně pojmenované. Pokud se zeptají, co to jsou, odkažte na **Böckeler na Fowlerovi, před deseti dny** a pokračujte. Nepřepisujte její definice.
- Pokud se místnost ztrácí, pilíř 3 (sensors) je ten, který se nejhůř chápe bez příkladu. Máte jeden: ten, který uvidí v demu za chvíli. Říct „uvidíte to za chvíli v demu" je legitimní záchrana.

## Scéna 4 — Lidé řídí. Agenti vykonávají.

**Agenda scéna:** `talk-humans-steer`

### Co říct

Tahle scéna je chráněná. Jediná scéna, kde záleží i na tom, jak stojíte.

Otevřete připomenutím Lopopola ze scény 1. Pak přečtěte hlavní větu: **Lidé řídí. Agenti vykonávají.** Pomalu. Bez důrazu nakonec. Pauza.

Pak Lopopolův citát o mapě: „Dejte Codexu mapu, ne tisícistránkový návod." Pak Hashimotův citát o fixování chyb. Oba jsou v hero blocích — čtěte je.

Pak **Druhý den callout**. Tohle je vaše Monday promise, i když slovo „Monday" v češtině nepoužijeme:

> Druhý den, až si otevřete coding agenta, budete pracovat jinak. Ne s novým nástrojem. S jinou rolí. Přestanete být ten, koho se agent ptá, a stanete se tím, kdo staví prostředí, do kterého agent vchází.

Poslední věta je ta, kterou chcete, aby si odnesli. Řekněte ji, pauza, nic nepřidávejte.

### Chráněná věta

**Lidé řídí. Agenti vykonávají.** je nejzapamatovatelnější věta celého workshopu. Chrání ji facilitátor tím, že:

- Ji neparafrázuje. Nikdy. Ani v lehčí variantě („lidé ukazují směr a agenti jednají"). Je to čtyři slova, ne pět.
- Ji neřekne dřív než ve scéně 4. Když vám ujede ve scéně 1, scéna 4 ztratí dopad.
- Ji neřekne podruhé v scéně 5. Scéna 5 je most, ne echo.
- Nedovolí, aby se z ní stala hashtag sloganka. Je to princip, ne motivační citát.

### Co hlídat

- Místnost bude chtít reagovat. Nedávejte prostor na diskusi uvnitř scény 4. Prostor je po scéně 5, v build fázi.
- Pokud se cítíte nesví při čtení Lopopola/Hashimota — nečtěte je. Vyberte jednu a zasaďte ji do kontextu. Dva citáty po sobě jsou hraniční, jeden stačí.

## Scéna 5 — Celé ráno jste v jednom seděli

**Agenda scéna:** `talk-sitting-inside`

### Most do dema

Tahle scéna je krátká a má jeden úkol: říct místnosti, že workshop skill, dashboard, participant board a repo, které za chvíli otevřou, jsou reálné ukázky toho, o čem celý talk byl.

Text z hero bloku: „Workshop skill, dashboard, participant board, repo, které za chvíli otevřete — to všechno bylo postavené s agenty a disciplínou, kterou jsme právě pojmenovali. To, co uvidíte v demu, není slib. Je to funkční instance."

Facilitátorova přechodová věta (pokud chcete): **„Ukážu vám, co tím myslím — takhle vypadá funkční session s agentem, když harness dělá svou práci."**

Pak přejděte do dema. Demo má vlastní delivery script v `content/talks/codex-demo-script.md`.

### Co hlídat

- Neprodlužujte scénu 5. Není to závěrečná řeč. Je to rampa do dema.
- Pokud místnost začne tleskat po scéně 4, nepřidávejte scénu 5 jako reakci. Scéna 5 je přípravou na demo, ne ukončením.

## Co explicitně neříkat

- Nepoužívejte termín „prompt blob" a nevěnujte se mu. Repo-readiness contrast je v demu, ne v talku.
- Neparafrázujte **Lidé řídí. Agenti vykonávají.** Ani jednou.
- Neříkejte „v pondělí ráno". V češtině se tenhle workshop loučí s posluchači větou o **„druhém dni, až si otevřete coding agenta"**.
- Nepředvádějte funkce Codexu nebo jiných nástrojů. Tohle není tool demo.
- Nepřidávejte šestou odrážku do čtyř sloupů. Čtyři, ne pět, ne šest.
- Nepopisujte habit taxonomii. Pět habit tagů patří na karty, ne do talku.
- Neříkejte „one function plus one test" ani v žádné variantě. Sloup 3 je o **holistickém ověření** — tracer bullet, end-to-end, ne unit test na jednu funkci.

## Fallbacky

- **Pokud jste nad 10 minut:** spojte sloupy 2 a 3 (guides + sensors) do jednoho. Scéna 3 je sekce, která snese kompresi bez ztráty hlavní věty.
- **Pokud je místnost unavená:** z scény 1 vypadne weather callout (Willison/Gartner). Zkraťte ji na pět hlasů + přechod.
- **Pokud jste pod časem a na hranici:** chráněné je scéna 4 a čtyři sloupy. Všechno ostatní je volitelné.
- **Pokud jste někde ztratili rytmus:** vraťte se na `team-lead staví systém` callout (scéna 3) a na **Lidé řídí. Agenti vykonávají.** (scéna 4). Ty dvě věty stačí na to, aby místnost pochopila, o co dnes jde.

## Co si odnesete do build fáze

Po tomhle talku se tým nemá vracet k repu s pocitem, že potřebuje jen chytřejší prompt. Má se vracet s **jedním jasným očekáváním**: nejdřív mapa a ověření, teprve potom práce na funkcích.

- Pokud ještě nemají workshop skill: `harness skill install`, pak `Codex: $workshop setup` nebo `pi: /skill:workshop`.
- Nejdřív krátká mapa v repu.
- Potom krátký plán kroků.
- Potom první tracer — holistické ověření, ne unit test na jednu funkci.
- Teprve potom další feature motion.

To je Build Phase 1. Demo vám ukáže, jak to vypadá, než je pošlete dovnitř.
