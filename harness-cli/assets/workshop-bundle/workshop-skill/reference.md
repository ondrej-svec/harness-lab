# Workshop Reference

## 4 pracovní výchozí body pro dnešek

- `Mapa před pohybem` — nejdřív udělejte z repa místo, kde se dá orientovat
- `Co není v repu, neexistuje` — důležité dohody, pravidla a další kroky patří do souborů
- `Ověření je hranice důvěry` — s větší autonomií musí růst i kvalita evidence
- `Handoff je průběžná podmínka práce` — další tým má najít první bezpečný krok bez vašeho výkladu

## 4 prvky dobrého zadání

- `Cíl` — co má agent konkrétně vytvořit nebo změnit
- `Kontext` — které soubory, rozhodnutí a souvislosti jsou pro úkol důležité
- `Omezení` — pravidla, standardy a hranice řešení
- `Hotovo když` — podle čeho poznáte, že je práce opravdu dokončená

## Rychlý checklist pro handoff

- Existuje `AGENTS.md`?
- Je `AGENTS.md` krátká mapa, ne přerostlý dump?
- Jsou v repu build/test příkazy, které umí spustit i další tým?
- Je jasné, co už funguje, co je rozpracované a co je jen nápad?
- Je v repu plán, runbook nebo jiný dokument, ze kterého další tým pochopí záměr?
- Je dohledatelné, co bylo skutečně ověřeno?
- Najde nový tým během pár minut první bezpečný krok?

## 3 otázky, ke kterým se vraťte, když se zaseknete

- Čeho se právě snažíme dosáhnout?
- Který artefakt nebo signál v repu nám chybí?
- Jaké je nejmenší ověření, které vrátí práci z dojmu do reality?

## Kdy po čem sáhnout během dne

- Po openingu a talku: `workshop setup` nebo `workshop reference`
- V prvním buildu: `template-agents`, brief, plán a první ověření
- Před obědem: dopsat další bezpečný krok a použít `workshop analyze`, když si nejste jistí handoffem
- Po rotaci: `workshop analyze`, learner kit a challenge cards místo ústního rescue
- Po posledním bloku: `workshop recap` a `workshop follow-up`

## Doporučené příkazy

- Workshop skill v Codexu: `$workshop ...`
- Workshop skill v pi: `/skill:workshop`, potom si řekněte o `reference`, `setup`, `brief` nebo jinou workshop akci
- Když nevíte, co skill umí: `Codex: $workshop commands`
- Workshop skill je garantovaný výchozí nástroj. Workflow skills a externí toolkity jsou doporučené akcelerátory, ne povinný bootstrap.
- Workflow skills jako `$brainstorm`, `$plan`, `$work`, `$test-writer`, `$review` a `$compound` jsou v tomto workshopu popsané hlavně pro Codex. V pi je berte jako volitelnou součást vlastního setupu, ne jako garantovaný výchozí stav.
- `Codex: $workshop reference` na začátku dne nebo po ztrátě orientace
- `Codex: $workshop brief` když potřebujete znovu ukotvit zadání
- `Codex: $workshop resources` když chcete účastnický kit a learner kit bez hledání v repu
- `Codex: $workshop gallery` když chcete další veřejné docs, repozitáře a volitelné toolkity
- `Codex: $workshop follow-up` když řešíte, co si odnést po workshopu
- `Codex: $brainstorm` když ještě není jasné, co je nejrozumnější scope nebo slice
- `Codex: $plan` před větší implementací
- `Codex: $work` když už máte plán a chcete držet implementaci v jedné linii
- `Codex: $test-writer` nebo vlastní spustitelné ověření před implementací, když potřebujete držet agenta v mezích
- `Codex: $review` po větším kusu práce
- `Codex: $compound` když chcete převést nové zjištění, fix nebo workflow pravidlo do trvalého artefaktu v repu
- `Codex: $workshop` pro orientaci během dne
- `Codex: $workshop template` když repu chybí základní kontext
- `Codex: $workshop analyze` před handoffem nebo po rotaci, když chcete rychle odhalit slepá místa v repu

## Doporučený pracovní rytmus

- `workshop` pro orientaci a další bezpečný krok
- `brainstorm` nebo rovnou `$plan`, když už je scope zřejmý
- `work` proti jednomu ověřitelnému cíli
- `review` před tím, než změně uvěříte
- `compound` nebo krátký runbook, když něco stojí za zachování
- průběžný úklid: build/test příkazy, omezení a handoff poznámky přesouvejte z chatu do repa

## Testy jako hranice důvěry

- Čím víc práce dělá agent samostatně, tím méně stačí „já jsem to rychle projel očima“.
- Když necháte agenta psát bez testů, často jen urychlíte vznik neověřené složitosti.
- Spustitelné ověření (unit test, tracer bullet nebo jednoduché e2e ověření) je často nejrychlejší způsob, jak agentovi říct, co přesně má být pravda.

## Bezpečný UI workflow

- Výchozí pattern je: `agent exploration -> Playwright regression -> human review`.
- Nechte agenta rychle projít UI, screenshoty a konzoli v izolovaném lokálním prostředí.
- Jakmile najdete důležitý flow, převeďte ho do opakovatelného browser testu.
- Nakonec změnu projděte člověkem. Testy chrání proti regresi, ale neřeší automaticky smysl a trade-offy.
- „Nech model řídit můj běžný přihlášený browser“ není výchozí doporučení. To patří jen do sandboxovaného a záměrně omezeného prostředí.

## Rychlá připomínka

Dobrý prompt nestačí. Když má práce přežít handoff, musí být kontext uložený v repu, další bezpečný krok musí být dohledatelný a ověření musí zůstat čitelné i pro cizí tým.

## Learnings log — pro facilitátory

- Po rotaci můžete procházet zachycené signály přímo v CLI: `harness workshop learnings`
- Filtrujte podle tagu: `harness --json workshop learnings --tag missing_runbook`
- Filtrujte podle kohorty nebo instance: `--cohort 2026-Q2`, `--instance <id>`
- V dashboardu: rotační panel v detailu instance obsahuje capture formulář i přehled posledních záznamů
- Learnings log přežije smazání instance a postupně buduje evidenci pro vylepšení blueprintu

## Kam dál po workshopu

- Oficiální docs, OpenAI článek o Harness Engineering a ověřené veřejné skill repozitáře najdete v [`docs/learner-reference-gallery.md`](../docs/learner-reference-gallery.md).
- Codex-specific craft (approval módy, sandboxing, long-horizon drift, před/po příklad) je v [`content/codex-craft.md`](../content/codex-craft.md).
- Conversational moves pro coaching agenta sežene v jedné straně v [`materials/coaching-codex.md`](../materials/coaching-codex.md).
- Když už používáte další workflow pack nebo toolkit, berte ho jako rozšíření nad tímto základem, ne jako náhradu za `AGENTS.md`, ověřování a handoff opřený o repo.
- Když nechcete hledat v repu, použijte přímo `workshop resources`, `workshop gallery` nebo `workshop follow-up`.
