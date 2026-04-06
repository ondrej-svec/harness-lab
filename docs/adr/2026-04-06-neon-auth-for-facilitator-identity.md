# ADR 2026-04-06: Adopt Neon Auth for Facilitator Identity

## Status

Accepted

## Context

The private workshop-instance build plan (Phase 4) preferred Neon Auth for facilitator identity but the initial implementation used custom Basic Auth with SHA-256 hashed passwords as a fallback. This left the system with:

- no facilitator logout (browser caches Basic Auth credentials)
- no session management, rotation, or revocation for facilitators
- plain SHA-256 password storage without salt
- no decision record explaining why the planned Neon Auth integration was skipped

Neon Auth has since stabilized as a managed Better Auth service that stores users, sessions, and auth configuration directly in the Neon database and branches with each Neon branch.

## Decision

Replace custom Basic Auth with Neon Auth for facilitator authentication in production (neon mode).

### What changed

- **Sign-in**: `/admin/sign-in` page with email/password form using `auth.signIn.email()`, replaces browser Basic Auth dialog
- **Sessions**: Neon Auth manages session cookies (HTTP-only, signed, short-lived with rotation)
- **Sign-out**: Server action using `auth.signOut()`, replaces the impossible-to-logout Basic Auth
- **Middleware**: Redirects to `/admin/sign-in` when no session cookie exists, replaces 401 + `WWW-Authenticate` challenge
- **Identity resolution**: `auth.getSession()` → `findBySubject(userId)` → `getActiveGrant()`, replaces `decodeBasicAuth` → `findByUsername` → password hash compare
- **Service selection**: `NeonAuthFacilitatorAuthService` auto-selected when `HARNESS_STORAGE_MODE=neon` and `NEON_AUTH_BASE_URL` is set

### What stayed the same

- Participant event-code access — completely unchanged
- Instance grants authorization model — Neon Auth handles identity, grants remain in our schema
- File-mode local dev — `BasicFacilitatorAuthService` still works without Neon Auth credentials
- `FacilitatorAuthService` interface — expanded with `hasValidSession`, not replaced

### New environment variables

| Variable | Purpose |
|----------|---------|
| `NEON_AUTH_BASE_URL` | Neon Auth endpoint (from Neon Console → Branch → Auth → Configuration) |
| `NEON_AUTH_COOKIE_SECRET` | 32+ char secret for session cookie signing |

### Bootstrap

1. Enable Auth on the Neon project in the Console
2. Create a facilitator user via Neon Auth (sign-up or Console)
3. Link the Neon Auth user ID to a facilitator identity: `npx tsx scripts/link-facilitator.ts <user-id> <username>`
4. Grant the identity access to the workshop instance via `instance_grants`

## Consequences

- Facilitators now have proper login/logout, session management, and password handling via managed infrastructure
- The maintenance burden for auth code decreases — Neon Auth handles password hashing, session rotation, and cookie signing
- OAuth, MFA, and email verification can be added later through Neon Auth without custom implementation
- File-mode development still works without Neon Auth for quick local iteration
- The `@neondatabase/auth` SDK requires Next.js 16+, which was adopted as part of this change
