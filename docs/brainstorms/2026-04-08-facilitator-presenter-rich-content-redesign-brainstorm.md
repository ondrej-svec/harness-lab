---
title: "Facilitator Presenter Rich Content Redesign"
type: brainstorm
date: 2026-04-08
participants: [Ondrej, Codex]
related:
  - /Users/ondrejsvec/projects/Bobo/harness-lab/docs/brainstorms/2026-04-08-facilitator-room-screen-and-presenter-flow-brainstorm.md
  - /Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/admin/instances/[id]/presenter/page.tsx
  - /Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-blueprint-agenda.json
  - /Users/ondrejsvec/projects/Bobo/harness-lab/content/talks/context-is-king.md
  - /Users/ondrejsvec/projects/Bobo/harness-lab/content/talks/codex-demo-script.md
  - /Users/ondrejsvec/projects/Bobo/harness-lab/content/facilitation/master-guide.md
---

# Facilitator Presenter Rich Content Redesign

## Problem Statement

The new presenter flow solved the routing and control-plane problem, but it does not yet solve the facilitator-support problem.

Right now the projected experience is too thin, too generic, and too operational:

- opening moments do not feel clearly launchable or intentionally designed
- scene cards look too similar to passive metadata, so affordance is weak
- room scenes contain too little substance compared with the actual workshop material already in the repo
- the projected chrome leaks facilitator-oriented runtime facts that do not help the room
- the demo flow is not rich enough to carry a live teaching moment
- scene navigation exists, but there is not enough meaningful content to navigate through

The real problem is not "make the current slides longer."

The real problem is:

- the presenter system needs a richer content model that can carry real workshop teaching material
- the room-facing surface needs projection-safe chrome rules rather than generic dashboard facts
- agenda items need to feel like presenter packs, not isolated one-card scenes
- the facilitator needs a room surface that can carry framing, demo cues, screenshots, quotes, links, checkpoints, and transitions without leaving the workflow

Success means:

- the opening and shared moments feel intentionally designed, not placeholder
- the facilitator can actually teach from the room screen instead of just using it as a title card
- the room sees only information that helps the current teaching moment
- presenter content feels visibly derived from the real workshop method and repo content
- each agenda segment can carry a small but meaningful sequence of room scenes

## Context

### What the current implementation proves

The current feature already proved a few important things:

- presenter mode belongs in facilitator admin
- agenda-driven room flow is viable
- multiple scenes per agenda item are useful
- blueprint defaults plus instance overrides is the right storage shape

That work should be kept.

### What the current implementation gets wrong

The current presenter implementation in [`dashboard/app/admin/instances/[id]/presenter/page.tsx`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/admin/instances/[id]/presenter/page.tsx) is still basically a generic shell around a thin scene payload:

- one title
- one body
- optional CTA
- generic metric tiles

The current blueprint scene model in [`dashboard/lib/workshop-blueprint-agenda.json`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-blueprint-agenda.json) is likewise too narrow:

- `title`
- `body`
- `ctaLabel`
- `ctaHref`

That schema cannot express:

- screenshots
- quotes
- richer step-by-step demo cues
- multiple content regions
- curated links
- visual comparisons
- facilitator note separation
- "show this, then this, then switch to participant view" style teaching flow

### What the repo already contains but the presenter does not yet use

The workshop content is already richer than the presenter system:

- [`content/talks/context-is-king.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/content/talks/context-is-king.md) has the core reframing line, a meaningful quote, micro-exercise framing, and a substantial thesis list
- [`content/talks/codex-demo-script.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/content/talks/codex-demo-script.md) already defines a concrete demo sequence plus fallbacks
- [`content/facilitation/master-guide.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/content/facilitation/master-guide.md) already has milestone boards, facilitator prompts, intermezzo structure, rotation instructions, and reflection frames

So the gap is not "we do not know what to say."

The gap is that the presenter model cannot yet carry what we already know.

### External grounding

External facilitation guidance supports a richer but still disciplined presenter model:

1. Participatory live coding is stronger than static code-on-slides for programming instruction, but it works best when the supporting projected surface is legible, paced, and structured.
   Source: https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1008090

2. The projection should reduce distraction: large, simple visuals, no irrelevant chrome, and sometimes a second complementary visual surface.
   Sources:
   - https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1008090
   - https://preview.carpentries.org/instructor-training/instructor/aio.html

3. Instructors benefit from a split between the projected teaching machine and the private command center or notes view.
   Source: https://carpentries.org/blog/2020/04/plan-map-live-coding-workshop/

Inference from these sources:

- the room screen should support live teaching, not replace it
- projected scenes should carry complementary visuals and structure
- projection chrome should be intentional and minimal
- richer scene support is justified, but a full presentation product still is not

## Chosen Approach

Keep the agenda-driven presenter system, but redesign it as `presenter packs` built from `rich scene blocks`.

Core shape:

1. each agenda item owns an ordered presenter pack
2. each pack contains multiple room scenes
3. each room scene is composed from structured content blocks, not just one title/body string
4. facilitator notes are modeled separately from room content
5. room chrome is controlled by scene preset, with almost all operational metrics hidden by default
6. participant walkthrough remains one valid scene type, but it becomes one scene inside a richer teaching sequence
7. blueprint packs hold the reusable workshop method, while instances can override, reorder, disable, or add scenes

This is not a full slide editor.

It is a structured presenter system that can actually carry the workshop.

## Why This Approach

This keeps what was correct in the first version while fixing what makes it feel weak in use.

It optimizes for:

- facilitator usefulness on the day
- reuse of existing workshop content
- projection-safe design
- strong agenda alignment
- agent-editable structured content

It avoids the two bad extremes:

- a generic participant mirror that cannot carry teaching moments
- a heavyweight freeform slide-builder that becomes its own product

## Key Design Decisions

### Q1: Should agenda items still be the top-level presenter unit? — RESOLVED

**Decision:** Yes, but the unit should be a `presenter pack`, not a single thin scene.

**Rationale:** The agenda is still the right outer skeleton. The problem is not agenda coupling. The problem is that each agenda item currently has too little internal structure.

**Alternatives considered:** Freeform deck outside the agenda was rejected because it weakens runtime coherence. Single-scene agenda items were rejected because they cannot carry real teaching flow.

### Q2: Should presenter content stay as plain title/body strings? — RESOLVED

**Decision:** No. Move to a structured block model.

**Rationale:** The current schema cannot carry screenshots, quotes, milestone boards, step sequences, or curated links. A richer content model is the minimum needed to express the workshop material already in the repo.

**Alternatives considered:** Longer markdown blobs were considered but rejected as too weak for layout control and too hard to make projection-safe consistently.

### Q3: What block types should exist on day one? — RESOLVED

**Decision:** Start with a small but expressive set:

- `hero` for one strong framing message
- `rich-text` for short explanatory copy
- `bullet-list` for theses or reminders
- `quote` for key lines
- `steps` for demo flow or handoff instructions
- `checklist` for checkpoints and milestone boards
- `image` for screenshots or diagrams
- `link-list` for curated resources or demos
- `callout` for one emphasized principle or caution
- `participant-preview` for live participant walkthrough scenes

**Rationale:** These blocks cover the material already present in the repo without committing to an open-ended page builder.

**Alternatives considered:** Arbitrary component registry was rejected as too open-ended for day one.

### Q4: Should facilitator notes and room content be the same field? — RESOLVED

**Decision:** No. Separate them explicitly.

**Rationale:** The room should see concise, high-signal content. The facilitator may need prompts, reminders, or fallback notes that should not be projected. This also supports a future second-device notes view without changing the content model again.

**Alternatives considered:** Single shared content field with "hidden" annotations was rejected as too error-prone.

### Q5: Should generic operational facts appear on the room screen by default? — RESOLVED

**Decision:** No. Room chrome should be preset-based and minimal by default.

**Rationale:** Hidden rotation state, team count, and similar admin facts are not inherently useful to the room and can actively cheapen the projected surface. Show them only when the scene explicitly calls for them.

**Alternatives considered:** Keep current metrics tiles globally visible. Rejected because this optimizes for dashboard completeness, not facilitation quality.

### Q6: Should the system support screenshots, quotes, and links as first-class content? — RESOLVED

**Decision:** Yes.

**Rationale:** These are not optional embellishments. They are core support material for teaching on the spot, especially when a demo needs a fallback or when the facilitator wants to anchor the room around one exact principle, artifact, or next step.

**Alternatives considered:** "Just switch away to docs or browser tabs when needed" was rejected because it reintroduces the fragmented operating flow the presenter system was meant to remove.

### Q7: How should the control-room UX change? — RESOLVED

**Decision:** Scene navigation needs stronger affordance and clearer action language.

**Rationale:** If clicking "Úvodní framing" does not feel obviously actionable, the control room is failing at its most basic job. Scene items should read like buttons or launchable cards, not like passive metadata labels. The UI needs explicit "show in room", "next scene", and "jump to scene" semantics.

**Alternatives considered:** Keep the current subtle chip/list treatment. Rejected because it already failed in real use.

### Q8: Should the redesign derive content from existing workshop material rather than inventing new presenter copy? — RESOLVED

**Decision:** Yes. Rebuild the opening, Context is King, demo, milestone, rotation, and reflection packs directly from the repo’s existing facilitation and talk content.

**Rationale:** The workshop method is already defined. The presenter surface should surface and structure it, not paraphrase it down into weaker generic cards.

**Alternatives considered:** Write new, shorter presenter-only copy from scratch. Rejected because it would duplicate content and likely weaken it.

## Proposed Content Model

At a conceptual level:

- `Agenda item`
  - `Presenter pack`
    - `Scene`
      - `room blocks[]`
      - `facilitator notes[]`
      - `chrome preset`
      - `scene intent`

Suggested `scene intent` values:

- `framing`
- `teaching`
- `demo`
- `walkthrough`
- `checkpoint`
- `transition`
- `reflection`

Suggested `chrome preset` values:

- `minimal`
- `agenda`
- `checkpoint`
- `participant`
- `custom`

Interpretation:

- `minimal` shows only the content and maybe a tiny agenda breadcrumb
- `agenda` keeps light orientation visible
- `checkpoint` allows a milestone or countdown treatment
- `participant` uses the participant-derived walkthrough shell
- `custom` is escape hatch, not the default

## What the Current Packs Should Probably Become

### Opening pack

Not one card. Likely 3 scenes:

1. strong opening framing line
2. what today is and is not
3. what the afternoon rotation will test

### Context is King pack

Likely 4 to 6 scenes:

1. the main reframing quote
2. a short thesis stack
3. the micro-exercise framing
4. the demo steps
5. fallback or comparison screenshot scene
6. participant walkthrough

### Build checkpoint pack

Should feel like a visible room board, not a prose paragraph:

1. milestone board
2. what facilitators keep asking
3. what "evidence over vibes" means

### Rotation pack

Should explicitly teach the room how to behave:

1. no verbal handoff
2. first 10 minutes read only
3. what to read first
4. frustration as signal

### Reflection pack

Should visibly scaffold the room discussion:

1. `1-2-4-All` questions
2. `W3` frame
3. examples of signal types we want to hear

## Open Questions

- How much freeform markdown should still be allowed inside `rich-text` before structure is lost?
- Should images be repo-managed assets, instance-local uploads, or both?
- Do links on the room screen need a QR or short-link treatment for participants?
- Should facilitator notes be visible only in admin, or also in a separate notes view?
- How much visual variation should scene presets allow before consistency breaks down?
- Should some shared scenes support dual-mode rendering: room version and facilitator-notes version?

## Out of Scope

- a generic slide authoring product
- arbitrary drag-and-drop page building
- animation-heavy presentation tooling
- replacing live demos with passive slideware
- projecting facilitator operational state by default

## Next Steps

- Update the presenter brainstorm lineage to explicitly mark the current implementation as a tracer bullet and this redesign as the next product-level direction.
- `$plan` a redesign around presenter packs, rich scene blocks, chrome presets, and stronger control-room affordances.
- Use the existing talk and facilitation docs as source material for the first rich packs instead of inventing new copy.
