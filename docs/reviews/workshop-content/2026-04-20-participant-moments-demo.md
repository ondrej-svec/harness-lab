---
title: "Czech review — participant moments, demo phase"
type: review
date: 2026-04-20
scope: "Phase 3 fan-out of docs/plans/2026-04-20-feat-participant-czech-audit-and-rewrite-plan.md"
status: pending-signoff
---

# Participant moments — demo phase

Phase 3 fan-out. Applies the same house phrases and defocus-rescue preference to the three demo-phase participant moments.

## Moments in scope

1. `demo-watch-the-contrast` — currently contains two "Zůstaňte s X" calques
2. `demo-name-your-first-artifact` — clean in prior audit
3. `demo-open-build-brief` — one residual `Participant plocha` hybrid (the other issues were fixed in `f9f2295`)

Phase-level `demo.cs.label` (*Ukážu vám to*) and `demo.cs.roomSummary` are already clean. Out of scope.

## Systemic findings

### 1. "Zůstaňte s X" calque (2 hits — both in `demo-watch-the-contrast`)

- `demo-watch-the-contrast.cs.body`: `Zůstaňte s demem.` — rewrite uses **C2** `Sledujte, co se právě děje` (house phrase for live-action attention).
- `demo-watch-the-contrast.blocks[0].body`: `Zůstaňte s kontrastem.` — rewrite uses **`Všímejte si kontrastu`**, a B3-adjacent variant that keeps the explicit *kontrast* noun (matches the hero title's focus) while dropping the `Zůstaňte s` calque.

### 2. `Participant plocha` hybrid (1 hit)

`demo-open-build-brief.blocks[0].body` contains *"Participant plocha je stabilní cesta"* — English adjective + Czech noun. Plan task 1.4 b-ii: rewrite to **`Plocha pro účastníky`** (all Czech).

### 3. `demo-name-your-first-artifact` — no changes

All 6 strings clean. The phrase *"než se práce rozběhne do šířky"* is a native Czech idiom worth preserving explicitly as a positive model for future authoring. Flipping `cs_reviewed: true` without edits.

## Moment-by-moment findings

### 1. `demo-watch-the-contrast`

**EN canonical:**
- `label`: `Watch the contrast`
- `title`: `Watch what the repo changes`
- `body`: `Stay with the demo. The point is not the command. The point is which repo artifact changes the agent's behavior.`
- `blocks[0]` (hero):
  - `eyebrow`: `Demo`
  - `title`: `Watch what the repo changes`
  - `body`: `Stay with the contrast. Look for the artifact that changes the outcome.`

**Proposed rewrite:**

| Path | Current | Proposed | Rationale |
|---|---|---|---|
| `cs.label` | Sledujte kontrast | *keep* | Clean imperative with concrete object. |
| `cs.title` | Sledujte, co mění repo | *keep* | Clean. |
| `cs.body` | Zůstaňte s demem. Nejde o příkaz. Jde o to, který artefakt v repu mění chování agenta. | **Sledujte, co se právě děje. Nejde o příkaz. Jde o to, který artefakt v repu mění chování agenta.** | Calque fix — house phrase C2. |
| `blocks[0].eyebrow` | Demo | *keep* | Accepted loan. |
| `blocks[0].title` | Sledujte, co mění repo | *keep* | Clean. |
| `blocks[0].body` | Zůstaňte s kontrastem. Hledejte artefakt, který mění výsledek. | **Všímejte si kontrastu. Hledejte artefakt, který mění výsledek.** | Calque fix — B3-adjacent, keeps explicit *kontrast* noun. |

### 2. `demo-name-your-first-artifact`

**Proposed rewrite:** No changes. All 6 strings clean. Flipping `cs_reviewed: true`.

### 3. `demo-open-build-brief`

**EN canonical:**
- `label`: `Open the working materials`
- `title`: `Open the brief, repo, and fallback path now`
- `body`: `Build 1 starts next. Open the brief, open the repo, and keep the browser fallback visible if local setup is not ready.`
- `blocks[0]` (hero):
  - `eyebrow`: `Next move`
  - `title`: `Open the brief, repo, and fallback path now`
  - `body`: `Use the participant surface as the stable path. Use the skill only if it is genuinely faster for your table.`

**Proposed rewrite:**

| Path | Current | Proposed | Rationale |
|---|---|---|---|
| `cs.label` | Otevřete pracovní materiály | *keep* | Clean. |
| `cs.title` | Otevřete zadání, repo a záložní cestu | *keep* | Fixed in `f9f2295` — clean. |
| `cs.body` | Build 1 začíná hned potom. Otevřete zadání, otevřete repo a nechte si po ruce záložní variantu v prohlížeči, pokud lokální setup ještě neběží. | *keep* | Fixed in `f9f2295` — clean. |
| `blocks[0].eyebrow` | Další krok | *keep* | Clean. |
| `blocks[0].title` | Otevřete zadání, repo a záložní cestu | *keep* | Clean. |
| `blocks[0].body` | Participant plocha je stabilní cesta. Skill použijte jen tehdy, když je pro váš stůl opravdu rychlejší. | **Plocha pro účastníky je stabilní cesta. Skill použijte jen tehdy, když je pro váš stůl opravdu rychlejší.** | Hybrid fix — all-Czech phrasing. |

## Roll-up

| Moment | Fields rewritten | Fields kept | Flag |
|---|---|---|---|
| `demo-watch-the-contrast` | body, hero body | label, title, hero title, hero eyebrow | → true |
| `demo-name-your-first-artifact` | (none) | all 6 | → true |
| `demo-open-build-brief` | hero body | label, title, body, hero title, hero eyebrow | → true |

**Total:** 3 string rewrites across 3 moments, 15 strings kept as clean native Czech.

---

## Phase 3 combined total (talk + demo)

**7 string rewrites across 6 moments; 29 strings kept as clean native Czech.** All 8 of the plan's participant moments (2 opening + 3 talk + 3 demo) will be at `cs_reviewed: true` after Phase 3 commits.
