---
title: "feat: simplify facilitator identity — Neon Auth as single source of truth"
type: plan
date: 2026-04-06
status: complete
confidence: high
depends-on: 2026-04-06-feat-neon-auth-facilitator-migration-plan.md
---

# Simplify Facilitator Identity

Eliminate the duplicate `facilitator_identities` table. Make Neon Auth the single source of truth for facilitator identity. Make `instance_grants` reference Neon Auth user IDs directly. Add grant management so facilitators can manage their own instances and other facilitators' access. Add a facilitator skill for agent-driven instance management.

## Problem Statement

After the Neon Auth migration, the system has three identity stores that should be one:

1. **Neon Auth** (`neon_auth.user`) — manages users, passwords, sessions
2. **`facilitator_identities`** — our custom table that duplicates user info (email, name, status, password_hash)
3. **`instance_grants`** — authorization, references `facilitator_identities.id` instead of Neon Auth user IDs

This creates:
- a mandatory linking step (`scripts/link-facilitator.ts`) that breaks the flow
- duplicate identity state that can drift
- no self-service facilitator management — everything requires manual DB operations
- no agent-accessible facilitator API — the workshop skill can't help facilitators manage instances

## Target Architecture

```
Neon Auth (neon_auth.user)          instance_grants
┌─────────────────────────┐         ┌─────────────────────────┐
│ id (PK)                 │◄────────│ neon_user_id            │
│ email                   │         │ instance_id             │
│ name                    │         │ role (owner|operator|    │
│ createdAt               │         │       observer)         │
│ ...managed by Neon Auth │         │ granted_at              │
└─────────────────────────┘         │ revoked_at              │
                                    └─────────────────────────┘
                                              │
                                              ▼
                                    workshop_instances
                                    ┌─────────────────────────┐
                                    │ id                      │
                                    │ template_id             │
                                    │ status                  │
                                    │ ...                     │
                                    └─────────────────────────┘
```

**One source of truth for identity.** Neon Auth.
**One table for authorization.** `instance_grants`.
**No linking scripts.** Auth session → user ID → grant check. One hop.

## Design Decisions

### D1: Drop `facilitator_identities`

Neon Auth already stores `id`, `email`, `name`, `createdAt`. The `facilitator_identities` table adds `username`, `display_name`, `password_hash`, `auth_subject`, `status` — all redundant:
- `username` / `display_name` → Neon Auth `name`
- `email` → Neon Auth `email`
- `password_hash` → managed by Neon Auth internally
- `auth_subject` → was the bridge to Neon Auth — no longer needed when grants reference user IDs directly
- `status` → Neon Auth has its own ban/disable mechanism (`auth.admin.banUser()`)

### D2: `instance_grants` references Neon Auth user IDs directly

Change `facilitator_identity_id` → `neon_user_id` (TEXT, no FK — Neon Auth tables are in a separate schema managed by Neon).

Auth flow becomes:
```
auth.getSession() → session.user.id → instance_grants WHERE neon_user_id = user.id AND instance_id = X
```

### D3: First-user bootstrap

When a Neon Auth user signs in and the system has zero grants for the current instance, auto-grant them `owner` role. After that, only existing owners can grant access to others.

This eliminates the bootstrap script entirely. The first person to sign in after creating a Neon Auth account becomes the instance owner.

### D4: Grant management via API

Facilitator API routes for managing who has access:

| Route | Method | Purpose |
|-------|--------|---------|
| `GET /api/admin/facilitators` | GET | List facilitators with grants on the current instance |
| `POST /api/admin/facilitators` | POST | Grant a Neon Auth user access (by email) |
| `DELETE /api/admin/facilitators/[id]` | DELETE | Revoke a facilitator's grant |

Only `owner` role can manage grants. `operator` can do all workshop operations but can't add/remove other facilitators. `observer` is read-only.

### D5: Admin UI for facilitator management

A "Facilitators" section on the admin page showing:
- current facilitators with their roles
- "add facilitator" form (enter email → look up Neon Auth user → create grant)
- "revoke" button for each facilitator (owner only)

### D6: Facilitator skill for agent-driven management

A new `facilitator-skill/` (or extend `workshop-skill/`) with commands for facilitators using agents:

| Command | Purpose |
|---------|---------|
| `/workshop facilitator login` | Authenticate facilitator session via Neon Auth API (email/password → session token) |
| `/workshop facilitator status` | Show current instance, facilitators, and workshop state |
| `/workshop facilitator grant <email> <role>` | Add a facilitator to the current instance |
| `/workshop facilitator revoke <email>` | Revoke a facilitator's access |
| `/workshop facilitator instances` | List instances the facilitator has access to |
| `/workshop facilitator create-instance` | Create a new workshop instance from a template |
| `/workshop facilitator prepare` | Set instance to `prepared` state, issue event code |
| `/workshop facilitator archive` | Archive the current instance |

These commands call the same API routes that the admin UI uses.

### D7: Skill auth for agents

The workshop skill running in a CLI agent needs facilitator auth without browser cookies. Two options:

**Option A: Email/password via Neon Auth API**
The skill calls `/api/auth/sign-in/email` with the facilitator's credentials and gets back a session token. This token is stored in the skill's local config and sent as a bearer token or cookie header on subsequent API calls.

**Option B: API key per facilitator**
Add an `api_keys` table with hashed keys linked to Neon Auth user IDs. The skill stores the API key and sends it in an `Authorization: Bearer <key>` header.

**Recommendation:** Start with **Option A** — it requires no new tables, reuses Neon Auth, and the session is already short-lived and revocable. If agents need long-lived keys later, add Option B as a follow-up.

### D8: File-mode dev fallback

When `HARNESS_STORAGE_MODE=file`:
- No Neon Auth, no `neon_auth.user` table
- Keep a simplified file-based grant check: if file mode, accept any request to `/admin` (current behavior with Basic Auth was similar — sample credentials auto-accepted)
- The facilitator management UI shows "file mode — all access granted" instead of the grant management form

## What Changes

| Component | Before | After |
|-----------|--------|-------|
| Identity source | `facilitator_identities` table | `neon_auth.user` (Neon Auth) |
| Grant FK | `facilitator_identity_id` → `facilitator_identities.id` | `neon_user_id` (Neon Auth user ID, no FK) |
| Auth flow | session → `findBySubject` → identity → grant | session → `user.id` → grant (one hop) |
| Bootstrap | `scripts/link-facilitator.ts` manual linking | First sign-in auto-grants `owner` |
| Grant management | Manual DB operations | API + admin UI + agent skill |
| Facilitator info | `facilitator_identities.display_name` etc. | `neon_auth.user.name`, `neon_auth.user.email` |
| Agent access | Not supported | Skill commands via API |

## What Stays the Same

- Participant event-code access — completely unchanged
- Neon Auth session management (sign-in, sign-out, cookies) — just shipped
- Workshop state, teams, checkpoints, monitoring — unchanged
- Public template content model — unchanged

## Phased Implementation

### Phase 1: Schema migration

- Add migration: `ALTER TABLE instance_grants ADD COLUMN neon_user_id TEXT`
- Backfill `neon_user_id` from `facilitator_identities.auth_subject` for existing rows
- Add `ALTER TABLE instance_grants DROP CONSTRAINT ... facilitator_identity_id` (remove FK)
- Keep `facilitator_identity_id` column temporarily for rollback safety
- Verify: migration applies cleanly on preview branch

### Phase 2: Simplify auth service

- Rewrite `NeonAuthFacilitatorAuthService.hasValidSession()`:
  - `auth.getSession()` → `session.user.id` → `getActiveGrant(instanceId, userId)` directly
  - No more `findBySubject` → identity → grant two-hop chain
- Update `InstanceGrantRepository.getActiveGrant()` to query by `neon_user_id` instead of `facilitator_identity_id`
- Add `InstanceGrantRepository.listGrants(instanceId)` for the admin UI
- Add `InstanceGrantRepository.createGrant(instanceId, neonUserId, role)` for grant management
- Add `InstanceGrantRepository.revokeGrant(grantId)` for revocation
- Verify: sign-in → admin page works with the simplified flow

### Phase 3: First-user bootstrap

- In `hasValidSession()`: after getting session, if `getActiveGrant` returns null, check if ANY grants exist for the instance
- If zero grants exist: auto-create an `owner` grant for the current user
- If grants exist but user has none: return unauthorized (they need to be added by an owner)
- Verify: fresh instance, first sign-in auto-grants owner; second user gets denied until granted

### Phase 4: Grant management API

- `GET /api/admin/facilitators` — list grants with user info (join `instance_grants` with `neon_auth.user`)
- `POST /api/admin/facilitators` — body: `{ email, role }` → look up `neon_auth.user` by email → create grant
- `DELETE /api/admin/facilitators/[id]` — revoke grant (set `revoked_at`)
- All routes require `owner` role
- Add audit logging for grant changes
- Verify: can add/remove facilitators via API

### Phase 5: Admin UI for facilitator management

- Add "Facilitators" section to admin page
- Show table: name, email, role, granted_at
- "Add facilitator" form: email input + role dropdown (owner/operator/observer)
- "Revoke" button per facilitator (not for self)
- Owner-only visibility (operators see the list but can't modify)
- Verify: end-to-end flow via admin UI

### Phase 6: Facilitator skill commands

- Extend `workshop-skill/SKILL.md` with facilitator commands
- Create `workshop-skill/facilitator.md` with the command reference and context
- Implement skill auth: `/workshop facilitator login` calls `/api/auth/sign-in/email` and stores session
- Implement status/grant/revoke/instances commands against the API
- Add `/workshop facilitator create-instance` and `/workshop facilitator prepare` for instance lifecycle
- Verify: end-to-end agent-driven instance setup and facilitator management

### Phase 7: Cleanup

- Drop `facilitator_identities` table (migration)
- Drop `facilitator_identity_id` column from `instance_grants`
- Remove `facilitator-identity-repository.ts`
- Remove `FacilitatorIdentityRecord` and `FacilitatorIdentityRepository` from `runtime-contracts.ts`
- Remove `scripts/link-facilitator.ts`
- Update all tests
- Update ADRs and docs
- Verify: clean build, all tests pass, no references to dropped entities

## Assumptions

| Assumption | Status | Notes |
|------------|--------|-------|
| `neon_auth.user` table is queryable via SQL from the same connection | Likely | Neon Auth stores data in the same Postgres instance, `neon_auth` schema — needs verification |
| Neon Auth user lookup by email is possible via SQL | Likely | `SELECT id, name, email FROM neon_auth.user WHERE email = $1` |
| First-user bootstrap is safe for workshop context | Verified | Workshop tool, not multi-tenant SaaS — first user becoming owner is the expected case |
| Skill can authenticate via Neon Auth API programmatically | Verified | `auth.signIn.email()` returns a session, SDK supports server-side calls |

## Risk Analysis

### `neon_auth` schema access
If the `neon_auth.user` table is not directly queryable from application code, the "add facilitator by email" flow won't work as a simple SQL join.

**Mitigation:** Verify access on the live Neon instance first. Fallback: use `auth.admin.listUsers()` server SDK instead of direct SQL query.

### Concurrent first-user bootstrap
Two facilitators sign in simultaneously on a fresh instance → both get `owner`.

**Mitigation:** Use `INSERT ... ON CONFLICT` or check grant count inside a transaction. Low risk — workshop instances are created deliberately, not at scale.

### Removing `facilitator_identities` while data exists
Any existing rows linking old-style `facilitator_identity_id` grants will break.

**Mitigation:** Phase 1 backfills `neon_user_id` from `auth_subject` before any code changes. Phase 7 drops the table only after everything is migrated and verified.

## Acceptance Criteria

- [ ] Neon Auth is the single source of truth for facilitator identity — no `facilitator_identities` table
- [ ] `instance_grants` references Neon Auth user IDs directly via `neon_user_id`
- [ ] First facilitator to sign in on a fresh instance auto-gets `owner` role
- [ ] Owners can add/remove facilitators via admin UI and API
- [ ] Multiple facilitators per instance work correctly
- [ ] Workshop skill has facilitator commands for agent-driven management
- [ ] Skill can authenticate via Neon Auth email/password and manage instances
- [ ] File-mode dev still works without Neon Auth
- [ ] All linking scripts removed
- [ ] ADR and docs updated

## Out of Scope

- Participant auth changes
- OAuth/social login for facilitators (Neon Auth supports it, can enable later)
- API keys for long-lived agent auth (follow-up if needed)
- Cross-instance facilitator dashboard (facilitator sees only current instance for now)

## References

- Previous migration plan: [2026-04-06-feat-neon-auth-facilitator-migration-plan.md](./2026-04-06-feat-neon-auth-facilitator-migration-plan.md)
- Neon Auth ADR: [../adr/2026-04-06-neon-auth-for-facilitator-identity.md](../adr/2026-04-06-neon-auth-for-facilitator-identity.md)
- Schema design: [../private-workshop-instance-schema.md](../private-workshop-instance-schema.md)
- Auth model: [../private-workshop-instance-auth-model.md](../private-workshop-instance-auth-model.md)
- Workshop skill: [../../workshop-skill/SKILL.md](../../workshop-skill/SKILL.md)
- Instance runbook: [../workshop-instance-runbook.md](../workshop-instance-runbook.md)
- Neon Auth server SDK: https://neon.com/docs/auth/reference/nextjs-server
