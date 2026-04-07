# Workshop Reference

## 4 prvky dobrého zadání

- `Cíl` — co má agent konkrétně vytvořit nebo změnit
- `Kontext` — které soubory, rozhodnutí a souvislosti jsou pro úkol důležité
- `Omezení` — pravidla, standardy a hranice řešení
- `Hotovo když` — podle čeho poznáte, že je práce opravdu dokončená

## Rychlý checklist pro handoff

- Existuje `AGENTS.md`?
- Jsou v repu build/test příkazy, které umí spustit i další tým?
- Je jasné, co už funguje, co je rozpracované a co je jen nápad?
- Je v repu plan, runbook nebo jiný dokument, ze kterého další tým pochopí záměr?
- Najde nový tým během pár minut první bezpečný krok?

## Doporučené commands

- `/plan` před větší implementací
- `/test-writer` nebo vlastní RED test před implementací, když potřebujete držet agenta v mezích
- `/review` po větším kusu práce
- `/workshop status` pro orientaci během dne
- `/workshop template` když repu chybí základní kontext

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

Dobrý prompt nestačí. Když má práce přežít handoff, musí být kontext uložený v repu.
