---
title: "Optional Team Mode — Participant-First Toggle"
type: brainstorm
date: 2026-04-21
participants: [Ondrej, Heart of Gold]
related:
  - docs/adr/2026-04-19-name-first-identify-with-neon-auth.md
  - docs/adr/2026-04-06-workshop-event-access-model.md
  - docs/plans/2026-04-16-feat-participant-management-and-team-formation-plan.md
  - docs/solutions/infrastructure/facilitator-admin-production-state-and-schema-drift.md
  - docs/reviews/workshop-content/2026-04-20-participant-moments-opening.md
  - memory: feedback_participant_copy_voice
---

# Optional Team Mode — Participant-First Toggle

## Problem Statement

The workshop was designed team-first: shared repos, upfront rotation schedules, team-level checkpoints, team progression. In practice, strict team mechanics are hard to arrange — remote participants, odd group sizes, and inability to commit upfront to rotation all make real team work the exception rather than the rule. Participant-mode is expected to be the **common** case going forward.

We need the workshop to support both modes from one admin toggle, without compromising the voice or experience of either.

## Context

**What exists:**

- Team concept is pervasive: `team-repository.ts`, `team-members-projection.ts`, `team-composition-history.ts`, `team-randomize.ts`, checkpoints (team-scoped), `rotation-signals` API, scene advancement through teams, admin `teams-section.tsx` and `people-section.tsx`, participant-facing team context in `participant-room-surface.tsx`, team-named strings in `agenda-cs.json` / `agenda-en.json`.
- Schema assumes team membership for auth/write scope: `findMemberByParticipant(participantId)` gates writes.
- Checkpoints are team-scoped in the data model (per `feat-participant-management-and-team-formation-plan`).
- Rotation lives in `workshop_state` JSONB and has legacy-tolerance normalization (per the 2026-04-20 schema-drift incident).

**Config pattern to mirror:** `allow_walk_ins` (migration `2026-04-20-participant-auth.sql`) — first-class boolean column on `workshop_instances`, radio-pair form in an admin section, `"use server"` action, direct repository read in participant Server Components, schema-drift guard via `loadWorkshopInstanceColumnSupport`.

**Copy-voice standing rules** (`feedback_participant_copy_voice.md`):
1. Defocus rescue/survives motif on participant surfaces — use `obstojí`, `dokáže pokračovat`, `stand on its own`, `be continued`.
2. Name the continuation triad explicitly — CS `další tým, člověk nebo agent` / EN `another team, teammate, or agent`. **This rule only covers team mode today.** Participant mode needs a parallel sanctioned triad.

**No prior brainstorm** has discussed making teams optional. This is new territory.

## Chosen Approach

One admin-level boolean per workshop instance: **`team_mode_enabled`**.

- **ON** → current team-based experience, unchanged.
- **OFF** → teams invisible everywhere on participant surfaces; checkpoints, progress, and room view attach to the participant directly; rotation, team randomizer, and composition history are hidden (not rendered).

Architecturally this is **Approach C-refined**: introduce a `ProgressSubject` abstraction (`{ type: 'team' | 'participant', id }`) as the unit of attachment for concepts that genuinely unify across modes — **checkpoints, progress, participant room view, scene progression**. Concepts that are genuinely team-specific — **rotation, team randomizer, composition history** — remain team-only features and are gated by the toggle (not generalized under `ProgressSubject`).

## Why This Approach

**Why a single toggle.** Facilitators need one clear mental model. Per-mechanic toggles would explode the settings surface for no evidence of real demand for intermediate states.

**Why pure participant UX in off-mode (not loose team labels).** Clean semantic split. Showing "your group" hints at a concept that isn't active and invites follow-up questions the UI can't answer.

**Why Approach C-refined over A or B.**
- **A (synthetic solo-team)** ships smallest but leaks: rotation logic still executes over 1-member teams, data says "teams" when UX says "participants," and copy code must constantly suppress team language over data that contains teams. That leak will take an afternoon of debugging for every new team-scoped feature.
- **B (nullable team membership)** adds an `if (teamMode)` branch at every team-scoped touch point. Given team-concept pervasiveness, that's a distributed tax that grows with the codebase.
- **C-full (unify everything under `ProgressSubject`)** would force rotation/randomizer/composition under a shared abstraction they don't fit. Rotation for a solo participant is meaningless; randomizing a solo participant is meaningless. Keeping them team-only is the honest model.
- **C-refined** concentrates the structural win where it pays off (the pervasive progress-tracking code) and leaves genuinely team-only features alone behind the toggle.

**Why default FALSE for new instances, TRUE backfill for existing.** Participant mode is expected to be the common case — defaulting new instances there matches the dominant future state. Existing instances backfill to TRUE to preserve already-configured workshops (and to avoid disturbing any running workshops at migration time).

## Subjective Contract

- **Target outcome:** In off-mode, a participant completes the full flow (sign-in → room → checkpoint) without encountering any team concept in CS or EN. In on-mode, the experience is indistinguishable from today.
- **Anti-goals:**
  - No "team of one" fiction visible to participants or in data semantics.
  - No leaky team language in off-mode ("your teammate," "your team's checkpoint").
  - No settings-page explosion (one switch, not per-mechanic toggles).
  - No generalizing rotation/randomizer under `ProgressSubject` just because it's possible.
- **References:**
  - `allow_walk_ins` — pattern for first-class boolean + radio form + server action + participant Server Component read (see `access-section.tsx`, `access.ts`, `participant/page.tsx:58-65`).
  - `workshop-instance-repository.ts:213-233` — schema-drift column-support probe pattern.
  - Commits `831e7d1`, `cb44fc1`, `148d576` — established house phrases for the team-mode triad and continuation voice.
- **Anti-references:**
  - JSONB settings bag for this toggle — the repo's pattern is first-class columns for behavior flags.
  - Backward-compat wrapping of old checkpoint shapes (per `archive/2026-04-12` plan, Decision 3).
  - Synthetic solo-team fiction (Approach A).
- **Tone / taste rules:**
  - Team-mode triad (existing, unchanged): CS `další tým, člověk nebo agent` / EN `another team, teammate, or agent`.
  - **Participant-mode triad (new sanctioned rule):** CS `další účastník, člověk nebo agent` / EN `another participant, teammate, or agent`. Correct variant selected by instance `team_mode_enabled`.
  - Defocus-rescue rule applies in both modes.
- **Rejection criteria:**
  - Either triad missing in its mode.
  - "Teammate" or "tým" leaks onto a participant surface when `team_mode_enabled = false`.
  - Any query crashes on a null team reference in participant mode.
  - Rotation / randomizer UI renders an empty state in off-mode instead of not rendering at all.
  - A participant in off-mode sees "checkpoint of [team]" anywhere, CS or EN.

## Preview And Proof Slice

- **Proof slice:** One workshop instance flipped to `team_mode_enabled = false`. A single participant completes sign-in → room → one checkpoint → agenda scene advance. CS first, then EN. Zero team references on any surface.
- **Required preview artifacts:**
  - Screenshots of the participant room in both modes, both languages.
  - Screenshot of the admin section exposing the toggle.
  - A checkpoint entry rendered in both modes (team-scoped vs. participant-scoped).
- **Rollout rule:** Ship with default FALSE for new instances, default TRUE backfill for existing. Do not flip any existing instance automatically. Facilitators who want participant mode create a new instance or explicitly toggle.

## Key Design Decisions

### Q1: Granularity of the toggle — RESOLVED

**Decision:** One admin-level boolean (`team_mode_enabled`) per instance, not per-mechanic.

**Rationale:** Simpler facilitator mental model. No evidence of real demand for intermediate states (e.g., "teams but no rotation"). Keeps the settings surface honest.

**Alternatives considered:**
- Per-mechanic toggles (shared repo, rotation, checkpoints independently) — rejected as over-flexible with no demonstrated need.

### Q2: What falls on each side of the switch — RESOLVED

**Decision:** Switch OFF = pure participant experience. Teams are invisible in participant UX — not even as a loose social label.

**Rationale:** Clean semantic split. Loose labels invite follow-up questions ("who's in my group, what do they do") the UI can't answer in off-mode.

**Alternatives considered:**
- Loose team labels with no mechanics — rejected as noise when the toggle says "off."
- Per-instance facilitator choice between loose/off — rejected as another axis of settings.

### Q3: Architectural approach — RESOLVED

**Decision:** Approach C-refined. Introduce `ProgressSubject = { type: 'team' | 'participant', id }` for concepts that genuinely unify (checkpoints, progress, room view, scene progression). Keep rotation, team randomizer, and composition history as team-only features gated by the toggle.

**Rationale:** Team concept is pervasive; distributed branch-cost (Approach B) grows with surface area. Concentrating the abstraction at one boundary pays off. Forcing team-only features under `ProgressSubject` (C-full) adds noise without benefit — rotation of one participant is meaningless.

**Alternatives considered:**
- **A (synthetic solo-team):** rejected — leaky abstraction. Rotation still executes over 1-member teams; copy must suppress team language over data that has teams; every new team feature risks leaking into off-mode.
- **B (nullable team membership):** rejected — adds `if (teamMode)` branches at every team-scoped call site; distributed tax that grows with codebase.
- **C-full (unify everything):** rejected — rotation/randomizer/composition are genuinely team-specific; forcing them under a subject abstraction adds noise without benefit.

### Q4: Copy triad for participant mode — RESOLVED

**Decision:** CS `další účastník, člověk nebo agent` / EN `another participant, teammate, or agent`. Parallel sanctioned rule to the existing team-mode triad.

**Rationale:** Preserves the workshop thesis (work transfers cleanly between humans AND agents) while naming the social context actually present in participant mode (fellow participants in the room, not a team).

**Alternatives considered:**
- Drop the third term entirely ("human, agent") — rejected; loses the human↔agent continuity thesis.
- "You / yourself" as third term — awkward reflexive.
- "Facilitator, human, agent" — misframes who picks up work.

### Q5: Default for new vs. existing instances — RESOLVED

**Decision:** New instances default `team_mode_enabled = FALSE` (participant mode). Existing instances backfill to TRUE on migration.

**Rationale:** Participant mode is the expected common case; defaulting new instances there matches the dominant future state. Backfilling existing to TRUE preserves already-configured workshops and avoids disturbing any running instance at migration time.

**Alternatives considered:**
- Uniform default TRUE — safer, but forces facilitator to opt out for the common case.
- Uniform default FALSE — breaks existing in-flight workshops.

### Q6: Treatment of the existing copy-voice memory rule — RESOLVED

**Decision:** Keep the existing team-mode triad rule unchanged. Add a parallel participant-mode triad rule. Instance mode selects the correct variant.

**Rationale:** Voice consistency is load-bearing; silent drift from one triad to another would erode it. Explicit parallel rules are auditable.

**Note:** This does not change the `feedback_participant_copy_voice.md` memory today — update that memory when the feature ships and the rule becomes operative.

## Open Questions

- **Mid-workshop toggle policy.** Should `team_mode_enabled` be editable when instance `status = 'running'`? Lean: **no — lock once running** to avoid mid-flight data/UI inconsistency. Revisit if a real need emerges.
- **Checkpoints data shape under `ProgressSubject`.** Three viable shapes: polymorphic `(subject_type, subject_id)` columns with a check constraint; nullable `team_id` + `participant_id` with a XOR constraint; dedicated `progress_subjects` table with an FK from checkpoints. Defer to `/plan`.
- **Auth scope rewrite for participant-mode writes.** Current authorization routes through `team_members` lookup (`findMemberByParticipant`). Participant mode needs direct participant-scoped authorization. Shape and scope defer to `/plan`.
- **Admin UI label wording.** "Workshop mode: Team-based / Participant-only" vs. "Enable teams" checkbox vs. something else. Decide at implementation time based on facilitator UX.
- **Schema-drift guard.** New `team_mode_enabled` column must be registered in `loadWorkshopInstanceColumnSupport` (`workshop-instance-repository.ts:213-233`) and added to `buildInstanceSelectList` / `buildCreateInstanceQuery` / `buildUpdateInstanceQuery`. Normal discipline — note in `/plan`.
- **Copy coverage audit.** Every string in `agenda-cs.json` and `agenda-en.json` that references team/tým/teammate/parťák needs review: which variant applies, or does the string need mode-conditional branches?

## Out of Scope

- **Per-mechanic toggles** (independent switches for repo, rotation, checkpoints).
- **Loose teams** (teams as social labels without mechanics).
- **A third mode** beyond team / participant.
- **Rotation in participant mode** — rotation is meaningless for single participants; hidden, not generalized.
- **Team randomizer in participant mode** — hidden.
- **Composition history in participant mode** — hidden; no teams means no composition to track.
- **Removing team mode** — this is additive; team mode is unchanged.
- **Backward-compat wrapping of old checkpoint shapes** — per Decision 3 of the archived 2026-04-12 plan, breaking migration is acceptable.
- **UI for migrating an existing workshop from team to participant mid-flight** — not supported; create a new instance instead.

## Next Steps

- **`/plan`** to turn these decisions into an implementation plan. Expected scope:
  - Migration adding `team_mode_enabled` to `workshop_instances` (DEFAULT TRUE so existing rows backfill safely; code flips default to FALSE for new-instance creation path).
  - `loadWorkshopInstanceColumnSupport` + query-builder updates.
  - `ProgressSubject` abstraction + checkpoint data-shape decision.
  - Auth scope rewrite for participant-mode writes.
  - Admin section + server action (mirror `access-section.tsx` / `access.ts`).
  - Participant-surface branches for room view, progress, scene progression.
  - CS + EN copy updates with the new participant-mode triad.
  - Gating (hide-rather-than-empty) for rotation, team randomizer, composition history in off-mode.
  - Regression test covering both modes for at least one full participant flow.
- **`/compound`** candidate: the `ProgressSubject` polymorphic-domain-entity pattern is novel for this codebase. If it ships clean, document it as a reusable pattern for unifying related concepts without forcing them under one type.
- **Memory update** (when feature ships): extend `feedback_participant_copy_voice.md` with the participant-mode triad variant.
