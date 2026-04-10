---
title: "refactor: participant CLI architecture — unified auth, clean scopes, skill delegation"
type: plan
date: 2026-04-10
status: in_progress
brainstorm: docs/brainstorms/2026-04-10-participant-cli-architecture-brainstorm.md
confidence: high
---

# Participant CLI Architecture

**One-line summary:** Unify auth (participant + facilitator), restructure CLI into three scopes (`auth`, `workshop`, `instance`), add participant data commands, and make the skill delegate all API calls through the CLI.

## Problem Statement

The workshop skill currently tries to call dashboard APIs directly from agent context. This is broken: origin checks block non-browser requests, the path is untestable, and it violates the trust boundary rule established for facilitator operations. Participants already have the CLI installed via `harness skill install` — the CLI should be their gateway to the dashboard, just as it is for facilitators.

## Target End State

When this plan lands:

1. `harness auth login --code <CODE>` authenticates a participant via event code
2. `harness auth login` authenticates a facilitator via device flow (unchanged behavior, new scope)
3. The session stores a `role` field (`"participant"` or `"facilitator"`)
4. `harness workshop brief/challenges/team/status` work for participants
5. `harness instance create/list/show/select/reset/remove/update` replaces `harness workshop *-instance`
6. The workshop skill delegates all API calls to `harness --json` commands
7. All new commands have tests using the existing `createFetchStub` pattern

## Scope and Non-Goals

**In scope:**
- Participant auth via event code
- Participant data commands (brief, challenges, team)
- CLI scope rename (workshop → instance for lifecycle commands)
- Session model update (add role)
- Skill file updates to delegate to CLI
- Tests for all new commands

**Non-goals:**
- Dashboard API changes (all routes already exist)
- Dashboard UI changes
- Real-time/websocket connections
- Multi-instance participant sessions
- New participant features beyond existing API surface

## Proposed Solution

Four phases, dependency-ordered. Each phase produces a committable, testable unit.

---

## Phase 1: Origin Check Verification + Session Model (half day)

Verify the unverified assumption first, then update the session model.

### Implementation Tasks

- [ ] **1.1** Verify origin check from CLI — write a minimal test that POSTs to `/api/event-access/redeem` with a known event code using the client's `origin: baseUrl` header pattern. This can be a manual curl with the correct origin header or an integration test. The dashboard's `isTrustedOrigin` (in `dashboard/lib/request-integrity.ts:15-31`) compares `origin` host to `host`/`x-forwarded-host` — the CLI sets `origin: baseUrl` on POST (client.js:49), so the origin host should match the dashboard's own host. **If this fails, we need to add the CLI as a trusted origin on the dashboard side before proceeding.**

- [ ] **1.2** Add `role` to `sanitizeSession` allowlist in `session-store.js:312`:
  ```
  role: session.role ?? null,
  ```
  This field is already stored by device-auth login (`run-cli.js:518`) but stripped by `sanitizeSession`.

- [ ] **1.3** Add `role` to the `authStatus` display in `handleAuthStatus` so `harness auth status` shows the current role.

- [ ] **1.4** Write a test for `harness auth status` that verifies `role` appears in the output when present in the session.

### Phase 1 Exit Criteria

- [ ] Origin check verified (or dashboard-side fix applied)
- [ ] `harness auth status` shows `role: participant` or `role: facilitator`
- [ ] Test passes

---

## Phase 2: Participant Auth + Client Methods (1 day)

Add event code login and participant API methods to the client.

### Implementation Tasks

#### 2.1 Client: add participant methods

- [ ] **2.1.1** Add `redeemEventAccess(eventCode)` to `client.js`:
  - POST `/api/event-access/redeem`
  - Body: `{ eventCode }`
  - Returns: `{ ok, expiresAt }` or `{ ok: false, error }`
  - The response includes a `Set-Cookie` header — extract it from the response headers

- [ ] **2.1.2** Add `logoutParticipant()` to `client.js`:
  - POST `/api/event-access/logout`
  - Requires participant cookie in session

- [ ] **2.1.3** Add `getBriefs()` to `client.js`:
  - GET `/api/briefs`
  - No auth required (public endpoint)

- [ ] **2.1.4** Add `getChallenges()` to `client.js`:
  - GET `/api/challenges`
  - No auth required (public endpoint)

- [ ] **2.1.5** Add `getTeams()` to `client.js`:
  - GET `/api/teams`
  - Requires participant session cookie

- [ ] **2.1.6** Add `getCheckpoints()` to `client.js`:
  - GET `/api/checkpoints`
  - Requires participant session cookie

- [ ] **2.1.7** Add `getParticipantContext()` to `client.js`:
  - GET `/api/event-context/core`
  - Requires participant session cookie
  - Returns the core participant bundle (instance info, agenda, phase)

#### 2.2 Auth: add participant login

- [ ] **2.2.1** Add `handleParticipantLogin` handler in `run-cli.js`:
  - Triggered when `harness auth login --code <CODE>` is invoked
  - Calls `client.redeemEventAccess(code)`
  - On success: extracts cookie from response, stores session with `{ authType: "event-code", cookieHeader: <cookie>, role: "participant", dashboardUrl, loggedInAt, expiresAt }`
  - On failure: shows error message (invalid code, rate limited, etc.)

- [ ] **2.2.2** Update `handleAuthLogin` dispatch in `run-cli.js`:
  - If `flags.code` is present → call `handleParticipantLogin`
  - Otherwise → existing facilitator login flow (device/basic/neon)

- [ ] **2.2.3** Update `handleAuthLogout` to handle participant sessions:
  - If session `authType === "event-code"` → call `client.logoutParticipant()`, then clear local session
  - Otherwise → existing facilitator logout

- [ ] **2.2.4** Store participant session with the same `writeSession` — single slot, role field distinguishes

#### 2.3 Tests

- [ ] **2.3.1** Test: `harness auth login --code <VALID>` stores a participant session with role
- [ ] **2.3.2** Test: `harness auth login --code <INVALID>` shows error, no session stored
- [ ] **2.3.3** Test: `harness auth status` after participant login shows role: participant
- [ ] **2.3.4** Test: `harness auth logout` after participant login clears session

### Phase 2 Exit Criteria

- [ ] `harness auth login --code <CODE>` works end-to-end (with fetch stub)
- [ ] Session stores `role: "participant"` and `cookieHeader`
- [ ] Logout clears participant session
- [ ] All new tests pass alongside existing 51 tests

---

## Phase 3: Participant Data Commands + Scope Rename (1 day)

Add participant data commands and rename instance lifecycle commands.

### Implementation Tasks

#### 3.1 Participant workshop commands

- [ ] **3.1.1** Add `handleWorkshopBrief` handler:
  - Calls `client.getBriefs()` or `client.getParticipantContext()` for the assigned brief
  - `--json` outputs raw API response
  - Human-readable output shows problem statement, user stories, first prompt

- [ ] **3.1.2** Add `handleWorkshopChallenges` handler:
  - Calls `client.getChallenges()`
  - Shows challenge cards grouped by section
  - `--json` outputs raw API response

- [ ] **3.1.3** Add `handleWorkshopTeam` handler:
  - Requires participant or facilitator session
  - Calls `client.getTeams()`
  - Shows team name, members, repo URL

- [ ] **3.1.4** Add dispatch entries in the `if`-chain:
  ```
  workshop brief      → handleWorkshopBrief
  workshop challenges → handleWorkshopChallenges
  workshop team       → handleWorkshopTeam
  ```

- [ ] **3.1.5** Update `requireSession` or add `requireParticipantSession`:
  - Participant commands need either a participant or facilitator session
  - Facilitator commands need specifically a facilitator session
  - Add a `requireSessionWithRole(io, ui, env, requiredRole)` helper that checks `session.role`

#### 3.2 Scope rename: workshop *-instance → instance *

- [ ] **3.2.1** Add `instance` scope dispatch entries:
  ```
  instance create    → handleWorkshopCreateInstance (reuse existing handler)
  instance list      → handleWorkshopListInstances
  instance show      → handleWorkshopShowInstance
  instance select    → handleWorkshopSelectInstance
  instance reset     → handleWorkshopResetInstance
  instance remove    → handleWorkshopRemoveInstance
  instance update    → handleWorkshopUpdateInstance
  instance current   → handleWorkshopCurrentInstance
  ```

- [ ] **3.2.2** Remove old `workshop *-instance` dispatch entries (breaking change)

- [ ] **3.2.3** Update `printUsage` to reflect new taxonomy:
  - `Participant` section: `skill install`, `auth login --code`
  - `Authentication` section: `auth login`, `auth status`, `auth logout`
  - `Workshop` section: `workshop status`, `workshop brief`, `workshop challenges`, `workshop team`, `workshop phase set`, `workshop participant-access`, `workshop learnings`, `workshop prepare`, `workshop archive`
  - `Instance` section: `instance create`, `instance list`, `instance show`, `instance select`, `instance reset`, `instance remove`, `instance update`, `instance current`

- [ ] **3.2.4** Update `harness skill` sub-command help to reflect new commands

#### 3.3 Tests

- [ ] **3.3.1** Test: `harness workshop brief` returns brief data (with fetch stub)
- [ ] **3.3.2** Test: `harness workshop challenges` returns challenge cards
- [ ] **3.3.3** Test: `harness workshop team` requires session, returns team data
- [ ] **3.3.4** Test: `harness instance create` works (same handler as old `workshop create-instance`)
- [ ] **3.3.5** Test: `harness instance list` works
- [ ] **3.3.6** Test: old `harness workshop create-instance` falls through to usage (breaking change verified)
- [ ] **3.3.7** Update all existing tests that use `workshop *-instance` commands to use `instance *`

### Phase 3 Exit Criteria

- [ ] `harness workshop brief/challenges/team` work with participant session
- [ ] `harness instance create/list/show/select/reset/remove/update/current` work
- [ ] Old `workshop *-instance` commands no longer work (intentional break)
- [ ] `harness --help` shows the new four-section taxonomy
- [ ] All tests pass (existing updated + new added)

---

## Phase 4: Skill Delegation + Bundle Sync (half day)

Update skill files to delegate API calls through the CLI, sync the bundle, and release.

### Implementation Tasks

#### 4.1 Skill updates

- [ ] **4.1.1** Update `workshop-skill/SKILL.md`:
  - `workshop login` → instructs agent to run `harness auth login --code <CODE>`
  - `workshop brief` → instructs agent to run `harness --json workshop brief`
  - `workshop challenges` → instructs agent to run `harness --json workshop challenges`
  - `workshop team` → instructs agent to run `harness --json workshop team`
  - `workshop` (status) → instructs agent to run `harness --json workshop status`
  - Add a general rule: "For all commands that need live workshop data, prefer `harness --json <command>` over direct API calls. The CLI handles authentication, session management, and origin headers."

- [ ] **4.1.2** Update `workshop-skill/SKILL-facilitator.md`:
  - Update all CLI command references from `harness workshop create-instance` → `harness instance create` etc.
  - Update `workshop facilitator login` → `harness auth login` (device flow)

- [ ] **4.1.3** Update `workshop-skill/facilitator.md`:
  - Update all CLI command references to use `instance` scope
  - Update preferred CLI invocations throughout

#### 4.2 Bundle and release

- [ ] **4.2.1** Run `node scripts/sync-workshop-bundle.mjs` to sync bundle
- [ ] **4.2.2** Run full test suite
- [ ] **4.2.3** Bump version to next minor (0.5.0 — breaking scope rename)
- [ ] **4.2.4** Commit, push, create GitHub release
- [ ] **4.2.5** Verify npm publication and test `harness skill install --force`

### Phase 4 Exit Criteria

- [ ] Skill files reference CLI commands, not API endpoints
- [ ] All skill CLI references use new scope names
- [ ] Bundle synced, tests pass, published to npm
- [ ] `harness skill install --force` installs updated skills

---

## Acceptance Criteria

1. `harness auth login --code <EVENT_CODE>` authenticates a participant and stores a session with `role: "participant"`
2. `harness auth login` authenticates a facilitator with `role: "facilitator"` (unchanged behavior)
3. `harness auth status` shows the role
4. `harness workshop brief` returns the assigned project brief
5. `harness workshop challenges` returns challenge cards
6. `harness workshop team` returns team info (requires session)
7. `harness instance create/list/show/select/reset/remove/update` work for facilitators
8. Old `harness workshop create-instance` etc. no longer work
9. The workshop skill delegates all API calls to `harness --json` commands
10. All commands have tests using `createFetchStub`
11. Published to npm and installable via `harness skill install`

## Decision Rationale

See brainstorm document for full rationale. Key decisions:

- **Unified session with roles** over dual-slot — facilitator is superset, one session avoids confusion
- **Three scopes** (`auth`, `workshop`, `instance`) over single `workshop` — clean separation of concerns
- **Breaking rename** over deprecation aliases — pre-1.0, single user, skill references updated together
- **CLI as gateway** over direct API calls — testable, session-managed, origin-check-safe

## Constraints and Boundaries

- Do not change dashboard API routes — the CLI adapts to existing routes
- The CLI is the only component that makes HTTP requests to the dashboard
- The skill never stores credentials or makes HTTP requests
- Breaking changes are acceptable (pre-1.0)
- All commands must support `--json` for machine-readable output

## Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| Origin check passes from CLI | Unverified → verify in Phase 1.1 | CLI sets `origin: baseUrl` on POST; dashboard checks `origin.host === host` |
| Participant event code session returns a cookie | Verified | `redeem/route.ts` sets `Set-Cookie` with `httpOnly` flag |
| Cookie can be extracted from fetch response | Verified | Node.js fetch exposes `response.headers.getSetCookie()` |
| Single session slot is sufficient | Verified | Facilitator is superset; no concurrent participant+facilitator need |
| All existing tests remain valid after rename | Needs care | Tests reference `workshop create-instance` etc. — must update in Phase 3.3.7 |

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Origin check fails from CLI | Low | High (blocks everything) | Phase 1.1 verifies first; fallback: add CLI to trusted origins on dashboard |
| Cookie extraction from fetch is non-trivial | Low | Medium | Node.js fetch has `getSetCookie()`; test in Phase 2 |
| Breaking rename causes confusion | Very low | Low | Single user, pre-1.0, skill references updated in same release |
| Facilitator tests break during rename | Medium | Medium | Phase 3.3.7 explicitly updates all existing tests |
| Session expiry not handled gracefully | Medium | Low | Add expiry check in `requireSession`; defer UX polish |

## References

- Brainstorm: `docs/brainstorms/2026-04-10-participant-cli-architecture-brainstorm.md`
- CLI foundation: `docs/harness-cli-foundation.md`
- Dashboard redeem route: `dashboard/app/api/event-access/redeem/route.ts`
- Origin check: `dashboard/lib/request-integrity.ts`
- Expert panel review: `docs/reviews/2026-04-10-expert-panel-skills-cli-teaching-approach.md`
