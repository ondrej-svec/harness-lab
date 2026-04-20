---
title: "feat: participant UI Czech audit and phase-level goal/roomSummary rewrite"
type: plan
date: 2026-04-20
status: in_progress
confidence: medium
parent: docs/plans/2026-04-20-feat-participant-czech-audit-and-rewrite-plan.md
---

# Participant UI Czech audit and phase-level goal/roomSummary rewrite

Close the two remaining gaps from the 2026-04-20 participant-copy plan: (A) Czech drift in the dashboard UI surfaces since the 2026-04-13 editorial lock, and (B) phase-level `cs.goal` / `cs.roomSummary` strings that render on the participant surface for the 8 phases without explicit `participantMoments`.

## Problem Statement

The parent plan closed the `participantMoments` gap for the 3 proof-slice phases (opening / talk / demo) but deferred two surfaces:

**Gap A — adjacent participant UI files.** `git diff ff85c84..HEAD` shows meaningful Czech drift across the dashboard surfaces marked `surface_profile: participant` in `.copy-editor.yaml`:

| File | CS-bearing `+` lines |
|---|---|
| `dashboard/lib/ui-language.ts` | 147 |
| `dashboard/app/components/participant-room-surface.tsx` | 65 |
| `dashboard/lib/public-page-view-model.ts` | 20 |
| `dashboard/app/components/participant-identify-prompt.tsx` | 2 |

These additions postdate the `ff85c84` Phase F lock (2026-04-13) and therefore bypassed the editorial gate. They came in via commits: `ec8b1b2` (surface split), `94979ca` (identify prompt), `f092932` (browser-first participant home), `edf59ed` (CLI-independent refactor), `148d576` (facilitator copy tightening), plus smaller ones.

**Gap B — phase-level `cs.goal` / `cs.roomSummary`.** For the 8 phases without `participantMoments` (build-1, intermezzo-1, lunch-reset, rotation, build-2, intermezzo-2, build-2-second-push, reveal), the fallback block in `public-page-view-model.ts:122-135` renders:

- eyebrow ← `phase.cs.label`
- title ← `phase.cs.goal` ← **this is the headline on the participant screen**
- body ← `phase.cs.roomSummary`
- focus items ← first 3 of `phase.cs.checkpointQuestions`

A read-through surfaces concrete issues:

- `reveal.cs.goal`: contains `pomáhají práci přežít předání` — direct "survives handoff" rescue motif the user asked to defocus on participant surfaces.
- `build-1.cs.goal`: `Dostat tým do režimu, kde…` reads as English calque ("get the team into mode where…"). Natural Czech uses a purpose-clause instead.
- `intermezzo-1.cs.goal`: `vrátit místnost k tomu, že` — mild calque of "bring the room back to [the fact] that". Awkward nominal construction.
- `build-2-second-push.cs.goal`: uses `z mezipatra` (mezzanine) when the phase label is `Intermezzo 2` — cross-phase terminology inconsistency.
- `talk.cs.goal`: contains `z openingu` hybrid — not participant-visible (moments exist) but a cross-phase consistency bug worth fixing in the same sweep.

No `cs.roomSummary` showstoppers on participant surfaces from a first pass, but each deserves a read-through since they render as the body under the goal-title.

**Why a single combined plan?** The two gaps share the same editorial infrastructure (style-guide, reject-list, review-note pattern, house phrases) and the same native reviewer. Running two separate cycles duplicates the calibration overhead without reducing risk.

## Target End State

- Every Czech string on participant-facing surfaces has passed an editorial gate. No un-reviewed additions remain between `ff85c84` and HEAD.
- For the 8 phases without `participantMoments`, the participant-rendered `cs.goal` and `cs.roomSummary` read as native Czech peer voice — no rescue motif, no English-Czech hybrids, no translation calques.
- `talk.cs.goal` uses `z úvodu`, not `z openingu`, for cross-phase consistency.
- Review notes filed under `docs/reviews/workshop-content/2026-04-20-*.md`, following the Phase D / prior-plan format.
- New patterns discovered during the audit are added to `content/czech-reject-list.md` and (if global enough) to `scripts/content/check-czech-anglicisms.ts`.
- Existing Layer 1 `check-czech-anglicisms.ts` rules don't false-positive on the rewrites.

## Scope and Non-Goals

**In scope:**

Gap A — Adjacent UI surfaces (diff-based, `ff85c84..HEAD`):
- `dashboard/lib/ui-language.ts` — audit all 147 added CS-bearing lines.
- `dashboard/app/components/participant-room-surface.tsx` — audit all 65 added CS-bearing lines.
- `dashboard/lib/public-page-view-model.ts` — audit all 20 added CS-bearing lines.
- `dashboard/app/components/participant-identify-prompt.tsx` — audit the 2 added CS strings (trivial).

Gap B — Phase-level CS content:
- `workshop-content/agenda.json`:
  - `phases[*].cs.goal` — audit all 11 phases; rewrite the 4 flagged + any others that surface during review. Priority: the 8 participant-visible ones.
  - `phases[*].cs.roomSummary` — audit all 11 for drift since 2026-04-13. Rewrite only if the review surfaces clear issues on participant-visible fields.
  - `talk.cs.goal` `z openingu` → `z úvodu` fix (landed in the same rewrite pass).

**Out of scope:**

- Presenter/facilitator-facing scene content (`phases[*].scenes[*]`) — that's a separate editorial pass.
- Facilitator-only phase fields (`cs.facilitatorPrompts`, `cs.facilitatorRunner`, `cs.facilitatorNotes`, `cs.watchFors`, `cs.sourceRefs`) — softer rules apply; out of scope.
- `cs.checkpointQuestions` — render on participant surface (focus items) but they're already carefully worded (used by Phase D review). Only re-audit if drift is visible.
- English-canonical copy.
- Structural changes to the bilingual agenda model, to the fallback-block rendering path, or to `.copy-editor.yaml`.
- New content for phases 3–10 (adding `participantMoments` to those phases is future work, not a fix-existing task).

## Non-Goals

- Not extending the participant fallback block with richer content. If fallback reads thinly, that's a separate design decision, not copy work.
- Not fixing the pre-existing Dashboard CI e2e failures on main.
- Not touching the `rotation` scene content (which already passed Phase D).
- Not flipping `cs_reviewed` across presenter scenes touched by this plan's UI work — UI files don't carry that flag.

## Proposed Solution

Two phases, sequential. Gap A and Gap B share house phrases, so Gap B can reuse any new house-phrase decisions made during Gap A's audit (and vice versa). But they commit separately so review notes stay tight.

**Phase A — UI surface audit (diff-based).** Walk the diff per file, extract every CS string introduced since `ff85c84`, classify by surface:
- Participant-facing string → strict editorial pass (reject list + participant-clarity rules).
- Facilitator-only string (in these files, rare; mostly admin UI fragments) → lighter pass.

File a single review note `docs/reviews/workshop-content/2026-04-20-participant-ui-surfaces.md` with a per-string table. Apply approved rewrites. Smoke-test the UI by running `bun scripts/content/check-czech-anglicisms.ts` (no file-extension filter — the script currently only scans agenda.json; if we need coverage on `.ts` files we extend the script in Phase C, below).

**Phase B — phase-level `cs.goal` + `cs.roomSummary` rewrite.** File a review note `docs/reviews/workshop-content/2026-04-20-phase-level-goals.md` with the 11 phases' `cs.goal` + `cs.roomSummary` side-by-side (EN / CS current / CS proposed / rationale). Apply rewrites, flip nothing (no `cs_reviewed` flag at field level — the phase-level flag is already `true` and these are targeted fixes).

**Phase C (if surfaced during A) — extend `check-czech-anglicisms.ts` scope.** Currently the script only scans `workshop-content/agenda.json`. If Phase A surfaces patterns that belong in Layer 1 (calques, hard hits) across `.ts` files too, extend the script to cover the participant UI files as well. Only trigger this phase if a new pattern repeats ≥2 times in Phase A.

## Subjective Contract

**Target outcome:** The participant, opening the `/participant` surface in Czech, sees text that reads as if authored by a Czech peer developer. No lingering translation seams, no rescue-drama framing, no English-Czech hybrids, no vague imperatives.

**Anti-goals:**
- Literal English→Czech rendering ("get the team into mode where…", "bring the room back to…", "arc of X").
- Rescue / survives / saves framing on participant surfaces (`přežije bez záchrany`, `pomáhá přežít předání`).
- Hybrid fragments (English adjective + Czech noun, or vice versa).
- Cross-phase terminology inconsistency (phase A labels `X` while phase B references the same thing as `Y`).
- "Corporate-ish" abstractions (`realizovat`, `zajistit`, `je nutné`).

**References (positive models):**
- `docs/reviews/workshop-content/2026-04-20-participant-moments-{opening,talk,demo}.md` — the parent plan's review notes, same format and voice target.
- `content/style-guide.md` and `content/czech-reject-list.md` (now including the 2026-04-20 additions: `Zůstaňte s X`, `oblouk dne`).
- `rotation.cs.goal` ("Vynutit tichý start po rotaci a nechat kvalitu repa ukázat, co je opravdu čitelné.") — already in voice, positive model for phase-level rewrites.
- `talk-note-one-gap` / `demo-name-your-first-artifact` — already in voice, positive models for participant-surface phrasing.

**Anti-references:**
- `reveal.cs.goal` (rescue motif), `build-1.cs.goal` ("Dostat tým do režimu, kde…" calque), `intermezzo-1.cs.goal` ("vrátit místnost k tomu, že" calque), `build-2-second-push.cs.goal` (`z mezipatra` inconsistency).
- The 6 "Zůstaňte s X" instances from the parent plan (for reference — already fixed).

**Tone / taste rules:**
- Inherit all rules from parent plan's subjective contract.
- Peer register (vy-form, no ty, no "kolegové", no "žáci").
- Sentences under ~20 words on participant-facing fields.
- Verbs first. No nominal `-ní / -ost / -ace` chains in genitive.
- Concrete objects for every imperative.
- Approved English terms per `content/style-examples.md#approved-english-terms`. No new hybrids.

**Proof slices:**
- Gap A proof slice: `dashboard/app/components/participant-identify-prompt.tsx` (2 strings) + one chunk of `ui-language.ts` covering one thematic section (e.g. participant CTAs). If the proof slice is clean, fan out to the full UI.
- Gap B proof slice: `reveal.cs.goal` — highest-severity hit (rescue motif). If the rewrite of `reveal` is signed off, fan out to the remaining 3 flagged phase goals + any that surface during review of the other 7 phases.

**Rollout rule:** Same as parent plan. Proof slice review → user signoff → apply → fan out. Gap A and Gap B can run interleaved but each has its own gating.

**Rejection criteria:**
- Any rewrite still reads as translated English.
- Any rescue motif reintroduced.
- Any new hybrid English-Czech fragment.
- Any string that would fail the Layer 2 "read aloud without flinching" test for the native reviewer.

**Preview artifacts (required before apply):**
- `docs/reviews/workshop-content/2026-04-20-participant-ui-surfaces.md` — Gap A, one review note covering all 4 UI files.
- `docs/reviews/workshop-content/2026-04-20-phase-level-goals.md` — Gap B, one review note covering all 11 phases (audit + fix table).

Each review note uses the same `| path | current CS | proposed CS | rationale |` format the parent plan established.

## Decision Rationale

**Why combined with Gap A + Gap B in one plan, not two?**
Both gaps share the calibration overhead: same house phrases, same reviewer, same reject-list updates. Splitting creates duplicated review sessions and risks decision drift (Gap A picks phrase `X`, Gap B picks slightly different phrase `Y`). Combined keeps the voice coherent in-session.

**Why proof-slice gate on UI work?**
`ui-language.ts` has 147 CS lines of drift — too large to audit in one pass without losing accuracy. A proof slice surfaces voice decisions early (how formal? how playful? what register for button CTAs?), then fan-out becomes mechanical. Same logic as the parent plan.

**Why audit `cs.goal` across all 11 phases, not just the 8 participant-visible ones?**
Cross-phase consistency. If `talk.cs.goal` says `z openingu` and `opening.cs.label` says `Úvod`, that's a bug even if only facilitators see `talk.cs.goal`. Fixing it during the same sweep costs almost nothing and the editorial win is real.

**Why defer script-scope extension to conditional Phase C?**
Extending `check-czech-anglicisms.ts` to scan `.ts` files is a substantial change (path globbing, AST parsing of string literals vs. code, false-positive handling for variable names). Doing it speculatively burns scope. Only trigger if Phase A surfaces a pattern that recurs and warrants a Layer 1 trap.

**Alternatives considered:**
- *Skip Gap A, fix only Gap B*: Rejected — the parent plan explicitly deferred Gap A with a "file a follow-up plan" rule, and the drift is substantial. Skipping is tech debt.
- *One giant commit for everything*: Rejected — review notes are easier to sign off per-file. Commit split: one for Gap A (per UI file or batched), one for Gap B.
- *Rewrite phase.cs.goal for all 11 without audit*: Rejected — some are already clean (lunch-reset, rotation, intermezzo-2). Only touch what's broken.

## Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| User is the native Czech reviewer | Verified | Parent plan's in-session pattern |
| Fallback block renders `phase.cs.goal` as title on participant for phases without moments | Verified | `dashboard/lib/public-page-view-model.ts:122-135` |
| `cs.roomSummary` renders as fallback body | Verified | Same file, line 128 |
| Diff-based audit is the right scope for UI files (vs full re-pass) | Verified by parent plan | `ff85c84` lock is the canonical baseline |
| No hidden CS strings in other participant files outside the four scoped | **Unverified** | Task A.0 verifies: grep for CS diacritics across `dashboard/app/**/participant*.tsx`, `dashboard/app/participant/**/*.tsx`, and `dashboard/app/[lang]/participant/**` (if exists) |
| Phase D review notes (2026-04-13 series) are the right format template | Verified | Parent plan used them successfully |
| Phases with existing `checkpointQuestions` render those on participant fallback | Verified | Same view-model function, line 138-144 |

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| UI audit surfaces more drift than 147+65+20+2 lines (hidden files) | Medium | Medium | Task A.0 grep sweeps for Czech diacritics across all participant UI paths before audit starts. Any hits beyond the 4 scoped files get added to scope. |
| `ui-language.ts` contains UI strings whose structure isn't obvious from the diff (e.g. templates with variable interpolation) | Medium | Low | Read the full context around each diff hunk before judging. Run the UI locally if needed. |
| `check-czech-anglicisms.ts` scan of `.ts` files (if Phase C triggers) false-positives on variable names or English comments | High | Medium | Phase C is conditional and scoped. If triggered, use bounded heuristics (only scan string literals inside known-CS branches of ternaries, or specific function arguments). |
| Phase B `cs.goal` rewrite changes the hero-title semantics in ways that break existing e2e presenter tests | Low | High | Existing e2e tests already don't reference phase-level `cs.goal` strings by value (from parent plan's audit). Re-verify with `grep -rn "Dostat tým\|přežít předání\|z openingu" dashboard/e2e/`. |
| Rewrites reintroduce rescue motif indirectly (e.g. via a different verb) | Low | Low | Review-note rationale column calls out motif-avoidance explicitly. Reviewer re-checks. |
| `roomSummary` audit snowballs into a bigger scope | Medium | Medium | Anchor: only rewrite `cs.roomSummary` if the string contains an explicit flag (calque / rescue motif / hybrid / vague imperative). Otherwise leave alone — the 2026-04-13 pass already touched them. |

## Implementation Tasks

### Phase A — UI Surface Audit (diff-based)

- [x] A.0 Hidden-strings sweep complete. 4 additional files surfaced; 3 out-of-scope (facilitator-only defaults, untracked in-progress work, test assertions), 0 added to scope. Original 4 files remain the audit scope.
- [x] A.1 CS diff extracted per file; results in review note systemic findings.
- [x] A.2 Review note filed at `docs/reviews/workshop-content/2026-04-20-participant-ui-surfaces.md` with per-string tables grouped by file.
- [x] A.3 Layer 1 anglicism check passed on unchanged `agenda.json`.
- [x] A.4–A.7 In-session signoff + apply. Expanded from 12 to 17 rewrites based on user's triad-naming + per-paragraph-voice rules (captured in project memory `feedback_participant_copy_voice.md` Rule 2). Both CS and EN landing-page copy updated for parity.
- [x] A.8 `pnpm vitest run` passes (205/220); typecheck errors in `workshop-store.test.ts` pre-existing from another session's workshop-store refactor, not caused by this work.
- [x] A.9 Shipping in this commit.

### Phase B — Phase-level `cs.goal` / `cs.roomSummary`

- [ ] B.1 Draft review note `docs/reviews/workshop-content/2026-04-20-phase-level-goals.md`. One table per phase, columns: field path + EN / CS current / CS proposed / rationale. Include all 11 phases' `cs.goal` + `cs.roomSummary`.
- [ ] B.2 Call out the 5 known hits explicitly at the top of the note: `reveal.cs.goal` (rescue motif), `build-1.cs.goal` (calque), `intermezzo-1.cs.goal` (calque), `build-2-second-push.cs.goal` (`z mezipatra` inconsistency), `talk.cs.goal` (`z openingu` hybrid).
- [ ] B.3 Proof-slice: `reveal.cs.goal` rewrite first. User signoff.
- [ ] B.4 Apply `reveal.cs.goal` rewrite to `workshop-content/agenda.json`. Regenerate views. Run content checks. Commit: `feat(content): rewrite reveal phase goal to drop rescue motif`.
- [ ] B.5 User signoff on the remaining flagged phase goals.
- [ ] B.6 Apply remaining rewrites. Regenerate views.
- [ ] B.7 If `cs.roomSummary` audit surfaces any fixes: apply in the same pass.
- [ ] B.8 Run full check suite (anglicism + generate-views --verify + tier2-sync + vitest).
- [ ] B.9 Commit: `feat(content): rewrite phase-level Czech goals for native voice on participant fallback`.

### Phase C (conditional) — Extend `check-czech-anglicisms.ts` scope

Trigger condition: Phase A surfaces the same calque pattern in `.ts` files ≥2 times.

- [ ] C.1 Extend `scripts/content/check-czech-anglicisms.ts` to scan a configured allow-list of `.ts` files (same list as `.copy-editor.yaml paths.include` participant-scoped files).
- [ ] C.2 Handle false-positive mitigation: restrict scanning to string literals inside `cs:` object properties (simple AST walk via `ts.createSourceFile`) or via regex for `cs:\s*{` blocks.
- [ ] C.3 Verify on the rewritten corpus: zero false positives.
- [ ] C.4 Update `content/czech-reject-list.md` with the new trap pattern.
- [ ] C.5 Commit: `chore(content): extend anglicism check to participant UI .ts files`.

### Close-out

- [ ] Close.1 Mark plan `status: complete`.
- [ ] Close.2 Cross-reference from the parent plan's "Deferred to follow-up plan" section.
- [ ] Close.3 If Phase C didn't trigger, note that explicitly in the close-out so future readers understand the decision.

## Acceptance Criteria

- [ ] All 234 CS-bearing line additions in the 4 UI files have been read and classified (keep / rewrite / already-clean). Every rewrite has a row in the review note.
- [ ] All 11 phase `cs.goal` strings have been read; every flagged one has been rewritten with user signoff.
- [ ] `talk.cs.goal` says `z úvodu`, not `z openingu`.
- [ ] `reveal.cs.goal` does not contain the "přežít předání" rescue motif.
- [ ] `build-1.cs.goal` does not start with the "Dostat tým do režimu, kde…" calque.
- [ ] `bun scripts/content/check-czech-anglicisms.ts` passes.
- [ ] `bun scripts/content/generate-views.ts --verify` passes.
- [ ] `bun scripts/content/check-tier2-sync.ts` passes.
- [ ] `pnpm vitest run` in dashboard passes (no regression).
- [ ] `/participant` UI in Czech, spot-checked locally, shows no broken strings or layout regressions from UI-string rewrites.
- [ ] Review notes filed under `docs/reviews/workshop-content/2026-04-20-{participant-ui-surfaces,phase-level-goals}.md`.
- [ ] `content/czech-reject-list.md` updated with any new patterns discovered.
- [ ] The "Defocus rescue motif on participant copy" memory preference has been honored across all rewrites.

## References

- **Parent plan:** `docs/plans/2026-04-20-feat-participant-czech-audit-and-rewrite-plan.md` (status: complete).
- **Parent plan's review notes:** `docs/reviews/workshop-content/2026-04-20-participant-moments-{opening,talk,demo}.md`.
- **2026-04-13 Phase F lock commit:** `ff85c84` — canonical baseline for diff-based UI audit.
- **Editorial infrastructure:** `content/style-guide.md`, `content/czech-reject-list.md`, `content/style-examples.md`, `.copy-editor.yaml`.
- **Render-path evidence:** `dashboard/lib/public-page-view-model.ts:122-144` (fallback block), `:264-302` (buildParticipantPanelState).
- **Project memory:** `feedback_participant_copy_voice.md` — defocus rescue motif on participant surfaces.
