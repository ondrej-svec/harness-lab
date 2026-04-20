---
title: "feat: participant-facing Czech audit and native-voice rewrite"
type: plan
date: 2026-04-20
status: complete
confidence: medium
---

# Participant-facing Czech audit and native-voice rewrite

Audit every participant-facing Czech string in the workshop, rewrite the ones that read as translated English, and extend the guardrails so the same drift cannot reappear.

## Problem Statement

The surface-split commit `ec8b1b2` (2026-04-20) introduced 8 `participantMoments` across the opening/talk/demo phases, all carrying `cs_reviewed: false`. They shipped without passing the 2026-04-13 editorial gate (Phase D/F). An in-session audit surfaced systemic issues, not isolated typos:

- **Dominant calque — "Zůstaňte s X"** (5 hits) — literal translation of "Stay with the room / argument / contrast / demo". Unnatural Czech in every context.
- **Abstract calque metaphors** — "oblouk dne" (= "arc of the day") reads as translated jargon. Natural Czech would say *program / průběh / plán dne*.
- **English-Czech hybrid fragments** — "proof targetem", "Participant plocha", "z openingu" — half-translated constructions where the author switched mental languages mid-sentence.
- **Vague imperatives** — e.g. `Poslouchejte` without a concrete object, violating the participant-clarity rule in `content/czech-reject-list.md`.
- **Cross-phase inconsistency** — the opening phase is labeled `Úvod` but referenced as `z openingu` in the talk phase goal.

Adjacent participant surfaces (`dashboard/lib/ui-language.ts` ~383 CS lines, `participant-room-surface.tsx` ~65 CS lines, `public-page-view-model.ts` ~21 CS lines) were last audited on 2026-04-13. The commits since then — `ec8b1b2` (surface split), `976ab6b` (auth hardening), `17a17dd` (lang switching) — likely introduced additions that bypassed the gate.

This is not just a text-quality issue. The repeated "Zůstaňte s X" pattern is a signature of translation-first authoring: one author held an English mental template and rendered each moment word-by-word. Without intervention, the next phase that receives `participantMoments` will inherit the same mental template.

## Target End State

- Every participant-facing Czech string reads as original Czech authorial voice, not translation. The test: a native Czech reader can read it aloud without flinching or pausing.
- `cs_reviewed: true` on every touched field in `workshop-content/agenda.json`.
- `bun scripts/content/check-czech-anglicisms.ts` catches the "Zůstaňte s X" family and "oblouk dne" if reintroduced by future authors or agents.
- Review notes filed in `docs/reviews/workshop-content/2026-04-20-*.md`, one per phase, following the 2026-04-13 Phase D precedent.
- `content/czech-reject-list.md` documents the new patterns so future self-passes catch them at draft time.
- `.copy-editor.lock.json` refreshed to match (if the lock mechanism is still enforced — verify in Phase 1).

## Scope and Non-Goals

**In scope:**
- `workshop-content/agenda.json`:
  - All 8 `participantMoments[*].cs.*` fields in phases `opening`, `talk`, `demo` (48 distinct strings).
  - `phases[*].cs.{label, goal}` for the 11 phases (22 strings) — if render-path verification confirms participant visibility.
- `dashboard/lib/ui-language.ts` — **diff against 2026-04-13 baseline**; audit additions only.
- `dashboard/lib/public-page-view-model.ts` — same diff-based audit.
- `dashboard/app/components/participant-room-surface.tsx` — same diff-based audit.
- `dashboard/app/components/participant-identify-prompt.tsx` — 2 hard-coded strings (trivial).
- `scripts/content/check-czech-anglicisms.ts` — extend with new patterns.
- `content/czech-reject-list.md` — document the new reject entries with "why".

**Out of scope:**
- Presenter/facilitator-facing scenes (`phases[*].scenes[*]`), facilitator notes, room-surface Czech copy.
- English (`en`) content anywhere in the tree.
- `content/project-briefs/locales/cs/`, `content/challenge-cards/locales/cs/`, `materials/locales/cs/` — already passed the 2026-04-13 gate and haven't been touched since (verify briefly; full re-audit is separate work).
- New participantMoments for phases 3–10 (none exist yet; those will go through this same process when added).
- English-canonical `workshop-skill/` (per ADR 2026-04-12-skill-docs-english-canonical.md).
- Structural changes to the bilingual agenda model.

## Proposed Solution

Five sequential phases following the 2026-04-13 editorial precedent (Layer 1 → human Layer 2 → apply → lock). Proof-slice gating before fan-out so voice decisions are validated once, not re-litigated per moment.

1. **Voice calibration** — decide the 2–3 house phrases that replace the recurring English motifs; decide the hybrid-fragment policy; verify render paths.
2. **Proof slice: Opening phase** — rewrite the 2 opening moments, native review, apply, flip flags, commit.
3. **Fan-out: Talk and Demo** — apply calibrated voice to the remaining 6 moments, same loop.
4. **Adjacent surfaces** — diff-based audit of UI Czech additions since 2026-04-13.
5. **Guardrails** — extend the reject list and the check script so the same drift is caught at CI before it reaches review.

Each rewrite is authored in Czech first (not by translating the English), then cross-checked against the English for semantic parity. Every batch produces a review note under `docs/reviews/workshop-content/` as a side-by-side before/after table with one-line rationale per change — the same format Phase D used.

## Subjective Contract

**Target outcome:** A Czech reader cannot tell the text was authored alongside English. The voice is a peer developer's — informed, specific, imperative where action is needed, quiet where listening is needed.

**Anti-goals:**
- Any sentence that reads as word-by-word English-to-Czech.
- Abstract metaphors that land naturally in English but don't in Czech (*oblouk dne*, *stay with*, *sitting inside*).
- English-Czech hybrid fragments with one content word in each language.
- Vague participant-facing imperatives (*poslouchejte*, *sledujte* without object).
- Corporate or school register (*realizujte*, *je nutné*, *zajistěte*).

**References (positive models):**
- `docs/reviews/workshop-content/2026-04-13-czech-batch-1-opening-talk-demo.md` — Phase D review note format and voice target.
- `content/style-guide.md` — canonical voice doctrine.
- `content/style-examples.md` — do/don't pairs and approved English terms list.
- `.copy-editor.yaml voice_doctrine:` — peer register, short sentences, verbs first.
- `talk-note-one-gap` and `demo-name-your-first-artifact` — the two moments that already read well (use as intra-surface anchors).

**Anti-references:**
- `opening-room-start.title/body` — the calque "Zůstaňte s místností" + "oblouk dne".
- `talk-listen.blocks[0].body` — "Zůstaňte s argumentem a s kontrastem".
- `demo-watch-the-contrast.body` — "Zůstaňte s demem".
- `talk-ready-for-build.title` — "proof targetem" hybrid.
- `demo-open-build-brief.blocks[0].body` — "Participant plocha" hybrid.

**Tone / taste rules:**
- Peer register (ty-form is banned; vy-form is in; no school "žáci", no corp "kolegové").
- Sentences under ~20 words in participant body copy.
- Verbs first. Nominal chains `-ní + -ost + -ace` in genitive are auto-reject.
- Concrete objects for every imperative (`zkontrolujte X`, `otevřete Y`) unless the action is explicitly "just listen / watch".
- English technical terms are fine when they're in `content/style-examples.md#approved-english-terms`; hybrid endings (*proof targetem*) are not.
- NBSP after single-letter Czech prepositions (Layer 1 typography).

**Proof slice:** Opening phase, 2 moments, 10 Czech strings. If the proof slice doesn't land cleanly, Phase 3 is blocked and Phase 1 reopens.

**Rollout rule:** Talk + Demo rewrites may proceed only after the opening proof slice is native-approved and committed. No speculative fan-out.

**Rejection criteria:** Any of these fail the rewrite:
- The original calque pattern is still present in any form.
- A fresh calque appears (different English template, same drift).
- A native Czech reader (the user) flinches reading it aloud.
- The semantic parity with English drifts — Czech says something the English does not, or omits something the English promises.

**Preview artifacts (required before apply):**
- `docs/reviews/workshop-content/2026-04-20-participant-moments-opening.md`
- `docs/reviews/workshop-content/2026-04-20-participant-moments-talk.md`
- `docs/reviews/workshop-content/2026-04-20-participant-moments-demo.md`
- `docs/reviews/workshop-content/2026-04-20-participant-ui-surfaces.md` — only if Phase 4 finds drift in ui-language.ts / room-surface / view-model.

Each preview uses a before/after markdown table: `| path | current CS | proposed CS | rationale |`. User signs off per moment in-session.

## Decision Rationale

**Why proof-slice gating instead of one big rewrite pass?**
The 2026-04-13 batch review ran four review notes in parallel and landed in 4 commits. That worked because the English was stable and the voice was calibrated. Here the voice calibration *is* the risky decision (how to replace "Stay with X" — one phrase? two? rewrite sentence-level?). Proof-slicing forces that decision once, on a small surface, with a tight feedback loop. Fan-out then becomes mechanical.

**Why extend the reject-list script rather than rely on human review alone?**
The pattern repeated 5 times in one commit. One author, one motif, five hits. Without a Layer 1 trap, the next author (human or agent) reintroduces the same pattern the next time a phase gains participantMoments. The reject-list script is the only gate that catches drift before review.

**Why not retranslate from English via an LLM-style agent pass?**
That's how we got here. The failure mode is not "bad translation quality", it's "translation-first authoring" — the English was the source, the Czech was the render. Fixing with another translation pass reproduces the pattern. The rewrite must be Czech-authored with English cross-check, not English-translated to Czech.

**Why diff-based audit of adjacent UI surfaces instead of full re-pass?**
`ui-language.ts` alone has ~383 CS lines. A full re-pass duplicates the 2026-04-13 work. But additions since 2026-04-13 bypassed the gate (the lock file was frozen on that date). Diffing against the baseline isolates the un-reviewed surface at O(days-of-drift) cost instead of O(total-content) cost.

**Alternatives considered:**
- *Delete `participantMoments` entirely and not render participant-specific copy per phase*: Rejected — the participantMoment pattern is load-bearing for polls + feedback affordances (see `participant-poll-form.tsx`). Killing the mechanism to fix copy is over-correction.
- *Flip `cs_reviewed: true` without rewriting, ship as-is*: Rejected — the flag is a trust signal, not a checkbox. Flipping it on text that wouldn't pass the editorial gate is debt, not resolution.
- *Rewrite only the "Zůstaňte s X" hits*: Rejected — the calque is the loudest symptom, but not the only one. A partial pass leaves hybrids and vague imperatives behind, and within a week someone will ask "why is some of this fine and some not?".

## Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| User is the native Czech reviewer for sign-off | Verified | In-session: user surfaced "Zůstaňte s místností" unprompted and asked for full audit |
| The 8 `participantMoments` are the only `cs_reviewed: false` gap in agenda.json | Verified | Explore research: every phase has `cs_reviewed: true`, every moment has `cs_reviewed: false` |
| `phases[*].cs.{label, goal}` render on the participant surface | **Unverified** | `.copy-editor.yaml` flags agenda.json as `hybrid`. Needs a view-model check (task 1.5). |
| `.copy-editor.lock.json` is still an active CI gate | **Unverified** | Last touched 2026-04-13. Verify before Phase 5 — if dormant, skip lock refresh. |
| `ui-language.ts` has drifted since 2026-04-13 | **Unverified** | `git log --since=2026-04-13 -- dashboard/lib/ui-language.ts` will answer. Phase 4 task 4.1. |
| No participantMoments exist in phases 3–10 that also need fixing | Verified | `jq` scan: 3 of 11 phases have `participantMoments`, matching the proof-slice scope from `ec8b1b2` |
| Fixing copy won't change the live `participantMomentId` state on `sample-studio-a` | Verified | IDs unchanged in this plan; only `cs` content rewrites |

Unverified items 1.5 (render-path), 5.x (lock file), and 4.1 (ui-language drift) are preconditions for specific tasks; they become tasks, not risks.

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Native review round-trip slow; Phase 3 blocks on user | Medium | Medium | Proof-slice scoped to 10 strings; user can review in 5–10 min in-session. Phase 4 (adjacent surfaces) runs in parallel to Phase 3 review wait. |
| House-phrase decision reversed after Phase 3 commits | Low | High | Phase 1 requires explicit user signoff on each house phrase before any rewrite drafting. Signoff captured in the proof-slice review note. |
| A future `participantMoment` author reintroduces the same calque | High (if no guard) / Low (with Phase 5) | Medium | Phase 5 extends reject-list + check script. Every future commit with the pattern fails CI. |
| "Zůstaňte s X" pattern is genuinely the right call in one edge case | Low | Low | Reject-list entries support `exception:` notes per item (see existing czech-reject-list.md format). Per-hit judgement stays with the human. |
| Layer 1 typography (NBSP, quotes) auto-fixes stomp on the rewrite | Low | Low | Run the check after each rewrite draft, before native review, so typography is clean at sign-off time. |
| ui-language.ts diff reveals large drift requiring separate full audit | Medium | Medium | Phase 4 exit-criteria: if drift >50 CS lines, file a follow-up plan rather than bloating this one. |
| Regenerating views creates noisy diff that obscures the actual edits | Low | Low | Commit source + generated in separate commits if the generated diff >100 lines. |

## Implementation Tasks

Tasks are dependency-ordered. Phases 2 and 3 are strictly sequential (proof slice must land before fan-out). Phase 4 can parallel Phase 2 review. Phase 5 closes after all rewrites land.

### Phase 1 — Voice Calibration and Render-Path Verification

- [x] 1.1 Enumerate every occurrence of the "Zůstaňte s X" pattern in participant-facing sources — **6 hits in agenda.json, 0 in UI files.**
- [x] 1.2 House phrases signed off by user: **A2** `Teď jen poslouchejte` (room/presenter attention), **B3** `Všímejte si, co se mění` (content attention), **C2** `Sledujte, co se právě děje` (live-action attention).
- [x] 1.3 "oblouk dne" resolution: **option 3 — drop the metaphor.** Replace with `plán dne` (neutral concrete noun).
- [x] 1.4 Hybrid-fragment policy: **a-iv** (restructure for "proof targetem"), **b-ii** (`Plocha pro účastníky` for "Participant plocha"). "z openingu" is out of scope (doesn't render to participants).
- [x] 1.5 Render path verified: `phase.cs.label` → `currentAgendaItem.title` (rendered in metric + breadcrumb); `phase.cs.roomSummary` → `currentAgendaItem.description` (rendered); `phase.cs.goal` renders only in fallback block (bypassed when moment has blocks, always the case for proof-slice phases). **`phase.cs.label` + `roomSummary` for opening/talk/demo are already clean Czech — no rewrite needed at phase level.**
- [x] 1.6 Lock status: active but scoped to markdown locale files only (`scripts/content/verify-copy-editor.ts:41-51`). Not applicable to `agenda.json` or `.ts` surfaces. **Phase 5.6 is a no-op, removing from scope.**

### Phase 2 — Proof Slice: Opening Phase

- [x] 2.1–2.10 **Shipped in commit `831e7d1`.** Review note at `docs/reviews/workshop-content/2026-04-20-participant-moments-opening.md`. In-session additional user direction captured: **defocus the "přežije bez záchrany" / rescue motif on participant surfaces** (saved to project memory; carries into Phase 3). `opening-room-start` rewritten (3 strings changed, 3 kept); `opening-look-up` verified clean and flag flipped. All content checks + 196 vitest tests pass.

### Phase 3 — Fan-out: Talk and Demo

- [x] 3.1–3.9 **Shipping in this commit.** Review notes at `docs/reviews/workshop-content/2026-04-20-participant-moments-{talk,demo}.md`. 7 string rewrites across the 6 moments (4 talk + 3 demo); 29 strings kept as already clean. All 6 moments now `cs_reviewed: true`. Combined commit (talk + demo) chosen over per-phase split because the fan-out was uniform — same calibrated phrases, same defocus-rescue preference, no phase-specific judgment calls beyond the per-moment table in the review notes. All content checks + 205 vitest tests pass.

### Phase 4 — Adjacent Participant Surfaces (parallel to Phase 2 review)

- [ ] 4.1 `git log --since=2026-04-13 --name-only -- dashboard/lib/ui-language.ts` — list commits and changed ranges.
- [ ] 4.2 `git diff 98b1c44..HEAD -- dashboard/lib/ui-language.ts` (use whichever commit landed the 2026-04-13 lock) — capture CS diff.
- [ ] 4.3 Same diff for `public-page-view-model.ts` and `participant-room-surface.tsx`.
- [ ] 4.4 If total CS drift <50 lines: audit inline, file `docs/reviews/workshop-content/2026-04-20-participant-ui-surfaces.md`, get signoff, apply fixes, commit.
- [ ] 4.5 If drift >50 lines: file a separate plan `2026-04-20-feat-participant-ui-czech-re-audit-plan.md` and mark task 4.x as scope-transferred.
- [ ] 4.6 `participant-identify-prompt.tsx` — audit the 2 strings in-line (trivial, no review note needed).

### Phase 5 — Guardrails

- [x] 5.1 Added `/\bzůstaňte\s+s\b/giu` trap. Smoke-tested: catches all 3 calque variants (`místností`, `argumentem`, `demem`); ignores reflexive `se`/`si` constructions and the replacement phrases.
- [x] 5.2 **"oblouk dne" regex dropped** — surface-specific rule (allowed in facilitator content, banned only on participant surfaces). 3 legitimate hits exist in `phases[0].cs.facilitatorPrompts[1]`, `facilitatorRunner.say[1]`, and `scenes[1].cs.label`. Enforcing globally would false-positive. Documented as Layer 2 only in the reject list.
- [x] 5.3 Hybrid-fragment regex skipped — pattern too narrow to generalize safely. Reject-list-only.
- [x] 5.4 Two new entries added to `content/czech-reject-list.md` → "Kalky z angličtiny" table: `Zůstaňte s + X` (Layer 1 trap) and `oblouk dne` (Layer 2 only, with the surface-profile rationale).
- [x] 5.5 Full check suite passes on current corpus.
- [x] 5.6 Skipped per Phase 1.6 finding — lock file scope is markdown-only, doesn't gate `agenda.json` or `.ts` surfaces touched by this plan.
- [x] 5.7 Commit landed in this phase's push.

### Phase 6 — Close-out

- [x] 6.1 Plan status flipped to `complete` in frontmatter.
- [ ] 6.2 Cross-reference from the agenda-scene-surface-split plan (`docs/plans/2026-04-19-feat-agenda-scene-surface-split-and-lightweight-interaction-plan.md`) under its rollout-gate task, noting the Czech gap is closed for the proof slice.

### Deferred to follow-up plan

- **Phase 4 (Adjacent Participant UI Surfaces)** — `git diff ff85c84..HEAD` on the UI files shows +1261/-357 lines of drift since the 2026-04-13 lock. Way above this plan's 50-line threshold (task 4.5). Files in scope for follow-up: `dashboard/lib/ui-language.ts`, `dashboard/lib/public-page-view-model.ts`, `dashboard/app/components/participant-room-surface.tsx`, `dashboard/app/components/participant-identify-prompt.tsx`. Recommend a dedicated plan: `2026-04-20-feat-participant-ui-czech-re-audit-plan.md`.
- **Phase-level CS goal rewrite** — `talk.cs.goal` contains `z openingu` (hybrid). Not participant-visible (fallback-only path in the three proof-slice phases), but reads inconsistently with `opening` phase label (`Úvod`). Worth a future phase-level editorial pass covering phases 3–10 `cs.goal` strings (which DO render on participant surfaces for those phases, since they have no `participantMoments` yet).

## Acceptance Criteria

- [ ] All 8 `participantMoments` in `workshop-content/agenda.json` have `cs_reviewed: true`.
- [ ] Each rewritten moment has an accompanying review note in `docs/reviews/workshop-content/2026-04-20-*.md` with native signoff in session context.
- [ ] `bun scripts/content/check-czech-anglicisms.ts` passes on the full repo after rewrite **and** catches the calque if artificially reintroduced.
- [ ] `bun scripts/content/generate-views.ts --verify` passes.
- [ ] `bun scripts/content/check-tier2-sync.ts` passes.
- [ ] `pnpm vitest run` in dashboard passes (no regression on unit tests).
- [ ] `content/czech-reject-list.md` contains the "Zůstaňte s X" and "oblouk dne" entries with "Why" blurbs.
- [ ] Phase 4 either: produced a commit closing the UI-surface gap, or referenced a follow-up plan.
- [ ] The existing `dashboard/e2e` pre-existing failures on main are unaffected by this plan (no claim this plan fixes them; it shouldn't make them worse either).
- [ ] When read aloud by the user, none of the rewritten strings prompt a pause or flinch.

## References

- Prior editorial precedent: `docs/reviews/workshop-content/2026-04-13-czech-batch-1-opening-talk-demo.md` (Phase D format).
- Voice doctrine: `content/style-guide.md`, `.copy-editor.yaml voice_doctrine:`.
- Reject list: `content/czech-reject-list.md`.
- Approved English terms: `content/style-examples.md#approved-english-terms`.
- Scene surface split plan (parent): `docs/plans/2026-04-19-feat-agenda-scene-surface-split-and-lightweight-interaction-plan.md`.
- Anti-reference commit: `ec8b1b2` — introduced all 8 unreviewed moments.
- Recent precedent commits: `98b1c44`, `9c09ffe`, `7cfcd31`, `0a1a5d7` (Phase D batches); `ff85c84` (Phase F lock).
