# Czech Voice & Style Guide

## Purpose

Tento workshop mluví česky, ale přemýšlí jako moderní developerský tým. Cílem není přeložit celý obor do češtiny. Cílem je psát tak, aby český developer text pochopil napoprvé a zároveň měl pocit, že čte přirozený, profesionální a jazykově kultivovaný obsah.

## Core Principle

Preferujeme porozumění před doslovným překladem.

- čeština pro význam, instrukce, facilitaci a vysvětlení
- angličtina pro běžné technické termíny, commands, file names a tool names

## Tone of Voice

- Piš jako zkušený peer, ne jako marketér a ne jako školní učebnice.
- Buď věcný, klidný a praktický.
- Piš s energií, ale bez hype.
- Vysvětluj jasně, ale ne patronizujícím tónem.
- Preferuj přesnost a použitelnost před efektní formulací.

## Language Rules

- Základní jazyk je spisovná, přirozená čeština.
- Technické výrazy nech v angličtině, pokud jsou v developerské praxi běžnější než český ekvivalent.
- Nepřekládej násilně výrazy jako `prompt`, `review`, `workflow`, `skill`, `runbook`, `deploy`, `build`, `checkpoint`, `handoff`, `fallback`, `CLI`, `App`.
- Slash commands, file names, paths a config keys vždy nech v originále.
- Když je anglický termín méně samozřejmý, při prvním výskytu ho krátce ukotvi česky.
- Na viditelných slidech a participant surfaces nenechávej anglický loanword jen proto, že ho měl source draft.
- Výrazy jako `launch` nebo `check` nejsou automaticky vhodné jako české headline. Pokud nejde o skutečně ustálený technický termín, preferuj přirozenou češtinu.

## Sentence Style

- Používej kratší věty.
- Preferuj aktivní rod.
- Piš konkrétní slovesa místo abstraktních obratů.
- Každý odstavec má mít jeden jasný účel.
- Když lze něco říct jednodušeji, zjednoduš to.

## What Good Looks Like

- „Nejdřív spusťte `/plan` a teprve potom začněte implementaci.“
- „Pokud se zaseknete déle než 7 minut, přejděte na fallback nebo pairing.“
- „Do 10:30 potřebujete mít jednu funkční cestu do Codexu.“

## What To Avoid

- korporátní omáčka
- doslovné kalky z angličtiny
- přehnaně akademický tón
- agresivní marketingový tón
- zbytečné vykřičníky

## Preferred Vocabulary

- `udělejte`
- `zkontrolujte`
- `spusťte`
- `doplňte`
- `ověřte`
- `pokračujte`
- `když se zaseknete`

## Avoid These Patterns

- „je žádoucí realizovat“
- „dochází k implementaci“
- „v rámci workshopu bude umožněno“
- „s cílem maximalizace efektivity“
- „využitím tohoto přístupu dosáhnete…“

## Czech + English Mixing Rule

Česká věta má zůstat česká, i když obsahuje anglické technické termíny.

Dobře:

- „Po rotaci si nejdřív přečtěte `README`, `AGENTS.md` a aktuální plán.“
- „Použijte `/review`, když chcete zkontrolovat větší změnu.“

Špatně:

- „Use `/plan` before coding, because it gives better context.“
- „V rámci challenge budete implementing a new workflow.“

## Formatting Rule

- Commands, file names, slash commands a literal terms piš v backticks.
- Nadpisy a běžný výklad piš normální češtinou.
- V textech pro účastníky nezahlcuj čtenáře dlouhými bloky textu.

## Typografie a pravopis

Tyhle věci si český čtenář všímá v první větě. Nejsou to „drobnosti" – jsou to nejspolehlivější signál, zda text psal Čech, nebo jestli prošel překladem. Typografický pass je mechanická vrstva pod redakční revizí a řeší ho deterministický audit (`marvin:copy-editor`, Layer 1). Tenhle oddíl je referenční – reviewer i autor by měli znát pravidla, i když je opravuje skript.

### Nezlomitelná mezera po jednopísmenných předložkách a spojkách

Po slovech `k`, `s`, `v`, `z`, `o`, `u`, `a`, `i` (a variantách `ke`, `se`, `ve`, `ze`, `ku`) patří nezlomitelná mezera (`\u00A0`, HTML `&nbsp;`), aby slovo neskončilo samotné na konci řádku.

- Špatně (běžná mezera): `v repu`, `k AGENTS.md`, `s účastníky`
- Dobře (nezlomitelná): `v\u00A0repu`, `k\u00A0AGENTS.md`, `s\u00A0účastníky`

V markdownu a JSONu ji vkládejte jako literál `\u00A0`. V Reactu/TSX jako `\u00A0` nebo `{"\u00A0"}`.

### České uvozovky

Česky se píše `„dolní a horní"` – ne anglicky `"straight"`, ne německy `»…«`. Vnořené uvozovky jsou `‚jednoduché'`.

- Špatně: `"workshop začíná"`
- Dobře: `„workshop začíná"`

V inline code a uvnitř code bloků nechte rovné uvozovky nebo backticky – typografické uvozovky uvnitř kódu rozbíjí parsing.

### Pomlčka vs. spojovník

Čeština používá en-dash (`–`, U+2013) jako „pomlčku". Spojovník (`-`, hyphen) se používá jen pro spojené výrazy typu `model-hot-path`.

- S mezerami na obou stranách při parentetickém vložení: `Celý tým – včetně nováčků – dorazil.`
- Bez mezer u rozsahů a jednoslovných protikladů: `strana 23–26`, `vztah učitel–žák`, `Praha–Brno`.
- Pokud je jedna strana víceslovná, mezery se vracejí: `autobus Hradec Králové – Litomyšl`.
- V dokumentu držte konzistenci. Nemíchejte `–` a `—` (em-dash).

### Trojtečka

Jeden znak `…` (U+2026), ne tři tečky `...`.

- Špatně: `počkejte...`
- Dobře: `počkejte…`

### Mezera mezi číslem a jednotkou

Mezi číslem a jednotkou patří mezera (často nezlomitelná): `50 Kč`, `99 %`, `5 MB`, `30 minut`. Výjimkou je adjektivní použití bez mezery: `99% pokrytí`, `24h provoz`.

### Ordinály a datum

Ordinální číslice mají tečku a mezeru: `1. dubna`, `3. místo`. Datum je `1. dubna 2026` nebo v tabulkách a formulářích `1. 4. 2026`. Nikdy `01.04.2026` v souvislém textu.

Měsíce, dny a názvy jazyků píšeme **malým písmenem**: `pondělí`, `duben`, `čeština`, `český vývojář`.

### Sentence case v nadpisech

Čeština píše všechny nadpisy sentence casem – **velké jen první slovo a vlastní jména**. Anglické Title Case je v českém textu vždy cizorodé.

- Špatně: `Jak Nastavit Vývojové Prostředí`
- Dobře: `Jak nastavit vývojové prostředí`

Tohle platí i pro krátké labely, callouty, sekce slidů a karet. Výjimka jsou názvy produktů a značek (`GitHub Actions`, `Docker`), které si nesou vlastní kapitalizaci.

### Vykání a psaní `Vy` / `vy`

Tenhle workshop používá **malé `vy`, `vám`, `váš`**. Peer tone je záměrný – velké `Vy` zní formálně a vytváří distanci, kterou workshop nemá chtít. Výjimka: pokud se někdy v budoucnu objeví tištěné formální oslovení (dopis, oficiální uvítací e-mail), tam je `Vy` v pořádku. Všechno ostatní – slidy, callouty, participant view, facilitační poznámky, briefy – používá malé `vy`.

## Slovesné vs jmenné vyjadřování

Nejspolehlivější otisk přeložené nebo AI-generované češtiny je **nominalizace** – transformace sloves na `-ní`, `-ost`, `-ace` podstatná jména. Čeština je sloveso-centrická: čtenář zpracovává aktivní slovesné věty výrazně rychleji než řetězy podstatných jmen.

Test pro přepis: když dokážete podstatné jméno nahradit vedlejší větou s `aby`, `když`, `jak` nebo `že`, udělejte to.

Dobře (slovesné):

- „Nakonfigurujte systém."
- „Až nainstalujete, systém se restartuje."
- „Po každé změně zkontrolujte repo."
- „Ověřte, že nasazený kód funguje."

Špatně (jmenné):

- „Provedení konfigurace systému je nutné."
- „Po dokončení instalace dojde k restartu."
- „Kontrola stavu repozitáře po každé změně."
- „Verifikace funkčnosti nasazeného kódu."

Signál k přepsání: jakmile ve větě vidíte tři a více `-ní`/`-ost`/`-ace` podstatných jmen v genitivu za sebou (`správa konfigurace nastavení`), přestavte větu kolem aktivního slovesa. Úplný seznam vzorů, které se mají odmítnout, drží [`content/czech-reject-list.md`](./czech-reject-list.md#nominální-řetězy-slovesné-vs-jmenné-vyjadřování).

## Code-switching s anglickými termíny

Workshop běžně mixuje češtinu a anglické technické výrazy. Aby to znělo přirozeně, ne lajdácky, drží se pár pravidel.

### Gramatický rod anglických loanwordů

Čeština musí přiřadit rod každému podstatnému jménu, včetně anglických výpůjček. Rod jde podle zakončení:

- **Mužský neživotný** (tvrdé souhláskové zakončení): `ten commit`, `ten branch`, `ten merge`, `ten build`, `ten pull request`, `ten rollback`, `ten checkpoint`, `ten handoff`
- **Ženský** (zakončení `-a`): `ta issue` (v developerském slangu, přestože původně neutrum), `ta pipeline`
- **Střední / mužský** (zakončení `-o`, `-e`): `to repo` / `ten repo` – držte jeden rod v rámci projektu. Tenhle workshop používá **`to repo`**.

### Deklinace

Ustálené loanwordy se skloňují, když jim to morfologie dovolí:

- `do repa`, `v repu`, `s repem`
- `před mergem`, `po commitu`, `v branchi`
- `commitnutí`, `pushnutí`, `mergnutí` – slovesná podstatná jména jsou v pořádku

Nesklonné zůstávají výrazy, jejichž zakončení neumožňuje přirozené české pády: `do CLI`, `v IDE`, `na proxy`, `s API`.

### Verbifikované anglicismy

V českém developerském kontextu jsou tyhle tvary **přirozené a pro tenhle workshop přijatelné**:

- `commitnout`, `pushnout`, `pullnout`, `mergovat`, `rebasenout`
- `deployovat`, `debugovat`, `refaktorovat`
- `reviewnout`, `approvnout`, `mergnout`

Důvod: každý český vývojář je používá v mluvě i v chatu. Formálnější `zapsat změny`, `sloučit`, `nasadit`, `odladit` jsou přesné, ale v hackathonu zní jako školní dokument. Workshop má peer tone – držíme hovorové formy.

**Výjimka:** ve formální tištěné dokumentaci (pokud taková vznikne) a v oficiálních dopisech preferujte české ekvivalenty.

### Kdy backtick, kdy bez

- **Příkazy, file names, slash commands, paths, config keys** – vždy backticks: `` `git commit` ``, `` `/plan` ``, `` `AGENTS.md` ``.
- **Názvy produktů a značek** v běžném textu – bez backticku, bez uvozovek: `GitHub Actions`, `Docker`, `Codex`, `Vercel`.
- **Technický termín při prvním výskytu** – volitelně italika nebo česky v závorce: `zásobník (*stack*)`, `kontext (*context*)`. Ale nepoužívejte to na každém výskytu – jen při zavedení pojmu v dané sekci.

### Česká věta zůstává česká

Zlaté pravidlo: česká věta má českou strukturu, slovosled a pád. Anglické termíny se do ní dosazují jako podstatná jména nebo slovesa, ne jako kusy anglické gramatiky.

- Dobře: „Po rotaci si nejdřív přečtěte `README`, `AGENTS.md` a aktuální plán."
- Špatně: „Use `/plan` before coding, because it gives better context."
- Špatně: „V rámci challenge budete implementing a new workflow."

## Jasnost na participant surfaces

Participant-facing content (participant view, karty, briefs, setup, recap, learner kit) má **mnohem přísnější standard srozumitelnosti než presenter nebo facilitator surfaces**. Důvod: účastník text čte sám, často přes QR kód na mobilu, bez toho, aby mu někdo doplňoval kontext živě. Když se musí v\u00A0hlavě ptát „čeho?" nebo „kterého?", text selhal.

### Hlavní rozdíl mezi vrstvami

- **Participant-facing** (strict clarity): text musí být self-contained. Každý imperativ má objekt. Každé směrové podstatné jméno je upřesněné. Žádný pronominální odkaz přes dvě tečky. Žádná vágní direktiva (`zmapujte`, `připravte`, `zvažte` bez kontextu).
- **Presenter / facilitator-facing** (hint style OK): text je podpora pro někoho, kdo ho doplní živě. Může být heslovitý, zkratkovitý, symbolický. Nadpis slide může být `Další kroky` nebo `Klíčová linka` – facilitátor mu dá kontext ústně.

### Red flags v participant-facing textu

- směrová podstatná jména bez upřesnění: `další kroky`, `první validace`, `příprava prostředí`
- imperativy bez objektu: `validujte`, `zkontrolujte`, `zmapujte`
- neurčité kvantifikátory: `několik`, `pár`, `různé`, `nějaký`
- pronominální řetězce přes dvě tečky: `to`, `tohle`, `tímto způsobem` odkazující na něco o dvě věty dříve
- abstraktní slovesa bez ukotvení: `zvažte`, `promyslete`, `získejte přehled`, `prozkoumejte možnosti`

Úplný seznam s preferovanými alternativami je v [`content/czech-reject-list.md`](./czech-reject-list.md#nejasnost-a-dvojznačnost-participant-facing-content).

### Test srozumitelnosti

Před publikací participant-facing textu si ho položte otázku: **„Kdyby tohle četl účastník na mobilu bez toho, aby mu někdo něco vysvětlil – ví bez přemýšlení, co má udělat nebo pochopit?"**

- „Validujte kód" – **ne** (co validovat? proti čemu?)
- „Spusťte `npm test` a ověřte, že všechny testy jsou zelené" – **ano**
- „Zmapujte repo" – **ne** (jak? co zaznamenat? kam to napsat?)
- „Projděte si top-level strukturu a do `AGENTS.md` zapište, kde jsou hlavní moduly" – **ano**
- „Připravte si další kroky" – **ne** (které další kroky? kde je předtím?)
- „Vypište si tři nejbližší akce, které po rotaci potřebujete udělat" – **ano**

### Pro presenter/facilitator-facing content

Pravidla výše platí **mírněji**. Facilitátor text vidí jako strukturovaný outline a doplní ho živě. Nadpis `Talk: Klíčová linka` je sám o sobě v pořádku – facilitátor na něm stojí, ne účastník. Když si nejste jistí, do které vrstvy text patří, ptejte se: *„Čte tohle účastník sám, nebo to někdo říká nahlas v\u00A0místnosti?"*

Mechanicky se vrstvy oddělují v `.copy-editor.yaml` polem `surface_profile` (`participant | presenter | hybrid`), aby copy-editor skill mohl uplatnit strict clarity check jen tam, kde má smysl.

## Audience Calibration

Workshop je pro developery. Nepiš, jako by publikum bylo netechnické.

- není nutné vysvětlovat běžné výrazy typu `repo`, `review`, `deploy`
- je vhodné vysvětlit nový koncept, pokud je specifický pro workshop
- když volíš mezi „přeložit“ a „zachovat známý termín“, preferuj známý termín

## Final Check Before Publishing

Před uložením textu pro účastníky si ověř:

1. Zní to jako přirozená čeština?
2. Pochopí to český developer napoprvé?
3. Nepřekládám něco, co má zůstat v angličtině?
4. Nezní to jako marketing nebo korporát?
5. Je z textu jasné, co má člověk udělat?

Pro finální workshop-ready revizi použijte i [`content/czech-editorial-review-checklist.md`](./czech-editorial-review-checklist.md). Living seznam konkrétních kalků, nominálních řetězů a AI fingerprintů drží [`content/czech-reject-list.md`](./czech-reject-list.md).

## Zdroje a další čtení

Pro pochybná rozhodnutí sáhněte po kanonických zdrojích – ne po prvním výsledku na Googlu.

- **Ústav pro jazyk český AV ČR – [Internetová jazyková příručka](https://prirucka.ujc.cas.cz/)** – normativní autorita pro český pravopis, gramatiku, interpunkci a typografii. První referenční bod.
- **[Mozilla Czech Localization Style Guide](https://mozilla-l10n.github.io/styleguides/cs/general.html)** – nejpraktičtější zdroj pro tech/software copy: interpunkce, typografie, kapitalizace, práce s anglickými termíny, formáty data a času.
- **[Microsoft Czech Localization Style Guide (PDF)](https://download.microsoft.com/download/7/b/5/7b57e4a1-d299-4238-9997-f3ac51d6f763/ces-cze-StyleGuide.pdf)** – tone of voice, konvence UI textů, terminologická disciplína.
- **[Naše řeč](http://nase-rec.ujc.cas.cz/)** – vědecký časopis ÚJČ pro hlubší dotazy (anglicismy, nominalizace, specifická dilemata).
- **[Nový encyklopedický slovník češtiny](https://www.czechency.org/slovnik/)** – terminologický slovník pro lingvistické pojmy.
- **[Wikipedie: Typografické rady](https://cs.wikipedia.org/wiki/Wikipedie:Typografick%C3%A9_rady)** – praktická rychlá reference.
