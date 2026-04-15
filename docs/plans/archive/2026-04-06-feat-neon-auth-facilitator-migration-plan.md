---
title: "feat: migrate facilitator auth from Basic Auth to Neon Auth"
type: plan
date: 2026-04-06
status: complete
confidence: high
---

# Migrate Facilitator Auth to Neon Auth

Replace the custom Basic Auth facilitator login with Neon Auth (managed Better Auth), using a dedicated `/admin/sign-in` page with email/password. Participant event-code access stays unchanged.

## Problem Statement

The build plan preferred Neon Auth for facilitator identity but the implementation fell back to custom Basic Auth with SHA-256 hashed passwords. This leaves three problems:

1. **No logout** — Basic Auth credentials are cached by the browser; there's no clean sign-out.
2. **No session management** — Every request re-authenticates via the `Authorization` header; there's no session rotation, expiry, or revocation for facilitators.
3. **Weak password storage** — Plain SHA-256 without salt. Acceptable for a workshop, but unnecessary when Neon Auth handles it properly.
4. **No decision record** — Phase 4 tasks are marked complete but no ADR explains why Neon Auth was skipped.

Neon Auth is now stable enough (Better Auth-based, branches with the DB, has a Next.js server SDK) and fits the existing architecture seams (`FacilitatorAuthService`, `FacilitatorIdentityRepository.findBySubject`).

## Target State

- Facilitators sign in at `/admin/sign-in` with email + password via Neon Auth
- Session managed by Neon Auth cookies (HTTP-only, signed, short-lived with rotation)
- `/admin` and facilitator API routes protected by Neon Auth session check
- Identity linked to existing `facilitator_identities` + `instance_grants` via `authSubject`
- Basic Auth completely removed from the facilitator path
- Participant auth unchanged

## What Changes

| Component | Before | After |
|-----------|--------|-------|
| `/admin` protection | Middleware returns 401 + `WWW-Authenticate` → browser Basic Auth dialog | Middleware checks Neon Auth session → redirects to `/admin/sign-in` if missing |
| Facilitator sign-in UX | Browser-native Basic Auth prompt | Custom form page at `/admin/sign-in` |
| Session transport | `Authorization` header on every request | Neon Auth session cookie (HTTP-only, signed) |
| Sign-out | Impossible (browser caches Basic Auth) | Server action calls `auth.signOut()` + cookie clear |
| Password storage | SHA-256 in `facilitator_identities.password_hash` | Managed by Neon Auth in `neon_auth` schema |
| Identity resolution | `findByUsername` → password hash compare | `auth.getSession()` → `findBySubject(session.user.id)` |
| Grant check | Same | Same — `instance_grants` check remains |
| `admin-auth.ts` | `decodeBasicAuthHeader`, `hasValidAdminCredentials` | `isProtectedPath` retained; Basic Auth helpers removed |
| Env vars | `HARNESS_ADMIN_USERNAME`, `HARNESS_ADMIN_PASSWORD` | `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` |

## What Stays the Same

- Participant event-code redemption and session cookies — completely unchanged
- `instance_grants` authorization model — Neon Auth handles identity, grants still live in our schema
- `FacilitatorAuthService` interface — implementation changes, contract stays
- `AuditLogRepository` logging — auth events still logged
- File-mode dev fallback — custom auth remains available when `HARNESS_STORAGE_MODE=file`
- All participant routes and APIs

## Assumptions

| Assumption | Status | Notes |
|------------|--------|-------|
| Neon Auth is enabled on the project's Neon instance | Unverified | Requires Console setup before implementation |
| `@neondatabase/auth` Next.js server SDK works with App Router server actions | Verified | Docs confirm `auth.signIn.email()` in server actions |
| Neon Auth session cookies coexist with participant `harness_event_session` cookie | Unverified | Different cookie names, should be fine |
| Neon Auth middleware can be composed with existing language/participant middleware | Unverified | May need manual session check instead of `auth.middleware()` to avoid conflict |
| Facilitator accounts can be pre-created via Neon Auth admin API or Console | Unverified | `auth.signUp.email()` or Console UI — need to confirm bootstrap path |
| Preview branches get their own Neon Auth environment automatically | Verified | Core Neon Auth feature — auth branches with the DB |

## Risk Analysis

### Middleware conflict
Current middleware handles language resolution, participant cookie forwarding, AND Basic Auth challenge — all in one function. Neon Auth wants its own middleware.

**Mitigation:** Don't use `auth.middleware()`. Instead, call `auth.getSession()` inside the existing middleware for `/admin` routes. This keeps one middleware file and avoids the composition problem.

### Dev mode without Neon Auth
Local file-mode developers won't have `NEON_AUTH_BASE_URL`.

**Mitigation:** Keep `HARNESS_STORAGE_MODE=file` path using a simplified dev-only auth bypass or the existing custom auth as a fallback. Gate Neon Auth code behind the storage mode check.

### Facilitator bootstrap
First facilitator account needs to exist in Neon Auth before anyone can sign in.

**Mitigation:** Document a bootstrap command using `auth.signUp.email()` or the Neon Console. Add a seed script for preview environments.

### Cookie domain mismatch
Neon Auth cookies and participant cookies need to work on the same domain.

**Mitigation:** Both use the same domain by default. Neon Auth `cookies.domain` can be configured if needed.

## Phased Implementation

### Phase 1: Neon Auth SDK setup and auth instance

- Install `@neondatabase/auth`
- Create `lib/auth/server.ts` with `createNeonAuth()`
- Create `app/api/auth/[...path]/route.ts` handler
- Add `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET` to env matrix
- Verify: SDK initializes, handler responds to `/api/auth/ok`

### Phase 2: Sign-in page and server actions

- Create `app/admin/sign-in/page.tsx` — email + password form matching current design system
- Create sign-in server action using `auth.signIn.email()`
- Create sign-out server action using `auth.signOut()`
- Add sign-out button to admin page header (replaces the impossible-to-logout Basic Auth)
- Verify: can sign in, session cookie set, can sign out

### Phase 3: Middleware migration

- Replace Basic Auth challenge in `middleware.ts` with Neon Auth session check for `/admin` routes
- Unauthenticated `/admin` requests redirect to `/admin/sign-in` instead of returning 401
- Keep language resolution and participant header forwarding unchanged
- Remove `x-harness-authorization` header forwarding (no longer needed without Basic Auth)
- Verify: `/admin` redirects to sign-in, signed-in facilitator sees admin page

### Phase 4: FacilitatorAuthService migration

- Create `NeonAuthFacilitatorAuthService` implementing `FacilitatorAuthService`
- Identity resolution: `auth.getSession()` → `session.user.id` → `findBySubject(userId)` → `getActiveGrant(instanceId, identity.id)`
- Keep `BasicFacilitatorAuthService` as file-mode fallback
- Update `getFacilitatorAuthService()` to select based on storage mode
- Update `requireFacilitatorPageAccess` and `requireFacilitatorActionAccess` to use session instead of authorization header
- Update `requireFacilitatorRequest` (API routes) to check Neon Auth session
- Verify: admin page and all facilitator API routes work with Neon Auth session

### Phase 5: Identity linking and bootstrap

- Link Neon Auth user IDs to `facilitator_identities.auth_subject`
- Create bootstrap documentation: how to create first facilitator in Neon Auth and link to instance grant
- Create seed script for preview environments
- Remove `password_hash` dependency from `facilitator_identities` (Neon Auth owns passwords now)
- Verify: end-to-end flow from sign-in → session → identity → grant → admin access

### Phase 6: Cleanup and tests

- Remove `decodeBasicAuthHeader` and `hasValidAdminCredentials` from `admin-auth.ts`
- Remove `HARNESS_ADMIN_USERNAME` and `HARNESS_ADMIN_PASSWORD` from env matrix
- Update `facilitator-auth-service.test.ts` — test both Neon Auth and file-mode paths
- Update `admin-auth.test.ts` — remove Basic Auth tests, keep `isProtectedPath` tests
- Update middleware tests if any
- Add e2e test: facilitator sign-in → admin page → sign-out
- Verify: all tests pass, no Basic Auth references remain in facilitator path

### Phase 7: Documentation

- Write ADR recording the decision to adopt Neon Auth for facilitator identity
- Update env matrix: remove `HARNESS_ADMIN_*`, add `NEON_AUTH_*`
- Update deployment spec: bootstrap steps, preview branch auth
- Update runbook: facilitator account creation, rotation, recovery
- Update build plan Phase 4: replace "custom auth behind seam" with actual Neon Auth reference
- Close the open question from the original plan

## Acceptance Criteria

- [ ] Facilitators sign in at `/admin/sign-in` with email and password
- [ ] `/admin` routes redirect to sign-in when no session exists
- [ ] Facilitator session uses Neon Auth cookies, not Basic Auth headers
- [ ] Sign-out works (clears session, redirects to sign-in)
- [ ] Instance grant check still happens after identity resolution
- [ ] Participant auth is completely unaffected
- [ ] File-mode local dev still works without Neon Auth credentials
- [ ] All existing facilitator-auth tests updated and passing
- [ ] No `WWW-Authenticate` / Basic Auth remains in facilitator path
- [ ] ADR and env matrix updated

## Out of Scope

- Participant auth changes
- OAuth / social login for facilitators (can be added later via Neon Auth)
- MFA (can be added later via Neon Auth)
- Neon Authorize (RLS) — separate concern, not needed for this migration
- Pre-built Neon Auth UI components — using custom form to match design system

## References

- Neon Auth overview: https://neon.com/docs/auth/overview
- Neon Auth Next.js server SDK: https://neon.com/docs/auth/reference/nextjs-server
- Neon Auth Next.js quickstart: https://neon.com/docs/auth/quick-start/nextjs-api-only
- Build plan Phase 4: [2026-04-06-feat-private-workshop-instance-build-plan.md](./2026-04-06-feat-private-workshop-instance-build-plan.md)
- Auth boundary ADR: [../adr/2026-04-06-private-workshop-instance-auth-boundary.md](../adr/2026-04-06-private-workshop-instance-auth-boundary.md)
- Auth model doc: [../private-workshop-instance-auth-model.md](../private-workshop-instance-auth-model.md)
- Env matrix: [../private-workshop-instance-env-matrix.md](../private-workshop-instance-env-matrix.md)
- Current facilitator auth service: [../../dashboard/lib/facilitator-auth-service.ts](../../dashboard/lib/facilitator-auth-service.ts)
- Current middleware: [../../dashboard/middleware.ts](../../dashboard/middleware.ts)
