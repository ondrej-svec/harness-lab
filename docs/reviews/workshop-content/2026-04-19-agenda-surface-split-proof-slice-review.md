---
title: "Agenda surface split proof-slice preview review"
type: review
date: 2026-04-19
status: implemented-awaiting-manual-rollout
scope: "Proof-slice implementation and verification for agenda-scene-surface-split-and-lightweight-interaction"
---

# Agenda surface split proof-slice preview review

This note records the proof-slice preview gate, implementation outcome, and verification record for [`2026-04-19-feat-agenda-scene-surface-split-and-lightweight-interaction-plan.md`](../../plans/2026-04-19-feat-agenda-scene-surface-split-and-lightweight-interaction-plan.md).

## Scope

Implemented in this slice:

- explicit `participantMoments` in the shared agenda model
- persisted `liveMoment` state with `auto` and `manual` participant modes
- presenter-scene sync back into runtime state
- proof-slice authored content for `opening`, `talk`, and `demo`
- participant poll input, storage, aggregate summary, and room-safe presenter aggregate rendering
- facilitator-private participant feedback input, review, and promotion path
- participant refresh fingerprint updates
- doctrine doc updates and proof-slice regression coverage

Still manual or out-of-band:

- human visual review before broader rollout
- reset of already-created non-sample workshop instances outside this public repo

## Files under review

- `docs/plans/2026-04-19-feat-agenda-scene-surface-split-and-lightweight-interaction-plan.md`
- `docs/previews/2026-04-19-agenda-surface-split-proof-slice-spec.md`
- `docs/dashboard-design-system.md`
- `docs/dashboard-surface-model.md`
- `docs/facilitator-agenda-source-of-truth.md`
- `workshop-content/agenda.json`
- `dashboard/lib/workshop-data.ts`
- `dashboard/lib/workshop-store.ts`
- `dashboard/lib/public-page-view-model.ts`
- `dashboard/app/components/participant-room-surface.tsx`
- `dashboard/app/admin/instances/[id]/_components/sections/run-section.tsx`
- `dashboard/app/admin/instances/[id]/presenter/page.tsx`
- `dashboard/e2e/participant-signal-flow.spec.ts`

## Locale coverage

- English and Czech visible-surface content changed in the proof slice
- Locale parity verified through generated agenda outputs and source review
- Czech human signoff remains pending even though deterministic copy audit passed

## What shipped

- `opening`, `talk`, and `demo` now ship explicit participant moments instead of relying on room-summary fallback
- participant visibility follows the persisted `liveMoment` contract, with manual override only as a safety path
- the `talk-note-one-gap` proof slice now carries an authored predefined-option poll
- participant feedback is always available and stays facilitator-private until promoted
- the control room shows live participant state, poll summaries, and private feedback
- the presenter surface can show the anonymous room-safe poll aggregate for the live scene

## What passed

- The runtime can explain what is live for the room, for participants, and whether participant mode is `auto` or `manual`.
- The participant surface now follows explicit participant moments inside one agenda item.
- Polls are bounded to predefined options, stored outside the hot workshop-state path, and rendered as anonymous aggregate only.
- Participant feedback is private by default and promotable through the existing ticker path.
- Docs, generated content, and runtime behavior now describe the same proof-slice contract.
- Presenter, participant, control-room, and repository tests all passed for the implemented slice.

## What is still pending

- Human visual review before broad rollout
- Reset/reimport of already-created real workshop instances outside this public repo
- A true exploratory browser pass through Chrome DevTools was attempted, but the shared DevTools browser session was unavailable in this environment

## Gate status

| Gate | Status | Evidence |
| --- | --- | --- |
| Proof-slice contract memo exists | Pass | `docs/previews/2026-04-19-agenda-surface-split-proof-slice-spec.md` |
| Runtime/content model implemented | Pass | shared types, store normalization, live-moment state, participant moments |
| Poll and feedback flows implemented | Pass | participant APIs, storage repos, control-room review, presenter aggregate |
| Design-system and surface-boundary docs updated | Pass | `docs/dashboard-design-system.md`, `docs/dashboard-surface-model.md`, `docs/facilitator-agenda-source-of-truth.md` |
| Automated verification | Pass | unit tests, content verification, lint, build, targeted Playwright proof slice |
| Human rollout review | Pending manual review | required before broader rollout |

## Review notes

- The final proof slice keeps the room scene leaner by moving schedule/detail beats off projection and into backstage support.
- `talk` is now the clearest proof of the contract because it exercises authored participant moments, a room-signal poll, and the presenter aggregate path.
- The participant fallback is now conservative and explicit rather than reconstructed from room copy.
- Poll summaries are safe to project because they expose only aggregate counts and option labels.

## Verification

Completed in this slice:

- `npm run generate:content`
- `npm run verify:content`
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- participant-signal-flow.spec.ts`
- focused presenter/store/workshop-data/admin-page test reruns during implementation

Notes:

- Production build required unsandboxed execution because `next/font` needed to fetch Google Fonts during build.
- Playwright also required unsandboxed execution because the sandbox would not allow the local Next.js test server to bind to `127.0.0.1:3100`.
- The participant refresh cadence remains 30s polling with a `liveMomentFingerprint`; this is operationally acceptable because scene changes within one agenda item are infrequent and the fingerprint removes unnecessary refreshes when the live contract is unchanged.

## Required artifact lines

- typography audit: pass (`verify-copy-editor` reported 0 findings, 0 errors)
- layer-2 suggestions considered: no additional rewrite suggestions surfaced in this implementation slice
- human Czech signoff: pending manual review for visible-surface Czech changes

## Next safe move

1. Run a human visual pass on participant, presenter, and control-room proof-slice states before broader rollout.
2. Reset any already-created real workshop instances from the updated blueprint before using the new contract live.
3. Keep future agenda work on the `participantMoments` contract rather than reintroducing participant guidance via room-scene prose.
