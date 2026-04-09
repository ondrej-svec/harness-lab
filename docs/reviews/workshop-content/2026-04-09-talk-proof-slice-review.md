# 2026-04-09 Talk Proof Slice Review

Status: in progress

This is the working review note for the current proof slice under [`2026-04-09-feat-workshop-blueprint-content-excellence-and-readiness-plan.md`](../../plans/2026-04-09-feat-workshop-blueprint-content-excellence-and-readiness-plan.md).

## Scope

Proof slice:

- `talk` room-facing pack
- `talk` participant mirror
- `talk` facilitator runner
- `code-review-helper` brief
- English/Czech parity for the same slice

## Files Under Review

- `dashboard/lib/workshop-blueprint-agenda.json`
- `dashboard/lib/workshop-blueprint-localized-content.ts`
- `dashboard/lib/workshop-data.ts`
- `content/project-briefs/code-review-helper.md`
- `docs/previews/2026-04-09-talk-proof-slice-preview.md`
- `docs/workshop-content-authority-and-citation.md`
- `docs/workshop-content-qa.md`

## Current Slice Summary

### Room-facing `talk` pack

What changed:

- reframed the `talk` goal and room summary toward map, boundaries, and proof
- sharpened `talk-framing` so it lands as a working-system thesis, not a generic “context matters” message
- tightened the micro-exercise so the contrast now points toward review and handoff, not prompt aesthetics
- added one bounded authority quote:
  - `Humans steer. Agents execute.`
  - attribution: Ryan Lopopolo, OpenAI, *Harness engineering: leveraging Codex in an agent-first world* (February 11, 2026)

Why:

- the room needed one memorable anchor that reinforces the workshop thesis without turning the scene into a quote wall
- the room-facing presenter route now correctly honors an explicitly requested participant walkthrough scene instead of silently falling back to the default room scene

### Participant mirror

What changed:

- moved the participant mirror from “what the surface is” to “what the team should do in the first minutes of Build Phase 1”
- made the three immediate actions explicit:
  - align on goal/context/constraints
  - write or tighten `Goal`, `Context`, `Constraints`, `Done When`
  - choose one verifiable first slice

### Facilitator runner

What changed:

- clarified the `talk` runner goal toward a concrete first working contract
- tightened the “say/show/do/watch/fallback” contract so the talk resolves into Build Phase 1 rather than drifting as standalone inspiration

### Associated brief

What changed:

- rewrote `code-review-helper` so certainty, heuristic suspicion, and human judgment are explicit parts of the brief
- made the handoff and extensibility standard stronger for the inheriting team

## Locale Parity Note

Current state:

- Czech remains the maintained structured source in `dashboard/lib/workshop-blueprint-agenda.json`
- English remains the reviewed overlay in `dashboard/lib/workshop-blueprint-localized-content.ts`
- the current `talk` slice was updated in both places in the same pass

Parity check completed locally:

- the English and Czech versions now make the same operational claim
- the participant mirror in both locales now answers “what should the team do now?”
- the authority quote remains in the original wording with explicit attribution in both locales

Still required:

- Czech spoken-readability review by a Czech-fluent human reviewer
- side-by-side human parity review note after spoken edits, if any
- human judgment on the generated room-projection and participant-mobile captures

## Gate Status

| Gate | Status | Evidence |
| --- | --- | --- |
| Portability/reference check | Pass | Ondrej-specific participant/public scene links removed in the same slice |
| Architecture/source-of-truth check | Pass | Docs updated to reflect the maintained blueprint source pair |
| Authority/citation pattern | Pass | One attributed quote added under the new authority rules |
| Presenter participant-scene routing | Pass | `resolvePresenterSelection` now honors enabled requested scenes across surfaces; covered by unit and e2e checks |
| Participant usefulness check | Pending human review | Needs participant-surface preview judgment |
| Cold-read facilitator check | Pending human review | No non-Ondrej review note yet |
| Spoken-readability check in Czech | Pending human review | Local style pass completed; spoken pass still required |
| Mobile glanceability check | Pending human review | Automated mobile capture exists in `dashboard/e2e/dashboard.spec.ts-snapshots/presenter-talk-participant-proof-mobile.png` |
| Projected-room legibility check | Pending human review | Automated presenter capture exists in `dashboard/e2e/dashboard.spec.ts-snapshots/presenter-talk-proof-ipad.png` |

## Local Editorial Check

Applied against:

- `content/style-guide.md`
- `content/style-examples.md`
- `content/czech-editorial-review-checklist.md`

Observed pass conditions:

- Czech instructions are shorter and more imperative
- mixed Czech/English usage stays disciplined around workshop terms
- participant copy is more action-oriented than descriptive
- no obvious corporate or translated-slide phrasing remains in the edited proof-slice lines

## Verification

Code/runtime verification completed after the slice changes:

- `cd dashboard && npm run test`
- `cd dashboard && npm run lint`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:e2e`

Focused proof-slice verification added in this pass:

- unit coverage for explicit participant walkthrough scene selection on the presenter route
- Playwright coverage for:
  - `talk` room proof slice on iPad
  - `talk` participant proof slice on mobile

Artifacts produced:

- `docs/previews/2026-04-09-talk-proof-slice-preview.md`
- `dashboard/e2e/dashboard.spec.ts-snapshots/presenter-talk-proof-ipad.png`
- `dashboard/e2e/dashboard.spec.ts-snapshots/presenter-talk-participant-proof-mobile.png`

## Next Safe Move

1. Review the generated presenter and participant captures as a human for legibility and usefulness.
2. Run the non-Ondrej cold-read and Czech spoken-readability checks.
3. Record those human gate outcomes in this file.
4. Only then decide whether Phase 3 propagation is safe.
