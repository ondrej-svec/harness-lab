# Learner Resource Kit

This page defines the participant learner kit for Harness Lab.

It is the small, portable subset of the repo that participants should take away, review, and reuse in their own projects.

## Ground Rule

The learner kit is not the full workshop backstage.

It should answer:
- what should I copy into a real repo?
- what should the agent or team do first?
- how do I make the work survive handoff?
- what do I need to verify before I trust the result?

Default participant rhythm the learner kit should reinforce:
- `workshop` pro orientaci
- `brainstorm` nebo `plan` před větším řezem
- `work` proti jednomu ověřitelnému cíli
- `review` před důvěrou
- `compound` a průběžný úklid pro věci, které mají přežít session

## Learner Kit Core

### 1. Workshop skill

Hlavní rozhraní pro účastníky:
- [`SKILL.md`](../SKILL.md)
- [`workshop-skill/setup.md`](../workshop-skill/setup.md)
- [`workshop-skill/reference.md`](../workshop-skill/reference.md)
- [`workshop-skill/recap.md`](../workshop-skill/recap.md)

Why it belongs here:
- it shows how a participant skill can guide setup, workflow, and verification
- it is a real repo-backed interface, not only a workshop slide artifact

### 2. `AGENTS.md` example

Výchozí starter:
- [`workshop-skill/template-agents.md`](../workshop-skill/template-agents.md)

Why it belongs here:
- it is the smallest reusable example of durable repo context
- participants can adapt it directly for a real project

### 3. Verification and review example

Výchozí checklist:
- [`workshop-skill/analyze-checklist.md`](../workshop-skill/analyze-checklist.md)

Why it belongs here:
- it gives a concrete standard for “can another team continue from here?”
- it turns repo quality into a checklist people can actually run

### 4. Challenge cards

Doporučený subset:
- [`content/challenge-cards/deck.md`](../content/challenge-cards/deck.md)

Use:
- malé zásahy během workshopu
- nápověda, co zlepšit později v reálném repu

### 5. Follow-up package

Posílení po workshopu:
- [`workshop-skill/follow-up-package.md`](../workshop-skill/follow-up-package.md)
- [`materials/participant-resource-kit.md`](../materials/participant-resource-kit.md)

Why it belongs here:
- it turns the workshop from a one-day event into a repeatable behaviour change
- it gives a literal handout that can be sent or printed without extra explanation

## When To Use Which Artifact

### During setup

Použijte:
- [`workshop-skill/setup.md`](../workshop-skill/setup.md)
- [`workshop-skill/reference.md`](../workshop-skill/reference.md)

### During Build Phase 1

Použijte:
- [`workshop-skill/template-agents.md`](../workshop-skill/template-agents.md)
- karty `Před obědem: postavte pracovní systém` v [`content/challenge-cards/deck.md`](../content/challenge-cards/deck.md)

### During the afternoon takeover

Použijte:
- [`workshop-skill/analyze-checklist.md`](../workshop-skill/analyze-checklist.md)
- karty `Po rotaci: opravte signál, ne jen feature` v [`content/challenge-cards/deck.md`](../content/challenge-cards/deck.md)

### After the workshop

Použijte:
- [`workshop-skill/recap.md`](../workshop-skill/recap.md)
- [`workshop-skill/follow-up-package.md`](../workshop-skill/follow-up-package.md)
- [`materials/participant-resource-kit.md`](../materials/participant-resource-kit.md)
- [`learner-reference-gallery.md`](learner-reference-gallery.md)

## What To Carry Into A Real Project

Participants should leave with these concrete moves:

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

## What Does Not Belong Here

The learner kit should not include full backstage operational detail, for example:
- runbooky pro konkrétní workshop instance
- privátní runtime architekturu a operace
- monitoring nebo řídicí postupy jen pro facilitátory
- maintainer-level deployment a security postupy, pokud se zrovna neučí explicitně jako skill pro účastníky
