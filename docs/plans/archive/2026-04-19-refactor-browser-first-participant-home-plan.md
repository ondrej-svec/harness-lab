---
title: "refactor: browser-first participant home"
type: plan
date: 2026-04-19
status: complete
brainstorm: docs/brainstorms/2026-04-19-participant-ui-browser-first-brainstorm.md
confidence: medium
---

# Browser-First Participant Home Plan

**One-line summary:** Evolve the current Build Phase 1 participant proof slice into a browser-first participant home with stable `Next / Build / Reference` navigation, a calm action-first hierarchy, and a provenance-rich live checkpoint feed that no longer depends on CLI or skill access to feel complete.

## Problem Statement

Harness Lab now has a solid Build Phase 1 participant proof slice, but the participant product is still structurally too narrow for the workshop reality described in the brainstorm.

Current state:

- the participant surface can now carry Build Phase 1 without CLI or skill success first
- the page still behaves mainly like a room/status surface with `room / teams / notes` anchors and a Build Phase 1 proof block layered on top
- participant support that already exists in the workshop skill (`briefs`, `challenges`, `resources`, `gallery`, `follow-up`) is not yet reflected as a coherent browser-first participant product
- live participant residue is still encoded as team-level `checkIns` appended inside `teams[]`, which is enough for the current room surface but too limited for the provenance-rich, filterable feed chosen in the brainstorm

This leaves three product gaps:

1. **The participant information architecture is still phase/status-first instead of participant-job-first.**
2. **The browser path is sufficient in one proof slice, but not yet excellent as the main participant experience across the day.**
3. **The workshop has no first-class live participant capture model for visible, structured, filterable checkpoint residue.**

## Target End State

When this plan lands:

1. The participant surface opens as one stable browser-first home with three persistent top-level sections:
   - `Next`
   - `Build`
   - `Reference`
2. The first screen answers the participant’s dominant question quickly:
   - what do I do now?
   - what materials do I need?
   - where do I go if local setup is blocked?
3. `Build` provides a real working surface for the current workshop mode:
   - brief access
   - repo/starter acquisition
   - challenge-card access
   - compact team/pair/solo context
   - visible but secondary CLI/skill acceleration guidance
4. `Reference` becomes an evergreen participant library reachable throughout the day without overwhelming the home.
5. The participant surface exposes a live chronological checkpoint feed with:
   - provenance
   - timestamps
   - scope filters
   - structured submissions only
6. The participant home works for:
   - solo participants
   - pairs
   - loose teams of four
   - workshops where participants work from separate repos
7. The implementation remains participant-safe, mobile-first, and aligned with the Harness Lab design system.

## Scope and Non-Goals

### In scope

- participant-home information architecture and navigation model
- participant-surface view-model refactor away from the current monolithic room/status layout
- a new or extended live participant capture model that supports provenance and filtering
- section-level participant UI for `Next`, `Build`, and `Reference`
- mobile and desktop participant layout review
- design-system and testing updates required by the new recurring participant pattern
- coordination seam with the recommendation-catalog plan so `Reference` does not become another hand-maintained list

### Non-goals

- removing the workshop skill or CLI
- collapsing participant and facilitator trust boundaries
- turning the participant surface into a collaboration suite or chat product
- auto-installing skills, plugins, or MCPs from the dashboard
- rewriting facilitator or presenter surfaces in this plan
- fully solving all follow-up/reference-catalog content authoring here if that work belongs to the companion catalog plan

## Proposed Solution

Build the browser-first participant home as an **evolution of the shipped Build Phase 1 proof slice**, not a fresh replacement.

The implementation should proceed in four connected layers:

1. **Participant-home IA and layout contract**
   - stable `Next / Build / Reference` section model
   - calm home canvas with one dominant action block
   - compact social context, not a dashboard of team state

2. **Section-oriented participant payloads**
   - replace the current “mostly generic participant scene + room/teams/notes” composition with explicit participant-home section payloads
   - keep presenter-linked phase context, but stop overfitting the participant home to generic presenter block rendering

3. **Live checkpoint capture model**
   - move from bare team-scoped `checkIns` toward a participant-aware feed model that can support provenance, timestamps, and filters
   - keep the write path strict and structured so the feed remains signal, not chatter

4. **Reference-layer seam**
   - implement `Reference` as a true evergreen participant layer
   - wire it through a projection seam that can consume the recommendation-catalog work from `docs/plans/2026-04-19-feat-recommended-tooling-catalog-and-surface-alignment-plan.md`
   - do not hard-code another bespoke list directly into the participant component tree

## Decision Rationale

### Why evolve the current proof slice instead of replacing it

The Build Phase 1 proof slice already proved the most important doctrinal shift:

> the participant surface is sufficient to start without CLI or skill success first

That should remain the foundation. Replacing it wholesale would risk losing the verified hierarchy while duplicating work.

### Why a stable three-section home

The brainstorm already resolved that participants need a persistent navigation model rather than a surface that changes shape every phase. Stable sections reduce cognitive load and support mobile scanning.

### Why a dedicated live checkpoint feed

The current `teams[].checkIns` array is useful for small evidence capture, but it does not satisfy the chosen product shape:

- provenance by participant and team
- room-wide visibility
- chronological flow
- filterable scope

The plan therefore needs a deliberate data-model decision instead of simply adding more UI around the current team-only structure.

### Alternatives considered

- **Keep the current room/teams/notes structure and just rename anchors.**
  Rejected because it would preserve the wrong mental model under new labels.
- **Keep all live capture as `TeamCheckIn[]` and render a synthetic feed.**
  Rejected as the default plan because it risks fighting the data shape immediately once richer provenance or filtering is needed.
- **Fold live checkpoint feed into `Reference`.**
  Rejected because stable reference material and live room capture are different jobs with different signal/noise dynamics.

## Constraints and Boundaries

- **Participant-safe only.** No facilitator-only controls or privileged state may leak into the participant home.
- **Mobile-first.** The dominant next move, section navigation, and structured capture must remain legible on phones.
- **Design-system compliance is mandatory.** Any new recurring participant pattern must either reuse the current design system or update `docs/dashboard-design-system.md` and relevant participant-surface design docs deliberately.
- **CLI and skill remain accelerators.** They should be visible and promoted, but never framed as required for workshop progression.
- **Structured capture only.** The live feed must not become a free-form room chat.
- **Preview gate before autonomous implementation.** This is a design-heavy and boundary-sensitive refactor; preview artifacts are required before `$work`.
- **Companion-plan coordination.** `Reference` must be designed so the recommendation-catalog plan can supply data cleanly rather than being reimplemented ad hoc in component code.

## Design System Influence

This plan is not allowed to invent a parallel participant visual language.

Required design-system influence:

- the participant home must remain subordinate to the dashboard-wide rules in `docs/dashboard-design-system.md`
- the participant-home layout must preserve the participant surface’s dominant-question rule from `docs/dashboard-surface-model.md`: what should I do right now in this room?
- the implementation must reuse existing action hierarchy semantics:
  - one primary action in the local context
  - secondary actions for support moves
  - links that still read as links
- progressive disclosure remains mandatory:
  - the default canvas is for current context and the minimum useful working set
  - deeper reference material and broader exploration sit behind clear secondary movement
- mobile reading order is part of the design-system contract, not an afterthought
- if this work introduces a recurring participant pattern that does not cleanly fit the current system, `docs/dashboard-design-system.md` and any relevant participant-surface design rules must be updated in the same slice of work

Design review must explicitly check:

- calm hierarchy over density
- a singularly dominant next-step block
- `Build` and `Reference` as clearly secondary to `Next` on first load
- live feed presentation that feels product-legible rather than chat-like

## Subjective Contract

- **Target outcome:** the participant opens the page and immediately feels oriented, capable, and unblocked. The UI feels like a real product, not a fallback board.
- **Anti-goals:**
  - dense dashboard composition
  - section overload on first load
  - CLI-first emotional framing
  - generic social-feed noise
  - a marketplace-like reference layer
- **References:**
  - `docs/brainstorms/2026-04-19-participant-ui-browser-first-brainstorm.md`
  - `docs/reviews/2026-04-19-participant-surface-proof-slice-review.md`
  - `docs/reviews/2026-04-19-participant-surface-implementation-review.md`
  - `docs/dashboard-design-system.md`
- **Anti-references:**
  - Kanban or LMS-like participant products
  - a room-status board dressed up as a participant home
  - unstructured public note streams
- **Tone or taste rules:**
  - calm, not dense
  - product-legible, not clever
  - primary action must be singularly dominant
  - deeper material should require deliberate movement, not compete at first glance
- **Representative proof slice:** Build Phase 1 on both mobile and desktop, plus one chronological checkpoint feed flow
- **Rollout rule:** propagate beyond Build Phase 1 only after the new home hierarchy and live feed behavior pass review in the proof slice
- **Rejection criteria:**
  - first screen does not answer “what should I do now?”
  - `Next / Build / Reference` reads like relabeling without structural improvement
  - skill/CLI regain equal or greater visual weight than the browser-first path
  - live checkpoint feed becomes noisy or ambiguous enough that participants stop reading it

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| The participant surface must be sufficient without CLI/skill success first | Verified | `workshop-blueprint/control-surfaces.md`, `docs/dashboard-surface-model.md`, and the 2026-04-19 Build Phase 1 implementation review |
| Stable top-level sections are preferable to phase-specific navigation reshaping | Verified | Brainstorm decision and current proof-slice hierarchy findings |
| The existing participant code can be evolved without replacing the participant route entirely | Verified | Current surface already isolates a Build Phase 1 proof slice and central view-model helpers |
| A participant-aware checkpoint feed will be materially more useful than team-only check-ins | Unverified | Chosen in brainstorm; needs proof-slice validation in real UI |
| Participants will consistently submit short structured checkpoint captures when prompted | Unverified | Brainstorm flagged this explicitly as a behavior risk |
| `Reference` can be cleanly separated from the live checkpoint feed in the final IA | Verified | Brainstorm decision plus the different source/data responsibilities already present in the repo |
| The current `TeamCheckIn` storage shape is sufficient for the final feed model | Unverified | Current shape lacks participant identity and explicit filter-friendly semantics; requires an implementation decision |

## Risk Analysis

### 1. Information architecture drift

Risk:
- the new labels land, but the page still feels like a room/status board

Mitigation:
- require section-level preview artifacts before coding
- explicitly review mobile and desktop reading order against the design-system dominant-question rule

### 2. Live feed noise

Risk:
- a room-wide chronological stream becomes unreadable or ignored

Mitigation:
- keep write shape structured and short
- start with limited filters and strong provenance
- treat noise as a rejection criterion in the proof slice

### 3. Data-model overreach

Risk:
- introducing a new participant-signal model creates more churn than the proof slice can absorb

Mitigation:
- make the data-model decision explicit in Phase 1
- allow a bridge implementation only if it cleanly supports the chosen UI contract and does not block later normalization

### 4. Reference-layer duplication

Risk:
- `Reference` ships with another hard-coded list while the companion catalog plan is also building a source of truth

Mitigation:
- define a seam/adaptor in this plan
- sequence the participant `Reference` implementation so catalog-backed integration is either available or clearly stubbed without duplication

### 5. Dominant CTA erosion

Risk:
- as `Build`, `Reference`, and feed modules grow, the home loses its calm hierarchy

Mitigation:
- preserve one primary action block rule
- require explicit review against proof-slice rejection criteria before propagation

## Verification Protocol

The plan is not complete when the UI “looks right.” It is complete only when executable and human verification both pass.

Required protocol:

1. **Preview gate before implementation**
   - review the participant-home preview artifacts before `$work`
   - reject implementation start if the first screen hierarchy is still ambiguous

2. **Automated verification during implementation**
   - add or update unit tests for section shaping, ranking, and feed helpers
   - add or update integration coverage for participant capture and feed reads
   - add or update Playwright coverage for the dominant participant flows

3. **Required commands before closing the work**
   - `cd dashboard && npm run test`
   - `cd dashboard && npm run test:e2e`
   - `cd dashboard && npm run lint`
   - `cd dashboard && npm run build`
   - `npm run generate:content`
   - `npm run verify:content`
   - `node harness-cli/scripts/sync-workshop-bundle.mjs` when bundle-facing participant content changes
   - `cd harness-cli && npm run verify:workshop-bundle` when bundle contents change

4. **Human review**
   - verify the participant home in-browser on mobile and desktop
   - review the hierarchy against the design system
   - inspect whether the live feed is still signal rather than noise

5. **Close-out rule**
   - final work notes must state what was verified and what was not verified
   - if any part of the protocol is skipped, the reason must be written down explicitly

## Phased Implementation

### Phase 0: Baseline and preview gate

Goal: convert the brainstorm into implementation-facing artifacts and confirm what the current participant proof slice already provides.

Tasks:

- [x] **0.1** Audit the current participant route, view-model helpers, and `BuildPhaseOneProofSlice` composition to mark what can be retained vs what must be refactored.
- [x] **0.2** Produce a participant-home structural preview for mobile and desktop showing `Next / Build / Reference`.
- [x] **0.3** Produce a live checkpoint-feed preview showing provenance, timestamps, and scope filters.
- [x] **0.4** Produce a participant-reference preview that distinguishes:
  - default workshop path
  - optional accelerators
  - explore-more layer
- [x] **0.5** Review the preview set against:
  - `docs/dashboard-design-system.md`
  - `docs/dashboard-surface-model.md`
  - `docs/reviews/2026-04-19-participant-surface-proof-slice-review.md`
- [x] **0.6** Decide whether the proof slice requires a new recurring participant pattern and note whether `docs/dashboard-design-system.md` must change in the same slice.

Exit criteria:

- preview artifacts exist and are reviewed
- the proof-slice reading order is explicit on mobile and desktop
- one implementation direction for the participant-home shell is chosen

### Phase 1: Surface contracts and data-model decision

Goal: define the contracts before editing the component tree.

Tasks:

- [x] **1.1** Define the participant-home section contract for `Next`, `Build`, and `Reference` in a plan-aligned preview/spec artifact or implementation-facing doc.
- [x] **1.2** Define the participant-home navigation contract:
  - participant header links
  - in-page anchors
  - mobile behavior
- [x] **1.3** Decide the live capture storage approach:
  - extend `TeamCheckIn`
  - add a normalized participant-signal model
  - or introduce a bridge shape with a documented migration path
- [x] **1.4** Define the structured checkpoint submission schema for the first proof slice.
- [x] **1.5** Define the feed query/filter contract for:
  - room
  - current phase
  - my team
  - mine
- [x] **1.6** Define the seam between `Reference` rendering and the companion recommendation-catalog plan so the data source is not duplicated.

Exit criteria:

- participant-home sections have an explicit contract
- live feed data model is chosen
- `Reference` integration seam is documented

### Phase 2: Participant-home refactor

Goal: restructure the participant surface around the new home model.

Tasks:

- [x] **2.1** Refactor `dashboard/lib/public-page-view-model.ts` so participant payloads are section-oriented rather than room/status-first.
- [x] **2.2** Update participant navigation from `room / teams / notes` toward `Next / Build / Reference`.
- [x] **2.3** Refactor `dashboard/app/components/participant-room-surface.tsx` into explicit participant-home sections with:
  - dominant `Next` action block
  - `Build` section
  - `Reference` section
- [x] **2.4** Keep Build Phase 1 behavior parity where already verified:
  - brief access
  - repo acquisition actions
  - fallback guidance
- [x] **2.5** Add compact working-context display (brief + solo/pair/team mode) without turning it into a large collaboration panel.
- [x] **2.6** Position CLI/skill guidance as a strong secondary accelerator, not a co-primary action.

Exit criteria:

- the participant home no longer reads as a room/status shell
- current Build Phase 1 proof-slice value is preserved or improved
- the primary next action remains visually dominant

### Phase 3: Live checkpoint feed

Goal: implement the visible structured capture model chosen in the brainstorm.

Tasks:

- [x] **3.1** Implement the data-layer changes required by the chosen checkpoint-feed model.
- [x] **3.2** Update participant write interactions so checkpoint submissions are structured and short.
- [x] **3.3** Render a chronological participant feed with provenance and timestamps.
- [x] **3.4** Add scope filters for the first proof slice.
- [x] **3.5** Ensure the feed is clearly distinct from stable reference content in both layout and copy.
- [x] **3.6** Decide and document how checkpoint items flow to the presenter/facilitator surfaces, if at all, in the proof slice.

Exit criteria:

- the participant can submit a structured checkpoint item
- the resulting feed is chronological, attributable, and filterable
- feed noise and clarity are reviewed explicitly

### Phase 4: Reference-layer integration

Goal: make `Reference` real without hard-coding another orphan list.

Tasks:

- [x] **4.1** Implement the participant `Reference` section shell and reading order in the participant home.
- [x] **4.2** Render current workshop-safe references, briefs support, and follow-up pointers through the chosen seam.
- [x] **4.3** Integrate the recommendation-catalog work when available, or stub the adapter boundary clearly without duplicating authored content.
- [x] **4.4** Distinguish curated defaults from optional accelerators and deeper exploration.
- [x] **4.5** Verify that the `Reference` section stays evergreen and reachable without overpowering the primary action flow.

Exit criteria:

- `Reference` is a real participant layer, not a placeholder
- the data source is not duplicated ad hoc in component code
- curated defaults and explore-more states are visually distinct

### Phase 5: Verification, design-system alignment, and rollout decision

Goal: treat the proof slice as complete only after executable and human verification.

Tasks:

- [x] **5.1** Add or update unit tests for participant-home view-model shaping and any new feed helpers.
- [x] **5.2** Add or update integration tests for participant capture and feed read paths.
- [x] **5.3** Add or update Playwright coverage for:
  - mobile participant home
  - desktop participant home
  - structured checkpoint submission
  - feed filtering
- [x] **5.4** Run:
  - `cd dashboard && npm run test`
  - `cd dashboard && npm run test:e2e`
  - `cd dashboard && npm run lint`
  - `cd dashboard && npm run build`
- [x] **5.5** If any participant-visible content or generated agenda material changes, run:
  - `npm run generate:content`
  - `npm run verify:content`
- [x] **5.6** If workshop bundle content changes, run:
  - `node harness-cli/scripts/sync-workshop-bundle.mjs`
  - `cd harness-cli && npm run verify:workshop-bundle`
- [x] **5.7** Review the implemented proof slice in browser on mobile and desktop against the design system and this plan’s rejection criteria.
- [x] **5.8** Update `docs/dashboard-design-system.md` and any participant-surface design docs if a new recurring participant pattern was introduced.
- [x] **5.9** Decide whether the validated pattern propagates beyond Build Phase 1 immediately or remains a narrower proof slice awaiting further review.

Exit criteria:

- verification protocol passes
- human review confirms the participant home answers the dominant question quickly
- broader rollout decision is explicit, not implicit

## Implementation Tasks

Execution order for `$work`:

1. Phase 0 preview gate
2. Phase 1 contracts and data-model choice
3. Phase 2 participant-home refactor
4. Phase 3 live checkpoint feed
5. Phase 4 reference-layer integration
6. Phase 5 verification and rollout decision

## Acceptance Criteria

1. The participant surface presents a stable `Next / Build / Reference` model rather than `room / teams / notes`.
2. The first participant screen on both phone and laptop clearly answers what to do next.
3. The dominant next-step block remains singularly primary over all other content.
4. Build Phase 1 still provides direct brief access, repo acquisition actions, and explicit fallback guidance without requiring CLI or skill success first.
5. The participant home includes compact working-context information without becoming a collaboration/status dashboard.
6. CLI and skill guidance remain visible but secondary, and the copy explicitly preserves the browser-first path.
7. The participant surface exposes a chronological live checkpoint feed with provenance and timestamps.
8. The proof slice supports at least the agreed scope filters for the live feed.
9. The live checkpoint feed is structured enough that it does not read like an unbounded room chat.
10. The `Reference` section is reachable throughout the participant experience and clearly distinguishes curated defaults from optional/deeper exploration.
11. The `Reference` implementation does not introduce another hand-maintained recommendation list separate from the companion catalog work.
12. The participant proof slice follows the Harness Lab design system or updates it deliberately in the same slice.
13. The agreed verification protocol is executed successfully.
14. A human in-browser review explicitly checks mobile and desktop hierarchy, feed clarity, and browser-first framing.
15. The final rollout decision beyond the proof slice is written down.

## References

- `docs/brainstorms/2026-04-19-participant-ui-browser-first-brainstorm.md`
- `docs/plans/archive/2026-04-19-refactor-participant-surface-cli-independence-plan.md`
- `docs/plans/2026-04-19-feat-recommended-tooling-catalog-and-surface-alignment-plan.md`
- `docs/reviews/2026-04-19-participant-surface-proof-slice-review.md`
- `docs/reviews/2026-04-19-participant-surface-implementation-review.md`
- `docs/previews/2026-04-19-participant-surface-build-1-proof-slice-spec.md`
- `docs/previews/2026-04-19-browser-first-participant-home-spec.md`
- `docs/dashboard-design-system.md`
- `docs/dashboard-surface-model.md`
- `docs/dashboard-testing-strategy.md`
- `workshop-blueprint/control-surfaces.md`
- `workshop-skill/SKILL.md`

## Implementation Notes

- The proof slice uses a documented bridge model: `TeamCheckIn` remains the storage seam, extended with optional structured evidence and participant provenance, while the participant home projects a room-wide chronological feed from that data.
- Rollout decision: keep the stable `Next / Build / Reference` shell live on the participant surface now, but treat the structured checkpoint bridge as validated for the current Build Phase 1 slice first. Later phases should reuse the same shell, and deeper feed normalization should wait for follow-up review rather than spawning another participant IA.
- Verification status:
  - automated checks passed: `cd dashboard && npm run test`, `cd dashboard && npm run lint`, `cd dashboard && npm run build`, `cd dashboard && npm run test:e2e`
  - content generation and workshop-bundle sync were not needed in this slice because no generated agenda/content files or bundle-authored workshop sources changed
  - Chrome DevTools browser review passed on the built app for desktop and mobile, including event-code redemption, participant identification, and a live structured checkpoint submission/feed verification
