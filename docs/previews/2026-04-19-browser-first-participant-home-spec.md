# Browser-First Participant Home Spec

Supports:
- `docs/plans/archive/2026-04-19-refactor-browser-first-participant-home-plan.md`
- `docs/brainstorms/2026-04-19-participant-ui-browser-first-brainstorm.md`

Status:
- preview + implementation contract
- proof-slice scope: Build Phase 1 first, reusable shell for later phases

## Preview verdict

This preview authorizes implementation.

Reason:
- the first screen keeps one dominant next-step block
- `Next / Build / Reference` are structurally distinct, not relabeled copies of `room / teams / notes`
- the checkpoint feed is clearly live residue, not a note wall
- mobile reading order stays explicit

## Desktop structure preview

1. Site header
   - brand
   - `Next / Build / Reference` anchor nav
   - language + theme controls

2. `Next`
   - current phase and next block
   - one dominant action block
   - compact room context:
     - my team / pair / solo state
     - session horizon
     - shared room note count
   - one support line that normalizes the browser-first path

3. `Build`
   - brief summary
   - repo / starter actions
   - challenge-card prompts
   - structured checkpoint capture
   - chronological checkpoint feed with scope filters
   - secondary accelerator card for CLI / skill
   - compact room materials list when the participant is not bound to one team

4. `Reference`
   - curated defaults
   - optional accelerators
   - explore-more links

## Mobile reading order

1. context line
2. `Next` section label
3. dominant next-step block
4. compact working context
5. brief summary
6. repo / starter actions
7. setup fallback
8. challenge prompts
9. structured checkpoint form
10. checkpoint feed
11. accelerator card
12. reference defaults
13. explore-more links
14. logout

Rule:
- `Build` and `Reference` stay reachable, but the first viewport still answers `what do I do now?`

## Section contracts

### `Next`

Job:
- answer the dominant participant question immediately

Must contain:
- live phase title
- one-sentence phase objective
- next block label
- one singularly dominant action cluster
- compact support context rather than a dashboard

Primary actions in the Build Phase 1 proof slice:
1. open the brief
2. get team materials
3. jump to checkpoint capture if blocked or ready to log evidence

### `Build`

Job:
- hold the minimum working set without making the page feel like an ops cockpit

Must contain:
- brief access
- repo or starter access
- challenge prompt access
- compact working-mode context
- visible fallback
- secondary CLI / skill accelerator guidance
- structured checkpoint capture and feed

### `Reference`

Job:
- keep evergreen help reachable without overpowering the home

Must contain three groups:
1. curated defaults
2. optional accelerators
3. explore more

Seam:
- render through a projection helper, not hard-coded JSX lists spread across the component tree
- the helper may currently adapt `setupPaths` and repo-linked docs
- later catalog work can replace or extend the same helper without reshaping the UI contract

## Checkpoint feed preview

### Feed shape

Each item shows:
- team name
- participant attribution when available
- phase label
- timestamp
- structured evidence
  - what changed
  - what verifies it
  - next safe move

Legacy compatibility:
- older team check-ins without structured fields still render as plain text items

### Filter model

First proof slice filters:
- room
- current phase
- my team
- mine

Default:
- `my team` when the participant has a bound team
- otherwise `current phase`

### Data-model decision

Use a bridge implementation for the proof slice:
- keep `TeamCheckIn[]` as the persistence seam
- extend each entry with optional structured/provenance fields
- derive a room-wide chronological feed from all team check-ins

Why this bridge is acceptable now:
- it adds provenance and structure without colliding with the separate facilitator runtime refactor already in progress
- it preserves current presenter/admin consumers of team check-ins
- it leaves a documented path to a later normalized participant-signal store if feed needs outgrow the team seam

Migration note:
- if later work needs moderation, richer identity guarantees, or feed items not owned by a team, promote the bridge shape into a dedicated normalized participant-signal model

## Structured checkpoint submission schema

Proof-slice schema:
- `changed`
- `verified`
- `nextStep`

Stored fields on the team check-in:
- `participantId` when available
- `writtenBy`
- `phaseId`
- `writtenAt`
- the three structured evidence fields above
- `content` as a human-readable fallback / legacy projection

## Design-system review

Checked against:
- `docs/dashboard-design-system.md`
- `docs/dashboard-surface-model.md`
- `docs/reviews/2026-04-19-participant-surface-proof-slice-review.md`

Result:
- calm hierarchy preserved
- one dominant CTA remains enforceable
- live feed stays distinct from reference material
- mobile reading order is explicit enough to implement safely

## New recurring pattern

This work introduces one new recurring participant pattern:

`participant home shell`
- stable three-section home
- dominant `Next` card
- quiet `Build` working set
- evergreen `Reference`
- live structured feed inside `Build`, not as top-level social chrome

This requires same-slice updates to:
- `docs/dashboard-design-system.md`
- `docs/dashboard-surface-model.md`
