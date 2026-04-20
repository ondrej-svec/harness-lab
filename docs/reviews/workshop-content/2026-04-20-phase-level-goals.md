---
title: "Czech review — phase-level goal + roomSummary"
type: review
date: 2026-04-20
scope: "Phase B of docs/plans/2026-04-20-feat-participant-ui-czech-and-phase-goal-audit-plan.md"
status: pending-signoff
---

# Phase-level `cs.goal` + `cs.roomSummary` audit

Audit of `phases[*].cs.goal` + `phases[*].cs.roomSummary` across all 11 phases. Priority: the 8 phases without `participantMoments` (build-1, intermezzo-1, lunch-reset, rotation, build-2, intermezzo-2, build-2-second-push, reveal), where `cs.goal` renders as the headline and `cs.roomSummary` as the body of the participant fallback block (`dashboard/lib/public-page-view-model.ts:122-135`). Also covers cross-phase consistency issues (e.g. `talk.cs.goal "z openingu"`).

## Participant-visibility recap

From the render-path verification in Phase 1 of the parent plan:

- `phase.cs.label` → `currentAgendaItem.title` → **rendered** as phase breadcrumb + metric.
- `phase.cs.roomSummary` → `currentAgendaItem.description` → **rendered**.
- `phase.cs.goal` → rendered as fallback hero title **only when no `participantMoment` has blocks**. For phases 3–10 (no moments), this is always. For opening/talk/demo (moments always present), it's never — so `talk.cs.goal` issues are consistency bugs, not participant-visible ones.

## Systemic findings

### 1. Rescue motif on participant-visible `reveal` (4 hits, CS + EN)

`reveal.cs.goal`, `reveal.cs.roomSummary`, `reveal.en.goal`, `reveal.en.roomSummary` all contain variants of *"pomáhají práci **přežít předání**"* / *"helped work **survive handoff**"*. This is the direct rescue-motif family the user asked to defocus on participant surfaces. `reveal` is participant-visible (no moments), so all four strings fall under Rule 1 from `feedback_participant_copy_voice.md`.

Rewrite direction: replace `přežít předání` / `survive handoff` with positive continuation framing. Czech: `práce unese předání` (hold the bar), `projde předáním`, `drží předání`. English: `hold up through handoff`, `carry forward through handoff`.

### 2. `Dostat tým do režimu, kde...` calque (1 hit, `build-1.cs.goal`)

Literal rendering of "get the team into mode where…". Native Czech frames the same meaning with a purpose-forward construction: `Do oběda má mít každý tým...`. Reads directly and matches the peer register.

### 3. `vrátit místnost k tomu, že...` mild calque (1 hit, `intermezzo-1.cs.goal`)

Awkward nominalized construction. Native Czech peer verb: `připomenout místnosti, že...`. Drops the prepositional-phrase roundabout.

### 4. `mezipatro` vs phase label `Intermezzo 2` inconsistency (2 hits, `build-2-second-push`)

The phase label (throughout the agenda) is `Intermezzo 2`. Using `mezipatro` (mezzanine) as a metaphor for the intermezzo phase creates cross-phase terminology drift. Fix: use `intermezzo` (already the canonical label form).

### 5. `z openingu` hybrid (1 hit, `talk.cs.goal`)

English loan + Czech declension where a native Czech term already exists in the same document — `opening` is `Úvod a naladění` (phase label). Fix: `z úvodu`. **Note:** `talk.cs.goal` doesn't render on participant surface (moments present), so this is a consistency bug only. Fixed in the same sweep per the plan's cross-phase-consistency rule.

### 6. Clean phase-level copy (no changes)

- `lunch-reset.cs.goal` + `cs.roomSummary` — clean peer voice, uses accepted `flow` loan correctly.
- `rotation.cs.goal` + `cs.roomSummary` — positive model; `Vynutit tichý start` is in-voice. Cited as reference in the parent plan.
- `build-2.cs.goal` + `cs.roomSummary` — clean triadic (`lepší mapy, lepšího ověřování, lepšího předání`). Describes the rotation test specifically — `nový tým` narrow subject is factually correct (it IS team rotation), not a violation of Rule 2.
- `intermezzo-2.cs.goal` + `cs.roomSummary` — clean.
- `opening`, `talk`, `demo` phase-level strings — not participant-visible; out of scope beyond the one `z openingu` fix.

## Per-phase proposed rewrites

### `build-1.cs.goal`

| Path | Current | Proposed | Rationale |
|---|---|---|---|
| `phases[build-1].cs.goal` | Dostat tým do režimu, kde do oběda existuje repo, AGENTS.md, plán kroků, nejmenší ověření a první ověřený výstup. | **Do oběda má mít každý tým repo, AGENTS.md, plán kroků, nejmenší ověření a první ověřený výstup.** | Calque fix — purpose-forward Czech construction, drops "Dostat tým do režimu, kde" calque. |

`build-1.en.goal` stays — clean native EN.

### `intermezzo-1.cs.goal`

| Path | Current | Proposed | Rationale |
|---|---|---|---|
| `phases[intermezzo-1].cs.goal` | Zviditelnit učení napříč týmy a vrátit místnost k tomu, že workflow je stejně důležité jako samotný výsledek. | **Zviditelnit učení napříč týmy a připomenout místnosti, že workflow je stejně důležité jako samotný výsledek.** | Calque fix — "vrátit...k tomu, že" → "připomenout místnosti, že", single native verb. |

`intermezzo-1.en.goal` stays — clean.

### `build-2-second-push.cs.goal` + `cs.roomSummary`

| Path | Current | Proposed | Rationale |
|---|---|---|---|
| `phases[build-2-second-push].cs.goal` | Aplikujte signál z **mezipatra**. Iterujte, rozšiřujte, tlačte dál. Commitněte a udělejte repo čitelné pro Závěr. | Aplikujte signál **z intermezza**. Iterujte, rozšiřujte, tlačte dál. Commitněte a udělejte repo čitelné pro Závěr. | Terminology consistency — `intermezzo` matches phase label. |
| `phases[build-2-second-push].cs.roomSummary` | Druhý push Build 2. Tým jedná podle toho, **co zvedlo mezipatro**, a připravuje repo pro Závěr. | Druhý push Build 2. Tým jedná podle toho, **co zvedlo intermezzo**, a připravuje repo pro Závěr. | Same. |

`build-2-second-push.en.goal` already uses `"the intermezzo's signal"` — consistent. No change.

### `reveal.cs.goal` + `cs.roomSummary` + `en.goal` + `en.roomSummary`

| Path | Current | Proposed | Rationale |
|---|---|---|---|
| `phases[reveal].cs.goal` | Uzavřít den přes konkrétní signály, které **pomáhají práci přežít předání**, a převést je do další praxe i do lepšího workshopového systému. | Uzavřít den přes konkrétní signály, **díky kterým práce unese předání**, a převést je do další praxe i do lepšího workshopového systému. | Rule 1 — defocus rescue motif. `unese předání` matches existing in-voice phrasing (`jestli … repa opravdu unese nový tým` in build-2.cs.roomSummary). |
| `phases[reveal].cs.roomSummary` | Závěr a reflexe nejsou soutěž týmů. Sledujeme, **které signály pomáhají práci přežít předání** a které ji brzdí. | Závěr a reflexe nejsou soutěž týmů. Sledujeme, **co práci při předání drží** a co ji brzdí. | Rule 1 — `drží` (holds up) is positive, creates parallel with `brzdí` (slows it) already in the sentence. |
| `phases[reveal].en.goal` | Close the day by naming the signals that **helped work survive handoff** and by turning them into next practice, not just a pleasant ending. | Close the day by naming the signals that **helped the work carry forward through handoff** and by turning them into next practice, not just a pleasant ending. | Rule 1 parity — `carry forward` is positive, matches the Czech "unese předání" semantics. |
| `phases[reveal].en.roomSummary` | Reveal and reflection are not a team ranking. They are the moment where the room decides **which signals helped work survive handoff** and which ones repeatedly failed. | Reveal and reflection are not a team ranking. They are the moment where the room decides **which signals carried the work through handoff** and which ones repeatedly failed. | Same. |

### `talk.cs.goal`

| Path | Current | Proposed | Rationale |
|---|---|---|---|
| `phases[talk].cs.goal` | Proměnit energii **z openingu** v přesnou tezi: harness engineering je týmová infrastruktura pro práci s agenty a první build krok musí začít mapou, mantinely a ověřením, ne dalším promptem. | Proměnit energii **z úvodu** v přesnou tezi: harness engineering je týmová infrastruktura pro práci s agenty a první build krok musí začít mapou, mantinely a ověřením, ne dalším promptem. | Hybrid fix — `úvod` matches the canonical phase label `Úvod a naladění`. |

## Roll-up

| Phase | CS changes | EN changes |
|---|---|---|
| `build-1` | `cs.goal` | — |
| `intermezzo-1` | `cs.goal` | — |
| `build-2-second-push` | `cs.goal`, `cs.roomSummary` | — |
| `reveal` | `cs.goal`, `cs.roomSummary` | `en.goal`, `en.roomSummary` |
| `talk` | `cs.goal` | — |
| **Total** | **7** | **2** |

## Proof-slice gate

Per plan B.3: **`reveal.cs.goal`** is the proof slice (highest severity — participant-visible rescue motif). If the proof-slice rewrite is signed off:
- Apply `reveal.cs.goal` + `cs.roomSummary` + `en.goal` + `en.roomSummary` together (4 strings, one semantic decision).
- Then fan out to build-1 / intermezzo-1 / build-2-second-push / talk — mechanical fixes with lower judgment overhead.

Single-commit feasible if signoff lands cleanly across all rows.

## Acceptance

- User signs off on proposed rewrites row-by-row (or tweaks specific rows).
- After signoff: apply to `workshop-content/agenda.json`, regenerate views, run content checks + vitest, commit.
