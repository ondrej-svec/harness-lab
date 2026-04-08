---
title: "feat: harness cli device auth and secure storage hardening"
type: plan
date: 2026-04-07
status: complete
brainstorm: ../brainstorms/2026-04-07-workshop-blueprint-and-facilitator-control-model-brainstorm.md
confidence: medium
---

# Harness CLI Device Auth And Secure Storage Hardening Plan

Replace the current facilitator CLI’s dev-oriented login modes with a production-grade device/browser auth flow, make secure local storage the default across supported operating systems, and add the integration and packaging gates required before npm publication.

## Problem Statement

The repository now has a real `harness` CLI, but it is not yet at the maturity level implied by the workshop control-model docs.

Today:

- the CLI supports file-mode Basic Auth and cookie-backed Neon email/password login
- macOS Keychain is implemented, but Windows Credential Manager and Linux Secret Service are not
- the skill points to the CLI conceptually, but there is no end-to-end integration test proving the real control path
- the current auth UX still assumes direct credential entry rather than the more mature device/browser approval flow used by modern CLIs
- local packaging works, but there is no publication gate proving the CLI is ready for npm distribution

This matters because facilitator auth is a privileged path. If the CLI is going to become the canonical local broker for facilitator operations, it needs the same qualities we expect from mature tools: browser/device auth, secure storage by default, explicit fallback behavior, and real integration coverage.

## Proposed Solution

Implement the next CLI milestone in six coordinated slices:

1. define a real device/browser auth contract on top of the existing Neon Auth-based facilitator identity system
2. add dashboard-side device authorization endpoints and polling lifecycle for the CLI
3. upgrade `harness auth login` so device flow becomes the primary interactive path, with existing direct credential modes demoted to explicit dev/bootstrap fallbacks
4. complete the secure-storage abstraction so supported operating systems default to their native credential stores
5. add integration coverage that proves CLI auth and facilitator commands work against the real runtime contract
6. define a publication gate so npm release happens only after auth, storage, packaging, and verification are all production-worthy

## Decision Rationale

### Why make device flow mandatory now

This is the most important remaining auth gap.

Evidence from current tooling:

- Vercel announced on **September 12, 2025** that `vercel login` now uses OAuth 2.0 Device Flow and that email-based login methods are deprecated, with most removals taking effect on **February 26, 2026**
- GitHub CLI currently defaults to a browser-based flow and stores credentials in the system credential store, with plaintext fallback only when a credential store is unavailable

These are strong signals that direct credential entry should not be the primary long-term UX for a facilitator CLI.

### Why not publish to npm before device flow and integration coverage

Publishing early would freeze a weak auth and storage story into an install surface that other people will treat as stable. That is the wrong order.

The repository can support local package installs now, but npm publication should be gated on:

- production-grade primary auth flow
- supported secure storage on claimed platforms
- integration tests proving the real facilitator control path

### Why Windows and Linux secure storage still matter

If Harness Lab claims the facilitator path is cross-platform, then secure storage cannot effectively be “macOS only.”

That said, they do not have to block the very first device-flow implementation if the plan explicitly phases them:

- device flow first
- native storage backends next
- npm publication only after both are in place

### Why keep direct credential modes at all

They are still useful for:

- file-mode local development
- emergency bootstrap while device flow is unfinished
- controlled fallback during rollout

But they should become explicit fallback modes, not the primary documented path.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| The CLI should become the canonical local broker for facilitator auth and privileged workshop operations | Verified | Current blueprint/control-model work and [`docs/harness-cli-foundation.md`](../harness-cli-foundation.md) already state this |
| Browser/device auth is the right primary UX for an interactive facilitator CLI | Verified | Vercel moved `vercel login` to OAuth 2.0 Device Flow on September 12, 2025 and GitHub CLI defaults to browser/web auth |
| The current dashboard auth stack can support an additional CLI-oriented device authorization flow without replacing Neon Auth | Unverified | Repo currently exposes Better Auth-style `/api/auth/*` routes, but a device-flow contract still needs design and validation |
| macOS Keychain support is already practical in this repo | Verified | Implemented in `harness-cli/src/session-store.js` and tested locally |
| Windows Credential Manager and Linux Secret Service can be added behind the current storage abstraction | Likely | This is the standard platform posture used by mature CLIs, but the concrete Node implementation/library choice remains open |
| CI can cover Windows and Linux backend behavior well enough to compensate for limited local manual testing | Likely | Cross-platform CI is a standard mitigation, but the exact mocking and runner strategy still needs definition |
| Skill-to-CLI integration can be tested without introducing unsafe secret handling in the skill itself | Unverified | Depends on how the skill invokes the CLI and how those invocations are represented in tests |
| npm publication should wait until device flow, secure storage, and integration tests are complete | Verified | Current shipped CLI is still explicitly documented as not production-ready for publication |

Unverified assumptions should become explicit design and tracer-bullet tasks before broader rollout.

## Risk Analysis

### Risk: Device flow adds backend complexity but still leaks into an ad hoc auth model

If the CLI invents a parallel auth protocol instead of cleanly extending the existing Neon Auth boundary, the system will drift.

Mitigation:

- define one explicit device authorization contract
- keep facilitator authorization on the same `instance_grants` model after session establishment
- reuse the same runtime APIs after login instead of introducing CLI-only privilege paths

### Risk: Secure storage support becomes inconsistent across platforms

If macOS uses Keychain while Windows/Linux silently fall back to plaintext, the security posture will be uneven and confusing.

Mitigation:

- define a supported-platform matrix explicitly
- make insecure file fallback opt-in and visibly labeled
- add CI checks for each supported storage backend

### Risk: Browser/device auth blocks local or headless workflows unnecessarily

If the CLI only supports a browser path, facilitators on remote shells or locked-down environments may be blocked.

Mitigation:

- design device flow to support a remote/SSH-friendly “open this URL and enter this code” path
- keep local browser opening optional, not mandatory
- retain explicit dev/bootstrap fallback modes

### Risk: Integration tests remain shallow and fail to prove the real path

If tests mock everything below the CLI boundary, they will not catch auth/session/runtime mismatches.

Mitigation:

- add CLI-to-dashboard integration tests against real route handlers where feasible
- cover login, session verification, logout, and at least one facilitator mutation path
- add CI jobs across macOS, Windows, and Linux for the supported auth/storage combinations

### Risk: npm publication happens because packaging works, not because the security model is done

It is easy to mistake “`npm pack` succeeds” for “the CLI is ready.”

Mitigation:

- define a publication checklist in the plan and docs
- require device flow, native storage on claimed platforms, and integration coverage before public release

## Phased Implementation

### Phase 1: Define the device auth contract

Goal: decide exactly how the CLI will start, poll, complete, and revoke an interactive facilitator login without inventing a second auth system.

Tasks:
- [x] Define the dashboard-side device authorization lifecycle:
  - start authorization
  - return device code, user code, verification URL, expiry, and poll interval
  - poll authorization status
  - complete login into a facilitator session
  - revoke/logout
- [x] Decide whether the device flow is implemented as a thin wrapper around Neon Auth or as an adjacent application-level authorization broker using the same identity backend.
- [x] Define what session material the CLI persists after device approval:
  - opaque session cookie jar
  - token pair
  - refreshable local session reference
- [x] Define how recent-auth or step-up constraints apply to sensitive CLI operations later.

Exit criteria:
- the CLI auth handshake is specified end to end
- the design clearly reuses the existing facilitator identity and authorization model
- session persistence format is explicit

### Phase 2: Implement dashboard-side device flow support

Goal: add the server-side contract the CLI needs.

Tasks:
- [x] Add device authorization start/poll/complete endpoints under the dashboard auth surface.
- [x] Add short-lived storage for device authorization records and approval state.
- [x] Ensure audit logging captures device auth start, approval, denial, expiry, and logout.
- [x] Ensure the resulting facilitator session is equivalent to dashboard facilitator sign-in for downstream authorization.
- [x] Add route-level tests for device auth lifecycle and failure modes.

Exit criteria:
- a CLI can complete an approved login without using direct password exchange as its normal runtime path
- auth lifecycle is testable and auditable

### Phase 3: Upgrade the CLI auth UX

Goal: make `harness auth login` behave like a mature interactive CLI.

Tasks:
- [x] Make device flow the default interactive login mode.
- [x] Print verification URL, user code, expiry, and status clearly.
- [x] Optionally open the browser locally when the environment supports it.
- [x] Support remote/headless use by keeping manual code entry first-class.
- [x] Keep `--auth basic` and direct credential paths only as explicit non-primary fallback modes for local dev/bootstrap.
- [x] Add `harness auth status` output that distinguishes:
  - active session
  - storage backend
  - auth mode
  - session health

Exit criteria:
- the default login path no longer requires direct credential entry
- local and remote facilitator environments are both supported

### Phase 4: Complete secure storage across supported platforms

Goal: align storage posture with the cross-platform claim.

Tasks:
- [x] Keep macOS Keychain as the default Darwin backend.
- [x] Add Windows Credential Manager backend behind the current storage abstraction.
- [x] Add Linux Secret Service backend behind the current storage abstraction.
- [x] Define unsupported-environment behavior explicitly:
  - fail closed by default
  - allow explicit file fallback only when requested
- [x] Add backend-specific tests and CI coverage for supported platforms.

Exit criteria:
- each claimed platform has a native secure storage backend
- plaintext file storage is no longer the silent default on unsupported secure-store paths

### Phase 5: Prove the facilitator control path with integration tests

Goal: verify that the real control model works end to end.

Tasks:
- [x] Add CLI integration tests that cover:
  - device auth happy path
  - expired or denied device authorization
  - auth status against a live session
  - logout/revocation
  - at least one facilitator operation such as `workshop status` or `phase set`
- [x] Add a skill-to-CLI integration strategy:
  - define how the facilitator skill invokes the CLI
  - test that invocation path without storing raw auth material in skill state
- [x] Add CI jobs on macOS, Windows, and Linux for the supported matrix.

Exit criteria:
- the repo proves the real facilitator control path, not just isolated unit behavior
- cross-platform storage/auth regressions are caught automatically

### Phase 6: Publication gate and rollout posture

Goal: define when the CLI is ready for broader distribution.

Tasks:
- [x] Define an explicit publication checklist covering auth, storage, tests, docs, and rollback posture.
- [x] Update docs to distinguish:
  - local package install
  - internal preview use
  - public npm publication
- [x] Decide whether the first npm release is:
  - public
  - private/internal only
  - deferred until post-workshop hardening
- [x] Add release smoke checks (`npm pack`, install smoke test, command smoke test) to CI.

Exit criteria:
- npm publication is a deliberate decision with clear gates
- packaging success is no longer confused with release readiness

## Implementation Tasks

- [x] Define the device authorization API contract and session persistence format.
- [x] Add dashboard-side device auth endpoints, state storage, and audit logging.
- [x] Make CLI device flow the default `harness auth login` path.
- [x] Demote direct credential paths to explicit dev/bootstrap fallback modes.
- [x] Implement Windows Credential Manager and Linux Secret Service backends behind the existing session-store abstraction.
- [x] Add CLI integration tests for login, session verification, logout, and at least one facilitator command.
- [x] Define and test the facilitator skill invocation path to the CLI.
- [x] Add cross-platform CI coverage for macOS, Windows, and Linux.
- [x] Define the npm publication gate and release smoke checks.

## Acceptance Criteria

- `harness auth login` defaults to a browser/device approval flow rather than direct credential entry.
- The CLI can complete login from a headless or remote shell by showing a verification URL and code.
- Facilitator session material is stored in a native secure store on every platform the CLI claims to support.
- File-based session storage is explicit fallback behavior, not the silent default on supported platforms.
- Dashboard-side device auth lifecycle is audited and tested.
- The repo contains integration coverage proving CLI auth plus at least one real facilitator operation against the runtime contract.
- The facilitator skill has a defined and tested invocation path to the CLI without storing raw facilitator secrets itself.
- npm publication remains blocked until the defined release gate is satisfied.

## References

- Existing control-model brainstorm: [2026-04-07-workshop-blueprint-and-facilitator-control-model-brainstorm.md](../brainstorms/2026-04-07-workshop-blueprint-and-facilitator-control-model-brainstorm.md)
- Existing control-model plan: [2026-04-07-feat-workshop-blueprint-and-facilitator-control-model-plan.md](2026-04-07-feat-workshop-blueprint-and-facilitator-control-model-plan.md)
- Current CLI foundation: [harness-cli-foundation.md](../harness-cli-foundation.md)
- Current CLI package: [harness-cli/README.md](../../harness-cli/README.md)
- Facilitator auth ADR: [2026-04-06-neon-auth-for-facilitator-identity.md](../adr/2026-04-06-neon-auth-for-facilitator-identity.md)
- Auth model: [private-workshop-instance-auth-model.md](../private-workshop-instance-auth-model.md)
- Vercel changelog: [New Vercel CLI login flow](https://vercel.com/changelog/new-vercel-cli-login-flow)
- Vercel docs: [vercel login](https://vercel.com/docs/cli/login)
- GitHub device flow docs: [Authorizing OAuth apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
- GitHub CLI docs: [gh auth login](https://cli.github.com/manual/gh_auth_login)
