# Learner Resource Kit

This page defines the participant-facing resource kit for Harness Lab.

It is the small, copyable slice of the repo that participants should take away, revisit, and reuse in their own projects.

## Core rule

The learner kit is not the full backstage harness.

It should answer:
- what should I copy from the workshop into my own repo?
- what should the agent do first?
- how do I make the work survive handoff?
- what must I verify before I trust the output?

The default participant pattern this kit should reinforce is:
- `workshop` for orientation
- `brainstorm` or `plan` before a larger cut
- `work` against one verifiable goal
- `review` before trust
- `compound` and cleanup for things that should survive the session

## Core learner kit

### 1. Workshop skill

Primary participant interface:
- [`SKILL.md`](../../../SKILL.md)
- [`workshop-skill/setup.md`](../../../workshop-skill/setup.md)
- [`workshop-skill/reference.md`](../../../workshop-skill/reference.md)
- [`workshop-skill/recap.md`](../../../workshop-skill/recap.md)

Why it belongs here:
- it shows how a participant-facing skill can guide setup, workflow, and verification in reviewed workshop language
- it is a real repo-native interface, not a workshop slide artifact

### 2. `AGENTS.md` example

Default starter:
- [`workshop-skill/template-agents.md`](../../../workshop-skill/template-agents.md)

Why it belongs here:
- it is the smallest reusable example of durable context in the repo
- participants can adapt it directly for their own project

### 3. Verification / review example

Default checklist:
- [`workshop-skill/analyze-checklist.md`](../../../workshop-skill/analyze-checklist.md)

Why it belongs here:
- it provides a concrete standard for “can another team continue from here?”
- it turns repo quality into a checklist people can actually run

### 4. Challenge cards

Recommended subset:
- [`content/challenge-cards/locales/en/deck.md`](../../../content/challenge-cards/locales/en/deck.md)

Use:
- as small interventions during the workshop
- as prompts for what to improve later in a real repo

### 5. Follow-up package

Post-workshop reinforcement:
- [`workshop-skill/follow-up-package.md`](../../../workshop-skill/follow-up-package.md)
- [`materials/locales/en/participant-resource-kit.md`](../../../materials/locales/en/participant-resource-kit.md)

Why it belongs here:
- it turns the workshop from a one-day event into a repeatable prompt for behavior change
- it provides a literal handout you can send or print without further explanation

## When to use which artifact

### During setup

Use:
- [`workshop-skill/setup.md`](../../../workshop-skill/setup.md)
- [`workshop-skill/reference.md`](../../../workshop-skill/reference.md)

### During Build Phase 1

Use:
- [`workshop-skill/template-agents.md`](../../../workshop-skill/template-agents.md)
- the `Context Engineering` cards in [`content/challenge-cards/locales/en/deck.md`](../../../content/challenge-cards/locales/en/deck.md)

### During the continuation shift

Use:
- [`workshop-skill/analyze-checklist.md`](../../../workshop-skill/analyze-checklist.md)
- the `Workflow` cards in [`content/challenge-cards/locales/en/deck.md`](../../../content/challenge-cards/locales/en/deck.md)

### After the workshop

Use:
- [`workshop-skill/recap.md`](../../../workshop-skill/recap.md)
- [`workshop-skill/follow-up-package.md`](../../../workshop-skill/follow-up-package.md)
- [`materials/locales/en/participant-resource-kit.md`](../../../materials/locales/en/participant-resource-kit.md)
- [`learner-reference-gallery.md`](learner-reference-gallery.md)

## What to carry into a real project

Participants should leave with these concrete moves:

1. Add `AGENTS.md` with:
   - goal
   - context
   - constraints
   - done when
2. In `context`, write what the agent should read first and which docs are the source of truth.
3. In `done when`, write explicit verification and the next safe move if work remains unfinished.
4. Add build/test commands that another team or agent can run without verbal backfilling.
5. Add one review or handoff checklist.
6. Move one durable rule from chat into the repo.
7. Use plan before a larger implementation and review or another check after a larger change.
8. If you already use an external workflow skill pack, layer it on top of this foundation instead of replacing repo-native context and verification.

## What does not belong here

The learner kit should not include the full backstage operating detail, for example:
- workshop-instance runbooks
- private runtime architecture and operations
- facilitator-only monitoring or control procedures
- maintainer-level deployment and security procedures unless they are being taught explicitly as participant skill content
