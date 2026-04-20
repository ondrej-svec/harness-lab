---
title: "Czech review — participant moments, talk phase"
type: review
date: 2026-04-20
scope: "Phase 3 fan-out of docs/plans/2026-04-20-feat-participant-czech-audit-and-rewrite-plan.md"
status: pending-signoff
---

# Participant moments — talk phase

Phase 3 fan-out from the opening proof slice (shipped in `831e7d1`). Applies the user-signed-off house phrases and the "defocus rescue motif" preference to the three talk-phase participant moments.

## Moments in scope

1. `talk-listen` — currently `Zůstaňte s místností` / `Listen for the shift`
2. `talk-note-one-gap` — currently `Pojmenujte jednu mezeru` (clean in prior audit)
3. `talk-ready-for-build` — currently contains the `proof targetem` hybrid

Phase-level `talk.cs.label` (*Řemeslo pod povrchem*) and `talk.cs.roomSummary` are already clean (prior audit); out of scope for rewrite. `talk.cs.goal` contains `z openingu` which does not render on participant surface (fallback-only path) — flagged for a future phase-level pass, out of scope for this plan.

## Systemic findings

### 1. "Zůstaňte s X" calque (2 hits)

Same pattern as opening. Hits in `talk-listen.label` (`Zůstaňte s místností`) and `talk-listen.blocks[0].body` (`Zůstaňte s argumentem a s kontrastem`). Rewrites use the house phrases from plan task 1.2: **A2** `Teď jen poslouchejte` for the room-attention label; **B3** `Všímejte si, co se mění` for the content-attention hero body.

### 2. "proof targetem" hybrid (2 hits)

`talk-ready-for-build.title` and `blocks[0].title` both say *"Vraťte se do repa s jednou mapou, jedním mantinelem a jedním proof targetem"* — English noun with Czech declension inside an otherwise-Czech triadic list. Plan task 1.4 a-iv: restructure in Czech.

Rewrite uses **`jedním ověřením`** — matches the triad's rhythm (mapa / mantinel / ověření = map / boundary / verification), matches the body's own verb triad ("co práci zmapuje, co ji ohraničí a co ji ověří"), and is idiomatic Czech dev register. No English-Czech hybrid.

### 3. `talk-note-one-gap` — no changes

All 6 strings read as native Czech peer voice. Keeping as-is and flipping `cs_reviewed: true`.

## Moment-by-moment findings

### 1. `talk-listen`

**EN canonical:**
- `label`: `Stay with the room`
- `title`: `Listen for the shift`
- `body`: `No table action yet. Track the contrast: prompts are not the system; the repo contract around the agent is.`
- `blocks[0]` (hero):
  - `eyebrow`: `Talk`
  - `title`: `Listen for the shift`
  - `body`: `No table action yet. Stay with the argument and the contrast.`

**Proposed rewrite:**

| Path | Current | Proposed | Rationale |
|---|---|---|---|
| `cs.label` | Zůstaňte s místností | **Teď jen poslouchejte** | Calque fix — house phrase A2. |
| `cs.title` | Poslouchejte, v čem je posun | *keep* | Idiomatic peer-voice Czech. |
| `cs.body` | Teď ještě nepracujte u stolu. Sledujte kontrast: prompt není systém, systém je kontrakt v repu kolem agenta. | *keep* | Clean; `Sledujte kontrast` is a grounded imperative with object. |
| `blocks[0].eyebrow` | Talk | *keep* | Accepted English term. |
| `blocks[0].title` | Poslouchejte, v čem je posun | *keep* | Same as `cs.title`. |
| `blocks[0].body` | Teď ještě nepracujte u stolu. Zůstaňte s argumentem a s kontrastem. | **Teď ještě nepracujte u stolu. Všímejte si, co se mění.** | Calque fix — house phrase B3. Condenses the "argument AND contrast" doublet into a single native imperative. The two halves of the EN sentence map together: the contrast *is* the shift, so noticing one captures both. |

### 2. `talk-note-one-gap`

**Proposed rewrite:** No changes. All 6 strings clean. Flipping `cs_reviewed: true`.

### 3. `talk-ready-for-build`

**EN canonical:**
- `label`: `Get ready for Build 1`
- `title`: `Return to the repo with one map, one boundary, one proof target`
- `body`: `You are about to go back to the repo. Carry one explicit next move: what will map the work, what will bound it, and what will prove it.`
- `blocks[0]` (hero):
  - `eyebrow`: `Next move`
  - `title`: `Return to the repo with one map, one boundary, one proof target`
  - `body`: `Build 1 should start from one explicit operating contract, not from more prompt exploration.`

**Proposed rewrite:**

| Path | Current | Proposed | Rationale |
|---|---|---|---|
| `cs.label` | Připravte se na Build 1 | *keep* | Clean. |
| `cs.title` | Vraťte se do repa s jednou mapou, jedním mantinelem a jedním proof targetem | **Vraťte se do repa s jednou mapou, jedním mantinelem a jedním ověřením.** | Hybrid fix — *ověření* matches the body's verb triad (`ověří`), keeps Czech triadic rhythm, idiomatic dev register. |
| `cs.body` | Za chvíli se vracíte do repa. Odneste si jeden explicitní další krok: co práci zmapuje, co ji ohraničí a co ji ověří. | *keep* | Clean; triadic verbs match the title's triadic nouns. |
| `blocks[0].eyebrow` | Další krok | *keep* | Clean. |
| `blocks[0].title` | Vraťte se do repa s jednou mapou, jedním mantinelem a jedním proof targetem | **Vraťte se do repa s jednou mapou, jedním mantinelem a jedním ověřením.** | Same as `cs.title`. |
| `blocks[0].body` | Build 1 nemá začít dalším hledáním promptu, ale jedním explicitním pracovním kontraktem. | *keep* | Clean peer voice, `promptu` is approved loan. |

## Roll-up

| Moment | Fields rewritten | Fields kept | Flag |
|---|---|---|---|
| `talk-listen` | label, hero body | title, body, hero title, hero eyebrow | → true |
| `talk-note-one-gap` | (none) | all 6 | → true |
| `talk-ready-for-build` | title, hero title | label, body, hero body, hero eyebrow | → true |

**Total:** 4 string rewrites across 3 moments, 14 strings kept as clean native Czech.
