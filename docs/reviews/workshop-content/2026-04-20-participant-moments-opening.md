---
title: "Czech review — participant moments, opening phase"
type: review
date: 2026-04-20
scope: "Phase 2 (proof slice) of docs/plans/2026-04-20-feat-participant-czech-audit-and-rewrite-plan.md"
status: pending-signoff
---

# Participant moments — opening phase

Proof-slice review for `docs/plans/2026-04-20-feat-participant-czech-audit-and-rewrite-plan.md`. Covers the two participant moments in the `opening` phase of `workshop-content/agenda.json`. Both moments carry `cs_reviewed: false` because they shipped via `ec8b1b2` (2026-04-20 surface split) after the 2026-04-13 Phase D/F editorial gate.

## Moments in scope

1. `opening-room-start` — currently "Zůstaňte s místností" / "Stay with the room"
2. `opening-look-up` — currently "Podívejte se nahoru" / "Look up"

Phase-level `opening.cs.{label, roomSummary}` were re-checked and read as clean native Czech (label = "Úvod a naladění", roomSummary narrates the day). No changes there. `opening.cs.goal` does not render on the participant surface for this phase (it only fires in the fallback guidance block, which is bypassed when a `participantMoment` has its own blocks — always the case for opening).

## Systemic findings

### 1. "Zůstaňte s X" calque (2 hits in this moment set)

Literal rendering of the English "Stay with the room" template. "Zůstaňte s místností" is not natural Czech — the verb `zůstat s` implies physical company (a person or animal you stay with), not attention directed at a collective space. Present in `opening-room-start.title` and `opening-room-start.blocks[0].title`. House phrase for this intent (attention on the presenter / no action yet) is **`Teď jen poslouchejte`** (plan task 1.2, option A2, user-signed off).

### 2. "Oblouk dne" metaphor (2 hits)

Literal rendering of "arc of the day". The metaphor has weight in English; in Czech it reads as translated jargon — `oblouk` means the physical shape of an arc or a geometric curve, and the temporal "arc of X" calque is not part of everyday Czech register. Plan decision (task 1.3, option 3): drop the metaphor and use `plán dne` — a neutral, concrete noun.

### 3. "Survives without rescue" motif defocused (user direction)

User direction in-session: defocus the `přežije bez záchrany` / "survives without rescue" narrative motif on participant surfaces. The quality-bar idea is preserved via `laťka`, but the rescue framing is removed from body text. The hero variant replaces the abstract "survives handoff" with an explicit naming of the receivers — *člověk i agent* — which lands the workshop's core thesis in one line instead of leaning on the rescue dramatics. This preference carries into the talk and demo rewrites.

### 4. Idiom correction: `laťku nasadit`, not `splnit laťku`

Earlier draft had `jakou laťku musí práce splnit` — grammatically off. In Czech, `splnit` pairs with criteria / requirements (*splnit podmínky*), while `laťka` pairs with physical-motion verbs: *nasadit laťku* (set the bar), *zvednout laťku* (raise the bar), *překonat laťku* (clear the bar). Final rewrite uses `laťku, kterou nasazujeme`.

### 4. "Opening-look-up" — no systemic issues

The second moment reads cleanly. `Podívejte se nahoru` works in participant context because participants are looking at phones; "look up [from your phone]" is natural. Transition body (`Místnost se přesouvá do talku…`) is in voice. Keeping as-is and flipping `cs_reviewed: true` without changes.

## Moment-by-moment findings

### 1. `opening-room-start`

**EN canonical:**
- `label`: `Look up and orient`
- `title`: `Stay with the room`
- `body`: `No action yet. Listen for the shape of the day and the bar for what must survive without rescue.`
- `blocks[0]` (hero):
  - `eyebrow`: `Opening`
  - `title`: `Stay with the room`
  - `body`: `No action yet. Listen for the day arc and the standard for work that survives handoff.`

**CS current:**
- `label`: `Zorientujte se`
- `title`: `Zůstaňte s místností`
- `body`: `Teď ještě nic nedělejte. Poslouchejte oblouk dne a laťku pro práci, která přežije bez záchrany.`
- `blocks[0]` (hero):
  - `eyebrow`: `Úvod`
  - `title`: `Zůstaňte s místností`
  - `body`: `Teď ještě nic nedělejte. Poslouchejte oblouk dne a laťku pro práci, která přežije předání bez záchrany.`

**Proposed rewrite:**

| Path | Current | Proposed | Rationale |
|---|---|---|---|
| `cs.label` | Zorientujte se | *Zorientujte se* (keep) | Clean imperative, matches EN "Look up and orient" semantically. |
| `cs.title` | Zůstaňte s místností | **Teď jen poslouchejte** | Systemic #1 — calque. House phrase for room-attention intent (plan 1.2 A2). |
| `cs.body` | Teď ještě nic nedělejte. Poslouchejte oblouk dne a laťku pro práci, která přežije bez záchrany. | **Ještě nic nedělejte. Poslouchejte plán dne a laťku, kterou dnes nasazujeme.** | Systemic #2 + #3 — drop the "oblouk dne" calque, drop the "survives without rescue" motif per user direction to defocus the rescue framing on participant surfaces. Fixes idiom: `laťku nasadit` is the correct Czech collocation (`splnit laťku` was wrong). Dropped opening "Teď" to avoid repeat with title. |
| `blocks[0].eyebrow` | Úvod | *Úvod* (keep) | Clean. |
| `blocks[0].title` | Zůstaňte s místností | **Teď jen poslouchejte** | Same as `cs.title`. |
| `blocks[0].body` | Teď ještě nic nedělejte. Poslouchejte oblouk dne a laťku pro práci, která přežije předání bez záchrany. | **Ještě nic nedělejte. Poslouchejte plán dne a laťku pro práci, kterou zvládne převzít člověk i agent.** | Same systemic fixes as body, plus keeps the hero's handoff specificity by naming the receivers explicitly (*člověk i agent*) instead of the abstract "survives handoff". Lands the workshop's core thesis — work transfers cleanly between humans and agents — inline. |

### 2. `opening-look-up`

**EN canonical:**
- `label`: `Look up`
- `title`: `Your team is recorded. Look up.`
- `body`: `The room is moving into the talk. Pause the table setup and switch your attention back to the front.`
- `blocks[0]` (hero):
  - `eyebrow`: `Transition`
  - `title`: `Your team is recorded. Look up.`
  - `body`: `Team is set. The room is moving into the talk.`

**CS current:**
- `label`: `Podívejte se nahoru`
- `title`: `Tým je zapsaný. Podívejte se nahoru.`
- `body`: `Místnost se přesouvá do talku. Přerušte nastavování u stolu a vraťte pozornost dopředu.`
- `blocks[0]` (hero):
  - `eyebrow`: `Přechod`
  - `title`: `Tým je zapsaný. Podívejte se nahoru.`
  - `body`: `Tým je hotový. Místnost se přesouvá do talku.`

**Proposed rewrite:** No changes. All 6 strings read as native Czech. `Podívejte se nahoru` is context-appropriate (participants looking up from phones). `Místnost se přesouvá do talku` uses `talku` (Czech-declined English loan), acceptable per style-examples.md approved-terms list. Flipping `cs_reviewed: true` without edits.

## Roll-up table (for signoff)

| Moment | Field | Action |
|---|---|---|
| `opening-room-start` | `cs.label` | keep |
| `opening-room-start` | `cs.title` | rewrite → `Teď jen poslouchejte` |
| `opening-room-start` | `cs.body` | rewrite → see moment 1 |
| `opening-room-start` | `blocks[0].eyebrow` | keep |
| `opening-room-start` | `blocks[0].title` | rewrite → `Teď jen poslouchejte` |
| `opening-room-start` | `blocks[0].body` | rewrite → see moment 1 |
| `opening-room-start` | `cs_reviewed` | flip `false → true` |
| `opening-look-up` | all fields | keep |
| `opening-look-up` | `cs_reviewed` | flip `false → true` |

## Layer 1 typography

Proposed strings were dry-run against `scripts/content/check-czech-anglicisms.ts` — no rejected words (existing rules). The new "Zůstaňte s X" trap gets added in Phase 5 of the plan; running it against these rewrites at that stage will confirm zero matches.

## Acceptance criteria for this memo

- User native signoff per row above.
- After signoff: apply rewrites to `workshop-content/agenda.json`, regenerate views, flip `cs_reviewed` flags, commit.
