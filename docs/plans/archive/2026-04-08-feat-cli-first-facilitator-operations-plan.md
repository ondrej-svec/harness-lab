---
title: "feat: cli-first facilitator operations over shared runtime APIs"
type: plan
date: 2026-04-08
status: complete
brainstorm: ../brainstorms/2026-04-07-workshop-blueprint-and-facilitator-control-model-brainstorm.md
confidence: medium
---

# CLI-First Facilitator Operations Plan

Make the `harness` CLI the primary facilitator execution surface for privileged workshop operations, while keeping the dashboard APIs as the canonical authorization, validation, audit, and persistence boundary used by both CLI and admin UI.

## Problem Statement

Harness Lab already requires the CLI for facilitator authentication, but the operator experience is still split awkwardly across three layers:

- facilitator auth is grounded in `harness auth login`
- some facilitator operations exist as first-class CLI commands (`workshop status`, `archive`, `phase set`)
- other facilitator operations still feel like raw API knowledge or ad hoc scripting rather than supported CLI workflows
- the admin UI already supports richer instance creation than the facilitator API/CLI surface advertises
- `workshop-skill` documents facilitator operations conceptually, but a coding agent still has to rediscover request shapes or improvise scripts for some of them

This matters because the current split weakens the intended control model:

- the facilitator CLI is supposed to be the trusted local broker for privileged operations
- the API is supposed to be the single server-side trust boundary
- the skill should rely on the CLI, not become a second operator shell full of raw fetches and bespoke payload lore

If this remains half-script and half-command, the system will be harder to teach, harder to secure, and easier to drift.

## Proposed Solution

Implement the next facilitator-control slice in four coordinated layers:

1. promote the `harness` CLI from a partial facilitator tool into the standard operator surface for privileged workshop lifecycle actions
2. keep all server-side authorization, validation, idempotency, and audit logging in the shared dashboard APIs
3. define one shared instance-operation contract so admin UI, CLI, and `workshop-skill` use the same nouns and payload shapes
4. explicitly defer participant CLI requirements; participant flows remain event-code-first unless a later plan proves a CLI adds value without harming zero-prep onboarding

The product rule becomes:

- facilitator operations should be invoked through `harness`
- `harness` should call the shared protected APIs
- the APIs, not the CLI, remain the source of truth for security and mutation semantics
- `workshop-skill` should prefer CLI commands for facilitator actions and never require raw credential handling or ad hoc mutation scripts

## Detailed Plan Level

This is a **detailed** plan because it changes the facilitator execution model across CLI UX, shared API contract ownership, testing strategy, and skill guidance. The wrong split here would harden a confusing or insecure control surface.

## Decision Rationale

### Why make the CLI the primary facilitator interface

- facilitators already need the CLI for auth, so making them fall back to raw scripts adds a second, lower-quality local surface
- commands are easier for agents and humans to discover, compose, document, and test than one-off scripts
- a stable CLI command surface is a better foundation for `workshop-skill` than embedding HTTP payload knowledge in the skill itself

### Why keep validation and authorization in the API

- any local caller can bypass the CLI
- if validation lives only in the CLI, the security boundary becomes optional
- the dashboard admin UI and the CLI must hit the same mutation rules, error semantics, and audit behavior

### Why not move facilitator logic fully into the CLI

- that would create a shadow backend and duplicate business rules
- it would drift from the admin UI contract
- it would weaken auditability and make authz bugs harder to reason about

### Why not require the CLI for participants now

- the current architecture explicitly keeps participant onboarding low-friction and event-code-first
- facilitators already accept a privileged toolchain because their path needs auth, grants, and mutations
- participant CLI requirements should be justified separately, not smuggled in through facilitator improvements

### Why standardize the shared request/response contract before adding more CLI commands

- today’s main friction comes from partial capability alignment, not from command parsing itself
- if the CLI command layer lands before the mutation contract is clearly shared, the repo will keep two subtly different models
- a shared contract also improves agentic use: the skill can reference one stable structure instead of UI-only behavior

### Alternatives considered

#### Alternative 1: Keep facilitator mutations as raw API calls invoked from skills or scripts

Rejected because it leaves the operator path half-documented and half-discovered, and it wastes the fact that facilitators already need `harness` for auth.

#### Alternative 2: Move validation and mutation semantics into the CLI and let the server stay thinner

Rejected because it weakens the trust boundary and makes non-CLI callers unsafe or inconsistent.

#### Alternative 3: Expand the admin UI only and treat the CLI as an auth helper

Rejected because the chosen control model explicitly says dashboard and facilitator skill should be equal control planes over shared APIs.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| Facilitator auth should continue to live in `harness` rather than in arbitrary skill state | Verified | [`docs/harness-cli-foundation.md`](../harness-cli-foundation.md) and [`workshop-skill/facilitator.md`](../../workshop-skill/facilitator.md) already state this explicitly |
| Dashboard APIs should remain the canonical trust boundary for facilitator mutations | Verified | Existing route protection and control-model docs already position shared APIs as the common backend for dashboard and skill |
| The current CLI command/testing seams are good enough to extend without a full rewrite | Verified | [`harness-cli/src/run-cli.js`](../../harness-cli/src/run-cli.js), [`harness-cli/src/client.js`](../../harness-cli/src/client.js), and [`harness-cli/test/run-cli.test.js`](../../harness-cli/test/run-cli.test.js) already show a command-dispatch plus API-client pattern |
| Facilitator lifecycle commands such as create/update/remove/prepare are the next missing CLI slice | Verified | Current shipped CLI only covers status/archive/phase set, while facilitator docs and recent API work already point to broader lifecycle operations |
| Participant CLI should remain out of scope for this plan | Verified | Existing blueprint/control-model work keeps participant access event-code-first and zero-prep |
| Some higher-risk facilitator operations may need step-up auth beyond a reused device session | Unverified | [`docs/harness-cli-foundation.md`](../harness-cli-foundation.md) already hints that higher-risk mutations may require fresh approval, but the exact threshold is not finalized |
| Shared request schema modules can be reused across dashboard and CLI without causing awkward package coupling | Unverified | The current repo is close, but the exact module boundary between `dashboard/` and `harness-cli/` still needs an intentional decision |
| Operator ergonomics are improved by typed commands even when the underlying API already exists | Verified | Existing `status`, `archive`, and `phase set` commands already follow this pattern successfully |

Unverified assumptions should be resolved early, not left implicit in implementation.

## Risk Analysis

### Risk: The CLI becomes a second business-logic layer instead of a command shell over the API

If command handlers start duplicating validation or inventing local-only mutation rules, the architecture will drift immediately.

Mitigation:

- keep CLI handlers thin
- centralize request/response contract definitions
- require server-side validation and audit assertions in tests

### Risk: The API contract and CLI command surface drift again

If CLI commands are added ad hoc without shared contract ownership, the same current mismatch will return under a cleaner name.

Mitigation:

- define a single facilitator-operation contract module or documented contract map
- update API tests, CLI tests, and skill docs in the same slice
- treat command docs as incomplete until the API route and CLI command are both covered

### Risk: Higher-risk operations reuse stale device sessions too casually

Some actions, especially grant management or destructive lifecycle changes, may deserve stronger guarantees than a long-lived cached session.

Mitigation:

- classify facilitator operations by risk
- explicitly decide which commands are allowed on a valid brokered session and which require recent-auth or step-up
- add test coverage for denied step-up cases if introduced

### Risk: Shared contract code introduces awkward cross-package coupling

If CLI starts importing dashboard internals directly, the repo may end up with hidden dependency knots.

Mitigation:

- define a narrow shared schema/util boundary rather than broad cross-imports
- prefer small plain-data contract modules over importing route handlers or store logic
- keep transport and domain logic separate

### Risk: The skill still encourages raw fetches because the CLI command set remains incomplete

If only half the operations are promoted into `harness`, skill authors will keep falling back to HTTP examples.

Mitigation:

- plan the command rollout as a coherent facilitator slice, not one-off additions
- update `workshop-skill/facilitator.md` so CLI is the preferred path and raw API remains secondary reference material
- ensure the CLI help output surfaces the new commands clearly

## Phased Implementation

### Phase 1: Freeze the facilitator control model and scope

Goal: define exactly which facilitator operations are CLI-first, which remain API-only references, and which may need stronger auth posture.

Tasks:
- [x] Inventory current facilitator operations across CLI, admin UI, API routes, and `workshop-skill`.
- [x] Define the day-one CLI-first command set, at minimum:
  - `harness workshop create-instance`
  - `harness workshop update-instance`
  - `harness workshop prepare`
  - `harness workshop remove-instance`
  - optionally `harness facilitators grant` / `revoke` if the step-up policy is ready
- [x] Classify each operation by risk level:
  - normal brokered-session command
  - owner-only command
  - step-up candidate
- [x] Decide whether `grant` / `revoke` ship in the same slice or remain a later follow-up.

Exit criteria:
- the facilitator CLI-first scope is explicit
- higher-risk commands are called out rather than hand-waved
- participant CLI remains explicitly out of scope

### Phase 2: Define the shared facilitator operation contract

Goal: make the API shape stable and shared before expanding the command surface.

Tasks:
- [x] Define one shared contract for instance lifecycle operations, including:
  - create payload
  - metadata update payload
  - prepare/remove semantics
  - success shape
  - agent-friendly validation errors
- [x] Decide where this contract lives so both dashboard and CLI can consume it without importing each other’s app logic.
- [x] Standardize idempotency semantics for CLI-friendly use:
  - repeated create with same `id`
  - update of missing instance
  - remove/prepare of missing or already-removed instance
- [x] Ensure audit expectations are explicit for each mutation type.

Exit criteria:
- CLI and dashboard can point to one contract definition
- the server remains the single validation/authz boundary
- the command surface can be implemented without rediscovering payload rules

### Phase 3: Extend the API client and CLI command surface

Goal: make facilitator lifecycle operations first-class `harness` commands rather than script recipes.

Tasks:
- [x] Extend [`harness-cli/src/client.js`](../../harness-cli/src/client.js) with the missing facilitator methods for instance lifecycle operations.
- [x] Extend [`harness-cli/src/run-cli.js`](../../harness-cli/src/run-cli.js) with new command parsing and handlers.
- [x] Support both typed flags and a reasonable interactive fallback for required fields when the command is missing values.
- [x] Make command output readable for both humans and skills:
  - explicit success/failure
  - instance id
  - event title/date/venue summary when relevant
  - stable error text for common validation failures
- [x] Update `harness --help` and [`harness-cli/README.md`](../../harness-cli/README.md) to advertise the new command surface.

Exit criteria:
- a facilitator can perform normal lifecycle operations through `harness` without raw scripts
- the skill can prefer CLI invocations over HTTP examples
- the CLI remains a thin shell over the shared API

### Phase 4: Align skill guidance and operator docs

Goal: make the repo-native documentation reflect the actual control model cleanly.

Tasks:
- [x] Update [`workshop-skill/facilitator.md`](../../workshop-skill/facilitator.md) so CLI is the preferred execution path for facilitator operations.
- [x] Keep raw API examples as secondary reference material only where they add diagnostic or architectural value.
- [x] Update [`docs/harness-cli-foundation.md`](../harness-cli-foundation.md) and any related control-model docs so the CLI-first stance is explicit for facilitators.
- [x] Document the boundary rule clearly:
  - skill invokes CLI
  - CLI invokes API
  - API enforces authz and validation

Exit criteria:
- the docs no longer imply that facilitators should reach for ad hoc scripts first
- the skill guidance and CLI help tell the same story
- the control model is teachable in one sentence

### Phase 5: Add verification and release gates

Goal: prove the CLI-first operator path works and remains safer than raw scripting.

Tasks:
- [x] Add CLI command tests covering:
  - create-instance success
  - create-instance validation failure
  - update-instance success
  - prepare/remove success
  - permission-denied failure for owner-only operations
- [x] Keep or extend route tests so the server contract is validated independently of the CLI.
- [x] Add at least one integration-style test showing a brokered facilitator session driving one new lifecycle mutation through the CLI.
- [x] Define a release checklist item that new facilitator API mutations are incomplete until:
  - route tests exist
  - CLI tests exist
  - skill/docs are updated

Exit criteria:
- the CLI-first path is executable and regression-tested
- the API trust boundary is still independently defended
- future facilitator commands have a repeatable quality bar

## Implementation Tasks

- [x] Confirm the exact facilitator command set and risk classification for the first CLI-first operations slice.
- [x] Define the shared lifecycle request/response contract and stable error semantics.
- [x] Decide the contract module boundary between `dashboard/` and `harness-cli/`.
- [x] Extend the CLI API client with lifecycle methods for create/update/prepare/remove.
- [x] Add `run-cli` handlers and help text for the new facilitator commands.
- [x] Implement human- and skill-friendly output formatting for lifecycle command results.
- [x] Update operator docs and `workshop-skill` to make CLI the preferred facilitator path.
- [x] Add CLI unit/integration tests for the new commands.
- [x] Keep API route tests in sync with the contract and authz rules.
- [x] Rehearse the remote facilitator flow against a deployed dashboard before treating the command set as complete.

## Implementation Notes

- This slice keeps the shared contract at the HTTP boundary instead of introducing a cross-package schema import. `dashboard/` remains the canonical owner of request validation and mutation semantics, while `harness-cli/` stays a thin authenticated client over that contract.
- `grant` and `revoke` were intentionally deferred. They remain a later step-up-auth slice rather than part of the first lifecycle command rollout.
- Remote rehearsal was completed as a read-only verification against `https://harness-lab-dashboard.vercel.app` using the repo-local CLI and an active device session (`auth status`, `workshop status`). Live create/update/remove mutations were not replayed against production during this implementation pass.

## Acceptance Criteria

- A facilitator with an active `harness` session can create, update, prepare, and remove workshop instances through CLI commands without writing raw fetch scripts.
- The CLI uses the shared protected dashboard APIs; it does not reimplement server-side validation or authorization locally.
- The API contract for lifecycle operations is explicit, stable, and covered by tests independent of the CLI.
- `workshop-skill` documentation prefers CLI invocations for facilitator operations and no longer implies scripts are the normal path.
- Normal facilitator lifecycle commands are discoverable through `harness --help` and documented in [`harness-cli/README.md`](../../harness-cli/README.md).
- The participant path remains unchanged: no new participant CLI requirement is introduced by this work.

## References

- [`docs/harness-cli-foundation.md`](../harness-cli-foundation.md)
- [`harness-cli/README.md`](../../harness-cli/README.md)
- [`harness-cli/src/run-cli.js`](../../harness-cli/src/run-cli.js)
- [`harness-cli/src/client.js`](../../harness-cli/src/client.js)
- [`harness-cli/test/run-cli.test.js`](../../harness-cli/test/run-cli.test.js)
- [`harness-cli/test/skill-integration.test.js`](../../harness-cli/test/skill-integration.test.js)
- [`workshop-skill/facilitator.md`](../../workshop-skill/facilitator.md)
- [`docs/plans/2026-04-07-feat-workshop-blueprint-and-facilitator-control-model-plan.md`](2026-04-07-feat-workshop-blueprint-and-facilitator-control-model-plan.md)
- [`docs/plans/2026-04-07-feat-harness-cli-device-auth-and-secure-storage-plan.md`](2026-04-07-feat-harness-cli-device-auth-and-secure-storage-plan.md)
- [`docs/plans/2026-04-07-feat-instance-lifecycle-and-instance-local-agenda-authoring-plan.md`](2026-04-07-feat-instance-lifecycle-and-instance-local-agenda-authoring-plan.md)
