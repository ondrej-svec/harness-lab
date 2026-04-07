# Edit Boundaries

This document is the quick answer to "what do I edit where?"

## Edit The Public Blueprint When

- you are improving the reusable workshop method
- you are changing the canonical agenda or phase descriptions
- you are clarifying participant or facilitator guidance that should apply to future workshops
- you are refining the control model, API contract, or publish-back rule

Typical locations:

- [`workshop-blueprint/`](/Users/ondrejsvec/projects/Bobo/harness-lab/workshop-blueprint)
- [`content/`](/Users/ondrejsvec/projects/Bobo/harness-lab/content)
- reusable docs in [`docs/`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs)
- shared dashboard code and skill docs

## Edit The Private Runtime Instance When

- you are changing the current phase of a live workshop
- you are revealing or hiding continuation
- you are registering teams or repo URLs
- you are capturing checkpoints, monitoring, or sprint updates
- you are attaching real event metadata such as date, venue, or facilitator notes

Typical locations:

- private database or private file-backed runtime store
- facilitator dashboard mutations
- facilitator skill commands over runtime APIs

## Never Store In The Public Repo

- real workshop dates, venues, or client names
- live team registry for a real event
- facilitator credentials or session material
- monitoring output tied to a real workshop
- facilitator-only intervention notes

## Source Map

| Topic | Public blueprint | Runtime instance | Private ops |
|-------|------------------|------------------|-------------|
| workshop framing | yes | no | no |
| canonical agenda | yes | imported copy only | no |
| current phase during a live event | no | yes | optional notes only |
| participant challenge deck | yes | completion state only | no |
| facilitator grants | no | yes | no |
| room logistics and staffing notes | no | no | yes |
| live team repo registry | no | yes | optional exports |
| post-event reusable improvement | yes, by GitHub edit | no auto-promotion | optional prep notes |

## Publishing Rule

Runtime edits stay local to the instance.

If a facilitator learns something reusable during a live event:

1. capture the learning privately if needed
2. decide whether it changes the reusable method
3. make a deliberate GitHub edit to the blueprint or related docs

The system must not imply that reset, archive, or runtime mutation writes back into the blueprint automatically.
