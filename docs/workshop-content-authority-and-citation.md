# Workshop Content Authority And Citation

Harness Lab should use authority as proof, contrast, or memory support, not as decoration.

Use this document before adding quotes, citations, or named expert references to room-facing, participant-facing, or learner-facing workshop content.

## Allowed Jobs For Authority

An authority cue is allowed only when it does at least one of these jobs:

- sharpens a contrast the room should remember
- adds trust to a non-obvious workshop claim
- anchors a teaching move in a primary source
- gives participants a durable next reference worth opening after the workshop

If the line would still teach cleanly without the authority cue, prefer cutting it.

## Approved Forms

### 1. Repo-derived source anchor

Use `sourceRefs` to point back to the underlying authored workshop material:

- `content/talks/*.md`
- `content/facilitation/*.md`
- `materials/*.md`
- reviewed workshop docs in `docs/`

This is the default form for most workshop content.

### 2. Attributed quote block

Use a presenter `quote` block only when the wording itself is part of what the room should remember.

Requirements:

- visible attribution on the room-facing surface
- a primary source recorded in plan, review note, or source registry
- one dominant voice per scene

### 3. Proof-bearing callout or learner reference

Use a short cited callout or reference link when the participant or learner needs a next step grounded in a real source rather than workshop folklore.

## Review Rules

Before an authority cue ships, confirm:

- why this authority cue is needed
- what teaching job it does
- where the primary source lives
- whether Czech and English delivery stay semantically aligned
- whether the cue still works when spoken aloud

Reject the cue if it:

- only makes the scene feel more premium
- repeats what the facilitator already says
- turns the slide into a quote wall
- introduces a second dominant voice in the same scene
- relies on a weak or secondary source when a primary source exists

## Localization Rule

- English and Czech should preserve the same claim, not necessarily the same sentence shape.
- Short named attributions may remain in the source language when that is clearer and more honest.
- Do not localize a quote loosely enough that it stops being attributable.

## Maintenance Rule

If the same authority cue is likely to recur:

1. document it in a reusable source doc or review note
2. record the primary source
3. avoid copying the same unattributed line into multiple scenes
