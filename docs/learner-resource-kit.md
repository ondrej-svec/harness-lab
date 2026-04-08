# Learner Resource Kit

Tato stránka definuje účastnický kit zdrojů pro Harness Lab.

Je to malá, kopírovatelná část repa, kterou si mají účastníci odnést, projít a znovu použít ve vlastních projektech.

## Základní pravidlo

Learner kit není celý backstage workshopu.

Má odpovídat na otázky:
- co si mám z workshopu zkopírovat do vlastního repa?
- co má agent udělat jako první?
- jak zařídit, aby práce přežila handoff?
- co musím ověřit, než výsledku uvěřím?

Výchozí pracovní rytmus, který má learner kit posilovat, je:
- `workshop` pro orientaci
- `brainstorm` nebo `plan` před větším řezem
- `work` proti jednomu ověřitelnému cíli
- `review` před důvěrou
- `compound` a průběžný úklid pro věci, které mají přežít session

## Jádro learner kitu

### 1. Workshop skill

Hlavní rozhraní pro účastníky:
- [`SKILL.md`](../SKILL.md)
- [`workshop-skill/setup.md`](../workshop-skill/setup.md)
- [`workshop-skill/reference.md`](../workshop-skill/reference.md)
- [`workshop-skill/recap.md`](../workshop-skill/recap.md)

Proč sem patří:
- ukazuje, jak může skill pro účastníky vést setup, workflow i ověřování v češtině
- je to reálné rozhraní opřené o repo, ne workshopový slide artefakt

### 2. `AGENTS.md` příklad

Výchozí starter:
- [`workshop-skill/template-agents.md`](../workshop-skill/template-agents.md)

Proč sem patří:
- je to nejmenší znovupoužitelný příklad trvalého kontextu v repu
- účastníci ho mohou upravit přímo pro vlastní projekt

### 3. Příklad pro ověření a review

Výchozí checklist:
- [`workshop-skill/analyze-checklist.md`](../workshop-skill/analyze-checklist.md)

Proč sem patří:
- dává konkrétní standard pro otázku „dokáže odtud pokračovat další tým?“
- převádí kvalitu repa do checklistu, který jde opravdu projít

### 4. Challenge cards

Doporučený subset:
- [`content/challenge-cards/deck.md`](../content/challenge-cards/deck.md)

Použití:
- malé zásahy během workshopu
- nápověda, co zlepšit později v reálném repu

### 5. Follow-up package

Posílení po workshopu:
- [`workshop-skill/follow-up-package.md`](../workshop-skill/follow-up-package.md)
- [`materials/participant-resource-kit.md`](../materials/participant-resource-kit.md)

Proč sem patří:
- proměňuje workshop z jednodenní akce na opakovatelný impuls ke změně chování
- dává doslovný handout, který lze poslat nebo vytisknout bez dalšího vysvětlování

## Kdy který artefakt použít

### Během setupu

Použijte:
- [`workshop-skill/setup.md`](../workshop-skill/setup.md)
- [`workshop-skill/reference.md`](../workshop-skill/reference.md)

### Během build fáze 1

Použijte:
- [`workshop-skill/template-agents.md`](../workshop-skill/template-agents.md)
- karty `Context Engineering` v [`content/challenge-cards/deck.md`](../content/challenge-cards/deck.md)

### Během odpoledního převzetí

Použijte:
- [`workshop-skill/analyze-checklist.md`](../workshop-skill/analyze-checklist.md)
- karty `Workflow` v [`content/challenge-cards/deck.md`](../content/challenge-cards/deck.md)

### Po workshopu

Použijte:
- [`workshop-skill/recap.md`](../workshop-skill/recap.md)
- [`workshop-skill/follow-up-package.md`](../workshop-skill/follow-up-package.md)
- [`materials/participant-resource-kit.md`](../materials/participant-resource-kit.md)
- [`learner-reference-gallery.md`](learner-reference-gallery.md)

## Co si odnést do reálného projektu

Účastníci by měli odejít s těmito konkrétními kroky:

1. Přidejte `AGENTS.md` s částmi:
   - goal
   - context
   - constraints
   - done when
2. Do `context` napište, co má agent číst jako první a které docs jsou zdroj pravdy.
3. Do `done when` napište konkrétní ověření a další bezpečný krok, když práce zůstane rozdělaná.
4. Přidejte build/test příkazy, které zvládne spustit další tým nebo agent bez ústního dovysvětlení.
5. Přidejte jeden review nebo handoff checklist.
6. Přesuňte jedno trvalé pravidlo z chatu do repa.
7. Před větší implementací použijte plan a po větší změně review nebo check.
8. Když už používáte externí workflow skill pack, napojte ho až nad tento základ místo toho, abyste jím nahrazovali kontext zapsaný v repu a ověřování.

## Co sem nepatří

Learner kit nemá obsahovat plný backstage provozní detail, například:
- runbooky pro konkrétní workshop instance
- privátní runtime architekturu a operace
- monitoring nebo řídicí postupy jen pro facilitátory
- maintainer-level deployment a security postupy, pokud se zrovna neučí explicitně jako skill pro účastníky
