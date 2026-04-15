# 2026-04-09 Czech Visible Surface Review

Status: in progress

This review note records the systemic Czech-language pass requested after live workshop review surfaced repeated mixed-language and translated-shorthand issues on visible workshop surfaces.

It supplements [`2026-04-09-talk-proof-slice-review.md`](./2026-04-09-talk-proof-slice-review.md) and the active plan [`2026-04-09-feat-workshop-blueprint-content-excellence-and-readiness-plan.md`](../../plans/archive/2026-04-09-feat-workshop-blueprint-content-excellence-and-readiness-plan.md).

## Scope

- visible Czech room scenes in the agenda-backed workshop blueprint
- visible Czech participant scenes in the agenda-backed workshop blueprint
- the durable Czech review doctrine for future visible-surface changes

## Files Under Review

- `dashboard/lib/workshop-blueprint-agenda.json`
- `dashboard/lib/workshop-blueprint-localized-content.ts`
- `content/czech-editorial-review-checklist.md`
- `content/style-guide.md`
- `docs/workshop-content-language-architecture.md`
- `docs/workshop-content-qa.md`
- `docs/plans/archive/2026-04-09-feat-workshop-blueprint-content-excellence-and-readiness-plan.md`

## Why This Review Exists

Live review and screenshot feedback showed a recurring failure mode:

- visible Czech slides and participant surfaces still contained English workshop shorthand or half-translated system language
- the wording was often structurally understandable, but not yet natural enough to feel authored for a Czech developer room
- the repo had style and checklist guidance already, but not an explicit rule that AI-assisted review cannot close the blocking Czech gates by itself

## Issues Observed Before This Pass

Examples that triggered the review:

- `Proto je launch důležitý`
- `Bez checku jen tipujete`
- `Participant vrstva`
- `harness engineering matters právě teď`
- internal-style visible attribution such as `Harness Lab demo framing`

These examples all pointed to the same underlying problem: weak Czech was still being allowed through when the workshop concept was strong enough to deserve a cleaner delivery standard.

## Changes Applied In This Pass

### Visible Czech agenda fixes

Corrected the most obvious mixed-language or translated-shorthand phrases in the current agenda-owned workshop content, including:

- `Proč tímhle začínáme` instead of the previous `launch` heading
- `Bez ověření jen hádáte` instead of the previous `check` heading
- `další bezpečný krok` instead of `safe move` on visible Czech content
- `Pohled pro účastníky` instead of `Participant vrstva`
- `Co si z dneška odnesete do skutečné práce` instead of the awkward `Co si zítřka odnesete...`
- a non-attributed internal demo quote converted into a normal callout so it no longer pretends to be visible authority

### Process hardening

The review doctrine now states explicitly:

- visible-Czech and spoken-readability gates require a Czech-fluent human reviewer
- AI/LLM review may assist, but it cannot close those blocking gates on its own
- visible Czech changes should leave a review note under `docs/reviews/workshop-content/`

## AI-Assisted Review Result

An AI-assisted review was run with Claude Code using the `opus` model in `default` permission mode.

What it helped surface:

- remaining mixed-language phrases in Czech agenda copy
- internal/source-like visible attribution on a demo scene
- awkward Czech phrasing in later-day scenes
- a process gap between documented gates and executed review artifacts

What it did not do:

- it did not replace Czech human signoff
- it did not complete the spoken-readability gate
- it did not complete the visible-Czech human gate

## Gate Status

| Gate | Status | Evidence |
| --- | --- | --- |
| AI-assisted detection pass | Pass | Claude Code `opus` review plus local follow-up fixes |
| Local editorial correction pass | Pass | Agenda and doctrine files updated in the same slice |
| Visible-Czech human idiom check | Pending human review | This note exists, but human signoff still needed |
| Czech spoken-readability check | Pending human review | No Czech human spoken note yet |
| Locale parity check after Czech edits | Pending local follow-up | English pair reviewed and adjusted where structure changed; final parity note still needed if more Czech edits land |

## Local Verification

Completed:

- JSON parse check for `dashboard/lib/workshop-blueprint-agenda.json`

Still not run in this pass:

- `cd dashboard && npm run lint`
- `cd dashboard && npm run test`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:e2e`

## Next Safe Move

1. Run one Czech human spoken-readability pass across the visible opening, talk, demo, build, intermezzo, and reveal scenes.
2. Record that outcome here with concrete accepted/rejected phrases.
3. If the human pass changes visible Czech again, update the English pair where structural parity changed.
4. Only then treat the Czech visible-surface gate as genuinely closed.
