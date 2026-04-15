---
title: "Czech native-quality remediation ledger"
type: review
date: 2026-04-13
scope: "Execution ledger for follow-up Czech rewrite work"
status: complete
---

# Czech native-quality remediation ledger

This note consolidates the current rewrite targets for the follow-up Czech remediation pass. It is not another diagnosis memo. It is the execution ledger for the plan in [`docs/plans/archive/2026-04-13-fix-czech-native-quality-audit-and-remediation-plan.md`](../../plans/archive/2026-04-13-fix-czech-native-quality-audit-and-remediation-plan.md).

## Inputs used

- [`2026-04-13-czech-layer2-sweep.md`](./2026-04-13-czech-layer2-sweep.md)
- [`2026-04-13-czech-materials.md`](./2026-04-13-czech-materials.md)
- live grep over in-scope Czech locale files and `workshop-content/agenda.json`

## Repeated issue classes

| Issue class | What it means | Typical examples |
|---|---|---|
| borrowed shorthand | non-technical English left in Czech prose by inertia | `script`, `message`, `callout`, `room`, `next-day commitments` |
| calque | Czech syntax mirrors English instead of using natural Czech structure | `delivery script`, `safe move`, `summary text`, `model jako výchozí volbu` |
| headline label | visible Czech heading or category left in English without strong reason | `Advanced`, `Meta`, `Challenge Cards` |
| ty/vy drift | Czech second-person form shifts inside one scene or artifact | mixed `ty`/`vy` in agenda scenes |
| clarity gap | participant-facing line requires the reader to infer the missing object or referent | `tři místa` not named inline |

## Source-of-truth ledger

| Source to edit | Audience | Main issue classes | Notes |
|---|---|---|---|
| `materials/locales/cs/coaching-codex.md` | participant | borrowed shorthand, calque | Proof slice 1. Dense workshop vocabulary; defines how much English stays. |
| `workshop-content/agenda.json` | hybrid | borrowed shorthand, headline label, ty/vy drift, clarity gap | Proof slice 2 must come from opening/talk/demo path. Canonical source for structured workshop content. |
| `materials/locales/cs/participant-resource-kit.md` | participant | calque, borrowed shorthand | Needs cleanup after proof slice patterns are established. |
| `content/challenge-cards/locales/cs/deck.md` | participant | headline label | `Challenge Cards`, `Advanced`, `Meta`, stretch-goal phrasing. |
| `content/challenge-cards/locales/cs/print-spec.md` | participant | headline label | English category labels are visible and should be intentional. |
| `content/project-briefs/locales/cs/*.md` | participant | borrowed shorthand, calque | Mostly small repeated phrases: `safe move`, `summary text`, `flow`, `workflow` by case. |
| `content/facilitation/locales/cs/*.md` | presenter | borrowed shorthand, calque | Keep facilitator usefulness; remove stage-note English that is not load-bearing. |
| `content/talks/locales/cs/*.md` | presenter | borrowed shorthand, calque | Biggest cluster of `script`, `delivery script`, `callout`, `watch-fors`, `room`. |

## Repeated rewrite targets to normalize

| Current form | Preferred handling rule |
|---|---|
| `safe move` | Prefer natural Czech like `bezpečný další krok` or rewrite the sentence around safe continuation. |
| `script` | Translate unless it names a literal script file. In facilitation prose prefer `podklad`, `postup`, or `sada otázek` by context. |
| `message` | Prefer `sdělení`, `hlavní myšlenka`, or sentence rewrite. |
| `callout` | Prefer `zdůraznění`, `box`, `poznámka`, or rewrite so the sentence does not need the meta term. |
| `room` | Prefer `místnost` only when talking about the physical room. Otherwise use `tým`, `účastníci`, or sentence rewrite. |
| `flow` | Keep when it reads as real developer vocabulary. Rewrite where it is only a stage-note shortcut. |
| `summary text` | Rewrite to Czech (`souhrn`, `shrnující text`) or make the underlying criterion explicit. |
| `Advanced` / `Meta` | Translate on participant-facing visible surfaces unless the English label is a deliberate workshop artifact. |
| `next-day commitments` | Rewrite to natural Czech heading; do not leave as English shorthand. |

## Frozen proof slice

Do not propagate beyond these until the pattern is proven in actual edits:

1. `materials/locales/cs/coaching-codex.md`
2. `workshop-content/agenda.json` — one high-visibility opening/talk/demo slice

## Verification notes

- `workshop-content/agenda.json` changes require `cd dashboard && npm run verify:content`
- all touched Czech files require the Layer 1 typography audit
- this ledger does not close human Czech signoff; it only centralizes execution targets

## Final outcome

Fixed:

- participant-facing English leftovers that were only source-draft shorthand
- talk/facilitator meta language that read as half-translated stage notes
- inconsistent Czech labels in the opening/talk/demo path of `workshop-content/agenda.json`
- repeated calques around `safe move`, `summary text`, `script`, `message`, and visible headings

Intentionally kept in English:

- `workflow`
- `review`
- `skill`
- `runbook`
- `guides`
- `sensors`
- `AGENTS.md`

Deferred with reason:

- full deterministic Layer 1 audit over bilingual `workshop-content/agenda.json`
  - current copy-audit engine treats English branches in mixed `en`/`cs` JSON as Czech and produces false-positive NBSP findings
  - CI wrapper now gates reviewed Czech locale markdown directly, while agenda Czech remains covered by generated-view sync and human review notes
