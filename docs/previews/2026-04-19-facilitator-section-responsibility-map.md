# Facilitator UI revamp preview map

Date: 2026-04-19
Plan: [`docs/plans/2026-04-19-refactor-facilitator-ui-revamp-plan.md`](../plans/2026-04-19-refactor-facilitator-ui-revamp-plan.md)

## Old to new section map

| Old section | New home | Decision |
| --- | --- | --- |
| `live` | `run` | retire as a separate label; keep only as a compat alias if needed |
| `agenda` | `run` | keep the agenda spine, remove editing from the default surface |
| `teams` | `people` | merge live team operations into People |
| `people` | `people` | keep as a first-class section |
| `signals` | `run` | fold checkpoint / handoff context into Run where it affects the live room |
| `access` | `access` | keep, but quiet it relative to the live surface |
| `settings` | `settings` | keep, but reserve for safety / recovery work |

## Responsibilities that stay in the dashboard

### Run

- current workshop moment
- next workshop moment
- move-live control
- presenter launch
- participant / handoff state when it belongs to the current or next moment
- agenda spine navigation

### People

- participant intake
- pool and team assignment / unassignment / reshaping
- team randomization
- current team composition
- append-only team-composition history timeline

### Access

- participant code handling
- participant access expiry / recovery
- facilitator access management

### Settings

- reset
- archive
- other safety / recovery actions that do not belong on the live canvas

## Responsibilities moved out of the dashboard UI

- agenda item wording edits
- agenda item time edits
- room-summary / goal edits
- add agenda item flow on the main facilitator route
- presenter-scene create / edit flows from the default control-room experience
- runtime source / storage explanation panels as co-primary live-surface content

These move to CLI / coding-agent flows and should be documented there explicitly.

## Run proof-slice notes

- The proof slice is the default `Run` screen.
- The main rejection criteria are:
  - editing controls still visible on Run
  - too many competing panels before the facilitator can act
  - Run reads like an editor instead of a live runner

## Design-system reuse vs. docs to update

### Reused unchanged

- calm before clever
- progressive disclosure by default
- read mode distinct from edit mode
- explicit primary / secondary / ghost / danger action hierarchy
- iPad-first composition
- pending-state and scroll-preservation rules already defined in the dashboard design system

### Docs that need follow-through when implementation starts

- [`docs/dashboard-surface-model.md`](../dashboard-surface-model.md)
- [`docs/facilitator-dashboard-design-rules.md`](../facilitator-dashboard-design-rules.md)
- [`docs/facilitator-control-room-design-system.md`](../facilitator-control-room-design-system.md)
- [`docs/workshop-instance-runbook.md`](../workshop-instance-runbook.md)
- [`workshop-skill/facilitator.md`](../../workshop-skill/facilitator.md)

## Verification implications

- Unit / tracer checks need new section resolution and legacy alias coverage.
- Playwright needs a new default Run flow instead of asserting the old agenda/signals split.
- People needs at least one browser-level path that shows history after a team move or assignment.
- Human review is required on the Run proof slice before deeper cleanup lands.
