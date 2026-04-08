# Workshop Reference

## 4 pracovní defaulty pro dnešek

- `Mapa před pohybem` — nejdřív udělejte z repa místo, kde se dá orientovat
- `Co není v repu, neexistuje` — důležité dohody, pravidla a next steps patří do souborů
- `Ověření je hranice důvěry` — s větší autonomií musí růst i kvalita evidence
- `Handoff je průběžný constraint` — další tým má najít první safe move bez vašeho výkladu

## 4 prvky dobrého zadání

- `Cíl` — co má agent konkrétně vytvořit nebo změnit
- `Kontext` — které soubory, rozhodnutí a souvislosti jsou pro úkol důležité
- `Omezení` — pravidla, standardy a hranice řešení
- `Hotovo když` — podle čeho poznáte, že je práce opravdu dokončená

## Rychlý checklist pro handoff

- Existuje `AGENTS.md`?
- Je `AGENTS.md` krátká mapa, ne přerostlý dump?
- Jsou v repu build/test příkazy, které umí spustit i další tým?
- Je jasné, co už funguje, co je rozpracované a co je jen nápad?
- Je v repu plan, runbook nebo jiný dokument, ze kterého další tým pochopí záměr?
- Je dohledatelné, co bylo skutečně ověřeno?
- Najde nový tým během pár minut první bezpečný krok?

## Doporučené commands

- Workshop skill v Codexu: `$workshop ...`
- Workshop skill v pi: `/skill:workshop`, potom si řekněte o `reference`, `setup`, `brief` nebo jinou workshop akci
- Když nevíte, co skill umí: `Codex: $workshop commands`
- Workshop skill je garantovaný default. Workflow skills a externí toolkity jsou doporučené akcelerátory, ne povinný bootstrap.
- Workflow skills jako `$brainstorm`, `$plan`, `$work`, `$test-writer`, `$review` a `$compound` jsou v tomto workshopu popsané Codex-first. V pi je berte jako volitelnou součást vlastního setupu, ne jako garantovaný default.
- `Codex: $workshop reference` na začátku dne nebo po ztrátě orientace
- `Codex: $workshop brief` když potřebujete znovu ukotvit zadání
- `Codex: $workshop resources` když chcete participant kit a learner kit bez hledání v repu
- `Codex: $workshop gallery` když chcete další veřejné docs, repozitáře a volitelné toolkity
- `Codex: $workshop follow-up` když řešíte, co si odnést po workshopu
- `Codex: $brainstorm` když ještě není jasné, co je nejrozumnější scope nebo slice
- `Codex: $plan` před větší implementací
- `Codex: $work` když už máte plan a chcete držet implementaci v jedné linii
- `Codex: $test-writer` nebo vlastní RED test před implementací, když potřebujete držet agenta v mezích
- `Codex: $review` po větším kusu práce
- `Codex: $compound` když chcete převést learning, fix nebo workflow pravidlo do trvalého repo-native artefaktu
- `Codex: $workshop` pro orientaci během dne
- `Codex: $workshop template` když repu chybí základní kontext
- `Codex: $workshop analyze` před handoffem nebo po rotaci, když chcete rychle odhalit slepá místa v repu

## Doporučený participant loop

- `workshop` pro orientaci a další safe move
- `brainstorm` nebo rovnou `plan`, když už je scope zřejmý
- `work` proti jednomu ověřitelnému cíli
- `review` před tím, než změně uvěříte
- `compound` nebo krátký runbook, když něco stojí za zachování
- průběžná cleanup práce: build/test příkazy, omezení a handoff poznámky přesouvejte z chatu do repa

## Testy jako hranice důvěry

- Čím víc práce dělá agent samostatně, tím méně stačí „já jsem to rychle projel očima“.
- Když necháte agenta psát bez testů, často jen urychlíte vznik neověřené složitosti.
- RED test, tracer bullet nebo jednoduché e2e ověření je často nejrychlejší způsob, jak agentovi říct, co přesně má být pravda.

## Bezpečný UI workflow

- Výchozí pattern je: `agent exploration -> Playwright regression -> human review`.
- Nechte agenta rychle projít UI, screenshoty a konzoli v izolovaném lokálním prostředí.
- Jakmile najdete důležitý flow, převeďte ho do opakovatelného browser testu.
- Nakonec změnu projděte člověkem. Testy chrání proti regresi, ale neřeší automaticky smysl a trade-offy.
- „Nech model řídit můj běžný přihlášený browser“ není výchozí doporučení. To patří jen do sandboxovaného a záměrně omezeného prostředí.

## Rychlá připomínka

Dobrý prompt nestačí. Když má práce přežít handoff, musí být kontext uložený v repu a ověření musí být dohledatelné.

## Kam dál po workshopu

- Oficiální docs, OpenAI článek o Harness Engineering a ověřené veřejné skill repozitáře najdete v [`docs/learner-reference-gallery.md`](../docs/learner-reference-gallery.md).
- Když už používáte další workflow pack nebo toolkit, berte ho jako rozšíření nad tímto základem, ne jako náhradu za `AGENTS.md`, ověřování a repo-native handoff.
- Když nechcete hledat v repu, použijte přímo `workshop resources`, `workshop gallery` nebo `workshop follow-up`.
