---
title: "Facilitator Room Screen and Presenter Flow"
type: brainstorm
date: 2026-04-08
participants: [Ondrej, Codex]
related:
  - /Users/ondrejsvec/projects/Bobo/harness-lab/docs/dashboard-surface-model.md
  - /Users/ondrejsvec/projects/Bobo/harness-lab/docs/facilitator-dashboard-design-rules.md
  - /Users/ondrejsvec/projects/Bobo/harness-lab/docs/workshop-instance-runbook.md
  - /Users/ondrejsvec/projects/Bobo/harness-lab/docs/brainstorms/2026-04-07-workshop-blueprint-and-facilitator-control-model-brainstorm.md
  - /Users/ondrejsvec/projects/Bobo/harness-lab/docs/brainstorms/2026-04-07-facilitator-cockpit-ia-and-ux-redesign-brainstorm.md
  - /Users/ondrejsvec/projects/Bobo/harness-lab/content/facilitation/master-guide.md
  - /Users/ondrejsvec/projects/Bobo/harness-lab/content/talks/codex-demo-script.md
  - /Users/ondrejsvec/projects/Bobo/harness-lab/content/talks/context-is-king.md
---

# Facilitator Room Screen and Presenter Flow

## Problem Statement

Harness Lab currently has a participant surface and a facilitator surface, but it does not yet have an explicit product model for what the room should see during the workshop day.

The real problem is not just "should we add slides?"

The deeper problem is:

- the facilitator needs one calm operating system for the day rather than juggling admin UI, participant UI, docs, talk notes, and possibly a separate deck
- the room needs a clear shared screen that says what matters right now without exposing facilitator controls or forcing improvisation
- the workshop method includes best-practice teaching moments, transitions, demos, and reflections, but there is no first-class place where those room-facing moments live
- agenda edits are already instance-local and runtime-aware, but the projected room flow is not yet attached to that same runtime model

Success means:

- the facilitator always knows what to show next
- there is no separate slide deck to maintain for the normal flow of the day
- the facilitator can switch into participant-facing walkthrough mode instantly
- agenda changes update the room-facing default flow
- the room sees one clear next step during shared moments

## Context

### What exists in the repo

- [`docs/dashboard-surface-model.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/dashboard-surface-model.md) already defines a two-surface model: participant surface for room orientation and facilitator surface for protected operations.
- [`docs/brainstorms/2026-04-07-facilitator-cockpit-ia-and-ux-redesign-brainstorm.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/brainstorms/2026-04-07-facilitator-cockpit-ia-and-ux-redesign-brainstorm.md) already moves `/admin` toward a workspace cockpit plus per-instance control room.
- [`docs/brainstorms/2026-04-07-workshop-blueprint-and-facilitator-control-model-brainstorm.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/brainstorms/2026-04-07-workshop-blueprint-and-facilitator-control-model-brainstorm.md) already established the blueprint/runtime split: reusable workshop design in repo, instance-local changes at runtime.
- [`docs/workshop-instance-runbook.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/workshop-instance-runbook.md) already treats agenda edits as instance-local runtime operations during a live event.
- [`dashboard/lib/workshop-blueprint-agenda.json`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-blueprint-agenda.json) already contains the workshop’s shared and team phases, which is a natural skeleton for room-facing moments.
- [`content/facilitation/master-guide.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/content/facilitation/master-guide.md), [`content/talks/codex-demo-script.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/content/talks/codex-demo-script.md), and [`content/talks/context-is-king.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/content/talks/context-is-king.md) already contain the substance of what the facilitator says during opening, demo, intermezzos, rotation, and reflection.

### What is missing

- no explicit "presenter" or "room-facing" surface
- no model connecting one agenda item to one or more room scenes
- no admin affordance that launches a presenter-safe shared screen from the current agenda item
- no explicit authoring model for best-practice teaching moments as reusable workshop artifacts

### External grounding

External workshop and teaching guidance supports a room-facing model built around visible agenda, explicit transitions, and live demonstration rather than a heavyweight slide engine.

1. Visible agenda helps learners and facilitators stay on track.
   The University of Michigan CRLT recommends sharing a brief visible agenda and notes that a clearly visible agenda helps both facilitator and learners stay on track.
   Source: https://crlt.umich.edu/node/240/printable/print

2. Shared sessions should state goals and expectations explicitly.
   Yale Poorvu advises making expectations concrete and stating the agenda at the start of each session so participants know what they need to do.
   Source: https://poorvucenter.yale.edu/teaching/teaching-how/chapter-2-teaching-successful-section/running-class

3. Programming workshops benefit from participatory live coding rather than static slides.
   The PLOS paper "Ten quick tips for teaching with participatory live coding" argues that live coding slows instruction down, makes thought process visible, supports immediate practice, and is at least as good as static code-on-slides approaches for programming instruction.
   Source: https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1008090

4. Projection design should optimize legibility and reduce distraction.
   The same PLOS guidance and Carpentries instructor guidance emphasize large fonts, simplified environments, notification-free screens, and in some cases a second screen for complementary material.
   Sources:
   - https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1008090
   - https://preview.carpentries.org/instructor-training/instructor/aio.html

5. Workshop transitions should be intentional, not filler.
   SessionLab argues that good transitions are purposeful, support the next activity, and should be designed into the agenda rather than improvised.
   Source: https://www.sessionlab.com/blog/workshop-transitions/

Inference from these sources:

- the room-facing surface should be tied to the agenda
- it should show clear next-step structure
- it should support live demonstration well
- it should include deliberate transition moments
- it should remain visually simple and projection-safe

## Approaches Explored

### Approach 1: Participant mirror only

Use the existing participant surface as the only shared screen and add a quick admin shortcut to launch it.

What it optimizes for:
- speed
- low implementation cost
- coherence with the current participant surface

What it costs:
- weak support for intro, demo, intermezzo, and reflection moments
- no explicit place for facilitator talking points or best-practice teaching beats
- no real answer to "what should I project right now?" beyond participant view

Why it was rejected:
- it solves walkthroughs but not the broader facilitation problem

### Approach 2: Agenda-driven presenter scenes

Attach one or more presenter-safe room scenes to each agenda item and launch them from admin, defaulting to the current agenda item.

What it optimizes for:
- facilitator confidence during the day
- agenda coherence
- reuse of workshop method
- visible best-practice teaching tied to real workshop moments

What it costs:
- requires a first-class content model for scenes
- requires authoring discipline so scene sprawl does not grow uncontrolled

Why it was selected:
- it fits the repo’s blueprint/runtime model
- it supports participant walkthroughs as one scene type without reducing the whole system to participant mirroring
- it provides a home for best-practice teaching, transitions, and room cues

### Approach 3: Embedded slide system inside admin

Build a richer deck-like system with sequencing and slide controls inside the dashboard.

What it optimizes for:
- presentation flexibility
- familiarity for facilitators who expect "slides"

What it costs:
- high product complexity
- risk of becoming a second authoring product
- drift away from the workshop runtime model
- temptation to rebuild keynote/powerpoint semantics when plain web pages are sufficient

Why it was rejected:
- current evidence supports scene-based web pages, not a full slide product

## Chosen Approach

Adopt an agenda-driven presenter scene model.

Core shape:

1. the facilitator launches presenter mode from the admin control room
2. presenter mode opens a separate room-facing surface, not the raw facilitator UI
3. each agenda item can own multiple presenter scenes
4. the current agenda item determines the default room scene
5. the facilitator can jump to a different scene or an earlier agenda item when needed
6. one valid scene type is "participant view" for live walkthroughs
7. presenter scenes are web pages, not a heavyweight slide engine
8. baseline scenes live in the reusable blueprint, while each workshop instance can override or reorder them at runtime

## Why This Approach

This approach best matches both the repo’s architecture and the facilitator’s actual job on the day.

It preserves existing doctrine:

- reusable workshop method stays in the blueprint
- event-specific changes stay in runtime
- facilitator admin remains the control plane
- participant view remains its own surface

It also matches the external evidence:

- keep the agenda visible and actionable
- make transitions intentional
- use live demonstration when teaching workflow
- reduce distraction and maximize legibility on projected screens

Most importantly, it solves a higher-order product problem:

- the facilitator is no longer forced to invent the room flow out of disconnected artifacts

## Key Design Decisions

### Q1: Is the real need "slides" or a room-facing operating surface? — RESOLVED

**Decision:** Build a room-facing operating surface, not a slide product.

**Rationale:** The underlying need is facilitator support and shared-screen clarity during the workshop day. Slides are only one possible implementation pattern, and current evidence does not justify a full slide engine.

**Alternatives considered:** A real deck system was rejected as overbuilt for the current need.

### Q2: Should the projected output be launched from facilitator admin? — RESOLVED

**Decision:** Yes. Presenter mode should be launched from the facilitator control room.

**Rationale:** This keeps one clear control plane for the day and supports the requirement that the facilitator always knows what to show next.

**Alternatives considered:** Separate standalone presenter routes without admin launch were rejected because they fragment the operating flow.

### Q3: Should presenter output be tied to the agenda? — RESOLVED

**Decision:** Yes. The current agenda item should determine the default presenter scene.

**Rationale:** The workshop already has a phase model, runtime agenda editing, and strong dependence on transitions and timing. Presenter flow should follow the same system rather than becoming a parallel deck.

**Alternatives considered:** Freeform manual selection only was rejected as too improvisational for the main path.

### Q4: Can one agenda item have multiple room-facing scenes? — RESOLVED

**Decision:** Yes.

**Rationale:** Shared moments often need multiple sub-scenes such as intro framing, live demo, participant-view walkthrough, checkpoint prompt, or reflection prompt.

**Alternatives considered:** Exactly one scene per agenda item was rejected as too rigid.

### Q5: Where should presenter scenes live? — RESOLVED

**Decision:** Hybrid model: blueprint defaults plus instance-local overrides or reordering.

**Rationale:** This follows the repo’s existing blueprint/runtime split and allows both reuse and event-specific adaptation.

**Alternatives considered:** Blueprint-only was rejected as too rigid. Runtime-only was rejected because it weakens the reusable workshop product.

### Q6: Should best-practice teaching be separate from the agenda or embedded into it? — RESOLVED

**Decision:** Hybrid teaching model. Use a short explicit intro/demo, then attach focused best-practice callouts to later agenda moments.

**Rationale:** Best practices should be taught once explicitly, then reinforced in context during the day.

**Alternatives considered:** Purely embedded teaching was rejected as too implicit. Standalone teaching blocks only were rejected as too disconnected from the live workshop.

## Assumption Audit

Assumption audit for the chosen approach:

- ✓ **Bedrock:** The facilitator needs one operating surface for the workshop day rather than separate admin, participant, and deck tools. Verified by the user’s stated success criteria and by the repo’s move toward a real facilitator control plane.
- ✓ **Bedrock:** Agenda should drive the default room-facing flow. Verified by the existing runtime agenda model and the user’s preference.
- ✓ **Bedrock:** A room-facing scene can be a well-designed web page rather than a true slide engine. Verified by the user’s preference and by external guidance favoring live demonstration and visible agenda over static slide dependence in programming workshops.
- ✓ **Bedrock:** Best-practice teaching should be attached to real workshop moments, not orphaned as a separate artifact. Verified by the current facilitation guide and talk materials.
- ? **Unverified:** The number of sub-scenes per agenda item will stay manageable and not produce authoring sprawl.
- ? **Unverified:** Instance-local overrides will remain disciplined rather than encouraging one-off per-event customization debt.
- ? **Unverified:** The normal workshop day can truly avoid a separate deck once opening/demo/reflection scenes are implemented well.
- ? **Unverified:** Facilitators will benefit from a scene launcher enough that it should be in the primary admin workflow rather than as a secondary utility.
- ✗ **Weak:** Projected workshop content should behave like conventional slides because presenters are used to slides. This is habit, not a demonstrated requirement.

The unverified assumptions justify planning and prototyping, but not a full presentation authoring system.

## Open Questions

- What scene types should exist on day one: `briefing`, `demo`, `participant-view`, `checkpoint`, `reflection`, `break`, `custom`?
- What minimum data model should a presenter scene use?
- Should facilitator notes live beside each scene, behind each scene, or in a split "notes vs room" model?
- Should presenter mode support a second-device notes view or keep day-one scope to one room-facing screen only?
- What is the correct default scene for each current blueprint agenda phase?
- Should intermezzo become an explicit agenda item in the blueprint rather than living only in facilitation guidance?
- Should presenter mode be public-safe by default, or may some scenes assume facilitator auth while still being projection-safe?
- How should instance-local overrides be represented so they are easy to review and reset?
- How should scene navigation work on the day: next/previous, scene list, agenda list, or all three?
- What analytics or logging, if any, matter for presenter-mode usage during a workshop?

## Out of Scope

- final route design
- exact React component inventory
- exact scene schema
- second-screen notes implementation
- remote facilitator collaboration behavior
- final visual design for presenter scenes
- full implementation plan

## Next Steps

- `$plan` to define the presenter-scene architecture, schema, route model, and day-one scope
- map current blueprint agenda phases to proposed scene types and defaults
- define where facilitator notes and room-facing content should live
- decide whether intermezzo belongs as an explicit blueprint agenda item
- prototype the day-one scene launcher and room-facing route before expanding authoring scope
