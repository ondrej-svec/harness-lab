---
title: "refactor: separate /participant route from public homepage"
type: plan
date: 2026-04-11
status: in_progress
confidence: high
---

# Separate /participant Route from Public Homepage

Split the participant room view into its own `/participant` route so the URL structure matches the user's mental model.

## Problem Statement

The public landing page and the authenticated participant room both live at `/`. The session cookie determines what you see. This is confusing:

- The URL doesn't change after login — a participant sees `lab.ondrejsvec.com/` and so does a visitor
- You can't share or bookmark the participant view directly
- The `page.tsx` at `/` contains both the public marketing view AND the participant room logic — one file doing two jobs
- Anchor links like `/#teams` work but look odd as a "participant URL"

## Target End State

- `/` — always the public landing page with event code form, workshop overview, principles
- `/participant` — the authenticated participant room (requires session cookie, redirects to `/` if no session)
- After successful event code redemption, redirect to `/participant` instead of `/`
- The leave-room action redirects back to `/`
- Navigation links update accordingly

## Scope and Non-Goals

**In scope:**
- New `app/participant/page.tsx` with the participant room surface
- Move participant logic out of `app/page.tsx` — it becomes public-only
- Update `redeemEventCodeAction` to redirect to `/participant`
- Update `logoutEventCodeAction` to redirect to `/`
- Update proxy to redirect unauthenticated `/participant` requests to `/`
- Update nav links and anchor hrefs
- Update E2E tests

**Non-goals:**
- Changing the facilitator `/admin` route structure
- Changing the API routes (`/api/event-context/*` stay the same)
- Changing the presenter routes

## Proposed Solution

### Move participant view to `/participant`

Create `app/participant/page.tsx` — moves the participant branch from the current `app/page.tsx`. The existing `page.tsx` becomes public-only (no `participantSession` conditional).

### Redirect flows

- `redeemEventCodeAction` → on success, redirect to `/participant` (currently redirects to `/`)
- `logoutEventCodeAction` → redirect to `/` (already does this)
- Proxy gate: if `/participant` is requested without a valid `harness_event_session` cookie, redirect to `/`
- `ParticipantLiveRefresh` continues to work at `/participant` (polls `/api/event-context/core`)

### Server actions

The server actions (`redeemEventCodeAction`, `logoutEventCodeAction`) currently live in `app/page.tsx`. They need to be accessible from both routes:
- Redeem action: called from the public page form, redirects to `/participant`
- Logout action: called from the participant page, redirects to `/`

Extract them into a shared module or keep them in `page.tsx` (redeem) and `participant/page.tsx` (logout).

## Implementation Tasks

- [ ] **1.** Create `app/participant/page.tsx` — extract participant rendering from `app/page.tsx`
- [ ] **2.** Simplify `app/page.tsx` to public-only (remove participant branch, keep redeem action)
- [ ] **3.** Update `redeemEventCodeAction` redirect target from `/` to `/participant`
- [ ] **4.** Add proxy gate for `/participant` — redirect to `/` when no participant session cookie
- [ ] **5.** Update `buildSiteHeaderNavLinks` to use `/participant#room`, `/participant#teams`, `/participant#notes` for participant nav
- [ ] **6.** Update E2E tests: event code redemption lands on `/participant`, assertions check the new URL
- [ ] **7.** Update E2E screenshot baselines
- [ ] **8.** Commit, push, verify CI green and Vercel deployed

## Decision Rationale

**Separate route vs. keeping `/` with cookie branching:**
A separate route is cleaner — the URL tells you where you are. The public page is marketing/orientation; the participant page is a working dashboard. These are different jobs and deserve different URLs.

**Proxy redirect vs. server-side redirect in page component:**
The proxy runs before the page renders, so a missing-session redirect at the proxy level avoids rendering the participant page at all. This matches the existing pattern used for `/admin` → `/admin/sign-in`.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| Server actions can redirect across routes | Verified | `redirect("/")` works from any server action regardless of the page it's defined in |
| Proxy can check participant session cookie | Verified | Cookie name `harness_event_session` is a constant; proxy already reads cookies for Neon Auth |
| `ParticipantLiveRefresh` works on any route | Verified | It fetches `/api/event-context/core` by absolute path, not relative |

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Old bookmarks to `/#teams` break | Low | Low | `/` still works as the public page; participants just need to re-login to get to `/participant` |
| CLI `dashboardUrl` needs updating | None | None | CLI calls API routes, not page routes — unaffected |
