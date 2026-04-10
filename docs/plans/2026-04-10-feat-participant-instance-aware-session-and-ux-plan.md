---
title: "feat: participant instance-aware session resolution and UX improvements"
type: plan
date: 2026-04-10
status: complete
confidence: high
---

# Participant Instance-Aware Session Resolution and UX Improvements

The participant page is permanently desynced from the facilitator because it reads workshop state from a global env var (`HARNESS_WORKSHOP_INSTANCE_ID`) instead of from the participant's own session. The page also lacks loading feedback and live updates.

## Problem Statement

Three distinct problems compound into a broken participant experience:

1. **Instance desync** — The participant page resolves the workshop instance from a deploy-time env var. The facilitator operates on a specific instance via URL params. When these differ, the participant sees a completely different workshop's state. This is architecturally wrong for multi-instance deployments.

2. **No loading feedback** — The participant room surface is a pure Server Component with server actions for logout. Button clicks have no visual feedback — no spinner, no disabled state, no indication that anything is happening.

3. **Static rendering** — The participant page only updates on full page reload. When the facilitator advances a stage, participants see stale data until they manually refresh. There is no polling or live update mechanism.

## Target End State

- A participant who redeems an event code always sees the workshop instance that code belongs to, regardless of the `HARNESS_WORKSHOP_INSTANCE_ID` env var.
- Form submissions (login, logout) show loading feedback.
- The participant page periodically refreshes its data without requiring a manual page reload.
- The CLI and dashboard API routes are consistent — both derive instance context from the participant session, not the env var.

## Scope and Non-Goals

**In scope:**
- Cross-instance session lookup in both File and Neon repositories
- Threading `session.instanceId` through participant page and API routes
- Adding client-side loading states to participant forms
- Adding a lightweight polling mechanism for live stage updates
- Updating API routes (`/api/event-context/core`, `/api/event-context/teams`) to use session-derived instance

**Non-goals:**
- WebSocket/SSE real-time push (polling is sufficient for workshop cadence)
- Participant-writable features (team editing, note creation) — separate scope
- Redesigning the participant page layout — this plan improves interactivity, not information architecture
- CLI changes beyond aligning instance resolution — the CLI already has `session.selectedInstanceId`
- Changing how `redeemEventCode` binds to an instance (the env var at redeem time is correct — it defines *which instance's event code* to validate against)

## Proposed Solution

### Phase A: Instance-aware session resolution (dashboard)

The core fix: make `getParticipantSession()` derive the instance from the stored session record, not the env var.

The `token_hash` column has a unique constraint (`ON CONFLICT (token_hash)` in `upsertSession`), so a cross-instance lookup by token hash alone is safe and unambiguous.

**Flow change:**

```
Before:
  getParticipantSession(token)
    → instanceId = getCurrentWorkshopInstanceId()  // env var
    → findSession(instanceId, tokenHash)           // scoped to env var instance
    → return { instanceId: <env var>, ... }

After:
  getParticipantSession(token)
    → findSessionByTokenHash(tokenHash)            // cross-instance lookup
    → return { instanceId: <from DB row>, ... }    // from stored record
```

### Phase B: Thread session.instanceId through participant reads

Once `getParticipantSession()` returns the correct instance, thread it through:

- `page.tsx`: `getWorkshopState(session.instanceId)` instead of `getWorkshopState()`
- `getParticipantTeamLookup()`: accept explicit instanceId
- `/api/event-context/core` and `/api/event-context/teams`: derive from session
- Unauthenticated API routes (`/api/briefs`, `/api/challenges`, `/api/teams`) continue using the env var — they serve the CLI in fallback/public mode

### Phase C: Participant UX — loading states

Add a thin `"use client"` wrapper around forms that need feedback:

- Login form (event code submission) — show spinner on submit
- Logout button — show spinner on submit
- Keep `ParticipantRoomSurface` as a Server Component for the main content

### Phase D: Participant UX — live stage updates

Add a lightweight client-side polling mechanism:

- A `"use client"` component that polls `/api/event-context/core` on a 30s interval
- On change detection (comparing `currentAgendaItem.id`), trigger `router.refresh()` to re-render the Server Component with fresh data
- The polling component is invisible — no UI, just a refresh trigger
- Stop polling when the tab is backgrounded (Page Visibility API)

## Implementation Tasks

- [x] **A1.** Add `findSessionByTokenHash(tokenHash)` to `EventAccessRepository` interface and both implementations (Neon: `SELECT ... WHERE token_hash = $1 LIMIT 1` without instance filter; File: scan all instance directories)
- [x] **A2.** Update `getParticipantSession()` in `event-access.ts` to use `findSessionByTokenHash` and return `instanceId` from the DB row instead of the env var
- [x] **A3.** Update `deleteExpiredSessions` call in `getParticipantSession` to use the session's `instanceId` (or remove — it runs on every request and could be a background job)
- [x] **A4.** Update `revokeParticipantSession` to use cross-instance lookup for the token
- [x] **A5.** Add tests: cross-instance session lookup returns correct `instanceId`; session for instance A is not found when env var points to instance B (the old bug, now fixed)
- [x] **B1.** Update `page.tsx` to pass `session.instanceId` to `getWorkshopState()` and `getParticipantTeamLookup()`
- [x] **B2.** Update `getParticipantTeamLookup()` to accept optional `instanceId` parameter
- [x] **B3.** Update `/api/event-context/core` route to derive `instanceId` from the validated session
- [x] **B4.** Update `/api/event-context/teams` route similarly
- [x] **B5.** Update `requireParticipantSession()` helper (used by API routes) to return `instanceId` in its success response
- [x] **C1.** Create a `"use client"` `SubmitButton` component with `useFormStatus()` for pending state
- [x] **C2.** Use `SubmitButton` in the event-code login form and logout form
- [x] **D1.** Create a `"use client"` `ParticipantLiveRefresh` component that polls `/api/event-context/core` every 30s
- [x] **D2.** Wire `ParticipantLiveRefresh` into the participant page layout
- [x] **D3.** Add Page Visibility API support to pause polling when tab is backgrounded

## Decision Rationale

**Cross-instance token lookup vs. storing instanceId in the cookie:**
Storing the instance ID in the cookie is simpler but creates a trust boundary issue — the client could tamper with it. The DB lookup is authoritative and aligns with the existing auth model's server-side-only authorization rule.

**Polling vs. SSE/WebSocket:**
Workshop phases change every 15-45 minutes. A 30s poll is ~2 requests/min per participant — negligible load even at 50 participants. SSE/WS adds connection management complexity for minimal latency gain in this use case.

**`useFormStatus` vs. custom state management:**
React's built-in `useFormStatus()` hook integrates directly with server actions and requires zero state management code. It's the standard Next.js App Router pattern for form loading states.

**Keeping `redeemEventCode` env-var-scoped:**
The env var is correct at redeem time — it defines which instance's event code to validate against. The fix is in the *read* path (session resolution), not the *write* path (code redemption). Each deployment serves one instance's event code form.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| `token_hash` is unique across instances | Verified | `ON CONFLICT (token_hash)` in `upsertSession` (Neon), UUIDs are unique (File) |
| Neon SQL supports single-column lookup without instance filter | Verified | Standard SQL, no composite-only index constraint |
| `useFormStatus()` works with Next.js server actions | Verified | Standard App Router pattern, used in admin submit button already |
| `/api/event-context/core` returns agenda with current item status | Verified | Returns full `agenda` array with `status` field per item |
| File mode session lookup can scan instance directories | Verified | Data dir structure is `data/{instanceId}/participant-sessions.json` |

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| File-mode cross-instance scan is slow with many instances | Low | Low | Scan is O(instances), workshop deployments have <10 instances. Add index file if needed later. |
| Polling creates unwanted load on production | Low | Low | 30s interval, paused on background tab. At 50 participants = 100 req/min — well within Vercel budget. |
| Session token hash collision across instances | Negligible | High | UUIDs have 122 bits of entropy. Collision probability is ~10^-37. |
| Breaking the CLI's unauthenticated API fallback | Medium | Medium | Non-goals: unauthenticated routes (`/api/briefs`, etc.) keep using env var. Only session-gated routes change. |
