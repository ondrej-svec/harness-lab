# Workshop Content QA

This document is the durable review gate for workshop-content work across blueprint, dashboard-backed agenda content, participant mirrors, facilitator runner content, and learner materials.

## Blocking Checks

Every meaningful content slice should be reviewed for:

- architecture correctness
- portability and public-safe references
- authority and citation handling
- scene or artifact quality
- visible-surface Czech idiom quality when Czech delivery changed
- `facilitatorRunner` alignment where agenda-owned guidance is involved
- participant usefulness
- mobile glanceability for participant-facing surfaces
- projected-room legibility for room-facing surfaces
- locale parity

AI-assisted review is allowed as a detection aid, but it does not satisfy blocking Czech language gates on its own. Spoken-readability and visible-surface Czech signoff require a Czech-fluent human reviewer.

## Required Artifacts

Store review artifacts in `docs/reviews/workshop-content/`.

Each review note should include:

- slice name and date
- files under review
- locale coverage
- what was previewed
- what passed
- what failed
- the next safe move

When previews matter, attach or link:

- mobile participant capture
- projected-room or presenter capture
- side-by-side locale note when both English and Czech changed
- short Czech visible-surface/spoken-readability note when visible Czech changed

## Minimum Review Pack By Change Type

### Architecture or portability change

- source-of-truth note updated
- portability checklist completed
- any new environment or deployment requirement documented

### Proof-slice content rewrite

- scene audit classification
- preview note for room-facing scenes
- participant mirror usefulness note
- facilitator runner note
- locale parity note
- visible-Czech note when the proof slice changed Czech delivery

### Broad rollout

- proof-slice note linked
- unchanged gate results referenced or re-run where needed
- drift check against this QA list
- spot-check note that visible Czech still clears the headline/idiom bar on the propagated scenes

## Completion Recording

A content slice is only complete when all three are true:

1. the relevant plan checkboxes are updated
2. the review note exists under `docs/reviews/workshop-content/`
3. the final handoff states what was verified and what still needs human review
