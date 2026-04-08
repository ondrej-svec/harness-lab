# Participant Resource Kit

Krátká sada artefaktů, které si můžete odnést z Harness Lab do vlastního projektu.

## 1. Začněte `AGENTS.md`

Použijte tento základ:
- `goal`
- `context`
- `constraints`
- `done when`

Výchozí šablona:
- [`workshop-skill/template-agents.md`](../workshop-skill/template-agents.md)

## 2. Přidejte jeden zdroj důvěry

Vyberte si alespoň jeden:
- build/test příkazy
- RED test
- tracer bullet
- review checklist

Když agent dělá větší kus práce, nestačí „rychle jsem to projel očima“.

Checklist pro handoff:
- [`workshop-skill/analyze-checklist.md`](../workshop-skill/analyze-checklist.md)

## 3. Používejte malý workflow, ne chaos

Doporučený základ:
- `workshop` pro orientaci a další safe move
- `/brainstorm`, když ještě není jasný scope nebo první slice
- `/plan` před větší implementací
- `/work` nebo jiný úzký implementační loop, když už víte co stavíte
- test nebo jiný executable check před důležitou změnou
- `/review` po větším kusu práce
- `/compound` nebo krátká repo-native poznámka, když objev udělá další práci levnější
- malý cleanup průběžně: build/test příkazy, omezení a handoff poznámky přesouvejte z chatu do repa

## 4. Přesuňte jedno pravidlo z chatu do repa

Typické kandidáty:
- build/test příkazy
- bezpečnostní omezení
- definice hotovo
- pravidlo pro handoff

## 5. Pro UI práci držte bezpečný postup

Výchozí pattern:
- `agent exploration`
- `Playwright regression`
- `human review`

Nenechávejte model jako default ovládat váš běžný přihlášený browser bez sandboxu a kontroly.

## 6. Co si projít po workshopu

- [`workshop-skill/reference.md`](../workshop-skill/reference.md)
- [`workshop-skill/recap.md`](../workshop-skill/recap.md)
- [`docs/learner-reference-gallery.md`](../docs/learner-reference-gallery.md)

Poznámka:
- `workshop` skill je garantovaný workshop default
- další workflow skills a veřejné toolkity berte jako volitelné akcelerátory, ne povinný setup

## Výzva na příští týden

1. Přidejte `AGENTS.md` do jednoho reálného projektu.
2. Přesuňte jedno trvalé pravidlo z promptu do repa.
3. Přidejte jeden review nebo handoff checklist.
