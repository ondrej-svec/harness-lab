---
title: "fix: Czech native-quality audit and remediation"
type: plan
date: 2026-04-13
status: complete
brainstorm: null
confidence: medium
---

# Czech Native-Quality Audit And Remediation Plan

Fix the remaining Czech delivery copy that still reads like translated workshop shorthand, with proof-slice discipline first and broad rollout second.

This is a follow-up to [`2026-04-13-refactor-language-flip-and-czech-review-plan.md`](./2026-04-13-refactor-language-flip-and-czech-review-plan.md). That plan fixed the file-system model and completed a broad Czech review sweep. This plan addresses the follow-up gap surfaced in the current audit: structurally correct Czech that still contains half-translated internal shorthand, inconsistent register, or phrasing a native speaker would rewrite on sight.

## Problem Statement

The Czech localization layer is no longer broadly broken, but it is not yet consistently native-quality.

The current audit found a recurring pattern across `workshop-content/agenda.json` and the Czech locale files in `.copy-editor.yaml` scope:

- visible Czech surfaces still expose internal English shorthand such as `safe move`, `script`, `message`, `callout`, `room`, `flow`, `summary text`, `next-day commitments`, `Advanced`, and `Meta`
- some Czech lines are grammatically acceptable but still sound translated rather than authored for Czech developers
- the problem is not confined to one file type; it appears in structured agenda content, participant materials, facilitator notes, and standalone locale files
- past reviews already captured much of the mechanical and scene-level work, but the findings are spread across multiple review notes and have not yet been turned into one execution tracker

If we edit ad hoc file by file, we will miss canonical source boundaries, duplicate fixes between `agenda.json` and derived mirrors, and risk over-correcting workshop vocabulary that should remain in English. The work needs one explicit plan that says where to start, what to leave alone, and when it is safe to propagate a rewrite pattern.

## Target End State

When this lands:

- every in-scope Czech visible-surface file reads like natural Czech authored for Czech developers, not like translated workshop shorthand
- `workshop-content/agenda.json` Czech fields no longer leak non-essential English backstage language onto rendered workshop surfaces
- approved English technical terms remain intact where they are load-bearing (`workflow`, `review`, `repo`, `CLI`, `runbook`, `AGENTS.md`, slash commands, tool names)
- non-technical internal shorthand is either translated into natural Czech or rewritten so the Czech sentence stands on its own
- participant-facing content clears the strict clarity bar in `docs/workshop-content-qa.md` and `content/style-guide.md`
- each affected batch has a review note under `docs/reviews/workshop-content/` stating what was reviewed, what was changed, and what still needs Czech-human signoff
- the next maintainer can continue the Czech review system without re-deriving source-of-truth boundaries

## Scope And Non-Goals

**In scope**

- Czech fields in [`workshop-content/agenda.json`](../../workshop-content/agenda.json)
- Czech locale markdown files included by [`.copy-editor.yaml`](../../.copy-editor.yaml):
  - `materials/locales/cs/**/*.md`
  - `content/project-briefs/locales/cs/**/*.md`
  - `content/challenge-cards/locales/cs/**/*.md`
  - `content/facilitation/locales/cs/**/*.md`
  - `content/talks/locales/cs/**/*.md`
- harmonizing terminology and phrasing across those files when the same workshop concept appears repeatedly
- new or updated review notes for the slices actually touched

**Out of scope**

- English-canonical files, unless a Czech rewrite reveals a real locale-parity problem that must be logged
- `workshop-skill/` reference docs, which are English-canonical by ADR
- Czech style reference files themselves (`content/style-guide.md`, `content/style-examples.md`, `content/czech-reject-list.md`, `content/czech-editorial-review-checklist.md`) unless the remediation uncovers a repeated rule gap worth documenting separately
- UI chrome outside workshop-content delivery
- introducing new workshop content or changing workshop method
- replacing the human Czech signoff gate with AI review

## Proposed Solution

Use one proof slice to establish rewrite discipline, then roll out the same standard in dependency order from highest-leverage source to lowest.

The work splits into five phases:

1. consolidate findings into a single remediation ledger
2. prove the rewrite standard on one participant-facing file and one canonical agenda slice
3. roll out participant-facing markdown rewrites in batches
4. fix facilitator-facing and talk-support files
5. close with source verification and review artifacts

The important constraint is source authority:

- for structured workshop content, fix the Czech in `workshop-content/agenda.json`, not in generated outputs
- for standalone bilingual markdown, fix the Czech locale file under `locales/cs/`
- if the same weak phrase appears in multiple files, establish the preferred Czech once in the proof slice and then propagate deliberately

## Decision Rationale

**Why a new plan instead of “just fixing the files.”**
The repo already contains broad review memos, but they are diagnosis artifacts, not an execution tracker. This plan turns those findings into dependency-ordered work so `$work` can proceed without guessing.

**Why proof slice first.**
This is subjective, voice-sensitive content. A broad batch rewrite before proving the tone on one strict participant surface and one canonical agenda slice is how drift gets amplified.

**Why `agenda.json` is a separate phase, not mixed into file-by-file cleanup.**
It is the canonical source for structured workshop content and fans out to runtime views. It deserves its own pass so the team does not hide source-of-truth changes among locale-file edits.

**Why keep some English terms.**
The style guide is explicit: common technical terms stay in English when they are the natural language of Czech developers. The goal is not “translate everything”; the goal is “remove lazy borrowed-English shorthand and keep real developer vocabulary.”

## Constraints And Boundaries

- [`docs/workshop-content-language-architecture.md`](../workshop-content-language-architecture.md) remains the language source-of-truth document.
- [`docs/workshop-content-qa.md`](../workshop-content-qa.md) remains the content gate: Layer 1 can be tool-closed; visible-surface Czech and participant clarity still need human judgment.
- [`content/style-guide.md`](../../content/style-guide.md), [`content/style-examples.md`](../../content/style-examples.md), and [`content/czech-reject-list.md`](../../content/czech-reject-list.md) define the Czech rewrite bar.
- The work must preserve approved English technical terms and canonical workshop vocabulary.
- No generated files under `dashboard/lib/generated/` or `workshop-blueprint/agenda.json` are hand-edited.
- Review notes live under `docs/reviews/workshop-content/`.
- Trunk-based development stays in force.

## Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| The main remaining gap is Layer 2 naturalness, not mechanical typography | Verified | Current `copy-audit` run returned 0 errors and only 1 warning; the audit findings were about voice and wording |
| `workshop-content/agenda.json` is still the canonical source for structured Czech workshop delivery | Verified | `docs/workshop-content-language-architecture.md` |
| Existing review memos are sufficient input to avoid a fresh full-dataset audit before planning | Verified | Multiple 2026-04-13 review notes already cover materials, talks, facilitation, cards, briefs, and Layer 2 sweep |
| A proof slice can establish repeatable rewrite rules for the broader rollout | Verified | Prior content plans in this repo already use proof-slice discipline for subjective work |
| Most English leakage is accidental shorthand rather than protected workshop vocabulary | Verified | Current findings cluster around non-technical labels like `message`, `script`, `room`, `Advanced`, `Meta`, `next-day commitments` |
| Some repeated issues may still surface during implementation outside the currently flagged examples | Unverified | Broad rewrite work often exposes more instances once files are open side by side |
| Human Czech signoff will still be needed after the rewrite batches | Verified | `docs/workshop-content-qa.md` explicitly requires it |

Unverified assumptions are handled by the remediation ledger and per-batch review notes; nothing should be silently “fixed everywhere” without confirming the pattern holds.

## Risk Analysis

### Risk: Over-correcting and stripping out legitimate workshop vocabulary

If the rewrite becomes “translate every English word,” the Czech will lose natural developer register and drift away from the approved term list.

Mitigation:

- use the approved-term list in `content/style-examples.md`
- treat tool names, slash commands, file names, and established developer terms as protected by default
- require each new rewrite pattern to be proven on the proof slice before propagation

### Risk: Fixing locale files while missing the canonical agenda source

If we treat agenda issues like ordinary markdown edits, rendered workshop surfaces will keep leaking weak Czech from `agenda.json`.

Mitigation:

- isolate `workshop-content/agenda.json` as its own remediation phase
- do not hand-edit generated views
- verify content generation after source edits

### Risk: Broad batch edits make tone inconsistent

Different files serve different audiences. Participant-facing Czech needs strict clarity; facilitator-facing notes can tolerate more shorthand.

Mitigation:

- split participant-facing and facilitator-facing rollout
- preserve audience-specific tone rules in the plan
- record proof-slice rewrite decisions before propagation

### Risk: The work stalls because findings are spread across too many documents

This is already happening. The repo has the diagnosis but not the execution tracker.

Mitigation:

- Phase 1 produces one remediation ledger with file ownership, issue classes, and source-of-truth location
- later batches work from that ledger, not from memory

## Subjective Contract

### Target Outcome

A Czech facilitator or participant should be able to read the touched lines aloud without mentally rewriting them. The copy should sound like a calm, technically fluent Czech peer speaking to another Czech developer.

### Anti-Goals

- not a literal translation pass
- not a mass terminology purge
- not “prettier Czech” that becomes softer, vaguer, or less actionable
- not a rewrite of English-canonical workshop method
- not a giant one-shot batch without a proven style slice

### References

- [`content/style-guide.md`](../../content/style-guide.md)
- [`content/style-examples.md`](../../content/style-examples.md)
- [`content/czech-editorial-review-checklist.md`](../../content/czech-editorial-review-checklist.md)
- [`docs/workshop-content-language-architecture.md`](../workshop-content-language-architecture.md)
- [`docs/workshop-content-qa.md`](../workshop-content-qa.md)
- [`docs/reviews/workshop-content/2026-04-13-czech-layer2-sweep.md`](../reviews/workshop-content/2026-04-13-czech-layer2-sweep.md)
- [`docs/reviews/workshop-content/2026-04-13-czech-materials.md`](../reviews/workshop-content/2026-04-13-czech-materials.md)

### Anti-References

- borrowed-English labels on visible Czech surfaces when a natural Czech phrase exists
- half-translated stage language like `delivery script`, `watch-fors`, `callout`, `message`, `room`
- participant-facing labels left in English just because the English source used them
- mixed `ty`/`vy` addressing inside a single Czech scene without a deliberate rhetorical reason

### Tone Rules

- short sentences
- active verbs
- peer tone, not classroom or corporate tone
- English only for real technical vocabulary, commands, file names, and canonical workshop terms

### Representative Proof Slice

Use two items before broader rollout:

1. `materials/locales/cs/coaching-codex.md`
2. one high-visibility Czech segment in `workshop-content/agenda.json` from the opening/talk/demo path

These two together prove:

- participant-facing strict clarity
- dense workshop vocabulary handling
- structured source editing discipline

### Rollout Rule

Do not propagate a rewrite pattern beyond the proof slice until all of these are true:

- the rewritten Czech sounds natural on read-aloud review
- the pattern does not conflict with approved English technical terms
- the change is clearly source-correct for that file type
- the batch review note names the preferred phrasing explicitly

### Rejection Criteria

The result is wrong even if the files compile and `verify:content` passes when:

- a Czech speaker would immediately rewrite the line in their head
- a non-technical English word remains on a visible Czech surface without a strong reason
- participant-facing copy becomes vaguer or less actionable after “localization”
- the same concept is translated three different ways across the batch

### Required Preview Artifacts

- proof-slice review note documenting before/after examples and rationale
- per-batch review note under `docs/reviews/workshop-content/`
- final summary note listing the recurring rewrite patterns that were applied

## Implementation Tasks

### Phase 1 — Consolidate the remediation ledger

- [x] Gather the currently known issue classes from:
  - `docs/reviews/workshop-content/2026-04-13-czech-layer2-sweep.md`
  - `docs/reviews/workshop-content/2026-04-13-czech-materials.md`
  - any same-day batch review note relevant to touched files
- [x] Build one ledger in the work session that maps:
  - file or source
  - audience (`participant`, `presenter`, `hybrid`)
  - issue class (`borrowed shorthand`, `calque`, `headline label`, `ty/vy drift`, `clarity gap`)
  - source-of-truth file to edit
- [x] Mark repeated rewrite targets that are likely to appear in multiple files:
  - `safe move`
  - `script`
  - `message`
  - `callout`
  - `room`
  - `flow`
  - `summary text`
  - `Advanced` / `Meta`
  - `next-day commitments`
- [x] Freeze the first proof slice before touching broad batches.

### Phase 2 — Proof slice: participant material

- [x] Rewrite `materials/locales/cs/coaching-codex.md` to native-quality Czech without diluting workshop vocabulary.
- [x] Check every affected line against:
  - approved English technical terms
  - participant strict-clarity bar
  - spoken-readability bar
- [x] Record a short review note with the specific rewrite decisions that should propagate later.
- [x] Treat this file as the pattern source for how to handle dense Czech + English workshop language.

### Phase 3 — Proof slice: canonical agenda source

- [x] Pick one high-visibility opening/talk/demo Czech slice in `workshop-content/agenda.json`.
- [x] Rewrite the Czech there so it no longer leaks backstage English or weak shorthand.
- [x] Validate that the rewritten slice still matches workshop vocabulary and room-delivery needs.
- [x] Capture the preferred phrasing patterns in the review note so later agenda work can reuse them.

### Phase 4 — Participant-facing markdown rollout

- [x] Rewrite `materials/locales/cs/participant-resource-kit.md`.
- [x] Rewrite `content/project-briefs/locales/cs/*.md` where the ledger flags calques or weak shorthand.
- [x] Rewrite `content/challenge-cards/locales/cs/*.md`, especially visible labels and category headings that should not stay in English by inertia.
- [x] After each batch, run the Czech Layer 1 audit and note Layer 2 considerations in the review artifact.
- [x] Keep a running terminology list for repeated workshop concepts so the batch stays internally consistent.

### Phase 5 — Facilitator and talk-support rollout

- [x] Rewrite `content/facilitation/locales/cs/*.md` for natural Czech while preserving facilitator utility.
- [x] Rewrite `content/talks/locales/cs/*.md`, removing half-translated stage-note language where Czech should carry the sentence.
- [x] Pay special attention to:
  - `script`
  - `delivery script`
  - `message`
  - `callout`
  - `room`
  - `watch-fors`
  - `pacing`
  - `repo-readiness contrast`
- [x] Preserve legitimate shared workshop terms where they are conceptually load-bearing.

### Phase 6 — Remaining `agenda.json` remediation

- [x] Audit the remaining Czech issue classes in `workshop-content/agenda.json` using the proof-slice decisions.
- [x] Fix inconsistent visible labels and any remaining borrowed-English backstage language.
- [x] Resolve any `ty`/`vy` drift that remains on visible Czech scenes.
- [x] If a phrase class repeats across phases, fix it systematically from the canonical source instead of patching rendered outputs.

### Phase 7 — Verification and closure

- [x] Run `bun ../heart-of-gold-toolkit/plugins/marvin/skills/copy-editor/scripts/copy-audit.ts --config .copy-editor.yaml` and require zero error-severity findings.
- [x] Run `cd dashboard && npm run verify:content` after `agenda.json` changes.
- [x] Write or update the relevant review note(s) in `docs/reviews/workshop-content/`:
  - scope
  - files touched
  - typography audit result
  - layer-2 suggestions considered
  - what still needs human Czech signoff
- [x] Record the final remediation ledger outcome:
  - fixed
  - intentionally kept in English
  - deferred with reason

## Acceptance Criteria

- The proof slice is completed first and has a review note that names the preferred rewrite patterns.
- No visible Czech participant surface in scope still contains non-technical English shorthand by inertia.
- `workshop-content/agenda.json` Czech delivery no longer exposes the currently flagged backstage English issue classes.
- Repeated concepts use consistent Czech phrasing across touched files unless the plan explicitly preserves an English workshop term.
- Layer 1 Czech audit passes with zero errors on the touched scope.
- `dashboard` content verification passes after canonical source changes.
- Review artifacts exist for the proof slice and rollout batches.
- The final handoff can state exactly what was verified, what was judgment-based, and what still awaits Czech-human signoff.

## References

- [`2026-04-13-refactor-language-flip-and-czech-review-plan.md`](./2026-04-13-refactor-language-flip-and-czech-review-plan.md)
- [`content/style-guide.md`](../../content/style-guide.md)
- [`content/style-examples.md`](../../content/style-examples.md)
- [`content/czech-editorial-review-checklist.md`](../../content/czech-editorial-review-checklist.md)
- [`docs/workshop-content-language-architecture.md`](../workshop-content-language-architecture.md)
- [`docs/workshop-content-qa.md`](../workshop-content-qa.md)
- [`docs/reviews/workshop-content/2026-04-13-czech-layer2-sweep.md`](../reviews/workshop-content/2026-04-13-czech-layer2-sweep.md)
- [`docs/reviews/workshop-content/2026-04-13-czech-materials.md`](../reviews/workshop-content/2026-04-13-czech-materials.md)
