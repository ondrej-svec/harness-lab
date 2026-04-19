---
title: "refactor: participant surface for CLI-independent workshop delivery"
type: plan
date: 2026-04-19
status: complete
confidence: high
---

# Participant Surface CLI-Independence Plan

**One-line summary:** Reposition the participant surface from a thin orientation board into a complete workshop operating surface, then demote the CLI and `workshop` skill from prerequisite to optional accelerator.

## Problem Statement

Harness Lab currently still teaches and encodes an overly fragile assumption: participants will successfully use the CLI + skill path during the workshop.

That assumption now fails the real-room test for corporate workshops:

- company IT policy may block package installs, shells, auth flows, or agent setup
- participants may not have a uniform coding-agent environment
- workshop momentum should not depend on local CLI success in the first hour
- some agenda scenes still tell participants to follow instructions on their phones or participant board even when the facilitator is running the exercise live in the room

This creates two connected failures:

1. **Content drift:** agenda scenes and talk/demo framing still overstate the centrality of the workshop skill (`workshop-content/agenda.json`, `content/facilitation/master-guide.md`, `content/talks/context-is-king.md`).
2. **Product drift:** the participant surface still behaves mostly like an orientation layer instead of a complete fallback / parallel operating surface (`workshop-blueprint/control-surfaces.md`, `docs/dashboard-surface-model.md`, `dashboard/app/components/participant-room-surface.tsx`).

The result is a workshop that can be operationally blocked by local setup — exactly the opposite of the workshop's own doctrine about resilient control surfaces and continuation quality.

## Audit Summary

### Confirmed friction in current repo state

#### 1. Misleading team-formation room copy

`workshop-content/agenda.json` contains room-facing scenes that still say participants should use their phones / participant board for team-formation instructions.

Examples:
- `opening-team-formation-room`
  - EN facilitator note: "Participants work from the steps on their phones..."
  - EN callout: "Check your phone."
  - CS equivalents: "Účastníci postupují podle kroků na telefonu..." / "Mrkněte na telefon."

For facilitator-led in-room team formation, this is misleading and should be removed.

#### 2. Skill-first framing in the talk/demo spine

Current workshop-content and facilitation docs still frame the workshop skill as the tool that "ties it together" or as an early mandatory step:

- `workshop-content/agenda.json`
  - `demo-your-toolkit`
  - `demo-first-ten-minutes`
- `content/facilitation/master-guide.md`
- `content/talks/context-is-king.md`

This is too strong for a workshop that must survive failed installs or blocked local environments.

#### 3. Participant surface still too thin for fallback execution

The participant surface currently supports:
- current phase
- guidance blocks
- team cards
- repo links
- notes
- team check-ins

But it does **not** yet provide a first-class way to complete the essential workshop loop without the CLI/skill path:
- direct brief access in UI
- direct challenge-card access in UI
- explicit repo acquisition options beyond a raw URL
- strong phase-specific "start here now" action hierarchy
- visible fallback guidance when local setup fails

#### 4. Existing plans do not yet reflect the new operating rule

Relevant plans exist:
- `docs/plans/2026-04-10-feat-participant-page-redesign-plan.md`
- `docs/plans/2026-04-10-refactor-participant-cli-architecture-plan.md`

But both still assume the CLI / skill remain a strong primary participant interface. They improve the surface, but they do not yet encode the stronger workshop rule: **the participant UI must be sufficient on its own.**

## Target End State

When this plan lands, Harness Lab should teach and operate with this rule everywhere:

> **The participant surface must be sufficient to complete the workshop. The CLI and skills are optional accelerators, not prerequisites.**

Concretely:

1. **Agenda and presenter copy stop implying phone-first or skill-first dependency** when the room flow is facilitator-led.
2. **Participant surface becomes an operational surface** that can carry the whole day even if no participant installs the CLI.
3. **Repo access becomes easier from the participant surface** with multiple acquisition modes where available: open repo, copy URL, copy clone command, download ZIP or starter bundle.
4. **Briefs and challenge cards are reachable from the participant surface** in a phase-aware way.
5. **Workshop framing explicitly treats CLI/skill as optional fast lanes** rather than the workshop's critical path.
6. **Control-surface docs describe participant UI and skill as equivalent-capability paths for core workshop actions**, not as orientation-vs-real-interface.

## Scope and Non-Goals

### In scope

- agenda-scene audit and copy corrections for misleading phone / skill dependency
- doctrine update for participant surface role in:
  - `workshop-blueprint/control-surfaces.md`
  - `docs/dashboard-surface-model.md`
  - related participant-surface docs where needed
- participant surface product redesign plan for:
  - brief access
  - challenge-card access
  - repo acquisition actions
  - stronger phase-aware CTA hierarchy
  - setup-failure fallback guidance
- workshop-skill framing updates so the skill becomes recommended / optional rather than required
- one proof-slice UI implementation path defined before broader rollout

### Non-goals

- removing the CLI or workshop skill from Harness Lab
- collapsing participant and facilitator auth boundaries
- building a full Git client into the dashboard
- solving private GitHub ZIP download for every possible enterprise setup in v1
- duplicating every advanced skill behavior in the participant UI
- rewriting the entire workshop blueprint or all agenda scenes in one pass

## Constraints and Boundaries

- **Participant surface remains participant-safe.** No facilitator-only controls or private runtime state may leak into the UI.
- **Public/private taxonomy stays unchanged.** Repo links, starter bundles, and workshop materials must stay public-safe or participant-safe per `docs/public-private-taxonomy.md`.
- **Mobile-first is non-negotiable.** The participant surface still needs to work from a phone in-room.
- **The participant UI must help without requiring repo clone success.** Download/open/copy actions should support multiple setup realities.
- **Skill and CLI remain supported.** This plan demotes them from prerequisite to accelerator; it does not remove them.
- **Preview-first rule applies.** This is UI + IA + workshop-copy work; implementation should not begin from prose alone.

## Product Rule

Adopt this rule in the repo and the workshop method:

> **Everything essential that participants need to progress through the workshop must be possible from the participant surface as well as from the skill path.**

Equivalent capability is required for these core actions:
- know current phase
- know the next required move
- access the brief
- access challenge cards
- access repo / starter materials
- submit a team check-in
- recover from setup friction

The skill may remain richer for:
- conversational coaching
- repo analysis
- generated templates
- follow-up and recap prompts

## Proposed Solution

## Phase 0 — Preview + audit pack (required gate)

Before implementation, produce a durable preview pack that makes the new participant-surface job concrete.

Required artifacts:
1. **Participant surface structural preview**
   - one HTML mockup or static page of the redesigned participant surface
   - mobile-first and desktop states
2. **Content audit memo**
   - exact agenda scenes and docs that currently overstate phone / CLI / skill dependency
   - exact proposed rewrites
3. **Repo acquisition matrix**
   - what actions the UI should support depending on repo type
   - public repo vs private repo vs starter bundle

Preview review gate:
- UX / IA pass against `docs/dashboard-design-system.md`
- copy pass for workshop framing and spoken naturalness
- boundary pass for public/private safety and participant-safe exposure

## Phase 1 — Content and doctrine correction

Correct the workshop method before changing product behavior.

### 1A. Agenda and presenter copy

Audit and update the affected scenes in `workshop-content/agenda.json`, especially:
- `opening-team-formation-room`
- `opening-team-formation`
- `demo-your-toolkit`
- `demo-first-ten-minutes`
- any participant-view or room scenes that imply the participant board / phone / skill is the only valid path

Copy shift:
- remove "check your phone" when the room flow is facilitator-led
- stop teaching skill installation as an early workshop gate
- reframe support surfaces as: participant UI first-class, skill optional accelerator

### 1B. Facilitation and talk docs

Update:
- `content/facilitation/master-guide.md`
- `content/talks/context-is-king.md`
- any demo script sections that overstate CLI primacy

Teaching shift:
- if setup works, use the skill
- if setup blocks, use participant UI and keep moving
- workshop success must not depend on shell success

### 1C. Control-surface doctrine

Update:
- `workshop-blueprint/control-surfaces.md`
- `docs/dashboard-surface-model.md`
- any related participant-surface design docs if repeated patterns are introduced

Doctrinal shift:
- participant surface = orientation **and essential execution support**
- skill = conversational accelerator over the same workshop model
- neither path should be a hidden dependency for the other

## Phase 2 — Participant surface product redesign (proof slice first)

Define the participant surface around **phase actionability**, not passive orientation.

### Surface job

The dominant question the participant page must answer is:

> **What do we do next, and how do we get moving right now even if our local setup is imperfect?**

### Required default-canvas sections

#### A. Current phase + next action
- one clear phase title
- one dominant CTA block: what to do now
- one fallback line: what to do if blocked

#### B. Your brief
- direct brief summary or link to full brief
- no skill required to see the assigned brief

#### C. Repo / starter access
Support the richest safe set available for the team's repo / artifact:
- open repo
- copy repo URL
- copy clone command
- download ZIP or starter bundle when available

#### D. Challenge cards
- phase-aware access to required and optional challenge cards

#### E. Team signals
- team check-ins
- notes
- current team / members / anchor as appropriate

### Action hierarchy

Primary action:
- the one next workshop move for the current phase

Supporting actions:
- brief
- repo access
- challenge cards
- check-in
- fallback guidance

### Anti-goals

The redesigned participant page must **not** become:
- a thin dashboard with decorative cards but no action path
- a second facilitator surface
- a giant scrolling document of everything in the workshop
- a place where raw repo links are dumped without acquisition help
- a UI that teaches participants they have failed if the CLI is blocked

## Phase 3 — Proof-slice implementation

Implement one representative slice first before broad propagation.

### Representative proof slice

**Build Phase 1 participant surface** is the proof slice.

It is the highest-leverage slice because it currently contains the strongest dependency risk:
- teams need to get started quickly
- repo access friction shows up here first
- skill-install assumptions are currently strongest here

### Proof-slice features

For Build Phase 1 only, the participant surface should support:
- assigned brief visibility
- repo access actions
- explicit "start here" hierarchy
- setup-failure fallback message
- optional pointer to CLI / skill as accelerator, not requirement

Only after this slice is reviewed and accepted should the pattern propagate to:
- opening
- continuation shift
- reveal / close

## Phase 4 — Controlled propagation

After the Build Phase 1 proof slice succeeds, propagate the pattern to other phases and affected scenes.

Safe propagation targets:
- opening team-formation language
- continuation-shift read-first guidance
- reveal prep guidance
- workshop-skill framing docs

Propagation should remain incremental, not one giant rewrite.

## Decision Rationale

### Why participant-surface-first instead of doubling down on the CLI?

Because the workshop's operational reliability must exceed the reliability of local participant setup. Corporate rooms introduce too many variables: permissions, shells, package managers, network rules, and uneven tool familiarity.

### Why not remove the skill?

Because the skill is still useful. It remains a strong accelerator for participants whose environment is ready, and it still models the workshop's own repo-native harness ideas. The problem is not the skill's existence; the problem is making it a prerequisite.

### Why prove Build Phase 1 first?

Because it is the point of highest workshop fragility and the cleanest place to test whether the participant surface can carry the workshop on its own.

### Why update doctrine before UI?

Because current docs and content still teach the old product shape. If the doctrine does not change first, implementation drift will reappear in later edits.

## Subjective Contract

### Target outcome

A participant landing on the page should feel:
- "I know what to do now."
- "I can keep moving even if setup is awkward."
- "The workshop is not blocked on my machine being perfect."

A facilitator should feel:
- "I can run the room without rescuing people into a shell-first path."
- "The participant surface reduces repeated instructions instead of creating more of them."

### References

- existing dashboard visual language and motion system
- current participant surface strengths: calm hierarchy, clear cards, readable mobile layout
- the workshop doctrine that the next safe move should be obvious

### Anti-references

- raw link dump / monitoring-dashboard feeling
- onboarding flow that feels like tool installation support rather than workshop support
- room-facing wording that tells people to look at phones when the facilitator is leading the exercise live
- copy that implies participants are off the happy path unless the skill is installed

### Tone / taste rules

- participant-facing copy should sound calm, direct, and in-room usable
- fallback guidance should feel normal, not apologetic
- workshop support surfaces should read as equivalent paths, not primary vs lesser path
- repo acquisition language should be practical and concrete

### Rejection criteria

The work fails if:
- Build Phase 1 still effectively requires skill install to progress
- the participant page still looks informative but not actionable
- repo access remains only a raw URL without support actions where feasible
- the revised copy still teaches "check your phone" or equivalent when the room flow is facilitator-led
- the surface becomes cluttered or loses mobile legibility

## Verification and Acceptance

### Acceptance criteria

1. The participant-surface doctrine explicitly states that the participant UI must be sufficient for workshop progression without the CLI.
2. Misleading phone / participant-board dependency copy is removed from affected opening scenes.
3. Workshop framing no longer presents skill install as an early hard dependency.
4. A reviewed preview artifact exists for the redesigned participant surface proof slice.
5. The Build Phase 1 participant surface proof slice exposes:
   - brief access
   - repo acquisition actions
   - one clear next-step CTA
   - one explicit setup-fallback path
6. The skill is still available and documented as an optional accelerator.
7. Mobile behavior remains workable and readable.

### Verification boundary

Before implementation is called done for the proof slice:
- preview artifact reviewed against design + copy + boundary criteria
- dashboard tests for touched participant-surface flows
- relevant content generation + verification if agenda content changes
- human review of the proof-slice participant surface in-browser

Expected checks for the implementation slice:
- `cd dashboard && npm run test`
- `cd dashboard && npm run test:e2e`
- `cd dashboard && npm run lint`
- `cd dashboard && npm run build`
- `npm run generate:content`
- `npm run verify:content`

If Czech visible-surface content changes, include the copy-audit Layer 1 pass and human Czech review.

## Propagation Rule

**Proof slice first.**

Do **not** rewrite every participant phase and workshop-content dependency in one pass.

Order:
1. preview + audit pack
2. content / doctrine correction
3. Build Phase 1 proof slice
4. review
5. only then broader propagation

## Session-State Artifact

At any handoff point, the repo should contain:
- this plan
- the preview artifact(s)
- the audit memo with exact scene / doc targets
- the current status of the Build Phase 1 proof slice
- a clear note on what has and has not propagated yet

## Implementation Tasks

### Phase 0 — Preview + audit gate
- [x] **0.1** Write a participant-surface audit memo naming exact files/scenes/docs to update
- [x] **0.2** Create a participant-surface proof-slice preview (HTML or static mockup)
- [x] **0.3** Write a repo acquisition matrix for public repo / private repo / starter bundle modes
- [x] **0.4** Review preview against design-system, copy, and boundary constraints

### Phase 1 — Content and doctrine correction
- [x] **1.1** Update `workshop-content/agenda.json` opening team-formation scenes to remove phone-first dependency wording
- [x] **1.2** Update `workshop-content/agenda.json` toolkit / first-ten-minutes framing to demote skill install from prerequisite to optional accelerator
- [x] **1.3** Update `content/facilitation/master-guide.md` to encode participant-surface-first fallback guidance
- [x] **1.4** Update `content/talks/context-is-king.md` and any linked demo script guidance to match the new framing
- [x] **1.5** Update `workshop-blueprint/control-surfaces.md` with the participant-surface sufficiency rule
- [x] **1.6** Update `docs/dashboard-surface-model.md` with the same rule and participant-surface responsibilities

### Phase 2 — Product design for proof slice
- [x] **2.1** Define Build Phase 1 participant-surface information hierarchy
- [x] **2.2** Define the primary CTA and supporting actions for Build Phase 1
- [x] **2.3** Define the participant-surface brief access pattern
- [x] **2.4** Define the participant-surface repo acquisition pattern
- [x] **2.5** Define the participant-surface challenge-card access pattern
- [x] **2.6** Define the setup-failure fallback copy and placement

### Phase 3 — Build Phase 1 proof-slice implementation
- [x] **3.1** Implement the Build Phase 1 participant-surface proof slice in the dashboard
- [x] **3.2** Add or update tests for the new participant-surface action hierarchy
- [x] **3.3** Verify mobile layout and interaction behavior
- [x] **3.4** Run human review on the proof slice in browser

### Phase 4 — Controlled propagation
- [x] **4.1** Decide which additional phases are safe to propagate next
- [x] **4.2** Propagate the proven pattern incrementally
- [x] **4.3** Keep docs and content aligned with each propagation step

## References

- `workshop-blueprint/control-surfaces.md`
- `docs/dashboard-surface-model.md`
- `docs/public-private-taxonomy.md`
- `docs/resource-packaging-model.md`
- `docs/harness-cli-foundation.md`
- `workshop-content/agenda.json`
- `content/facilitation/master-guide.md`
- `content/talks/context-is-king.md`
- `dashboard/app/components/participant-room-surface.tsx`
- `docs/plans/2026-04-10-feat-participant-page-redesign-plan.md`
- `docs/plans/2026-04-10-refactor-participant-cli-architecture-plan.md`
