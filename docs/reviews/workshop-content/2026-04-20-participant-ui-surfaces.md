---
title: "Czech review — participant UI surfaces (diff-based)"
type: review
date: 2026-04-20
scope: "Phase A of docs/plans/2026-04-20-feat-participant-ui-czech-and-phase-goal-audit-plan.md"
status: pending-signoff
---

# Participant UI surfaces — diff-based Czech audit

Diff-based audit of Czech strings introduced between `ff85c84` (2026-04-13 Phase F lock) and HEAD on the four `surface_profile: participant` files from `.copy-editor.yaml`. Covers 234 CS-bearing line additions across the four files.

## Files in scope

| File | `+` CS lines since ff85c84 | Verdict |
|---|---|---|
| `dashboard/app/components/participant-identify-prompt.tsx` | 2 (actually 3 strings) | clean |
| `dashboard/lib/public-page-view-model.ts` | 20 | 1 hybrid |
| `dashboard/app/components/participant-room-surface.tsx` | 65 | clean |
| `dashboard/lib/ui-language.ts` | 147 | 1 rescue motif (participant-visible) + 10 hybrids (admin UI) + 4 "live marker" (admin UI, discretionary) |

## A.0 sweep — out-of-scope files surfaced

Grep for CS diacritics across `dashboard/app/components/participant-*.tsx`, `dashboard/app/participant/`, `dashboard/lib/*.ts` found three additional files beyond the plan's scope:

- `dashboard/lib/participant-paste-parser.ts` — CS only in lookup-keyword Set (`"jméno"`, `"účastník"`), not user-facing copy. **Not in scope.**
- `dashboard/lib/workshop-data.ts` — CS strings are facilitator-runner defaults (`"Drž krátké tempo..."`, `"Usaď hlavní kontrast..."`) which produce values for `facilitatorRunner.say[]`. Facilitator-facing. **Not in scope** (plan's "Out of scope" rule for facilitator-only fields).
- `dashboard/app/components/participant-identify-flow.tsx` — **UNTRACKED** in-progress work from another session. **Not in scope** — respect uncommitted work.
- `dashboard/app/participant/page.test.tsx` — test assertions, not user copy. **Not in scope**.

Original 4 files remain the audit scope.

## Systemic findings

### 1. Rescue motif on participant-visible landing (1 hit)

`ui-language.ts:69` — inside `publicCopy.cs.structurePhase4Body` (the rotation-phase description on the public landing + participant surface):

> *"Jiný tým přebírá vaše repo. Nejdřív čte, pak diagnostikuje, teprve pak mění. Co přežije bez autorů v místnosti?"*

The closing rhetorical question *"Co přežije bez autorů v místnosti?"* ("What survives without the authors in the room?") is the rescue-motif family the user asked to defocus. This is a borderline case — the page describes the workshop's structural design to a reader who's exploring what the day looks like, so the rhetorical framing has more room to breathe than a mid-session participant moment would. But it still echoes the same motif the parent plan pulled out of `opening-room-start`.

### 2. English-adjective + Czech-noun hybrid (11 hits, all admin UI)

- `participant plocha / plochu / plochy` (7 hits in `ui-language.ts` adminCopy.cs) — the plan's parent made the canonical decision to use **`plocha pro účastníky`** (1.4 b-ii). The correct form already appears 13 times in the same file; the hybrid appears 7. Inconsistency, not an ambiguous call.
- `participant scénář` (1 hit, `ui-language.ts:330`) — same pattern.
- `workspace přehledu` / `workspace přehledu` (2 hits, `ui-language.ts:276, 360`) — English noun with Czech declension. Correct Czech form: restructure around `přehledu workspace` (Czech first) or all-Czech alternative. The word `workspace` itself has accepted-loan status in dev Czech.
- `týmový board` (1 hit, `public-page-view-model.ts:330`) — English `board` with Czech adjective. Correct Czech form: `týmová nástěnka` or drop English entirely and say `týmová plocha`.

These are all adminCopy / facilitator-facing strings (softer rules apply) *except* the `týmový board` which is in `public-page-view-model.ts` on a string that renders to participants (`"Držte tady jen to, co právě potřebujete..."`). That one is strict-rule territory.

### 3. "live marker" as English UI term (4 hits, admin UI)

`ui-language.ts:372, 374, 377, 378` — all in adminCopy.cs describing the facilitator's control room:

- *"posunout live marker"* (button)
- *"...posunete live marker bez editorského šumu."*
- *"Jen posouváte live marker v této instanci."*
- *"...spusťte projekci nebo sem rovnou posuňte live marker."*

`live marker` is a UI-object name that acts as a noun phrase. Options: keep as English UI term (consistent with "blueprint", "workspace", etc. already accepted), translate to `živý ukazatel`, or restructure around `aktuální fáze` / `posun v agendě`. The facilitator-facing register allows the English UI term to stand — this is discretionary.

### 4. Large spans of clean native Czech (the good news)

`participant-room-surface.tsx` +65 CS lines — all read as native Czech peer voice. Signature authoring work in commit `148d576` ("tighten czech participant home copy") set a high bar. Positive models worth preserving explicitly as references:

- *"Mějte po ruce to podstatné: zadání, repo, prompty k výzvám, fallback a krátký záznam, ke kterému se dá vrátit."*
- *"Další člověk ani další agent by neměli muset hádat, co se stalo."* — this one explicitly names the human/agent scope, matching the `opening-room-start` H1 rewrite from the parent plan.
- *"Zapište stručně to, k čemu se má místnost vrátit: co jste změnili, čím jste to ověřili a co má přijít dál."*
- *"Napište, jaký důkaz nebo kontrola potvrzuje, že změna drží."*

`participant-identify-prompt.tsx` +3 strings — all clean (`Jak se jmenujete?` / `Pokračovat` / `Vaše jméno`).

Most of `public-page-view-model.ts` +20 strings — clean.

The majority of `ui-language.ts` +147 strings — clean.

**Net:** the 234-line drift contains a lot of good Czech. The 15 flagged hits are concentrated in specific patterns, not a systemic quality collapse.

## File-by-file proposed actions

### 1. `dashboard/app/components/participant-identify-prompt.tsx`

No changes. Keep all 3 CS strings (`Jak se jmenujete?`, `Pokračovat`, `Vaše jméno`).

### 2. `dashboard/lib/public-page-view-model.ts`

| Line | Current | Proposed | Rationale |
|---|---|---|---|
| 330 | `...ne nahrazovat týmový board.` | `...ne nahrazovat týmovou plochu.` | Hybrid fix. `Plocha` is already the established word for these surfaces in the codebase (per plan's parent b-ii). Keeps the Czech-first rule without inventing a new term. |

No other changes.

### 3. `dashboard/app/components/participant-room-surface.tsx`

No changes. All 65 added CS lines read as native Czech peer voice.

### 4. `dashboard/lib/ui-language.ts`

**Participant-visible (publicCopy.cs) — 1 change:**

| Line | Current | Proposed | Rationale |
|---|---|---|---|
| 69 | `Jiný tým přebírá vaše repo. Nejdřív čte, pak diagnostikuje, teprve pak mění. Co přežije bez autorů v místnosti?` | **`Jiný tým přebírá vaše repo. Nejdřív čte, pak diagnostikuje, teprve pak mění. Dokáže na vaši práci navázat bez vás v místnosti?`** | Drops the rescue motif (*Co přežije* → *Dokáže navázat*); shifts the framing from "survival" to "continuation" — same semantic payload, positive frame. Matches the defocus-rescue preference saved to project memory. |

**Facilitator/admin (adminCopy.cs) — 7 + 3 changes (hybrid consolidation):**

`participant plocha` hybrid → canonical `plocha pro účastníky` form:

| Line | Current | Proposed | Rationale |
|---|---|---|---|
| 440 | `continuationEyebrow: "odemknutí participant plochy"` | `continuationEyebrow: "odemknutí plochy pro účastníky"` | Hybrid → canonical. |
| 443 | `handoffMomentLiveDescription: "Rotace právě běží. Tady otevřete participant plochu a držte po ruce i rozpis přesunů."` | `handoffMomentLiveDescription: "Rotace právě běží. Tady otevřete plochu pro účastníky a držte po ruce i rozpis přesunů."` | Same. |
| 446 | `revealTitle: "stav participant plochy"` | `revealTitle: "stav plochy pro účastníky"` | Same. |
| 466 | `participantSurfaceCardDescription: "Vedlejší záchranná vrstva pro chvíli, kdy už je rotace pryč, ale potřebujete stav participant plochy ještě upravit."` | `participantSurfaceCardDescription: "Vedlejší záchranná vrstva pro chvíli, kdy už je rotace pryč, ale potřebujete stav plochy pro účastníky ještě upravit."` | Same. |
| 473 | `presenterOpenParticipantButton: "otevřít participant plochu"` | `presenterOpenParticipantButton: "otevřít plochu pro účastníky"` | Same. |

Other hybrids:

| Line | Current | Proposed | Rationale |
|---|---|---|---|
| 330 | `instanceSelectHint: "Tahle volba zatím mění hlavně participant scénář a nastavení rotace podle velikosti skupiny."` | `instanceSelectHint: "Tahle volba zatím mění hlavně scénář pro účastníky a nastavení rotace podle velikosti skupiny."` | Hybrid → consistent `X pro účastníky` pattern. |
| 276 | `workspaceCreateStepOne: "instance se objeví ve workspace přehledu"` | `workspaceCreateStepOne: "instance se objeví v přehledu workspace"` | Hybrid — restructure to Czech-first ("in the overview of [workspace]") so declension sits on the Czech noun. `workspace` itself is accepted tech loan. |
| 360 | `"Tohle je druhá vrstva operace. Instance zmizí z aktivního workspace přehledu, ale před odebráním se automaticky vytvoří archiv aktuálního stavu."` | `"Tohle je druhá vrstva operace. Instance zmizí z aktivního přehledu workspace, ale před odebráním se automaticky vytvoří archiv aktuálního stavu."` | Same restructure. |

**`live marker` — discretionary (4 hits, admin UI):**

Recommendation: **keep as-is**. `live marker` is a named UI object in the facilitator control room (like `workspace`, `blueprint`, `checkpoint`), and the admin register allows established English UI terms. Translating to `živý ukazatel` would be accurate but create a mismatch with the rest of the control-room vocabulary.

Alternative if rejected: rewrite all 4 to `ukazatel aktuální fáze`. Flagging for your call.

## Roll-up

| File | Changes | Keep |
|---|---|---|
| `participant-identify-prompt.tsx` | 0 | 3 |
| `public-page-view-model.ts` | 1 | ~19 |
| `participant-room-surface.tsx` | 0 | 65+ |
| `ui-language.ts` publicCopy | 1 (rescue motif) | ~60 |
| `ui-language.ts` adminCopy | 7 `participant plocha` hybrids + 1 `participant scénář` + 2 `workspace přehledu` | ~80 |
| `ui-language.ts` `live marker` | 0 (keep, discretionary) | 4 |
| **Total** | **12 string rewrites** | **clean majority** |

## Phase C decision

The audit surfaced:
- 11 hybrid-fragment hits — all share the same `English + Czech-declined` pattern but target different words (`plocha`, `scénář`, `přehledu`, `board`). Writing a generic Layer 1 regex for this class would be noisy (every legitimate Czech-declined English loan would trigger).
- 1 rescue motif — participant-specific, better caught at review.

**Recommendation:** **Phase C (extend `check-czech-anglicisms.ts` to scan `.ts` files) stays skipped.** The hybrid pattern is too broad for a safe regex without false positives, and the rescue motif is already on the Layer 2 radar via `content/czech-reject-list.md`. Document the `participant plocha` family as a reject-list entry so future authoring catches it at draft time.

## Proof-slice gating

Per the plan, proof slice for Phase A:
1. `participant-identify-prompt.tsx` — zero changes, just verify signoff on keep-as-is.
2. One thematic cluster from `ui-language.ts` — I recommend the **`participant plocha` consolidation** (7 hits, one pattern) as the proof-slice apply: it's mechanical, low-judgment, and validates that the review-note-to-apply loop works on UI files.

If the proof slice lands cleanly, fan out to:
- `public-page-view-model.ts` hybrid fix (1 string)
- `ui-language.ts` line 69 rescue-motif rewrite
- `ui-language.ts` `participant scénář` and `workspace přehledu` fixes

## Acceptance for this memo

- User signs off on the 12 proposed rewrites (or rejects / tweaks specific rows).
- User decides on the `live marker` discretionary question (keep vs translate).
- After signoff: apply the approved rewrites per file, run `pnpm vitest run` + spot-check `/participant` locally, commit in logical units.

## Expansion during signoff

During in-session review the user surfaced two additional systemic rules that expanded the scope beyond the initial 12 rewrites:

1. **Grammar correctness on the restructured question** — initial proposal `Dokáže na vaši práci navázat bez vás v místnosti?` had no explicit subject across four sentences with dropped subject chain + voice shift. Final rewrite uses explicit subject `vaše práce` + `Obstojí` verb + `ať už` concessive triad.

2. **Name the human/agent/team triad** — wherever copy (CS or EN) describes continuation/handoff with a narrow subject (`další tým` / `another team`), expand to the triad (`další tým, člověk nebo agent` / `another team, teammate, or agent`). This aligns participant-facing landing copy with the workshop's thesis. Saved as a standing rule in project memory (`feedback_participant_copy_voice.md` → Rule 2).

Rewrites added during signoff:

| File / line | Current | Final applied |
|---|---|---|
| `ui-language.ts:31` (publicCopy.cs heroBody) | …dokáže navázat další tým — bez autorů v místnosti. | …dokáže navázat další tým, člověk nebo agent — bez autorů v místnosti. |
| `ui-language.ts:60` (publicCopy.cs structurePhase1Body) | …jestli na něj další tým dokáže navázat. | …jestli na něj dokáže navázat další tým, člověk nebo agent. |
| `ui-language.ts:69` (publicCopy.cs structurePhase4Body) | Jiný tým přebírá vaše repo. … Co přežije bez autorů v místnosti? | Jiný tým přebírá vaše repo. … Obstojí vaše práce bez vás v místnosti, ať už ji převezme další tým, člověk nebo agent? |
| `ui-language.ts:152` (publicCopy.en heroBody) | Success is when another team can continue the work without the authors in the room. | Success is when another team, teammate, or agent can continue the work without the authors in the room. |
| `ui-language.ts:190` (publicCopy.en structurePhase4Body) | …What survives without the authors in the room? | …Will your work hold up without you in the room — for another team, teammate, or agent? |

Per-paragraph voice consistency honored: lines 31 + 60 stay 3rd-person (`bez autorů`, EN `the authors`); line 69 stays 2nd-person (`vaše repo` → `vaše práce` → `bez vás`); EN line 190 mirrors 2nd-person (`your repo` → `your work` → `without you`).

**Final total: 17 string rewrites across 3 of the 4 UI files (plus 0 on `participant-identify-prompt.tsx` which verified clean).**
