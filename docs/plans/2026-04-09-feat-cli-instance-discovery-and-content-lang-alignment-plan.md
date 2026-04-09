---
title: "feat: cli instance discovery and content language alignment"
type: plan
date: 2026-04-09
status: complete
brainstorm: ../brainstorms/2026-04-07-workshop-blueprint-and-facilitator-control-model-brainstorm.md
confidence: high
---

# CLI Instance Discovery And Content Language Alignment Plan

Make the facilitator CLI and `workshop` skill cover the remaining day-to-day discovery path for workshop instances, and align the CLI payload surface with the already-supported `contentLang` API contract.

## Problem Statement

The facilitator control model is mostly in place, but a real operator session still exposed two avoidable gaps:

- `harness workshop status` only shows the default workshop context, not the full facilitator-visible instance registry
- the skill therefore still tempts agents to inspect local session files or improvise authenticated `node -e` fetches against `/api/workshop/instances`
- `workshop-skill` docs already advertise `--content-lang` for create/update flows, but the CLI parser does not currently send `contentLang`, so the documented path is ahead of the real command surface

This matters because it breaks the intended control model:

- facilitator operations should flow through `harness`, not ad hoc scripts
- the skill should treat CLI commands as the privileged execution path, not session-file spelunking
- command and doc drift on `contentLang` weakens trust in the facilitator tooling exactly where reviewed locale delivery matters

## Target End State

When this lands:

- facilitators can enumerate all accessible workshop instances through a first-class CLI command
- facilitators can inspect one explicit instance through the CLI without relying on the deployment-default workshop context
- `create-instance` and `update-instance` accept and transmit `contentLang`
- `harness --help`, facilitator skill docs, and CLI tests tell the same story
- the skill no longer needs to imply that raw authenticated scripts are an acceptable discovery path

## Scope

In scope:

- new facilitator CLI discovery commands over the existing shared instance APIs
- CLI support for `contentLang` on instance create/update
- tests for the new command and flag behavior
- skill and maintainer doc updates for the refined facilitator workflow

Out of scope:

- new server APIs beyond the already-existing list and per-instance GET routes
- participant CLI changes
- batch reset/remove flows
- a generic authenticated request shell for arbitrary facilitator API calls
- redesigning `workshop status` into a full workspace browser

## Proposed Solution

Add one narrow discovery slice and one contract-alignment fix:

1. extend the CLI client with read-only instance discovery methods for:
   - `GET /api/workshop/instances`
   - `GET /api/workshop/instances/{id}`
2. expose those through explicit commands such as:
   - `harness workshop list-instances`
   - `harness workshop show-instance <instance-id>`
3. keep `harness workshop status` as the default-instance status command rather than overloading it into two jobs
4. add `contentLang` parsing to create/update command payload construction so the CLI matches the already-supported server contract
5. update facilitator skill guidance so CLI discovery is the preferred path and raw API examples remain secondary architectural reference only

## Implementation Tasks

- [x] Freeze the command shape and output contract.
  - confirm the final noun choice for instance discovery (`list-instances` plus `show-instance` is the default recommendation)
  - define a compact output shape for list results that is readable for humans and stable for skills
  - decide whether `show-instance` should return the full server payload or a summarized JSON wrapper plus the full instance body
- [x] Extend the CLI client and argument parsing.
  - add client methods for listing instances and fetching a single instance
  - add `contentLang` support to the create/update payload builder
  - update `harness --help` usage text to advertise the new commands and `content-lang` support
- [x] Add CLI handlers and tests.
  - add `run-cli` handlers for instance listing and explicit instance inspection
  - add tests for successful list/show flows
  - add tests for instance-not-found and API failure cases
  - add tests proving create/update send `contentLang` when specified
- [x] Align skill and maintainer docs.
  - update `workshop-skill/facilitator.md` and `workshop-skill/SKILL.md` to prefer the new discovery commands
  - explicitly discourage session-file inspection or ad hoc authenticated fetch scripts for routine facilitator discovery
  - update `docs/harness-cli-foundation.md` if the documented command set changes
- [x] Verify the packaged surface still matches authored source.
  - run the relevant CLI tests
  - run the bundle verification path
  - confirm the updated help and skill wording survives into the packaged bundle

## Acceptance Criteria

- `harness workshop list-instances` returns the facilitator-visible instance registry via the shared authenticated API surface.
- `harness workshop show-instance <instance-id>` returns one explicit instance and reports a clear failure for missing instances.
- `harness workshop create-instance` sends `contentLang` when `--content-lang` is provided.
- `harness workshop update-instance` sends `contentLang` when `--content-lang` is provided.
- CLI help and facilitator skill docs reference the new discovery path instead of implying raw script-based discovery.
- CLI tests cover the new commands and the `contentLang` flag behavior.
- bundle verification still passes after the doc and skill updates.

## Decision Rationale

### Why add explicit discovery commands instead of teaching scripts

The whole facilitator model is built around `skill -> harness CLI -> shared API`. Teaching session-file reads and authenticated one-liners reintroduces the exact brittle backdoor the CLI-first model was meant to remove.

### Why keep `workshop status` separate from instance discovery

`workshop status` is currently anchored to the active or default workshop context. Preserving that meaning keeps existing operator behavior stable. Discovery is a different task and deserves its own nouns rather than hidden mode switches.

### Why fix `contentLang` in the CLI now

The dashboard API already supports it, and the skill docs already describe it. Leaving that drift in place makes reviewed workshop-language delivery look optional or broken depending on which surface a facilitator trusted first.

### Alternatives considered

Alternative: make `workshop status` list all instances when no explicit target is provided.

Rejected because it would overload one command with both workspace discovery and current-instance runtime status, which would make both human expectations and test coverage fuzzier.

Alternative: keep list/show out of the CLI and document a supported raw fetch recipe in the skill.

Rejected because it weakens the trust boundary and normalizes the exact operator behavior the repo is trying to retire.

## Constraints And Boundaries

- The CLI remains a thin broker over existing protected dashboard APIs, not a second backend.
- Facilitator auth and privileged session handling stay inside `harness`, not in `workshop` skill state.
- Participant onboarding remains CLI-optional and event-code-first.
- Bundle outputs remain generated artifacts; any skill/doc change here must still pass the bundle refresh discipline in [`docs/resource-packaging-model.md`](../resource-packaging-model.md).
- This slice should not invent a new instance-selection model that conflicts with the current default-instance posture described in [`docs/harness-cli-foundation.md`](../harness-cli-foundation.md).

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| The existing instance list and per-instance GET routes are sufficient for CLI discovery without new server work | Verified | [`dashboard/app/api/workshop/instances/route.ts`](../../dashboard/app/api/workshop/instances/route.ts) and [`dashboard/app/api/workshop/instances/[id]/route.ts`](../../dashboard/app/api/workshop/instances/[id]/route.ts) already expose these surfaces |
| The current CLI structure can absorb two more read-only commands without a command-model rewrite | Verified | [`harness-cli/src/run-cli.js`](../../harness-cli/src/run-cli.js) already follows the same handler pattern used for status, create, update, and reset |
| `contentLang` is already part of the supported server contract for create/update | Verified | [`dashboard/lib/workshop-instance-api.ts`](../../dashboard/lib/workshop-instance-api.ts) accepts `contentLang` for both create and metadata update bodies |
| Facilitators and skills benefit from explicit discovery commands more than from richer prose guidance alone | Verified | The recent live transcript required session-file inspection and manual fetches precisely because the command surface was incomplete |
| We can keep `workshop status` stable while adding separate discovery commands | Verified | The list/show routes already exist, so discovery does not require redefining the current status semantics |

## Risk Analysis

### Risk: the new commands duplicate `status` semantics and confuse operators

Mitigation:

- keep discovery commands explicitly workspace-oriented
- keep `status` focused on the selected/default workshop runtime state
- document the distinction in CLI help and facilitator docs

### Risk: list output becomes too verbose for routine use or too unstable for skill parsing

Mitigation:

- define a small stable summary shape for list output
- keep full instance payloads in the explicit per-instance command instead of the list output
- cover output expectations in tests

### Risk: docs get ahead of the packaged bundle again

Mitigation:

- treat skill/doc updates and bundle verification as part of the same slice
- use the existing refresh discipline and `npm run verify:workshop-bundle` before calling the work done

## References

- Prior plan: [`2026-04-08-feat-cli-first-facilitator-operations-plan.md`](2026-04-08-feat-cli-first-facilitator-operations-plan.md)
- Brainstorm: [`2026-04-07-workshop-blueprint-and-facilitator-control-model-brainstorm.md`](../brainstorms/2026-04-07-workshop-blueprint-and-facilitator-control-model-brainstorm.md)
- CLI contract doc: [`docs/harness-cli-foundation.md`](../harness-cli-foundation.md)
- Facilitator skill doc: [`workshop-skill/facilitator.md`](../../workshop-skill/facilitator.md)
