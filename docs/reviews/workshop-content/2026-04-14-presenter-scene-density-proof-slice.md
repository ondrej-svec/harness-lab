---
title: "Presenter scene density rollout review"
type: review
date: 2026-04-14
status: pending-signoff
scope: "Proof slice plus remaining flagged room scenes for refactor-presenter-scene-density-and-coverage-plan"
---

# Presenter scene density rollout review

This note records the implemented density refactor and rollout verification for [`2026-04-14-refactor-presenter-scene-density-and-coverage-plan.md`](../../plans/2026-04-14-refactor-presenter-scene-density-and-coverage-plan.md).

## Scope

Implemented in this slice:

- talk proof pack density refactor
- opening and demo trim pass
- Build 1 timeline/baseline split
- Build 2 first-push refactor
- Build 2 second-push pacing trim
- rotation protocol trim
- Reveal commitment/storage split
- presenter viewport-fit regression coverage
- presenter screenshot proof refresh for the split scenes
- propagated no-scroll fit gate for the remaining flagged room scenes

Not propagated yet:

- human Czech signoff for the touched visible scenes
- non-author facilitator cold-read signoff

## Files under review

- `workshop-content/agenda.json`
- `dashboard/lib/generated/agenda-cs.json`
- `dashboard/lib/generated/agenda-en.json`
- `workshop-blueprint/agenda.json`
- `content/talks/context-is-king.md`
- `docs/presenter-rich-scene-authoring.md`
- `docs/dashboard-testing-strategy.md`
- `dashboard/e2e/dashboard.spec.ts`

## Scene audit

| Scene | Classification | Update | Gate status |
| --- | --- | --- | --- |
| `talk-argued-about-prompts` | split-needed | collapsed into one evidence hero beat; urgency moved out | pass |
| `talk-why-now` | added beat | new urgency scene for the weather / why-now beat | pass |
| `talk-got-a-name` | trim-needed | removed the long on-slide analogy; kept equation + quote + reframe | pass |
| `talk-how-to-build` | split-needed | pillars-only scene; role-shift teaching removed | pass |
| `talk-managing-agents` | added beat | new dedicated role-shift scene | pass |
| `talk-humans-steer` | trim-needed | reduced to one supporting quote | pass |
| `opening-team-formation` | trim-needed | removed rationale callout; compressed action list | outside proof gate |
| `demo-first-ten-minutes` | trim-needed | removed ambition callout | outside proof gate |
| `build-1-next-65-minutes` | split-needed | timeline-only ambient scene | pass |
| `build-1-by-lunch` | added beat | new repo-baseline / proof scene | pass |
| `rotation-read-the-room` | trim-needed | merged quiet-start protocol into two beats; emotional reframing moved off-screen | pass |
| `build-2a-eighty-five` | split-needed | compressed to three beats; verification reminder moved to facilitator notes | pass |
| `build-2b-second-push-timeline` | trim-needed | refocused on acting on intermezzo signal and landing the reveal slice | pass |
| `reveal-one-thing` | split-needed | writing / speaking scene only | pass |
| `reveal-save-the-commitment` | added beat | storage mechanics and tool-agnostic close moved out | pass |

## Gate status

| Gate | Status | Evidence |
| --- | --- | --- |
| Presenter horizontal fit at `1024x768` | Pass | `dashboard/e2e/dashboard.spec.ts` presenter iPad overflow test |
| Presenter horizontal fit at `1920x1080` | Pass | `dashboard/e2e/dashboard.spec.ts` presenter big-screen overflow test |
| Proof pack + rollout room scenes no vertical scroll at `1024x768` | Pass | Playwright fit test now covers talk/build/reveal proof scenes plus `rotation-read-the-room`, `build-2a-eighty-five`, and `build-2b-second-push-timeline` |
| Proof screenshots refreshed | Pass | updated existing opening/talk screenshots; added build/reveal split-scene baselines |
| Source/generated sync | Pass | `npm run generate:content`, `npm run verify:content` |
| Deterministic Czech typography audit | Pass | zero errors, zero warnings |
| Facilitator cold-read review | Pending human review | talk script updated, no non-author human signoff yet |
| Czech visible-surface signoff | Pending human review | touched scenes marked `cs_reviewed: false` |

## Verification

Completed locally:

- `cd dashboard && npm run generate:content`
- `cd dashboard && npm run verify:content`
- `cd dashboard && npm run build`
- `cd dashboard && npm run lint`
- `cd dashboard && npm run test:e2e -- --grep '(presenter renders at 4:3 iPad viewport without content overflow|presenter renders at 16:9 big-screen mirror viewport without content overflow|presenter proof and rollout scenes fit the 4:3 baseline without vertical scroll)'`
- `cd dashboard && npm run test:e2e -- --grep '(opening promise scene|talk room proof slice|opening participant proof slice|split proof scenes visually stable)' --update-snapshots`

Artifacts updated:

- `dashboard/e2e/dashboard.spec.ts-snapshots/presenter-opening-proof-ipad.png`
- `dashboard/e2e/dashboard.spec.ts-snapshots/presenter-talk-proof-ipad.png`
- `dashboard/e2e/dashboard.spec.ts-snapshots/presenter-opening-participant-proof-mobile.png`
- `dashboard/e2e/dashboard.spec.ts-snapshots/presenter-talk-evidence-proof-ipad.png`
- `dashboard/e2e/dashboard.spec.ts-snapshots/presenter-talk-pillars-proof-ipad.png`
- `dashboard/e2e/dashboard.spec.ts-snapshots/presenter-build-1-proof-ipad.png`
- `dashboard/e2e/dashboard.spec.ts-snapshots/presenter-reveal-commitment-proof-ipad.png`

## Notes

- The Playwright proof runner serves `next start`, so rebuilding the dashboard was required after regenerating the blueprint-derived agenda files. Before the rebuild, the test server was still rendering the previous talk pack.
- The no-scroll gate is still selective rather than universal, but it now covers the remaining flagged room-facing afternoon scenes in addition to the original proof pack.
- `rotation-read-the-room` only fit after the quiet-start protocol was collapsed into two beats and the emotional reframing moved into facilitator notes; that is the exact content-budget pattern this refactor was meant to catch.

## Next safe move

1. Run a human Czech pass on the scenes still marked `cs_reviewed: false`.
2. Do a cold-read facilitator preview on the updated talk/build/rotation/reveal beat sequence.
3. If both pass, flip the touched scenes back to `cs_reviewed: true` and close the plan.
