# ADR 2026-04-06: Private Workshop-Instance Auth Boundary

## Status

Accepted

## Context

Harness Lab already distinguishes participant event access from facilitator-only operations, but the production auth boundary needs to be stated more tightly so storage design, API design, and release checks all follow the same model.

The system must support:

- public participant entry with low friction
- short-lived participant sessions tied to one workshop instance
- facilitator identities that can operate across multiple workshop instances without credential sprawl
- explicit authorization boundaries for participant-private and facilitator-private APIs
- auditability for privileged actions and cross-instance access attempts

## Decision

Harness Lab will use two separate authentication planes:

- participant event access
- facilitator identity and grants

Participant access rules:

- the participant dashboard remains public until private instance context is requested
- each workshop instance has one active participant event code at a time
- event-code redemption issues a short-lived participant session scoped to a single `instance_id`
- participant sessions may read only participant-safe instance context and may never unlock facilitator routes or mutations
- participant sessions are renewable by re-entering the current event code and revocable by invalidating the underlying grant or session

Facilitator access rules:

- facilitators authenticate through a separate identity path
- facilitator identities are global to the system, not re-created per event
- each facilitator action requires an `instance_grant` or a global operator role that explicitly authorizes the target action
- in hosted Neon mode, the Neon Auth `admin` user role is the global operator role for workspace-level instance list/create operations and for first-owner bootstrap on an empty instance
- facilitator APIs and admin routes must default-deny when the requested `instance_id` is absent, mismatched, archived, or unauthorized

Enforcement rules:

- authorization happens server-side on every protected read and mutation
- audit logs are required for login success and failure, session issuance and revocation, grant changes, exports, archive operations, and privileged state mutations
- repository code must keep authn/authz behind explicit interfaces so identity implementation can change later without rewriting the application boundary

## Consequences

- participant convenience is preserved without collapsing participant and facilitator trust boundaries
- multi-instance operations remain manageable because facilitator identities are reused while grants stay per instance
- the implementation must specify session rotation, expiry, revocation, CSRF posture, and secure cookie policy before production use
- custom auth remains possible initially, but only behind a seam that permits migration to managed identity if security or maintenance pressure demands it
