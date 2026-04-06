# ADR 2026-04-06: Simplify Facilitator Identity — Neon Auth as Single Source of Truth

## Status

Accepted

## Context

After adopting Neon Auth for facilitator login, the system had three identity stores:

1. `neon_auth.user` — Neon Auth managed users, passwords, sessions
2. `facilitator_identities` — a custom table duplicating email, name, password_hash, status
3. `instance_grants` — authorization referencing `facilitator_identities.id`

This required a manual linking script to bridge Neon Auth user IDs to facilitator identities, and prevented any self-service facilitator management.

## Decision

Eliminate `facilitator_identities` and make Neon Auth the single source of truth for facilitator identity.

### What changed

- **Dropped `facilitator_identities` table** — Neon Auth's `neon_auth.user` is the identity source
- **`instance_grants` references Neon Auth user IDs directly** via `neon_user_id` column (TEXT, no FK to Neon Auth schema)
- **One-hop auth flow**: `auth.getSession()` → `session.user.id` → `instance_grants WHERE neon_user_id = user.id`
- **First-user bootstrap**: first Neon Auth user to sign in on an empty instance auto-gets `owner` role
- **Grant management API**: `GET/POST /api/admin/facilitators`, `DELETE /api/admin/facilitators/[id]` — owners manage access
- **Admin UI section**: facilitator list with add/revoke capabilities for owners
- **Workshop skill**: facilitator commands for agent-driven instance management (`/workshop facilitator login/status/grant/revoke/create-instance/prepare/archive`)
- **Removed**: `facilitator-identity-repository.ts`, `scripts/link-facilitator.ts`, `FacilitatorIdentityRecord`, `FacilitatorIdentityRepository`

### Roles

- **owner** — full access + can add/remove other facilitators
- **operator** — full workshop operations, cannot manage facilitators
- **observer** — read-only access

### Bootstrap flow

1. Enable Neon Auth on the Neon project (Console)
2. Set `NEON_AUTH_BASE_URL` + `NEON_AUTH_COOKIE_SECRET` in deployment
3. Create a user account (sign up at `/admin/sign-in`)
4. First sign-in on the instance auto-grants `owner` — no scripts, no DB operations

## Consequences

- Facilitator identity management is now zero-friction: sign up, sign in, get owner on first use
- Multiple facilitators per instance are properly supported
- Facilitators can manage access via the admin UI or the workshop skill
- Agent-driven instance management is now possible via skill commands
- The system has one clear identity boundary (Neon Auth) instead of a custom shim
- File-mode dev still works without Neon Auth for local development
