---
title: "Agenda Scene Surface Split and Lightweight Interaction"
type: brainstorm
date: 2026-04-19
participants: [Ondrej, Codex]
related:
  - ../brainstorms/2026-04-09-workshop-scene-content-richness-and-voice-brainstorm.md
  - ../brainstorms/2026-04-12-brainstorm-workshop-agenda-content-review.md
  - ../plans/2026-04-09-fix-room-safe-presenter-scene-separation-and-opening-reset-plan.md
  - ../plans/2026-04-14-refactor-presenter-scene-density-and-coverage-plan.md
  - ../plans/archive/2026-04-19-refactor-participant-surface-cli-independence-plan.md
  - ../dashboard-surface-model.md
  - ../presenter-rich-scene-authoring.md
  - ../../workshop-blueprint/control-surfaces.md
  - ../../workshop-content/agenda.json
  - ../../dashboard/lib/public-page-view-model.ts
  - ../../dashboard/app/components/participant-live-refresh.tsx
---

# Agenda Scene Surface Split and Lightweight Interaction

## Problem Statement

Harness Lab's current agenda scene system is still carrying a blended assumption that one authored workshop moment can serve the room projection, the participant surface, and the facilitator equally well.

That assumption is now the main quality failure.

The result is not only scene density. It is surface confusion:

- room-facing scenes still carry too much facilitator-thinking and too much participant-instruction detail
- participant content is still too often treated as a mirror of the live agenda instead of a selective support surface
- facilitator-led moments leak onto participant screens even when participants do not need to read those instructions
- the current live-refresh contract is only strong enough for agenda-item changes, not for finer-grained participant moments inside the same item

The user-facing symptom is strongest in `opening`, `talk`, and `demo`, but the pattern exists across the day.

The actual problem to solve is:

> Make the room screen minimal and high-signal by design, move facilitator depth backstage, and make participant content selectively visible only when participants genuinely need it.

Interaction is secondary to that rule. If lightweight interaction is added, it must reinforce the surface split rather than reintroduce blended scenes.

## Context

### What already exists in the repo

- The repo already states a three-surface model:
  - room projection
  - participant surface
  - facilitator support
- The room-safe separation work has already been partially codified in:
  - `docs/dashboard-surface-model.md`
  - `docs/facilitator-agenda-source-of-truth.md`
  - `docs/plans/2026-04-09-fix-room-safe-presenter-scene-separation-and-opening-reset-plan.md`
- Presenter density has already been identified as a real problem in:
  - `docs/plans/2026-04-14-refactor-presenter-scene-density-and-coverage-plan.md`
- The participant surface was recently reframed as a first-class workshop path rather than a CLI-only fallback in:
  - `docs/plans/archive/2026-04-19-refactor-participant-surface-cli-independence-plan.md`

### What the current implementation actually does

Research against the live codebase found three important facts.

1. **Participant scenes already exist as a separate authored track.**

`buildParticipantPanelState()` in `dashboard/lib/public-page-view-model.ts` first looks for a participant-surface scene:

- `scene.enabled && scene.surface === "participant"`

If one exists, that scene's `blocks` become the participant guidance.

2. **But the fallback behavior still leaks agenda-level content onto the participant surface.**

If no explicit participant scene exists, the current code auto-builds fallback participant guidance from the current agenda item:

- hero from agenda title/goal
- bullet-list from checkpoint questions or room summary
- generic participant-preview block

That means facilitator-led agenda moments still bleed onto participant screens even when the product intent says they should not.

3. **The participant surface is live only at agenda-item granularity, not at participant-moment granularity.**

`dashboard/app/components/participant-live-refresh.tsx` polls `/api/event-context/core` every 30 seconds, pauses when hidden, and refreshes on visibility return. But it only refreshes when the current agenda item id changes.

So:

- `opening -> talk` updates
- `opening scene A -> opening scene B` does not reliably update the participant surface

This is too weak if participant content becomes a selectively live workshop surface.

### What prior brainstorms already decided

- `2026-04-09-workshop-scene-content-richness-and-voice-brainstorm.md` intentionally deferred interactive/live components as future work.
- `2026-04-12-brainstorm-workshop-agenda-content-review.md` already identified the participant mirror tension in practice, especially around team formation and presenter/participant divergence.
- The room-safe and scene-density plans already established that projected scenes should not be treated as documents.

### Pre-existing signal mechanisms

The repo already has two useful patterns:

- participant-visible shared room notes on the participant surface
- facilitator-private freeform rotation signals in the admin `Run` flow

This matters because the proposed persistent participant feedback channel should behave more like facilitator-private signals than like a visible room chat.

## Chosen Approach

Treat this as a **systemic surface-contract correction** with a small, intentional interaction layer.

The chosen direction has five parts:

1. **Make room scenes canonical and intentionally minimal.**
   The room-facing scene is not a rich variant with a minimal rendering mode. It is minimal on purpose. The projected beat should carry only what the room needs to see.

2. **Keep facilitator depth backstage.**
   Explanations, timing reminders, fallback moves, nuance, and recovery logic belong in facilitator notes, facilitator runner, or protected control-room support surfaces, not on the projected scene.

3. **Make participant content selective, not mirrored.**
   The participant surface should show only participant-relevant content and only when it changes what participants should understand or do. It should not continuously mirror facilitator choreography.

4. **Drive participant content automatically from the authored workshop moment.**
   The facilitator should not have to manually choose what participants see during the day. The normal path should be automatic. Manual override may exist as a system safety valve, but not as the primary operating model.

5. **Add lightweight interaction as room signal, not as a poll product.**
   When interaction exists, it should remain lightweight:
   - predefined choices only
   - room-first by default
   - optional participant tap-in where show-of-hands is weak
   - anonymous aggregate shown on the room screen
   - no quiz mechanics, no leaderboard, no Kahoot replacement

Alongside that, add a second, distinct feedback pattern:

- **persistent participant feedback**
  - always available on the participant surface
  - freeform
  - intended for blockers and facilitator questions
  - facilitator-private by default
  - selectively promotable into a room-safe note when useful

## Why This Approach

It optimizes for:

- **projection clarity** by making the room scene one clean beat instead of a dense hybrid
- **facilitator support** by preserving nuance backstage instead of deleting it
- **participant usefulness** by showing only what participants actually need
- **operational simplicity** by keeping the participant surface automatic rather than facilitator-operated
- **bounded interaction scope** by treating polls as signals, not as a second product

It rejects two weaker mental models:

- "keep the rich scene and add a minimal variant"
- "keep participant screens as a live mirror of whatever the facilitator is doing"

Both preserve the core problem instead of fixing it.

## Subjective Contract

- Target outcome: a facilitator can project a scene without editing it down in their head; participants can glance at their surface and immediately know whether it matters to them right now.
- Anti-goals: projected scenes that read like notes; participant surfaces that mirror facilitator choreography; freeform participant chat; poll mechanics that feel like quiz software.
- References:
  - existing room-safe separation doctrine in `docs/dashboard-surface-model.md`
  - existing fit contract in `docs/presenter-rich-scene-authoring.md`
  - participant-surface sufficiency direction from the archived 2026-04-19 participant-surface plan
- Anti-references:
  - "everything on every surface"
  - participant instructions shown during fully facilitator-led room beats
  - interaction patterns that demand ongoing manual control from the facilitator
- Tone or taste rules:
  - the room screen should be restrained, authored, and one-glance legible
  - participant content should be action-shaped, not deck-shaped
  - interaction should feel like a workshop signal, not a game layer
- Rejection criteria:
  - if a projected scene still needs facilitator-only explanation visible on-screen, reject
  - if the participant surface still shows facilitator-led choreography by default, reject
  - if the interaction layer starts to resemble Slido/Kahoot, reject
  - if persistent feedback becomes a participant-visible ambient stream, reject

## Preview And Proof Slice

- Proof slice: `opening`, `talk`, and `demo`
- Why this slice:
  - it contains the sharpest current blending of room, participant, and facilitator concerns
  - it will prove whether selective participant visibility actually feels better in live workshop flow
  - it is the place where lightweight room-signal questions are most likely to matter
- Required preview artifacts:
  - a room-facing preview of minimal scenes for the proof slice
  - a participant-surface preview showing selective visibility rather than continuous mirroring
  - a control-room preview showing where facilitator-only detail moves
  - one concrete lightweight poll moment and one persistent feedback moment
- Rollout rule:
  - do not propagate the new pattern across the whole agenda until the proof slice demonstrates that the room beat, participant visibility, and facilitator support all feel cleaner than the current model

## Key Design Decisions

### Q1: Is this primarily a copy-trim problem or a surface-contract problem? — RESOLVED

**Decision:** It is primarily a surface-contract problem.

**Rationale:** The repo already contains separation doctrine, but the authored content and fallback behavior still violate it. Trimming scenes without correcting the surface model would leave the participant mirror and fallback leakage intact.

**Alternatives considered:** A pure scene-density pass. Rejected because density is only the visible symptom.

### Q2: Should the room-facing scene be a minimal variant of a richer authored scene? — RESOLVED

**Decision:** No. The room-facing scene should be authored as minimal on purpose.

**Rationale:** If minimal is only a variant, the rich scene remains the real source of truth and the room surface will continue to accumulate things that "might be useful." The fix is to make the projected beat intentionally narrow.

**Alternatives considered:** Keep rich authored scenes and add a minimal projection mode. Rejected as a weaker, more permissive model.

### Q3: Should participant content continuously mirror the live agenda? — RESOLVED

**Decision:** No. Participant content should be selective.

**Rationale:** Continuous mirroring makes participants read facilitator-led choreography they do not need. The participant surface should show participant-relevant content only when it changes what participants should do or understand.

**Alternatives considered:** Continuous participant mirroring. Rejected as the current weak model.

### Q4: Should participant visibility be manual or automatic? — RESOLVED

**Decision:** Automatic by default.

**Rationale:** The facilitator should not need to run a second cockpit just to keep participant content relevant. Automatic authored behavior should be the default. Manual override may exist only as a safety mechanism.

**Alternatives considered:** Facilitator manually chooses participant content throughout the day. Rejected as operationally too heavy.

### Q5: What kind of interaction belongs in scenes? — RESOLVED

**Decision:** Lightweight room signals only.

**Rationale:** The right scope is a room-first question pattern with optional participant tap-in where honesty or speed matters. This stays compatible with in-room facilitation and avoids building quiz software.

**Alternatives considered:**
- room poll only
- participant tap poll as the main mode
- richer quiz/poll system

The chosen direction is hybrid but room-first.

### Q6: What should participant polls look like? — RESOLVED

**Decision:** Predefined choices only, anonymous aggregate on the room screen.

**Rationale:** Predefined choices are lightweight to author, easy to answer quickly, and easy to aggregate. Anonymous room-visible results improve honesty without social exposure.

**Alternatives considered:** Free-text poll responses. Rejected as harder to author, moderate, and display without scope creep.

### Q7: Is persistent freeform participant feedback in scope? — RESOLVED

**Decision:** Yes, but as a separate pattern from polls.

**Rationale:** This satisfies a different need: blockers and facilitator questions outside the current scene beat. It should not be merged with polls because the jobs are different.

**Alternatives considered:** Fold freeform feedback into the same scene-bound poll mechanic. Rejected because it weakens both patterns.

### Q8: Who should see persistent participant feedback by default? — RESOLVED

**Decision:** Facilitator only, with selective promotion to room-safe notes when needed.

**Rationale:** A blocker/question backchannel is operational. If it becomes participant-visible by default, it turns into ambient room chat. The repo already has a precedent for facilitator-private signals.

**Alternatives considered:** Room-visible by default. Rejected as high-noise and socially distortive.

## Systemic Changes Implied By The Chosen Approach

This brainstorm intentionally treats the work as systemic. The chosen direction implies changes in at least these areas:

1. **Authored workshop content contract**
   - stronger rule for room scenes vs participant scenes vs facilitator support
   - likely elimination or restriction of participant fallback generation from agenda-item summaries

2. **Runtime workshop-moment model**
   - participant visibility needs a more explicit authored/live contract than "current agenda item"
   - automatic participant updates need to follow the right live moment, not only the phase/item id

3. **Participant live-refresh contract**
   - current item-level polling is insufficient for selective participant moments inside the same agenda item

4. **Interaction model**
   - a scene-bound predefined signal/poll concept
   - room-visible aggregate display
   - clear reset/lifecycle behavior for poll state

5. **Participant feedback model**
   - persistent facilitator-private intake for blockers/questions
   - promotion path into room-safe notes when useful

6. **Facilitator control-room support**
   - stronger backstage surface for details removed from projected scenes
   - safe review surface for participant feedback and poll summaries

## Assumption Audit

### Bedrock

- The current repo already distinguishes room projection, participant surface, and facilitator support in doctrine and partially in code.
- Participant scenes already exist as a separate authored track via `surface: "participant"`.
- Current participant fallback guidance still derives from agenda-level content, which is exactly the wrong behavior for facilitator-led beats.
- Current participant live refresh is only item-level and therefore not strong enough for finer-grained selective participant moments.
- Existing product patterns already separate participant-visible room notes from facilitator-private signals.

### Unverified

1. **Automatic participant-moment switching will be good enough most of the time.**
   This is the preferred operational model, but it has not yet been proven in a live workflow that includes selective participant visibility inside one agenda item.

2. **Anonymous aggregate polls will materially outperform show-of-hands in the workshop moments that matter.**
   Strong product hypothesis, but still a hypothesis until tested in the room.

3. **Persistent participant feedback can remain low-noise if restricted to blockers and facilitator questions.**
   Likely, but still depends on good framing, UI cues, and where it lands on the participant surface.

### Weak

4. **"Minimal variant" as an alternate rendering mode would be enough.**
   Rejected. This rests on inertia from the current rich-scene model rather than on the user's actual goal.

## Open Questions

- What is the cleanest authored/runtime unit for automatic participant visibility?
  - separate participant-moment ids
  - scene-linked participant moments
  - agenda-item-local live substate
- Should the participant surface have a visible "this matters now" marker when a participant moment becomes live, or should the change remain ambient?
- What is the smallest acceptable latency for participant-moment updates in-room?
  - current 30s item-level polling is too slow/too coarse for some moments
- What is the lifecycle of a room-signal poll?
  - when it opens
  - whether it auto-closes
  - when it resets
  - whether it is tied to a scene, a participant moment, or an agenda item
- Where should facilitators review participant feedback by default?
  - inline in `Run`
  - agenda-detail support panel
  - separate filtered list
- Should participant feedback support lightweight tagging or categorization from day one, or start as plain text plus timestamp and optional team identity?
- Which proof-slice moments should actually use a poll first?
  - knowledge calibration in opening/talk
  - live room confidence checks
  - workshop-friction checks
- Do any current agenda items need to be split structurally so participant relevance can change within what is currently one item?

## Out of Scope

- Kahoot/Slido replacement
- quizzes, scoring, leaderboards, timers, or game mechanics
- free-text poll responses
- participant-visible persistent chat or comment feed
- facilitator manually operating participant visibility as the normal path
- rebuilding the presenter system into a general slide editor
- solving all implementation details of live-sync transport in this brainstorm

## Next Steps

- `$plan` this brainstorm into a systemic implementation plan that covers:
  - content contract changes
  - runtime live-moment model
  - participant refresh contract
  - lightweight room-signal polls
  - persistent facilitator-private participant feedback
  - proof-slice previews for `opening`, `talk`, and `demo`
- Candidate for `$compound` after implementation: if the new surface split and live participant-moment model works, capture it as reusable workshop-surface doctrine so the repo stops drifting back toward blended scenes.
