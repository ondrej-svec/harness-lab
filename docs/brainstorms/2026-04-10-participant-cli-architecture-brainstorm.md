---
title: "Participant CLI Architecture"
type: brainstorm
date: 2026-04-10
participants: [Ondrej, Claude]
related:
  - docs/harness-cli-foundation.md
  - docs/brainstorms/2026-04-10-expert-panel-remediation-brainstorm.md
  - docs/adr/2026-04-08-portable-participant-skill-distribution.md
---

# Participant CLI Architecture

## Problem Statement

The workshop skill currently tries to call dashboard APIs directly from agent context for participant operations (login via event code, fetching briefs, challenges, teams). This is broken: the dashboard enforces origin checks that block non-browser requests, and the skill-to-API path is untestable, fragile, and violates the trust boundary principle already established for facilitator operations ("the skill must not become a second secret store").

Three intertwined problems:

1. **The skill can't reach the dashboard** — origin checks block raw API calls from agent contexts. Participant login doesn't work.
2. **The participant path isn't testable** — no tests cover participant auth or data retrieval. Breakage surfaces during the workshop.
3. **Two auth models, one session slot** — the CLI stores one session (facilitator). Participants need their own auth. The models don't coexist.

## Context

### What already exists

- The HTTP client supports `cookieHeader` — mechanically ready for participant cookies
- The dashboard has all participant API routes: `/api/event-access/redeem`, `/api/briefs`, `/api/challenges`, `/api/teams`, `/api/checkpoints`, `/api/event-context/core`
- Briefs and challenges are unauthenticated endpoints
- The session store is single-slot: `harness-cli.session` / `active`
- The CLI sets `origin: baseUrl` on POST requests
- The facilitator skill already delegates everything to the CLI — proven pattern
- Participants already have the CLI installed (it's the entry point via `harness skill install`)

### Prior decisions that now need revision

- The original design kept participants away from the CLI beyond `skill install`. This was because npm install was seen as a barrier. Since participants now install the CLI anyway, this constraint no longer applies.
- The current CLI scope taxonomy puts everything under `workshop` — instance lifecycle, live facilitation, and participant data all in one scope.

## Chosen Approach

**Unified session with roles + clean scope taxonomy.**

One session, one auth command, role determines access. Facilitator is a superset of participant. Three clean CLI scopes: `auth`, `workshop`, `instance`.

### End-state CLI taxonomy

```
harness skill install                 → get the skill into your repo

harness auth login [--code <CODE>]    → authenticate (participant via event code, facilitator via device flow)
harness auth status                   → shows role, instance, what's accessible
harness auth logout                   → clears session

harness workshop status               → where am I in the day
harness workshop brief                → my team's project brief
harness workshop challenges           → challenge cards
harness workshop team                 → team info
harness workshop phase set <id>       → advance agenda (facilitator only)
harness workshop participant-access   → manage event code (facilitator only)
harness workshop learnings            → query rotation signals (facilitator only)
harness workshop prepare              → mark ready (facilitator only)
harness workshop archive              → snapshot (facilitator only)

harness instance create               → provision a new workshop
harness instance list                 → browse instances
harness instance show <id>            → inspect one
harness instance select <id>          → pin local target
harness instance reset <id>           → reinitialize
harness instance remove <id>          → soft-delete
harness instance update <id>          → change metadata
```

### Auth flow

```
Participant:  harness auth login --code KV5m_y_sNhR...  →  role: "participant"
Facilitator:  harness auth login                        →  role: "facilitator" (superset)
Either:       harness auth status                       →  shows role + what's accessible
Either:       harness auth logout                       →  clears session
```

### Skill delegation

```
$workshop login   →  skill asks for event code, runs `harness auth login --code <CODE>`
$workshop brief   →  skill runs `harness --json workshop brief`
$workshop team    →  skill runs `harness --json workshop team`
```

Same pattern as facilitator operations. The skill is a conversational wrapper around CLI commands, not an HTTP client.

## Why This Approach

### Alternatives considered

**Approach A: Dual-session CLI** — two separate session slots (participant + facilitator), separate command sets.
Rejected because: unnecessary complexity, the user correctly identified that facilitator is a superset of participant, and two sessions create confusion about which is active.

**Approach C: Participant commands only, no session** — minimal CLI changes, event code stored as a lightweight token.
Rejected because: it creates a third auth path alongside device flow and neon, fragmented and harder to test.

### Why Approach B wins

- **One auth model** — `harness auth login` is the single entry point. The mechanism differs (event code vs. device flow) but the session contract is the same.
- **Facilitator = superset** — a facilitator can access participant data without switching sessions. No "log out and log back in as participant" flow.
- **Clean taxonomy** — `auth` for identity, `workshop` for the day, `instance` for infrastructure. Each scope has a clear audience and lifecycle.
- **Proven pattern** — facilitator operations already use skill→CLI→dashboard. Extending to participants is additive, not a new architecture.
- **Testable** — all participant operations flow through CLI commands that can be tested with the existing `createFetchStub` pattern.

## Key Design Decisions

### Q1: Session model — RESOLVED
**Decision:** Unified single-slot session with a `role` field (`"participant"` or `"facilitator"`).
**Rationale:** Facilitator is a superset. One session means no confusion about which identity is active. The session stores whatever credential the dashboard returns (cookie or token) plus the role.
**Alternatives considered:** Dual-slot session — rejected for complexity. Stateless participant path — rejected because teams/checkpoints require authentication.

### Q2: CLI scope taxonomy — RESOLVED
**Decision:** Three scopes: `auth`, `workshop`, `instance`. Current `workshop create-instance` etc. move to `instance create` etc.
**Rationale:** `workshop` should mean "the workshop day" — what participants and facilitators do during the event. Instance lifecycle is infrastructure management, a different concern with a different audience and timing.
**Alternatives considered:** Keeping everything under `workshop` — rejected because it conflates three activities. Adding a `participant` scope — rejected because participant and facilitator share the same day-of operations, just with different permissions.

### Q3: Auth command surface — RESOLVED
**Decision:** `harness auth login --code <CODE>` for participants, `harness auth login` (existing device flow) for facilitators. Same command, different mechanism.
**Rationale:** Auth is auth. The mechanism is an implementation detail, not a user-facing concept. Participants don't need to know they're using a "different" auth system.
**Alternatives considered:** `harness event login` — rejected because it creates a fourth scope for a single command. `harness workshop login` — rejected because login is an auth concern, not a workshop concern.

### Q4: Breaking change strategy — RESOLVED
**Decision:** Rename in one pass. The CLI is pre-1.0, used by one facilitator, and the skill's `facilitator.md` references CLI commands that we update together.
**Rationale:** The alternative — deprecation aliases — adds complexity for a user base of one. Clean break is cheaper.
**Alternatives considered:** Gradual deprecation with aliases — rejected as over-engineered for a single-user pre-1.0 tool.

### Q5: Skill delegation model — RESOLVED
**Decision:** The skill delegates all dashboard communication to `harness --json` commands. The skill never makes HTTP requests directly.
**Rationale:** This is the trust boundary rule already established for facilitator operations. Extending it to participants is consistent and makes the skill simpler (no HTTP, no cookies, no origin headers). The CLI is the testable, session-managed gateway.
**Alternatives considered:** Skill makes API calls for unauthenticated endpoints (briefs, challenges) — rejected for consistency. If some commands go through the CLI and others don't, the failure modes differ and testing is split.

## Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| Participants already have the CLI installed | Bedrock | `harness skill install` is the entry point — CLI is already on their machine |
| Dashboard origin check passes from CLI | Unverified | CLI sets `origin: baseUrl` on POST, but this needs verification against the dashboard's `isTrustedOrigin` implementation |
| Single session slot is sufficient | Mostly bedrock | Facilitator = superset. Edge case: facilitator testing as participant on a different instance — acceptable to defer |
| Scope rename is manageable | Bedrock | Pre-1.0, single facilitator user, skill references updated together |
| Skill→CLI delegation is proven | Bedrock | Facilitator operations already use this pattern successfully |

## Open Questions

1. **Origin check verification** — does the dashboard's `isTrustedOrigin` accept requests from the CLI when `origin` is set to the dashboard URL? Needs a test early in implementation.

2. **Session expiry and re-auth** — participant event code sessions have an expiry. How does the CLI handle expiry gracefully? Should `harness auth status` warn when the session is about to expire?

3. **Instance targeting for participants** — facilitators use `harness instance select <id>` to pin a target. Participants don't manage instances — their event code is tied to one. Does the redeem response include the instance ID, or does the CLI need to resolve it?

4. **Backwards compatibility for facilitator.md** — the facilitator skill references CLI commands like `harness workshop create-instance`. After the rename, these become `harness instance create`. Both `SKILL-facilitator.md` and `facilitator.md` need updating. Track this as a task.

5. **Test strategy** — should we add integration tests that hit a real dashboard (with a test instance), or keep everything mocked? The unverified origin assumption argues for at least one real HTTP test.

## Out of Scope

- Dashboard API changes (the routes exist and work; the CLI adapts to them)
- Dashboard UI changes
- New participant features beyond what the existing API supports
- Multi-instance participant sessions
- Real-time/websocket connections

## Next Steps

- `/plan` to create an implementation plan from these decisions
- The plan should verify the origin check assumption early (open question 1)
- Consider capturing this as a `/compound` pattern: "when a skill needs to call an API, route through the CLI instead"
