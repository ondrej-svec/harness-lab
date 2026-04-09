# Autonomous Planning Proving Ground

This document proves the hardened planning model on one real mixed UI+copy Harness Lab slice.

## Chosen Slice

Use the public homepage first screen as the proving ground:

- hero
- supporting body copy
- principles band

This is a real Harness Lab slice because it combines:

- visible UI hierarchy
- participant-facing product framing
- tone-sensitive Czech and English copy
- mobile readability

## Why This Slice

It is small enough to reason about, but subjective enough that prose-only plans are not sufficient.

The existing work already gave us good repo history:

- [`brainstorms/2026-04-07-public-homepage-copy-brainstorm.md`](./brainstorms/2026-04-07-public-homepage-copy-brainstorm.md)
- [`plans/2026-04-07-docs-public-homepage-copy-plan.md`](./plans/2026-04-07-docs-public-homepage-copy-plan.md)

That makes it a good proving ground for the hardened method instead of a synthetic example.

## Prior Baseline

The prior workflow already had strong qualities:

- clear problem framing
- explicit approach comparison
- bilingual alignment
- real verification expectations

But it still left some work to post-implementation judgment:

- no visual proof slice before implementation
- no anti-reference list for tone or hierarchy
- no preview review gate before touching the live surface

## Hardened Plan Contract For This Slice

### Target Outcome

The first screen should explain Harness Lab in one pass as disciplined team work with AI coding agents, then differentiate it without sounding like internal architecture notes or AI-manifesto copy.

### Anti-Goals

The surface must not become:

- repo-first
- slogan-heavy
- startup-polished but vague
- visually busy
- dependent on desktop-only composition

### References

- [`dashboard-design-system.md`](./dashboard-design-system.md)
- [`brainstorms/2026-04-07-public-homepage-copy-brainstorm.md`](./brainstorms/2026-04-07-public-homepage-copy-brainstorm.md)
- [`content/style-guide.md`](../content/style-guide.md)
- [`content/style-examples.md`](../content/style-examples.md)

### Anti-References

Reject directions that feel like:

- architecture documentation on a marketing page
- generic AI workshop boilerplate
- cards that compete with the hero for attention
- hero copy that only works in English-ish Czech

### Tone Rules

- calm first
- precise before clever
- one line of edge is enough
- natural Czech and plain English beat slogan density

### Representative Proof Slice

Prove only the hero and principles band before touching deeper homepage sections or propagating the same framing elsewhere.

### Rollout Rule

Do not propagate this framing into other public or participant surfaces until the proof slice passes preview review.

### Rejection Criteria

Reject the slice if any of these are true:

- the first screen still foregrounds repo mechanics over workshop purpose
- the hero and principle cards feel like separate narratives
- the copy sounds translated, corporate, or generic
- mobile wrapping obscures the main message
- the principles band adds concepts instead of reinforcing the hero

## Required Preview Artifacts

The proof slice now has explicit preview artifacts:

- HTML preview: [`previews/2026-04-09-public-homepage-proof-slice.html`](./previews/2026-04-09-public-homepage-proof-slice.html)
- ASCII preview: [`previews/2026-04-09-public-homepage-proof-slice.txt`](./previews/2026-04-09-public-homepage-proof-slice.txt)

## Preview Review Gate

### Design Critic Pass

Checks:

- one dominant first-screen hierarchy
- calm visual family
- principles band reinforces rather than competes
- mobile stacking remains legible

Result:

- pass if the hero owns the frame and the cards read as reinforcement
- fail if the cards become equal-weight marketing tiles

### Copy Critic Pass

Checks:

- natural spoken Czech
- no blended voice between public framing and internal doctrine
- strong but restrained English parity

Result:

- pass if the copy sounds like an experienced peer
- fail if key lines sound translated or sloganized

### Boundary Auditor Pass

Checks:

- no room-specific or facilitator-private context leaks into the public page
- public copy keeps the blueprint / private instance distinction accurate

Result:

- pass if the page stays public-safe while still explaining the workshop clearly

## Comparison Against The Prior Baseline

| Area | Prior flow | Hardened flow |
| --- | --- | --- |
| Copy direction | Strong | Strong |
| Visual contract | Implicit | Explicit preview artifacts |
| Anti-references | Implicit | Named |
| Proof slice | Implicit | Explicit |
| Review gate | After implementation | Before implementation |
| Broad rollout discipline | Assumed | Named |

## What Generalizes

The generalizable part is not "homepage copy."

The generalizable part is this pattern:

1. use a real subjective slice
2. require a preview artifact
3. add named anti-goals, anti-references, and rejection criteria
4. let review challenge the preview before autonomous implementation

That belongs upstream in the toolkit.

The homepage-specific tone, mobile priorities, and public/private wording rules remain Harness Lab doctrine.
