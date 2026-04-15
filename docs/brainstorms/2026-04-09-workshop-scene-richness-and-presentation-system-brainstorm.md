---
title: "Workshop scene richness and presentation system"
type: brainstorm
date: 2026-04-09
participants: ["Codex", "Ondrej Svec"]
related:
  - ../plans/archive/2026-04-08-feat-rich-facilitator-agenda-and-presenter-content-plan.md
  - ../brainstorms/2026-04-08-facilitator-room-screen-and-presenter-flow-brainstorm.md
  - ../facilitator-agenda-source-of-truth.md
---

# Workshop Scene Richness And Presentation System

## Problem Statement

Harness Lab now has a real presenter surface, scene editing, and a bounded block-based content model, but the room-facing experience still feels weak because the canonical blueprint content is visually thin and the authoring workflow is too raw.

The actual problem is not "we need prettier slides." The actual problem is:

- the reusable blueprint does not yet encode flagship-quality conference-grade content
- the editor makes rich scenes expensive to author because blocks are still edited as raw JSON
- the current scene taxonomy is good enough for structured guidance, but not yet good enough for striking visual storytelling
- the current blueprint/runtime split makes it easy to patch one live instance and too hard to deliberately publish reusable improvements back into the blueprint

If this remains unchanged, every new workshop instance will import underpowered room content by default.

## Context

### What the current system already supports

The current presenter model is schema-driven, not freeform slide code:

- canonical runtime-facing blueprint: [`dashboard/lib/workshop-blueprint-agenda.json`](../../dashboard/lib/workshop-blueprint-agenda.json)
- typed scene/block model: [`dashboard/lib/workshop-data.ts`](../../dashboard/lib/workshop-data.ts)
- room renderer: [`dashboard/app/admin/instances/[id]/presenter/page.tsx`](../../dashboard/app/admin/instances/[id]/presenter/page.tsx)
- agenda/source-of-truth rule: [`docs/facilitator-agenda-source-of-truth.md`](../facilitator-agenda-source-of-truth.md)

The renderer already supports:

- `hero`
- `rich-text`
- `bullet-list`
- `quote`
- `steps`
- `checklist`
- `image`
- `link-list`
- `callout`
- `participant-preview`

This means the system is not blocked on "can we render anything richer than text?" It can.

### What the current blueprint actually uses

The current blueprint is much thinner than the renderer:

- 10 phases
- 26 scenes
- 0 scenes with an `image` block
- block usage is dominated by `hero`, `bullet-list`, and `participant-preview`

Current block counts:

- `hero`: 14
- `bullet-list`: 14
- `participant-preview`: 10
- `steps`: 7
- `callout`: 6
- `checklist`: 4
- `quote`: 2
- `link-list`: 1
- `image`: 0

This is the clearest evidence that the blueprint content is behind the platform.

### What makes rich authoring hard today

The current admin editor is technically useful but operationally weak for quality design:

- scene blocks are still edited as raw JSON in [`dashboard/app/admin/instances/[id]/page.tsx`](../../dashboard/app/admin/instances/[id]/page.tsx)
- the UI copy explicitly tells users to edit blocks and references as JSON
- there is no visual block gallery, no asset browser, no reusable scene templates, and no live side-by-side preview inside the editor
- there is no first-class image sourcing pipeline or citation helper
- there is no deliberate "publish reusable scene improvement back to blueprint" workflow inside the product

### Important structural tension already in the repo

The language architecture says canonical shared workshop content should be authored in English and localized deliberately, but the runtime-facing canonical blueprint is still primarily Czech:

- rule: [`docs/workshop-content-language-architecture.md`](../workshop-content-language-architecture.md)
- current canonical file: [`dashboard/lib/workshop-blueprint-agenda.json`](../../dashboard/lib/workshop-blueprint-agenda.json)

That mismatch matters because it makes reuse, review, and future workshop portability harder.

### There is richer source material than the blueprint currently expresses

The workshop docs already contain stronger messages, milestones, and facilitation logic than the presenter scenes currently show:

- [`content/talks/context-is-king.md`](../../content/talks/context-is-king.md)
- [`content/facilitation/master-guide.md`](../../content/facilitation/master-guide.md)

So part of the problem is not missing ideas. It is incomplete transfer from long-form workshop doctrine into structured room-facing content.

## External Research

### Strong presentation principles worth importing

From TED/TEDx speaker guidance:

- one talk should communicate one clear idea
- slides should stay simple
- use as little text as possible
- avoid bullet-heavy slides
- one slide should support one point
- use images only when licensed or owned
- fact-check claims and use credible sources

Sources:

- TEDx Speaker Guide: https://storage.ted.com/tedx/manuals/tedx_speaker_guide.pdf?lang=es
- TEDx Content Guidelines: https://www.ted.com/participate/organize-a-local-tedx-event/tedx-organizer-guide/speakers-program/prepare-your-speaker/tedx-content-guidelines-details

From Garr Reynolds and Duarte:

- keep slides simple and visually subordinate to the spoken message
- build a consistent visual language across the deck
- design for the audience, not for the author's notes

Sources:

- Garr Reynolds, Presentation Design Tips: https://www.garrreynolds.com/design-tips
- Duarte slide design guidance: https://www.duarte.com/blog/perfect-your-slide-design/

From hackathon/demo presentation guidance:

- quickly set the scene
- show the working thing early
- end with the future potential, not a feature inventory
- screenshots and demo video materially improve asynchronous judging/review

Source:

- Devpost, How to present a successful hackathon demo: https://info.devpost.com/blog/how-to-present-a-successful-hackathon-demo

### Strong agent-content principles worth importing

For Harness Lab specifically, high-value claims should be anchored in reproducible evaluation and clear success criteria rather than slogans.

Sources:

- OpenAI, Evaluate agent workflows: https://developers.openai.com/api/docs/guides/agent-evals
- OpenAI, Working with evals: https://platform.openai.com/docs/guides/evals
- Anthropic, Prompt engineering overview: https://docs.anthropic.com/en/docs/prompt-engineering

### Relevant presentation engines and libraries

Potential reference systems:

- Slidev: markdown + Vue components + UnoCSS + presenter notes + remote/local assets
  - https://docs-legacy.sli.dev/guide/syntax
- reveal.js: open-web HTML presentation model with markdown support and per-slide state
  - https://revealjs.com/markup/
- Marp/Marpit: markdown presentation ecosystem with themeable CSS and strong portability
  - https://marp.app/
  - https://marpit.marp.app/

These are useful as reference systems for authoring patterns and layout vocabulary, but not as automatic proof that Harness Lab should become a generic slide-deck product.

## Approaches Considered

## Approach 1: Keep the current schema and only rewrite the copy

Pros:

- fastest
- minimal code changes

Cons:

- does not solve the raw JSON authoring pain
- does not add enough visual range
- likely produces "better text cards," not amazing room screens

Verdict:

Rejected. It improves content quality but not enough to change the perceived product.

## Approach 2: Replace the presenter with a generic JS/HTML slide framework

Pros:

- maximal expressive freedom
- easier to build flagship decks quickly

Cons:

- breaks the agenda-owned scene model
- makes agentic editing harder
- risks creating a second presentation product unrelated to the control room
- weakens structured reuse across dashboard, skill, and runtime APIs

Verdict:

Rejected as the default architecture.

## Approach 3: Keep the agenda-owned structured presenter model, but upgrade it into a serious content system

Pros:

- preserves the repo's source-of-truth model
- stays compatible with agentic editing and APIs
- keeps runtime and blueprint semantics aligned
- can still support a few premium scene types and richer layout blocks

Cons:

- requires both content work and product work
- needs a stronger authoring workflow than raw JSON

Verdict:

Chosen.

## Approach 4: Hybrid model

Keep the structured agenda/scene model as canonical, but add a tightly bounded escape hatch for flagship scenes that need more art direction.

Possible escape hatches:

- `custom-html` scene type compiled from repo-owned templates
- `remote-slide-deck` scene type for a reviewed exported deck
- block-level support for richer split layouts, image mosaics, stats, timelines, before/after comparisons, and quote walls

Verdict:

Likely worth doing, but only after the structured system is upgraded first.

## Chosen Direction

Harness Lab should stay schema-driven and agenda-owned, but the schema, blueprint content, and authoring workflow all need to move up a level.

The recommended direction is:

1. treat the blueprint as the product, not as placeholder sample content
2. rebuild the canonical scene packs around conference-grade presentation principles
3. add richer visual/content blocks without turning the system into a freeform page builder
4. replace raw JSON block editing with structured authoring tools, templates, previews, and asset handling
5. create a deliberate publish-back workflow so the best runtime experiments become blueprint improvements

## Validation Results

The remaining strategic doubts were investigated explicitly.

### 1. Can the structured scene system feel premium enough without a separate deck engine?

**Verdict:** Probably yes, but only conditionally.

**Strongest evidence:**

- the current typed model already supports multiple scene primitives in [`dashboard/lib/workshop-data.ts`](../../dashboard/lib/workshop-data.ts)
- the current renderer already supports richer room content in [`dashboard/app/admin/instances/[id]/presenter/page.tsx`](../../dashboard/app/admin/instances/[id]/presenter/page.tsx)
- the earlier brainstorm already rejected a generic slide builder and chose agenda-owned presenter packs in [`2026-04-08-facilitator-presenter-rich-content-redesign-brainstorm.md`](2026-04-08-facilitator-presenter-rich-content-redesign-brainstorm.md)

**Residual risk:**

- if the visual grammar stays repetitive and card-heavy, "structured" will still feel like admin UI

**What must be true for this verdict to hold:**

- the blueprint has to use the richer scene model seriously
- the visual language has to stop flattening every scene into the same card treatment
- a small number of targeted presentation primitives must be enough to create flagship moments

### 2. Will a curated blueprint-plus-assets workflow be maintainable over time?

**Verdict:** Yes, but only with explicit discipline and better tooling.

**Strongest evidence:**

- the repo already has the right governance model in [`workshop-blueprint/edit-boundaries.md`](../../workshop-blueprint/edit-boundaries.md), [`docs/facilitator-agenda-source-of-truth.md`](../facilitator-agenda-source-of-truth.md), and [`docs/workshop-content-language-architecture.md`](../workshop-content-language-architecture.md)
- runtime changes are already supposed to publish back deliberately rather than auto-promote
- the current weakness is not governance but execution: the editor is still JSON-first in [`dashboard/app/admin/instances/[id]/page.tsx`](../../dashboard/app/admin/instances/[id]/page.tsx)

**Residual risk:**

- if assets, attribution, and authoring stay ad hoc, maintainers will bypass the blueprint and canonical quality will decay

**What must be true for this verdict to hold:**

- assets need metadata and review rules
- structured authoring must replace JSON for the normal path
- publish-back must remain a deliberate reviewed edit, not a side effect of runtime experimentation

### 3. Can another facilitator run the workshop from scene content plus notes alone?

**Verdict:** Not today, but it is the right target and should become an explicit quality gate.

**Strongest evidence:**

- the architecture already separates room content from facilitator notes and source references
- the broader workshop doctrine already wants the day to survive another facilitator
- current notes are too thin for a real cold-read handoff, so the failure is content depth, not architecture

**Residual risk:**

- we might optimize for premium visuals and still leave a non-Ondrej facilitator under-supported

**What must be true for this verdict to hold:**

- at least one flagship phase has to be rewritten with richer notes and source anchors
- a non-Ondrej facilitator must actually try to run it
- passing that cold-read check must become a release gate, not just a stated aspiration

## What "Amazing" Should Mean In This Repo

Not glossy for its own sake. "Amazing" should mean:

- every agenda item has a strong default room-safe scene pack
- participant-view scenes feel intentional, not like diagnostics
- flagship moments use visuals, quotes, comparisons, and evidence instead of bullet piles
- claims are sourced and legally usable
- facilitators can adapt content without hand-authoring giant JSON blobs
- the same canonical content powers dashboard, presenter, and facilitator skill coherently

## Hard Rules

- One premium presentation system, still structurally scene-based. We do not introduce a second default deck product.
- Canonical blueprint content stays the quality bar. Runtime experimentation is useful, but reusable improvements must publish back deliberately.
- A flagship scene pack is not done until a non-Ondrej facilitator can cold-read it from scene content plus facilitator notes and run the moment coherently.

## Proposed System Upgrades

### 1. Blueprint content upgrade

Every major agenda moment should ship with a richer scene pack, for example:

- `thesis` scene
- `evidence` scene
- `story` scene
- `demo flow` scene
- `participant mirror` scene
- `checkpoint cue` scene
- `quote wall` scene
- `next move` scene

Each pack should encode:

- one central idea
- one supporting proof or example
- one visual anchor
- one facilitator cue
- one participant-safe next step

### 2. Block taxonomy upgrade

Add high-value blocks rather than arbitrary layout freedom:

- `stat`
- `comparison`
- `timeline`
- `two-column`
- `image-grid`
- `code-before-after`
- `speaker-quote`
- `source-strip`
- `milestone-board`
- `room-signal`
- `team-instruction`

### 3. Asset and sourcing system

Scenes need a first-class asset model:

- repo-owned image/video asset folders for reviewed blueprint visuals
- explicit source attribution metadata
- legal status per asset
- cropped variants for projection-safe use
- screenshot ingestion path for product UI or code examples

### 4. Authoring UX upgrade

Replace raw JSON editing with:

- block picker
- block-specific forms
- layout templates
- scene duplication
- live preview
- image picker
- source-reference helper
- blueprint-vs-runtime diff view

### 5. Canonical content language cleanup

Move toward:

- canonical English structured blueprint
- reviewed Czech localized delivery
- consistent shared IDs and scene semantics across locales

### 6. Publish-back workflow

Add an explicit maintainer path:

- runtime scene experiment
- review and promote to blueprint
- localize
- import into future workshop instances

Without this, the best workshop improvements will keep getting trapped in one-off runtime edits.

## Open Questions

1. Should flagship talk scenes stay inside the current block model only, or do we want one premium escape hatch for art-directed scenes?
2. How much image/video material can be repo-owned versus uploaded per workshop?
3. Do we want blueprint visuals to be public-safe but high quality, with private runtime swaps for client/event-specific visuals?
4. Should the facilitator skill be able to propose and draft rich scenes automatically, or only edit approved templates?
5. How far do we want to push animation and transitions before it becomes presentation theater instead of workshop support?

## Out Of Scope

- turning Harness Lab into a full generic presentation product
- automatic write-back from runtime to blueprint
- pulling random unlicensed internet images into workshop scenes
- solving content quality only by letting facilitators hand-code HTML in live workshops

## Decision Summary

- The main issue is not missing scene infrastructure. It is weak blueprint content plus weak authoring ergonomics.
- The blueprint import is not "out of date" in the sense of missing the current schema. It is underusing the schema.
- The current presenter should stay agenda-owned and structured.
- We should upgrade the blueprint, block model, asset pipeline, and authoring workflow together.
- We should likely add one bounded premium escape hatch only after the structured system becomes genuinely strong.
- Cold-read facilitator self-sufficiency is now a hard acceptance criterion, not an implicit hope.

## Next Step

Translate this into a detailed implementation plan that covers:

- blueprint content redesign
- scene/block model extensions
- authoring UX
- asset sourcing rules
- localization alignment
- publish-back workflow
