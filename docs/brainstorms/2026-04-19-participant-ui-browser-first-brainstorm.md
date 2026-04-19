---
title: "Participant UI Browser-First Product Shape"
type: brainstorm
date: 2026-04-19
participants: [ondrej]
related:
  - docs/plans/2026-04-19-feat-recommended-tooling-catalog-and-surface-alignment-plan.md
  - docs/brainstorms/2026-04-16-harness-lab-product-shape-and-participant-management-brainstorm.md
  - docs/reviews/2026-04-19-participant-surface-proof-slice-review.md
  - docs/dashboard-surface-model.md
  - workshop-blueprint/control-surfaces.md
  - workshop-blueprint/day-structure.md
  - content/facilitation/master-guide.md
  - workshop-skill/SKILL.md
  - workshop-skill/reference.md
  - workshop-skill/install.md
  - harness-cli/README.md
---

# Participant UI Browser-First Product Shape

## Problem Statement

Harness Lab can no longer treat the participant UI as a thin phase/status page while expecting the CLI and `workshop` skill to carry the real participant operating path.

In real company workshops and hackathons, browser access is the only guaranteed surface. Some participants will not be able to use the CLI or the skill at all. Others may work solo, in pairs, or as part of a loose team of four while still keeping separate repos. The participant UI therefore has to become a first-class workshop operating surface that:

- tells each participant what to do next without ambiguity
- provides enough working materials and reference support to continue without CLI/skill success
- supports both individual flow and lightweight collaboration
- captures meaningful workshop residue without turning into a noisy team-status app

## Context

What already exists:

- `workshop-blueprint/control-surfaces.md` already states that the participant surface must be sufficient to complete the workshop and that the skill/CLI are optional accelerators, not prerequisites.
- `docs/dashboard-surface-model.md` already expects the participant surface to expose briefs, challenge cards, workshop reference links, learner-kit artifacts, repo/starter access, and fallback guidance.
- `workshop-skill/SKILL.md` and `workshop-skill/reference.md` already encode a broad participant support model: orientation, setup, briefs, challenges, resources, gallery, follow-up, and repo analysis.
- The current dashboard participant implementation still behaves mostly like a room/status surface: current phase, team cards, room notes, and Build Phase 1 proof-slice guidance.
- The workshop method still values continuation pressure and intermezzo ritual, but `content/facilitation/master-guide.md` and `workshop-blueprint/day-structure.md` also show that intermezzos are explicit retrieval-and-sharing rituals, not continuous project management.

Constraints discovered during brainstorming:

- participants will access the participant UI individually on their own laptops and phones, not from one shared projected-only experience
- the Tuesday hackathon variant should default to preserving flow, not forcing repo handoff logistics that may be too flimsy in practice
- continuation pressure still matters pedagogically, but it must become an optional facilitation mode, not a hard dependency of the participant product
- participants are unlikely to maintain continuous shared notes unless the ritual explicitly asks for short capture at the right moment

## Chosen Approach

Adopt a **browser-first participant home** that becomes the stable participant operating surface across the day.

The UI should use one calm, layered participant home with three persistent top-level sections:

- `Next`
- `Build`
- `Reference`

These sections stay in the same order throughout the day. Phase changes only change emphasis and content priority, not the participant's navigation model.

The surface should also include a separate **live checkpoint feed** for short structured participant captures. That feed is chronological, provenance-rich, and filterable, but distinct from the evergreen reference library.

The product rule is:

- browser-first is the guaranteed path
- CLI and skill remain strongly recommended accelerators
- workshop progression must still make sense without them

## Why This Approach

This approach optimizes for:

- **clarity:** one obvious next move is always dominant
- **resilience:** participants can progress even when local setup fails
- **transferability:** the same workshop works for solo, pair, and loose-team formats
- **product coherence:** stable sections teach the participant model quickly
- **progressive disclosure:** participants see what they need now, while deeper material stays reachable without crowding the home

Rejected alternatives:

- **Thin phase-only participant surface.** Rejected because it leaves too much participant support trapped in the CLI/skill path.
- **Dense dashboard/cockpit home.** Rejected because participants need calm orientation, not a room-control shell.
- **Continuous collaboration/status app.** Rejected because it assumes behavior people usually do not sustain and turns the surface into noise.
- **Mandatory continuation-handoff operating model.** Rejected for this product slice because the real workshop variant must preserve flow by default and support continuation opportunistically.

## Subjective Contract

- Target outcome: the participant opens the page and immediately knows what to do next, where the working materials live, and where to go for support without feeling blocked or overwhelmed.
- Anti-goals:
  - phase barriers with no real participant support behind them
  - CLI-first or skill-first emotional framing
  - dense tiles competing for attention on first load
  - a fake collaboration app that expects constant manual upkeep
  - an uncurated marketplace of tools and links
- References:
  - `docs/reviews/2026-04-19-participant-surface-proof-slice-review.md`
  - `workshop-blueprint/control-surfaces.md`
  - `workshop-skill/reference.md`
- Anti-references:
  - Kanban-like participant tracking surfaces
  - LMS-style “course portal” framing
  - a room-wide noisy social feed without structure
- Tone or taste rules:
  - calm, not dense
  - product-legible, not experimental
  - mobile-first without becoming mobile-only
  - browser path normalized, not apologetic
- Rejection criteria:
  - the first screen does not answer “what do I do now?”
  - the home gives equal visual weight to too many blocks
  - CLI/skill setup reads as a prerequisite rather than an accelerator
  - live participant capture degrades into an unstructured chat-like stream

## Preview And Proof Slice

- Proof slice: Build Phase 1 participant home with `Next / Build / Reference` plus one chronological checkpoint feed module
- Required preview artifacts:
  - participant-home layout preview for desktop and mobile
  - navigation and information-architecture preview
  - chronological checkpoint-feed preview with provenance and filters
  - reference-layer preview showing curated defaults vs deeper exploration
- Rollout rule:
  - validate the Build Phase 1 slice first
  - if the hierarchy holds, expand the same model across later phases rather than inventing a second navigation pattern

## Key Design Decisions

### Q1: What is the participant UI primarily for? — RESOLVED
**Decision:** The participant UI is a first-class workshop operating surface equal in importance to the CLI/skill path, not a fallback-only shell.
**Rationale:** Browser access is the only guaranteed path across real workshop environments. The participant surface must stand on its own.
**Alternatives considered:** Treating the UI as a thin orientation layer over a CLI/skill-first workshop was rejected because it fails in the exact environments this workshop must support.

### Q2: What workshop format should the participant UI assume? — RESOLVED
**Decision:** Design for individuals working on their own devices, sometimes solo, sometimes in pairs, sometimes within a loose team of four, potentially across separate repos.
**Rationale:** This matches the most realistic operating mode surfaced during brainstorming and avoids overfitting to one-shared-repo assumptions.
**Alternatives considered:** Assuming one shared team repo as the default was rejected because the upcoming hackathon variant may not work that way.

### Q3: What should the participant home optimize for on first load? — RESOLVED
**Decision:** Optimize for one obvious next move rather than a dense overview.
**Rationale:** Participants need quick operational clarity more than broad situational awareness. The proof-slice review already supports this hierarchy.
**Alternatives considered:** A denser dashboard-style overview was rejected because it would increase cognitive load and bury the main action.

### Q4: What is the right top-level information architecture? — RESOLVED
**Decision:** Use three persistent sections: `Next / Build / Reference`.
**Rationale:** These labels are the clearest and most durable. They explain the model without product-jargon flourish and work well on both phone and laptop.
**Alternatives considered:** `Now / Materials / Library`, `Now / Workbench / Library`, and `Next Move / Working Set / Field Guide` were considered and rejected in favor of the clearer set.

### Q5: How should workshop flow vs continuation pressure be handled? — RESOLVED
**Decision:** Preserve flow by default; support continuation-style swaps as an optional facilitation mode when the room can support them.
**Rationale:** This keeps the workshop robust in real conditions while preserving the pedagogical value of continuation when it is truly workable.
**Alternatives considered:** Mandatory handoff/rotation as the primary product model was rejected because it is too fragile for the identified Tuesday variant.

### Q6: How much collaboration context belongs on the home screen? — RESOLVED
**Decision:** Show minimal social context on the home by default: current brief plus compact working-mode context such as solo, pair, or team.
**Rationale:** Participants need orientation, but a heavier collaboration panel would add noise and imply continuous social coordination work.
**Alternatives considered:** Hiding social context completely was rejected because participants still need quick orientation; making it a major home block was rejected because it would crowd the primary action hierarchy.

### Q7: How should CLI and skill guidance appear? — RESOLVED
**Decision:** Present CLI/skill setup as a prominent secondary accelerator, not at the same level as the browser-first path and not as a prerequisite.
**Rationale:** The workshop still benefits from promoting the local path, but the UI must not emotionally reintroduce dependency on it.
**Alternatives considered:** Equal visual weight with the main path was rejected because it weakens the browser-first contract; burying it deeply was rejected because it remains genuinely valuable.

### Q8: What should the reference layer contain? — RESOLVED
**Decision:** `Reference` should use two layers: a tight curated default set first, then an `Explore more` layer for broader repos, skills, MCPs, plugins, and reading.
**Rationale:** Participants need confidence and curation during the day, but deeper explorers should still be rewarded.
**Alternatives considered:** A flat long list was rejected because it becomes marketplace-like and weakens the workshop path.

### Q9: How should participant capture work? — RESOLVED
**Decision:** The UI should proactively ask for short structured checkpoint captures at the right moments, rather than only preparing discussion prompts.
**Rationale:** Written residue matters more than talk alone, and ritualized prompts are more realistic than expecting continuous note-taking.
**Alternatives considered:** Discussion-prompt-only support was rejected because it produces too little durable residue.

### Q10: Who should see checkpoint captures? — RESOLVED
**Decision:** Checkpoint captures should be visible instance-wide, including facilitator view, but only for short structured checkpoint submissions rather than every possible note.
**Rationale:** Visibility increases the value of capture and supports room-level learning, as long as the capture format stays tight.
**Alternatives considered:** Private-by-default capture was rejected because the user wants more productized shared visibility; publishing all free-form notes was rejected because it would create noise.

### Q11: What is the right feed model for live capture? — RESOLVED
**Decision:** Use one shared chronological feed with provenance and filters, not grouping by phase/checkpoint as the primary visual model.
**Rationale:** Chronological flow is simpler to understand. Phase and team metadata should still exist, but as context and filters.
**Alternatives considered:** Grouping primarily by phase/checkpoint was rejected because it adds structural complexity without strong participant benefit.

### Q12: What metadata and filters should the live feed support? — RESOLVED
**Decision:** Each checkpoint item should carry participant identity, team identity, phase/checkpoint context, and timestamp. The UI should support scope filters such as room-wide, phase, team, and mine.
**Rationale:** This makes the feed product-legible and explorable without turning it into an undifferentiated wall of notes.
**Alternatives considered:** Anonymous or low-context feed items were rejected because they reduce usefulness; mixing stable reference content into the same feed was rejected because it confuses two different jobs.

## Assumption Audit

### Bedrock

- The participant UI must be sufficient without requiring CLI/skill success first.
- The home should optimize for one obvious next move instead of a dense dashboard.
- Stable navigation with phase-aware emphasis is better than reshaping the IA every phase.

### Unverified

- Participants will reliably submit short structured checkpoint captures if asked at the right ritual moments.
- A room-wide chronological checkpoint feed will remain useful instead of becoming noise when filters and provenance are present.
- Participants will understand and use the distinction between browser-first default path and local accelerators without confusion.

### Weak

- Continuous self-maintained team status as an expected behavior. This was rejected during brainstorming because it depends more on wishful process discipline than observed participant behavior.

Proceeding posture:

- proceed with the chosen direction
- explicitly test capture usefulness and feed-noise level in the proof slice rather than assuming they will naturally work

## Contradiction with Prior Decisions

- `workshop-blueprint/day-structure.md` and the broader workshop method still treat continuation pressure as a pedagogical centerpiece. This brainstorm does **not** reject that principle. It changes the participant-product default for this variant: preserve flow first, and use continuation when room conditions make it genuinely viable.
- Earlier participant-surface work emphasized Build Phase 1 as the main proof slice. This brainstorm keeps that rollout rule, but expands the intended product shape to an evergreen participant home rather than a phase-only card.

## Open Questions

1. What exact structured capture schema should the participant submit at checkpoints: one prompt, or a fixed set such as learn / verify / next team should know?
2. How much moderation or facilitator curation should exist before checkpoint items appear on the presenter/room-facing surface?
3. Should the live feed be its own panel on the participant home or a secondary destination within `Build`?
4. How should repo/starter acquisition behave when teams work from separate repos but the brief is shared?
5. How should the UI indicate when the room is operating in solo, pair, or loose-team mode, and who sets that state?
6. What is the best mobile treatment for the chronological feed so it stays useful without dominating the page?
7. How much of the filter model belongs in the first proof slice versus later rollout?

## Out of Scope

- implementing the participant UI
- changing runtime trust boundaries or facilitator auth
- building a general social/collaboration platform
- auto-installing the skill, CLI, plugins, or MCPs from the participant UI
- forcing one workshop structure for every future event variant

## Next Steps

- `$plan docs/brainstorms/2026-04-19-participant-ui-browser-first-brainstorm.md` to turn this into an implementation plan for the participant surface
- align `docs/plans/2026-04-19-feat-recommended-tooling-catalog-and-surface-alignment-plan.md` with this brainstorm as the reference-layer companion
- candidate for `$compound`: the preserve-flow-default / continuation-optional facilitation rule for real-world workshop variants
