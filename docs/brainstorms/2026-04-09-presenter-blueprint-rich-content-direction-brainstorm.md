---
title: "Presenter Blueprint Rich Content Direction"
type: brainstorm
date: 2026-04-09
participants: ["Codex", "Ondrej Svec"]
related:
  - ../plans/2026-04-08-feat-rich-facilitator-agenda-and-presenter-content-plan.md
  - ../plans/2026-04-08-feat-facilitator-room-screen-and-presenter-flow-plan.md
  - ../facilitator-agenda-source-of-truth.md
---

# Presenter Blueprint Rich Content Direction

## Problem Statement

Harness Lab now has a real presenter surface, scene editing, and a bounded block-based content model, but the actual workshop projection still feels weak because the canonical blueprint content is visually thin and the visual grammar of the presenter surface is too generic.

The problem is not only "we need prettier slides." The real problem is that new workshop instances inherit a blueprint that does not yet encode the best workshop story, the best room-safe visual content, or a high-quality asset pipeline. As a result:

- facilitators get scene controls without getting truly strong scenes
- participants and room projections inherit copy-heavy layouts instead of memorable visual moments
- the dashboard, blueprint, and skill do not yet form a high-quality content production system

## Context

### What exists already

- The canonical runtime source of truth is agenda-backed and scene-backed, not ad hoc HTML:
  - [`dashboard/lib/workshop-blueprint-agenda.json`](../../dashboard/lib/workshop-blueprint-agenda.json)
  - [`dashboard/lib/workshop-data.ts`](../../dashboard/lib/workshop-data.ts)
  - [`dashboard/app/admin/instances/[id]/presenter/page.tsx`](../../dashboard/app/admin/instances/[id]/presenter/page.tsx)
- The repo already decided that agenda items own presenter scenes and that richer workshop content should extend this shared model rather than create a second presenter-only system:
  - [`docs/facilitator-agenda-source-of-truth.md`](../facilitator-agenda-source-of-truth.md)
  - [`docs/plans/2026-04-08-feat-rich-facilitator-agenda-and-presenter-content-plan.md`](../plans/2026-04-08-feat-rich-facilitator-agenda-and-presenter-content-plan.md)
- The workshop source material is richer than the room screen currently feels:
  - [`content/facilitation/master-guide.md`](../../content/facilitation/master-guide.md)
  - [`content/talks/context-is-king.md`](../../content/talks/context-is-king.md)
  - [`content/talks/codex-demo-script.md`](../../content/talks/codex-demo-script.md)

### What is actually missing

Current blueprint evidence:

- 10 phases
- 26 scenes
- 0 scenes using the `image` block
- block usage is dominated by `hero`, `bullet-list`, and `participant-preview`
- only 2 `quote` blocks and 1 `link-list`

This means imported instances are not "missing" rich content because import is stale. They are missing rich content because the canonical blueprint still does not carry enough strong visual/editorial material.

### External research that matters

Presentation craft:

- TEDx speaker guide:
  - strong talks should communicate one idea clearly and fast
  - slides should stay simple
  - slides should use as little text as possible
  - bullet points should be avoided
  - each graph should make only one point
  - edge-to-edge photography is recommended for simple slides
  - source: https://storage.ted.com/tedx/manuals/tedx_speaker_guide.pdf
- Duarte emphasizes that slide design is not decoration but "persuasive visual communication" and that story structure plus visual thinking are part of one communication system
  - sources:
    - https://www.duarte.com/training/slide-document-design/
    - https://www.duarte.com/resources/guides-tools/slideology-workshop-overview/
    - https://www.duarte.com/resources/talks/the-secret-structure-of-great-talks/

Agent-system design guidance that also applies here:

- Anthropic's guidance on effective agents favors simple, composable patterns over complex frameworks; that argues against turning the presenter into a fully unconstrained slide-CMS
  - source: https://www.anthropic.com/engineering/building-effective-agents
- OpenAI's practical guide stresses explicit instructions, tool boundaries, existing documents as source material, and evals as the reliability loop
  - sources:
    - https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/
    - https://platform.openai.com/docs/guides/evals

Relevant library landscape:

- reveal.js is a strong web-native option when we need richer staged motion, speaker notes, and HTML-level control
  - source: https://revealjs.com/
- Marp is strong for Markdown-authored slide decks with CSS theming and export to HTML, PDF, and PowerPoint
  - source: https://marp.app/
- Motion Canvas is strong for rare high-polish animated explainers, not for day-to-day authoring
  - source: https://motioncanvas.io/docs/
- Slidev is attractive for developer-authored decks with themes, layouts, addons, and AI workflows, but it introduces a Vue-centric authoring lane that does not match the current Next.js runtime as cleanly
  - source: https://sli.dev/features/

## Chosen Approach

Adopt a **hybrid presenter content system**:

1. Keep the agenda-owned structured scene model as the canonical workshop runtime backbone.
2. Substantially upgrade the blueprint content and visual system so most scenes become genuinely editorial and visual, not just text cards.
3. Introduce a small number of premium "immersive narrative" scenes for keynote moments, using a web-native deck/composition layer only where the bounded block system is genuinely insufficient.
4. Add an asset pipeline, rights metadata, and AI-assisted authoring workflow so facilitators do not have to hand-design every workshop instance.

This keeps the system agent-friendly and runtime-coherent while creating room for much more ambitious room-facing storytelling.

## Why This Approach

This optimizes for:

- reusable quality for every new workshop instance
- one canonical source of truth for dashboard, presenter, and skill
- strong visual storytelling without turning the dashboard into a freeform page builder
- compatibility with agentic authoring and API-driven mutation
- a realistic maintenance burden for a small team

It also fits the strongest evidence:

- TED/TEDx guidance points toward fewer words, one idea per frame, strong imagery, and clear visual hierarchy
- Duarte guidance points toward visual systems and story structure, not ad hoc deck cleanup
- Anthropic and OpenAI guidance points toward composable systems, explicit instructions, and eval loops rather than uncontrolled complexity

## Key Design Decisions

### Q1: Should we replace the current schema-driven presenter with a full slide tool? — RESOLVED

**Decision:** No. Keep the schema-driven presenter as the main system.

**Rationale:** The current agenda + scene + block model is the right runtime backbone for shared ids, API mutation, workshop resets, localization, and facilitator-skill interoperability. Replacing it with freeform slides would fracture the source of truth and make agentic editing much harder.

**Alternatives considered:**

- Full replacement with a general slide framework
  - rejected because it would create a second authoring system and weaken runtime consistency

### Q2: Is the current problem mostly code or content? — RESOLVED

**Decision:** Mostly content and content-system quality, with a secondary presenter visual-language gap.

**Rationale:** The schema already supports richer blocks including images, quotes, callouts, and link lists, but the canonical blueprint uses zero image blocks and very few richer editorial blocks. The renderer also still renders most content in a uniform "rounded card on dark panel" style, which compresses visual hierarchy.

**Alternatives considered:**

- "Import is stale"
  - rejected as the primary diagnosis because imported instances simply mirror the thin canonical blueprint
- "Renderer cannot do rich content"
  - rejected as the primary diagnosis because the renderer already supports more than the blueprint currently uses

### Q3: How should we increase richness without overwhelming facilitators? — RESOLVED

**Decision:** Split scene authoring into three tiers.

**Rationale:** Not every workshop moment needs the same treatment. Most scenes should be high-quality structured editorial scenes. Only a handful should become premium narrative compositions.

**Alternatives considered:**

- make every scene equally elaborate
  - rejected because facilitators need speed and clarity during live operation
- keep everything flat and utilitarian
  - rejected because the workshop is also a room experience and a teaching artifact

### Q4: What should the three tiers be? — RESOLVED

**Decision:**

- Tier 1: `operational scenes`
  - participant-safe orientation, milestone, checkpoint, and transition scenes
  - optimized for fast scanning on room screens and mobile mirrors
- Tier 2: `editorial keynote scenes`
  - richer story-led scenes for opening, Context is King, demo framing, rotation, and reveal/reflection
  - use stronger imagery, pull quotes, comparison layouts, and more deliberate composition
- Tier 3: `immersive narrative scenes`
  - only for a small number of showpiece moments
  - may use reveal.js-style staged animation or a similar web-native composition approach

**Rationale:** This preserves coherence while making room for high-impact moments that deserve more than static cards.

### Q5: What should be added to the block system next? — RESOLVED

**Decision:** Add blocks that support editorial presentation patterns directly.

**Recommended next block families:**

- `full-bleed-image`
- `image-with-caption`
- `two-column-argument`
- `before-after`
- `stat-highlight`
- `quote-with-portrait`
- `timeline`
- `comparison-table`
- `principles-grid`
- `code-window`
- `diagram`
- `speaker-note-fragment`
- `source-strip`

**Rationale:** The current taxonomy is too narrow for high-end conference-style storytelling. It handles structure, but not enough visual narrative patterns.

### Q6: How should content be authored? — RESOLVED

**Decision:** Build a repo-native content production pipeline instead of relying on manual dashboard editing.

**Pipeline shape:**

1. repo-native long-form sources remain the deep content authority
2. curated structured scene packs become canonical blueprint content
3. asset manifests provide image paths, license/source metadata, alt text, and recommended usage
4. skill/API workflows generate draft scenes from source materials
5. human review approves high-visibility blueprint scenes before publish-back

**Rationale:** This matches the workshop doctrine. Important content should survive in the repo and be regenerable, not live only in runtime state.

### Q7: Which external deck/composition library is the best fit for premium scenes? — RESOLVED

**Decision:** Prefer reveal.js as the first serious candidate for premium scene compositions. Keep Marp as an optional authoring/export aid, and reserve Motion Canvas for rare cinematic explainers.

**Rationale:**

- reveal.js is directly web-native, supports speaker notes, staged fragments, and auto-animate, and maps well to HTML/CSS-first storytelling
- Marp is excellent for fast authored decks and export, but weaker as the primary live runtime for richly interactive workshop scenes
- Motion Canvas is powerful but too heavyweight for the core workshop-content loop
- Slidev is compelling, but adopting a Vue-centric presentation layer into a Next.js presenter stack adds unnecessary system complexity right now

## Open Questions

- Do we want premium narrative scenes rendered inside the existing presenter route, or linked as dedicated immersive sub-routes?
- How much of the visual asset library should be public-safe and versioned in the repo versus generated or injected per private workshop instance?
- What is the review standard for external imagery, screenshots, and quotes, especially for copyright and attribution?
- Should blueprint scene authoring stay in one JSON source, or move to per-phase content files that compile into the canonical agenda artifact?
- What exact localization strategy should be used for images containing embedded text?
- Which workshop moments deserve premium scenes first: opening, Context is King, Codex demo, rotation handoff, or reveal/reflection?

## Out of Scope

- building a general-purpose slide editor inside the dashboard
- allowing arbitrary facilitator-authored HTML/JS for every scene
- replacing agenda ownership with deck-file ownership
- solving all workshop copy quality in one pass without a reusable pipeline

## Next Steps

- Create a `$plan` for a three-track implementation:
  - Track A: blueprint and source-content redesign
  - Track B: presenter visual system and new block taxonomy
  - Track C: asset pipeline, rights metadata, and skill-driven authoring flow
- Prioritize a first "signature scene pack" for the highest-impact workshop moments before redesigning every agenda item
- Add visual/content eval criteria for presenter scenes so new blueprint content is judged on clarity, scanability, sourcing, and visual hierarchy instead of taste alone
- Consider a future `$compound` once the first rich-content pipeline and scene system are proven in practice
