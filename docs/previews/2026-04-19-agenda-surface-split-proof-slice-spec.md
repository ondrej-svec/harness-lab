# Agenda Surface Split Proof Slice Spec

Preview artifact for Phase 0 of [`2026-04-19-feat-agenda-scene-surface-split-and-lightweight-interaction-plan.md`](../plans/2026-04-19-feat-agenda-scene-surface-split-and-lightweight-interaction-plan.md).

This file is the contract preview, not the runtime source of truth. It exists so the product split can be reviewed before runtime and content-model changes propagate.

## Why this preview exists

Current authored proof-slice shape in `workshop-content/agenda.json`:

- `opening`: 5 room scenes, 1 participant scene
- `talk`: 7 room scenes, 0 participant scenes
- `demo`: 4 room scenes, 0 participant scenes

That confirms the plan diagnosis:

- room scenes still carry too many beats in facilitator-led moments
- participant relevance still collapses back to agenda-derived guidance during `talk` and `demo`
- there is no explicit live contract for participant changes inside one agenda item

## Product vocabulary

### Room scene

A room scene is the single room-safe projection beat for the current workshop moment.

Rules:

- one dominant idea
- no facilitator-only detail
- no participant-only task list unless the whole room must act now
- must answer: what should the room see right now?

### Participant moment

A participant moment is the participant-safe live slice inside an agenda item.

Rules:

- owned by the agenda item, but not part of the room projection deck
- answers: should I act, watch, or just stay oriented right now?
- can change within one agenda item
- may carry CTA metadata and optional interaction metadata
- if absent, the system falls back to a conservative neutral state rather than reconstructing guidance from room copy

### Backstage facilitator support

Backstage facilitator support is the facilitator-only operating layer for the current live moment.

Rules:

- includes timing cues, optional phrasing, watch-fors, fallback moves, and source refs
- optimized for scan speed in `Run`
- never projected by default
- should help a facilitator run the beat without reading from the room screen

### Room signal poll

A room signal poll is a short, scene-bound, predefined-option check-in that produces anonymous aggregate output.

Rules:

- opened from the current live moment
- predefined options only
- aggregate only on room screen
- no free-text answers
- no participant identity on the room-facing result
- must feel like a workshop signal, not a game mechanic

### Participant feedback

Participant feedback is the always-available private lane for blockers and facilitator questions.

Rules:

- facilitator-private by default
- scoped to `blocker` or `question`
- attached to the current agenda item and participant moment when available
- promotable into a room-safe note only by explicit facilitator action

## Surface contract

| Surface | Dominant question | Proof-slice answer |
| --- | --- | --- |
| Room projection | What should the room see right now? | One minimal beat, no backstage detail |
| Participant surface | Does this matter to me right now? | Explicit action or watch state, not presenter prose |
| Facilitator support | What is live, what matters next, what is safe to do? | Backstage script, signals, and private feedback |

## Proof-slice preview

## `opening`

### Room projection

Keep:

- `opening-framing`
- `opening-day-arc`
- `opening-team-formation-room`
- `opening-handoff`

Move off the room screen:

- the detailed day schedule
- facilitator rationale for why participant surface appears later

Intended result:

- the opening reads as ambition, day shape, team formation, then transition
- the room does not get a schedule card plus activation instructions plus backstage commentary in one pass

### Participant moments

Previewed participant moments:

1. `opening-join-team`
   Participant answer: stand up, line up, count off, claim anchor.
2. `opening-team-settle`
   Participant answer: sit, introduce, choose team name, wait for board confirmation.
3. `opening-look-up`
   Participant answer: team is recorded, room is moving into the talk.

### Backstage support

Backstage content for `opening` should hold:

- the detailed schedule that no longer needs projector weight
- facilitator timing cues for the experience line and count-off
- stall handling for team formation
- the reminder that participant surface appears only at the activation beat, not as a parallel deck

## `talk`

### Room projection

Previewed room stack:

1. something changed
2. why this matters now
3. the four pillars
4. managing agents changes your role
5. bridge back into the repo

Move off the room screen:

- supporting explanation that repeats the spoken line
- source-led quote density that is useful to the facilitator but not necessary for one-glance projection

Intended result:

- the talk still has a narrative spine
- the room sees clear beats, not a room-safe lecture transcript

### Participant moments

Previewed participant moments:

1. `talk-listen`
   Participant answer: stay with the room, no action yet.
2. `talk-note-one-gap`
   Participant answer: identify one repo gap your team already suspects.
3. `talk-ready-for-build`
   Participant answer: prepare to return to the repo with one map, one boundary, one proof target.

### Poll preview

Poll location:

- `talk-note-one-gap`

Prompt:

- Which part of your repo is weakest right now?

Options:

- map
- boundaries
- instructions
- verification

Room result:

- aggregate bars only
- no names, no team labels

Facilitator use:

- see where the room is under-specified before Build 1 starts

### Backstage support

Backstage content for `talk` should hold:

- optional quote support
- contrast examples for the same-prompt framing
- timing notes for when to cut depth and move to Build 1
- the explicit bridge sentence from talk into repo work

## `demo`

### Room projection

Previewed room stack:

1. same prompt, two repos
2. what made the difference
3. your toolkit, same discipline
4. your first ten minutes

Move off the room screen:

- facilitator-level narration detail
- any implementation trivia that does not help the room understand the contrast

Intended result:

- the demo shows causal contrast
- the room sees why the repo changed the outcome, not just what commands were run

### Participant moments

Previewed participant moments:

1. `demo-watch-the-contrast`
   Participant answer: watch which repo artifact changes the agent's behavior.
2. `demo-name-your-first-artifact`
   Participant answer: decide what your team will create first in your repo.
3. `demo-open-build-brief`
   Participant answer: move into Build 1 with the right working materials open.

### Feedback preview

Always-available participant action:

- `Blocked or have a facilitator question?`

Submission shape:

- type: `blocker` or `question`
- short free-text field
- optional team association from the current participant session

Facilitator review:

- appears in `Run` beside current live moment support
- newest first
- explicit action: `promote to room-safe note`

Room behavior:

- nothing appears publicly unless the facilitator promotes it

### Backstage support

Backstage content for `demo` should hold:

- exact repo artifacts to call out in the contrast
- fallback screenshots if live demo timing slips
- a short bridge into Build 1 when the contrast lands

## Dominant-question check

Against `docs/dashboard-design-system.md` and `docs/dashboard-surface-model.md`, this preview is correct only if:

- room first viewport answers the current beat immediately
- participant first viewport answers whether action is required now
- facilitator `Run` answers what is live, what changed, and what intervention is safe

This preview intentionally rejects:

- participant screens that mirror presenter choreography all day
- room scenes that still carry backstage detail
- poll mechanics that look like a quiz product
- private participant feedback that leaks by default

## Next move if approved

If Ondrej signs off on this preview gate, Phase 1 should:

1. add `participantMoments` to the shared agenda/runtime contract
2. add persisted live-moment state that can name the active room beat and participant moment
3. keep poll responses and participant feedback outside `WorkshopState`
4. implement the proof slice only before any wider agenda rollout
