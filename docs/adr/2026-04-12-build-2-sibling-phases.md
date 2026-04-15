# ADR: Build Phase 2 as Two Sibling Phases Around Intermezzo 2

**Date:** 2026-04-12
**Status:** Accepted
**Deciders:** Ondrej

## Context

The 2026-04-12 content review brainstorm restructured the afternoon of the workshop. In the original schedule, Build Phase 2 ran uninterrupted from 13:45 to 14:45 with Intermezzo 2 starting at 14:45 as a reflection at the end of the build. During review, we decided Intermezzo 2 should be a **mid-point pause** inside Build 2 rather than an endpoint — teams build, pause to check in with the room, then go back to building for a second push before Reveal.

The new intended schedule:

- 13:45–14:30 · Build Phase 2 · first push (45 min)
- 14:30–14:50 · Intermezzo 2 · mid-point pause (20 min)
- 14:50–15:30 · Build Phase 2 · second push (40 min)
- 15:30–15:45 · Pre-Reveal buffer
- 15:45–~16:45 · Reveal

This raises a schema question: how do we model "Build 2 is one phase conceptually, but Intermezzo 2 happens in the middle of it" in `workshop-content/agenda.json`?

The current schema (schemaVersion 3) treats phases as a flat array with `order: number` and non-overlapping time ranges. Phases are siblings, not nested. The generator (`scripts/content/generate-views.ts`), the dashboard loader (`dashboard/lib/workshop-data.ts`), and the presenter selection logic (`dashboard/lib/presenter-scenes.ts`) all assume this flat model.

Two ways to represent the split:

**Option A — Nest Phase 9 Intermezzo 2 inside Phase 8 Build 2.** Introduce a `children` field on phases so Phase 8 can contain Intermezzo 2 as a sub-phase. Requires:
- Schema change: `Phase.children?: Phase[]`
- New recursive validation in the generator
- New recursive loader logic in the dashboard
- New presenter selection that understands nested phases
- Updated admin scene editor to handle nested structure
- Migration for any code that loops over phases flatly

**Option B — Split Phase 8 into two sibling phases.** Phase 8 becomes "Build Phase 2 · first push" (13:45–14:30). A new phase, call it Phase 9, becomes "Build Phase 2 · second push" (14:50–15:30). Intermezzo 2 (previously Phase 9) becomes Phase 10. Reveal (previously Phase 10) becomes Phase 11. No schema change; the day's phase count goes from 10 to 11.

## Decision

**Adopt Option B — split Build Phase 2 into two sibling phases.**

Concretely:

- Keep the existing flat phase array. `schemaVersion` stays at 3.
- Add a new phase entry after the mid-point pause in `workshop-content/agenda.json`. Label: "Build Phase 2 · second push." Intent: `build`. Kind: `team`. Start time: 14:50.
- Rename the existing `build-2` phase to "Build Phase 2 · first push" (internal id can stay `build-2` for minimal churn; the new sibling gets a new id, e.g., `build-2-second`).
- Re-number phases that follow. Intermezzo 2 moves from `order: 9` to `order: 10`. Reveal moves from `order: 10` to `order: 11`.
- The day schedule scene (Phase 1 Scene 1.3) shows two "Build Phase 2" entries in the timeline. This is mildly redundant visually but is the honest representation of what happens in the room.
- Both Build Phase 2 phases share the same scene kickoff shape (mirroring Build Phase 1) and the same stuck-recovery pattern. The first push includes the quiet read from rotation and the capture-friction beat; the second push is iteration and final cleanup.

## Rationale

Option A is the more elegant model — "Intermezzo 2 is a pause inside Build 2" maps directly to a nested structure. But elegance is not worth the cost here:

- The current schema is flat and has no precedent for nesting. Every downstream consumer (generator, loader, presenter, admin editor, tests) assumes flat siblings with `phases.length` and `phases[index]` access. Introducing nesting means touching all of them at once.
- The semantic gain of nesting is minimal — the room experiences the two pushes as two distinct building periods with a pause in between, not as one continuous session with an interruption. The sibling model reflects that experience accurately.
- Option B is additive. We add one phase entry to the JSON and update an `order` field on two existing phases. No code touches the phase traversal model. The only downstream cost is grepping for hardcoded `10` phase counts and fixing them to use `phases.length`.

The visual redundancy of two "Build Phase 2" labels in the day schedule is real but easily mitigated by how the facilitator narrates the opening — "we have two building periods this afternoon with a short pause between them." The day schedule scene can also label them as "Build · first push" and "Build · second push" to make the continuity visible.

## Consequences

- **Positive:** No schema change. No migration. Additive edit to `workshop-content/agenda.json`. Downstream code unaffected except where it assumed a fixed phase count.
- **Positive:** Scene 8.1 kickoff pattern and Scene 8.3 stuck-recovery pattern can be reused for the second push phase. Less new scene content to author.
- **Positive:** Facilitator runner notes for Build 2 apply to both pushes symmetrically.
- **Negative:** The day's phase count goes from 10 to 11. Any code with hardcoded `10` or assumptions of `phases.length === 10` breaks until updated. (This is captured as a risk in the implementation plan and the task is to grep for such assumptions.)
- **Negative:** Two phases with similar labels can look confusing in a dense phase list. Mitigated by distinct suffixes ("first push" / "second push") and facilitator narration.
- **Neutral:** Future schema work that wants to introduce real phase nesting (for whatever reason) is not blocked by this decision. If nesting ever becomes useful for another reason, we can revisit.

## References

- [Brainstorm: Workshop Agenda Content Review — 2026-04-12](../brainstorms/2026-04-12-brainstorm-workshop-agenda-content-review.md)
- [Plan: Workshop Content and Infrastructure Update — 2026-04-12](../plans/archive/2026-04-12-feat-workshop-content-and-infrastructure-update-plan.md)
- [ADR: Unified Bilingual Content Model — 2026-04-10](./2026-04-10-unified-bilingual-content-model.md) (describes the flat phase schema this decision builds on)
