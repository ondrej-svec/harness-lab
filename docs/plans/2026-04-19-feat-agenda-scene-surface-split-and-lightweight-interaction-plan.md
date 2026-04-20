---
title: "feat: agenda scene surface split and lightweight interaction"
type: plan
date: 2026-04-19
status: in_review
brainstorm: ../brainstorms/2026-04-19-agenda-scene-surface-split-and-lightweight-interaction-brainstorm.md
confidence: medium
---

# Agenda Scene Surface Split and Lightweight Interaction Plan

**One-line summary:** Correct the workshop surface contract so room scenes become intentionally minimal, participant content becomes selective and automatically live, and lightweight signals fit the room without turning Harness Lab into a poll product.

## Problem Statement

Harness Lab already documents three distinct workshop surfaces:

- room projection
- participant surface
- facilitator support

But the current system still behaves as if one agenda moment can serve all three equally well.

This creates three systemic failures:

1. **Projection drift.** Room scenes still carry too much facilitator depth and too much participant instruction, especially in `opening`, `talk`, and `demo`.
2. **Participant leakage.** The participant surface still falls back to agenda-derived content, which means facilitator-led beats leak onto participant screens even when participants do not need them.
3. **Live-contract weakness.** Participant refresh is currently tied only to agenda-item changes. There is no persisted runtime concept of a finer-grained live workshop moment or live scene, so selective participant visibility cannot be automatic inside one agenda item.

The brainstorm confirmed that the desired end state is not “richer scenes with a minimal mode.” It is a stronger contract:

> The room sees only the essential beat, the facilitator keeps the supporting detail backstage, and participants only see content that matters to them right now.

The same brainstorm also added two interaction requirements:

- scene-bound predefined room-signal polls with anonymous aggregate output
- always-available freeform participant feedback for blockers and facilitator questions, private to facilitators by default

This is therefore a multi-surface product change, not a copy pass.

## Target End State

When this lands, the following should be true:

- room-facing scenes are authored as minimal by design, not rendered as a minimal variant of richer content
- facilitator support remains backstage and is easier to scan because it no longer competes with projection copy
- participant content is selective and agenda-owned, but no longer mirrors facilitator choreography by default
- the runtime has an explicit live-moment contract strong enough to drive participant updates automatically inside a single agenda item
- the participant surface no longer derives fallback guidance from room-oriented agenda summaries except for a deliberately conservative safe fallback
- lightweight room-signal polls can be authored for selected moments using predefined options only
- poll results are anonymous and visible as room aggregate only
- a persistent participant feedback channel is always available for blockers and facilitator questions, but remains facilitator-private unless explicitly promoted to a room-safe note
- the proof slice (`opening`, `talk`, `demo`) demonstrates the pattern before it spreads across the full agenda

## Scope and Non-Goals

### In scope

- workshop-surface contract correction across:
  - workshop-content authoring
  - runtime workshop state
  - participant refresh contract
  - facilitator control-room support
- proof-slice content and preview work for `opening`, `talk`, and `demo`
- a new explicit participant-moment model or equivalent runtime/content contract
- lightweight scene-bound poll definitions and anonymous aggregate display
- persistent facilitator-private participant feedback intake and review flow
- tests, docs, and operational reset guidance needed to keep the new contract durable

### Non-goals

- building a quiz product, Kahoot replacement, or social polling system
- free-text poll responses
- participant-visible persistent chat or comment stream
- making facilitators manually operate participant visibility as the normal workflow
- redesigning the entire participant surface IA in one pass
- rewriting the full workshop agenda before the proof slice works
- building a generic slide editor or second presenter-notes device workflow

## Proposed Solution

Implement the change as four connected system moves, behind a proof-slice gate.

### 1. Introduce an explicit participant-moment contract

The current `presenterScenes` model is not enough because participant relevance can change within one agenda item, while presenter scene choice today is URL-driven and not persisted as live workshop state.

The plan should therefore add an agenda-owned participant-specific contract, most likely as a new `participantMoments` field on agenda items rather than by overloading `presenterScenes` further.

Each participant moment should be able to carry:

- participant-safe blocks
- CTA metadata
- activation semantics
- optional lightweight interaction metadata
- explicit always-available feedback affordance settings where relevant

Backward compatibility should normalize existing participant scenes into the new model during read/import so current content does not break immediately.

### 2. Add a persisted live-moment runtime state

Today the workshop runtime persists the current agenda item, but not a finer-grained live workshop moment.

The plan should add one explicit runtime state object that becomes the source of truth for:

- current agenda item
- current room scene or equivalent room beat id
- current participant moment id
- participant visibility mode (`auto` as default, manual override only as safety path)
- any active lightweight room signal/poll id

This is what makes “participant content updates automatically” real instead of implied.

### 3. Split signal storage from the hot workshop state path

Use the existing rotation-signal precedent:

- authored poll definitions and live-moment pointers may live in workshop content/state
- participant poll responses and persistent freeform participant feedback should use dedicated repositories/APIs rather than inflating the hot `WorkshopState` read/write path

This keeps frequent participant writes from contending with broader workshop-state writes.

### 4. Prove the pattern on one slice before rollout

Apply the new surface contract only to `opening`, `talk`, and `demo` first.

That proof slice must include:

- minimal room scenes
- selective participant moments
- backstage facilitator detail relocation
- one authored room-signal poll moment
- one persistent participant feedback flow

Only after the proof slice passes preview and verification should the pattern spread to the rest of the agenda.

## Subjective Contract And Preview Gate

### Target outcome

- a facilitator can project a scene without mentally subtracting content
- participants can tell in one glance whether the participant surface matters to them right now
- interaction feels like a workshop signal, not a game mechanic
- backstage detail becomes easier to use because it is no longer fighting for room space

### Anti-goals

- a room screen that still reads like notes
- a participant screen that mirrors facilitator choreography all day
- a persistent participant-visible feedback stream
- a poll mechanic that feels like Slido or Kahoot

### References

- `docs/dashboard-design-system.md`
- `docs/dashboard-surface-model.md`
- `docs/dashboard-testing-strategy.md`
- `docs/agent-ui-testing.md`
- `docs/workshop-content-qa.md`
- `docs/facilitator-agenda-source-of-truth.md`
- `docs/presenter-rich-scene-authoring.md`
- `docs/plans/2026-04-09-fix-room-safe-presenter-scene-separation-and-opening-reset-plan.md`
- `docs/plans/2026-04-14-refactor-presenter-scene-density-and-coverage-plan.md`
- `docs/plans/archive/2026-04-19-refactor-participant-surface-cli-independence-plan.md`

### Anti-references

- “everything on every surface”
- participant instructions shown during fully facilitator-led beats
- manual facilitator switching as the normal way participant content changes
- any interaction design that requires leaderboard, quiz flow, or room-visible personal responses

### Tone or taste rules

- room-facing scenes should be one-glance and restrained
- participant content should be action-shaped, not deck-shaped
- facilitator support should read like an operating guide, not like a hidden duplicate of the room scene
- interactive moments should feel native to an in-room workshop

### Representative proof slice

- `opening`
- `talk`
- `demo`

### Rollout rule

- no full-agenda propagation until the proof slice passes preview review, contract review, and verification review

### Rejection criteria

- if a projected scene still requires facilitator-only text on the screen, reject
- if participant visibility still defaults to mirroring facilitator-led choreography, reject
- if the interaction layer starts to behave like a quiz or chat product, reject
- if the runtime model cannot explain exactly why the participant surface changed, reject

### Required preview artifacts

- room-facing proof-slice preview
- participant-surface proof-slice preview
- control-room backstage preview
- one poll preview with aggregate result state
- one persistent feedback preview from participant input through facilitator review

Reviewers:

- Ondrej for product and facilitation fit
- maintainership pass against `docs/dashboard-surface-model.md` and trust-boundary docs

Failure rule:

- if the proof slice still feels blended or operationally noisy, stop and return to planning before broader implementation

## Implementation Tasks

### Phase 0 — Proof-slice contract and preview gate

- [x] **0.1 Create a proof-slice contract memo inside this plan’s execution slice.**
  Define the exact product vocabulary for:
  - room scene
  - participant moment
  - backstage facilitator support
  - room signal poll
  - participant feedback
- [x] **0.2 Produce preview artifacts for `opening`, `talk`, and `demo`.**
  Show:
  - minimal room scenes
  - selective participant moments
  - backstage detail locations
  - one poll
  - one feedback flow
- [x] **0.3 Review the proof slice against the dashboard design-system rules.**
  Check the previews against:
  - `docs/dashboard-design-system.md`
  - `docs/dashboard-surface-model.md`
  and confirm each surface still answers its dominant question quickly.
- [x] **0.4 Review the preview gate before implementation propagates.**
  Ondrej signs off on whether the proof slice actually feels cleaner than the current system.

### Phase 1 — Runtime and content-model foundations

- [x] **1.1 Decide and document the runtime/content model.**
  Choose the exact shape for:
  - `participantMoments` or equivalent
  - persisted live-moment state
  - optional manual override path
  - active room-signal metadata
- [x] **1.2 Extend the shared workshop types.**
  Update `dashboard/lib/workshop-data.ts` and related bilingual/runtime types to support:
  - explicit participant moments
  - live-moment state
  - lightweight interaction definitions
- [x] **1.3 Add normalization/migration behavior for existing instances.**
  Ensure current agenda imports and legacy runtime states:
  - normalize existing participant scenes
  - preserve room-scene behavior
  - do not silently discard instance-local state
- [x] **1.4 Update workshop-content generation and verification seams.**
  Ensure authored content can carry the new participant and interaction structures without drifting across generated outputs.
- [x] **1.5 Update doctrine docs in the same slice.**
  At minimum:
  - `docs/dashboard-design-system.md` when recurring UI patterns change
  - `docs/dashboard-surface-model.md`
  - `docs/facilitator-agenda-source-of-truth.md`
  - any ADR or boundary doc required by the final state-model choice

### Phase 2 — Live-moment sync and participant-surface contract

- [x] **2.1 Introduce persisted live-moment reads/writes in the workshop runtime.**
  The runtime must be able to explain:
  - what is live for the room
  - what is live for participants
  - whether participant mode is auto or manually pinned
- [x] **2.2 Make presenter progression update live-moment state, not just URLs.**
  Ensure facilitator actions that move the room also update the participant-relevant live contract when appropriate.
- [x] **2.3 Replace agenda-derived participant fallback guidance with a conservative safe fallback.**
  Remove the current behavior that auto-builds participant guidance from room-oriented agenda summaries except where a neutral fallback is explicitly justified.
- [x] **2.4 Update participant refresh behavior.**
  Replace the current item-id-only refresh trigger with a more precise live-moment fingerprint or equivalent.
- [x] **2.5 Reassess polling cadence and load.**
  Decide acceptable latency for participant-moment changes in-room and document why the chosen refresh approach is operationally safe.

### Phase 3 — Proof-slice authored content and backstage redistribution

- [x] **3.1 Rewrite `opening` under the new contract.**
  Minimal room scenes, selective participant moments, facilitator detail moved backstage.
- [x] **3.2 Rewrite `talk` under the new contract.**
  Keep the narrative spine, but split participant relevance from presenter exposition cleanly.
- [x] **3.3 Rewrite `demo` under the new contract.**
  Ensure participant moments show only what participants need, not facilitator-led walkthrough detail.
- [x] **3.4 Update control-room support surfaces for the proof slice.**
  Ensure removed projected detail is available backstage in a fast, usable form.
- [x] **3.5 Re-run content generation and integrity checks for the proof slice.**

### Phase 4 — Lightweight room-signal polls

- [x] **4.1 Define the authored poll schema.**
  Predefined options only, anonymous aggregate only.
- [x] **4.2 Define poll lifecycle.**
  Decide and implement:
  - how a poll opens
  - how it closes
  - how it resets
  - whether it is tied to participant moment or room moment
- [x] **4.3 Add poll response storage outside the hot workshop state path.**
  Follow the rotation-signal precedent for dedicated repositories/APIs.
- [x] **4.4 Add participant poll input UI.**
  Keep it optional and scene-bound.
- [x] **4.5 Add room-facing aggregate result rendering.**
  Anonymous aggregate only, no participant identity exposure.
- [x] **4.6 Add facilitator review/visibility for active and completed poll states.**

### Phase 5 — Persistent participant feedback

- [x] **5.1 Define participant feedback data contract.**
  Scope to blockers and facilitator questions.
- [x] **5.2 Add participant feedback storage and API outside the hot workshop state path.**
- [x] **5.3 Add always-available participant feedback UI.**
  Keep it lightweight and distinct from check-ins.
- [x] **5.4 Add facilitator-side review workflow.**
  Make feedback visible where facilitators actually work, likely in `Run` or the current-moment support pane.
- [x] **5.5 Add selective promotion into room-safe notes.**
  Promotion should write through an existing room-note/ticker path rather than inventing a second announcement mechanism.

### Phase 6 — Verification, rollout, and instance operations

- [x] **6.1 Add type-level and normalization tests for the new runtime/content contract.**
- [x] **6.2 Add tracer-bullet integration coverage for the new runtime flows.**
  Cover:
  - live-moment reads/writes
  - participant-moment normalization
  - poll submission/storage
  - participant feedback submission/storage
- [x] **6.3 Add participant refresh and live-moment behavior tests.**
  Cover:
  - participant surface follows proof-slice live moments
  - item-internal changes can update participants automatically
  - conservative fallback when explicit participant moment is absent
- [x] **6.4 Add poll and feedback tests.**
  Cover:
  - anonymity
  - facilitator visibility
  - non-chat constraints
- [x] **6.5 Add presenter/participant/control-room proof-slice regression coverage.**
- [ ] **6.6 Run exploratory agent-driven UI inspection on the proof slice in an isolated local environment.**
  Check:
  - mobile participant flow
  - presenter scene fit and legibility
  - facilitator backstage usability
  - browser console and page-error cleanliness
- [x] **6.7 Add or update Playwright coverage for the critical proof-slice flows.**
  Include:
  - room-scene fit at the presenter baseline
  - participant-surface updates for live-moment changes
  - poll interaction and aggregate rendering
  - feedback submission visibility on the facilitator side only
- [ ] **6.8 Complete human review before rollout.**
  Human review must explicitly confirm:
  - room-facing clarity
  - participant usefulness
  - backstage facilitator usability
  - mobile reading order
  - projection legibility
- [x] **6.9 Run content generation and verification.**
  - `npm run generate:content`
  - `npm run verify:content`
- [x] **6.10 Run workshop-content QA artifacts for the proof slice.**
  At minimum:
  - review note under `docs/reviews/workshop-content/`
  - preview evidence for mobile participant and projected room
  - locale parity note if both English and Czech change
  - copy-editor Layer 1 deterministic audit if visible Czech changes
  - explicit Layer 2 findings plus human Czech signoff note where visible Czech changes
- [ ] **6.11 Reset or recreate affected workshop instances after the blueprint/model fix is landed.**
  Document which instances need reset and verify they import the corrected contract.
- [x] **6.12 Write rollout and maintainer notes.**
  Explain how future agenda work should use the new contract without drifting back.

## Acceptance Criteria

- The runtime has an explicit live-moment concept that can drive participant content independently of coarse agenda-item changes.
- Participant content no longer depends on agenda-derived room-summary fallback except for a deliberately conservative safe fallback.
- `opening`, `talk`, and `demo` each have:
  - minimal room scenes
  - selective participant moments
  - backstage facilitator detail
- At least one proof-slice poll works end to end with:
  - predefined options
  - participant input
  - anonymous room aggregate
  - facilitator review
- The participant surface has a persistent feedback input for blockers/questions, and those submissions are facilitator-private by default.
- Facilitators can selectively promote a participant feedback item into a room-safe note.
- Presenter movement and participant visibility stay synchronized according to the documented live-moment contract.
- Docs, generated workshop content, and runtime behavior all describe the same surface model.
- Any new recurring UI pattern introduced by the proof slice is reflected in `docs/dashboard-design-system.md` or an explicitly linked surface-specific design doc.
- The proof slice passes the repo’s layered UI verification workflow:
  - tracer/integration checks
  - critical-path Playwright coverage
  - exploratory browser inspection
  - human review
- The proof slice has the required `docs/reviews/workshop-content/` review artifact and satisfies `docs/workshop-content-qa.md`.
- Existing workshop instances can be reset/imported without losing the new contract.

## Decision Rationale

### Why add an explicit participant-moment model instead of stretching `presenterScenes`

The current `presenterScenes` model already serves room projection and a limited participant track, but it is not the right place to keep growing semantics:

- participant relevance can change inside an agenda item
- current scene selection is URL-driven, not persisted
- room projection and participant visibility now have meaningfully different jobs

Adding a dedicated participant-moment concept is more explicit and keeps the system honest about the difference between “what the room sees” and “what participants need.”

### Why add persisted live-moment state instead of relying on URL selection

“Automatic participant updates” require a shared runtime truth. Today there is none beyond the current agenda item. Presenter scene selection happens in local/URL space. That is fine for presentation control, but too weak for system-wide participant visibility.

The plan therefore introduces explicit state rather than hiding the problem behind heuristics.

### Why store poll responses and feedback outside `WorkshopState`

There is already a precedent in `rotation signals`: frequent, append-oriented signal streams live outside the hot workshop-state path.

That pattern should be reused here so participant interaction writes:

- do not contend with workshop-state writes
- do not inflate every workshop-state read
- remain easier to reason about as signal streams rather than as structural workshop state

### Why proof-slice first instead of whole-agenda rollout

The brainstorm’s strongest evidence was concentrated in `opening`, `talk`, and `demo`. That is where the surface blend is most obvious and where the pattern can be validated fastest.

Rolling the whole agenda at once would create too many moving parts:

- content rewrite
- runtime model change
- interaction layer
- participant sync

The proof-slice gate is the control against that sprawl.

## Constraints and Boundaries

- `workshop-content/agenda.json` remains the canonical authored source for agenda content.
- Generated mirrors must remain in sync through the existing content generation pipeline.
- If this work introduces a new recurring UI pattern on participant, presenter, or facilitator surfaces, `docs/dashboard-design-system.md` and any relevant surface-specific design doc must be updated in the same slice.
- Public/private boundaries stay unchanged:
  - participant-visible content must remain participant-safe
  - facilitator-private feedback must not leak into public or participant surfaces by default
- Mobile-first participant behavior remains non-negotiable.
- The facilitator dashboard remains the protected operational surface; this work must not create a second hidden authoring system.
- If the final runtime/content model changes architectural boundaries materially, the relevant ADR or boundary doc must be updated in the same execution slice.
- Existing workshop instances are runtime copies. The rollout must account for reset/reimport behavior explicitly.
- Proof-slice content work must satisfy `docs/workshop-content-qa.md`, including review-note artifacts, participant usefulness, mobile glanceability, projected-room legibility, locale parity, and Czech review gates where visible Czech changes.

## Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| The current three-surface doctrine is already strong enough to build on rather than replace | Verified | `docs/dashboard-surface-model.md` and `docs/facilitator-agenda-source-of-truth.md` already define room, participant, and facilitator concerns separately |
| Existing participant scenes can be normalized into a stronger participant-moment model without breaking all current content | Mostly verified | Current runtime already distinguishes `surface: "participant"` scenes and normalizes legacy scene types on read |
| A dedicated live-moment state is required for automatic participant updates inside one agenda item | Verified | Presenter scene selection is URL/local-state driven today; no persisted “live scene” exists in workshop runtime |
| Poll responses and persistent feedback are better stored outside `WorkshopState` | Verified | `rotation signals` already use separate repositories specifically to avoid inflating hot workshop-state reads/writes |
| A proof slice is sufficient to validate the new contract before broader rollout | Unverified | Strong product inference, but it still needs preview review and execution feedback |
| Automatic participant-moment switching will feel reliable enough without everyday manual control | Unverified | Desired by the user, but not yet tested in a room flow that changes inside one agenda item |
| A more frequent or more precise participant refresh trigger will remain operationally safe at workshop scale | Unverified | Current 30s item-level polling was acceptable for coarse phase changes; tighter live-moment sync needs explicit validation |

## Risk Analysis

### Risk: The new state model creates drift between agenda, room scene, and participant moment

If live workshop state is not explicit and well-bounded, the room and participant surfaces can desynchronize in harder-to-debug ways than today.

Mitigation:

- one persisted live-moment source of truth
- explicit auto/manual mode semantics
- tests that assert synchronization behavior, not only rendering

### Risk: The participant-moment model becomes a second content system that authors avoid or misuse

If the new model is too abstract or too verbose, maintainers will fall back to room-scene overload again.

Mitigation:

- keep participant moments agenda-owned
- normalize existing participant scenes forward
- prove the model on one slice before spreading it
- update doctrine in the same slice

### Risk: Interaction scope balloons into a poll product

Polls are an easy place to lose discipline.

Mitigation:

- predefined options only
- anonymous aggregate only
- no leaderboards, no quiz flow, no free-text poll answers
- explicit rejection criteria in preview review

### Risk: Persistent participant feedback becomes noisy or chat-like

If feedback is visible to everyone or framed too broadly, it will stop being operational.

Mitigation:

- facilitator-private by default
- scope to blockers and facilitator questions
- promotion to room-safe notes is an explicit action

### Risk: Existing workshop instances remain on the old contract

Because runtime instances are copied from blueprint content, landing the new model in repo files alone is not enough.

Mitigation:

- include reset/reimport in the rollout phase
- verify at least one reset/import after the model lands

### Risk: Proof-slice previews look clean, but the backstage facilitator experience gets worse

Removing detail from projection is only a win if it remains accessible backstage.

Mitigation:

- require a control-room backstage preview in the proof gate
- treat backstage relocation as a first-class implementation task, not cleanup

## Phased Implementation

### Phase 0 — Preview and contract lock

Goal: make the new surface model concrete before runtime edits begin.

Exit criteria:

- proof-slice previews exist
- Ondrej signs off that the pattern is cleaner than current behavior
- implementation does not need to guess what “minimal room scene” means

### Phase 1 — State-model foundation

Goal: make the runtime and content contracts explicit.

Exit criteria:

- types and normalization strategy are decided
- doctrine docs match the chosen model
- a fresh executor can explain how participant moments become live

### Phase 2 — Sync contract and participant surface

Goal: make participant visibility automatic and explainable.

Exit criteria:

- live-moment state is persisted
- participant refresh reacts to the right trigger
- agenda-derived leakage fallback is removed or constrained

### Phase 3 — Proof-slice authored content

Goal: prove the new contract on real workshop content.

Exit criteria:

- `opening`, `talk`, and `demo` all satisfy the new room/participant/backstage split
- content integrity pipeline passes

### Phase 4 — Lightweight room signals

Goal: add the minimal interaction layer without scope creep.

Exit criteria:

- one poll works end to end
- aggregate remains anonymous
- facilitator can review it without new operational burden

### Phase 5 — Persistent participant feedback

Goal: add the operational backchannel without turning it into chat.

Exit criteria:

- participants can submit blockers/questions anytime
- facilitators can review them privately
- promotion to room-safe notes works

### Phase 6 — Verification and rollout

Goal: lock the new contract into tests and real workshop operations.

Exit criteria:

- verification coverage exists for the new contract
- generated content is in sync
- at least one instance reset/import proves the corrected model lands in runtime

## References

- Brainstorm: [`docs/brainstorms/2026-04-19-agenda-scene-surface-split-and-lightweight-interaction-brainstorm.md`](../brainstorms/2026-04-19-agenda-scene-surface-split-and-lightweight-interaction-brainstorm.md)
- Surface doctrine: [`docs/dashboard-surface-model.md`](../dashboard-surface-model.md)
- Agenda ownership: [`docs/facilitator-agenda-source-of-truth.md`](../facilitator-agenda-source-of-truth.md)
- Presenter fit contract: [`docs/presenter-rich-scene-authoring.md`](../presenter-rich-scene-authoring.md)
- Prior separation plan: [`docs/plans/2026-04-09-fix-room-safe-presenter-scene-separation-and-opening-reset-plan.md`](2026-04-09-fix-room-safe-presenter-scene-separation-and-opening-reset-plan.md)
- Prior density plan: [`docs/plans/2026-04-14-refactor-presenter-scene-density-and-coverage-plan.md`](2026-04-14-refactor-presenter-scene-density-and-coverage-plan.md)
- Archived participant-surface direction: [`docs/plans/archive/2026-04-19-refactor-participant-surface-cli-independence-plan.md`](archive/2026-04-19-refactor-participant-surface-cli-independence-plan.md)
- Current participant fallback and panel assembly: [`dashboard/lib/public-page-view-model.ts`](../../dashboard/lib/public-page-view-model.ts)
- Current participant refresh behavior: [`dashboard/app/components/participant-live-refresh.tsx`](../../dashboard/app/components/participant-live-refresh.tsx)
- Current participant core bundle: [`dashboard/lib/event-access.ts`](../../dashboard/lib/event-access.ts)
- Rotation-signal precedent: [`dashboard/lib/workshop-store.ts`](../../dashboard/lib/workshop-store.ts)
