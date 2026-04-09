# Czech Editorial Review Checklist

Použijte tento checklist při revizi českého obsahu pro účastníky, hlavně pro:

- workshop agenda a presenter scenes
- pokyny pro participant room
- project briefs
- challenge cards
- setup, reference, recap, follow-up a learner-kit materiály

Tento checklist doplňuje [`content/style-guide.md`](./style-guide.md) a [`content/style-examples.md`](./style-examples.md). Není to náhrada. Je to poslední quality gate před tím, než se text bere jako workshop-ready.

## 1. Přirozenost češtiny

- Zní text jako přirozená čeština, ne jako překlad?
- Přečetl by to český developer bez škobrtnutí?
- Nejsou ve větách doslovné anglické kalky?
- Nejsou věty zbytečně dlouhé nebo toporné?

## 2. Kvalita míchání češtiny a angličtiny

- Zůstává česká věta česká?
- Jsou anglické termíny použité jen tam, kde jsou v developerské praxi opravdu přirozené?
- Není v textu náhodně promíchaná angličtina jen proto, že původní zdroj byl anglický?
- Když se méně známý anglický termín objevuje poprvé, je stručně ukotvený česky?

## 3. Viditelné surface a headline quality

- Zní nadpis, callout nebo participant prompt jako něco, co byste skutečně řekli nahlas v české místnosti?
- Nepůsobí viditelný text jako interní taxonomie nebo polopřeložený source draft?
- Není na viditelné české surface ponechané anglické slovo jen proto, že ho obsahoval původní workshop shorthand?
- Když na slidu vidíte slova jako `launch`, `check`, `checkpoint` nebo podobný interní termín, je pro ně opravdu silný důvod?
- Pokud by fluentní český reviewer větu okamžitě přepsal v hlavě, vraťte ji do editace.

## 4. Jasnost instrukce

- Je z textu jasné, co má člověk udělat právě teď?
- Mají věty konkrétní slovesa jako `spusťte`, `zkontrolujte`, `doplňte`, `ověřte`?
- Neschovává se akce za abstraktní formulace typu „je vhodné realizovat“?
- Nejsou odstavce přeplněné více cíli najednou?

## 5. Workshop voice

- Zní text jako zkušený peer, ne jako marketér nebo korporát?
- Drží se text klidného, věcného a praktického tónu?
- Nezní text jako slide, slogan nebo generický AI obsah?
- Je z textu cítit disciplína workshopu: kontext zapsaný v repu, ověření, handoff?

## 6. Terminologická disciplína

- Jsou opakované workshop terms použité konzistentně?
- Neobjevují se slabé nebo matoucí fráze jen proto, že znějí „AI-ish“?
- Jsou výrazy jako `safe move`, `handoff`, `checkpoint`, `workflow`, `review`, `skill`, `runbook` použité záměrně, ne náhodně?
- Není stejná věc jednou česky a podruhé napůl anglicky bez důvodu?

## 7. Vyhněte se těmto signálům

Pokud se v textu objeví něco z toho, vraťte ho do editace:

- doslovný překlad anglické vazby
- česká věta s náhodně vloženými anglickými slovy mimo technické termíny
- viditelný nadpis nebo callout, který přebírá interní anglický shorthand místo přirozené češtiny
- korporátní nebo školometský tón
- fráze, které nic nekotví k akci
- generické AI obraty bez konkrétního významu

## 8. Spoken check

Přečtěte text nahlas nebo aspoň polohlasem.

Text vrátit do editace, pokud:

- se nedá říct plynule
- obsahuje nepřirozený slovosled
- zní tvrdě přeloženě
- potřebuje v hlavě „opravovat“, co tím autor asi myslel

## 9. Cross-locale check

Pokud text vznikal z anglického source:

- není to doslovný překlad?
- drží česká verze stejný význam, ale přirozenější formulací?
- není česká verze výrazně slabší, plošší nebo méně konkrétní než anglická?
- není anglický source sám o sobě slabý a nehodí se nejdřív přepsat?

## 10. Required workflow

Když se mění viditelný český obsah v agendě, presenteru, participant view nebo workshop skillu, nestačí jen tichá self-editace.

Minimum:

1. autor provede self-pass podle `content/style-guide.md`
2. druhý český lidský reviewer projde checklist výše
3. reviewer udělá spoken check a visible-surface check
4. vznikne krátká review note v `docs/reviews/workshop-content/`, pokud jde o sdílený workshop obsah

LLM review může pomoci vytáhnout slabá místa nebo navrhnout varianty, ale nemůže sám uzavřít blocking gate pro viditelný český obsah.

## 11. Before publish

Před schválením českého textu pro účastníky musí být možné říct `ano` na všechno:

1. Je to přirozená čeština?
2. Rozumí tomu český developer napoprvé?
3. Je jasné, co má člověk udělat nebo pochopit?
4. Drží text workshop voice bez hype a bez korporátu?
5. Je míchání češtiny a angličtiny disciplinované?
6. Neobsahuje text slabé fráze nebo „AI slop“?
7. Obstojí text při čtení nahlas?
8. Obstojí i nadpisy a callouty na viditelných surfaces bez mentálního přepisu?
