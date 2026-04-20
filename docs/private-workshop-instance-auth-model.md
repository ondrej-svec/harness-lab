# Private Workshop-Instance Authentication, Authorization, and Threat Model

This document defines the first production security model for participant and facilitator access in Harness Lab.

## Goals

- preserve low-friction participant entry
- keep facilitator access on a separate trust plane
- make auth/session behavior testable and auditable
- support migration from a custom implementation to managed identity later if needed

## Authentication Planes

### Participant event access

- one active participant event-code version per workshop instance
- redemption creates a short-lived participant session scoped to one `instance_id`
- the participant session is transported in an HTTP-only, secure cookie
- participant sessions may read only participant-safe event context and participant-private APIs for that same instance

### Facilitator identity

- facilitators authenticate through a separate identity path
- each facilitator identity is global to the system
- authorization is granted per instance through `instance_grants`
- workspace-level instance list/create operations require an explicit global operator identity; in Neon mode this is the Neon Auth `admin` user role
- facilitator sessions must use stronger session duration and rotation rules than participant sessions

## Participant Session Rules

- event codes are stored only as hashes
- raw event codes must not be logged, echoed in traces, or embedded in client-visible configuration
- redemption returns a new session identifier; session fixation is prevented by always issuing a fresh session on successful login
- sessions expire on inactivity and on absolute age
- logout and emergency rotation revoke the backing session or access version immediately
- access to archived or reset instances is denied even if an old session cookie is presented

## Facilitator Session Rules

- facilitator credentials must be stored as hashed secrets or delegated to an external identity provider
- facilitator sessions require secure cookies, same-site protection, rotation after login and privilege change, and short absolute lifetime
- sensitive operations such as exports, archive actions, or grant changes should require recent authentication or equivalent step-up protection
- facilitator sessions are invalidated immediately when the identity or grant is disabled

## Authorization Rules

- every protected route and API must resolve the target `instance_id` before authorization
- authorization decisions are server-side only
- participant sessions may never call facilitator routes or observe facilitator-private records
- facilitator access defaults to deny when the instance grant is missing, revoked, or weaker than the requested action
- the global operator role is explicit and limited to workspace-level instance lifecycle actions plus first-owner bootstrap on empty instances

## Audit Requirements

The system must log:

- participant redemption success and failure
- facilitator login success and failure
- session revocation and expiry
- grant creation, change, and revocation
- state mutations with the acting identity and target instance
- archive/export actions
- blocked cross-instance and privilege-escalation attempts

Logs must avoid raw secrets, raw session identifiers, and full personal data where hashing or redaction is sufficient.

## Threat Model

### Session fixation

Risk:
- attacker forces a known session identifier before login and inherits the victim session after redemption

Controls:
- issue a fresh session token after every successful participant or facilitator login
- invalidate the pre-auth session context if one exists

### CSRF on authenticated mutations

Risk:
- browser carries an authenticated cookie into an attacker-controlled request

Controls:
- use same-site cookie policy appropriate to the deployment
- require CSRF tokens or an equivalent origin-check mechanism on state-changing facilitator routes
- keep participant mutations minimal and subject them to the same origin protections when cookies are used

### Credential leakage

Risk:
- facilitator password, event code, or signing keys leak through source control, logs, screenshots, or preview config

Controls:
- store secrets only in deployment configuration or secret management
- redact secrets from logs
- rotate event codes and signing keys through operational procedures
- treat preview environments as sensitive and protect them accordingly

### Guessed identifiers

Risk:
- predictable instance or session identifiers allow unauthorized access attempts

Controls:
- use non-guessable identifiers for sessions and any externally visible sensitive references
- require authorization even when identifiers are known
- rate-limit auth endpoints and log repeated failures

### Cross-instance data leakage

Risk:
- participant or facilitator requests accidentally read another event's data because the query omitted or misapplied `instance_id`

Controls:
- require `instance_id` at repository and service boundaries
- add authz tests for mismatched `instance_id`
- make audit logs capture denied cross-instance access attempts

### Admin escalation

Risk:
- participant path or low-privilege facilitator path reaches privileged actions

Controls:
- separate participant and facilitator route trees and session handling
- check role plus instance grant on every facilitator mutation
- require recent auth for high-risk operations

## Decision Review Trigger

The first implementation may stay custom only if these remain true:

- auth code stays behind clean interfaces
- tests cover the defined authn/authz behaviors
- audit logging and revocation work as designed
- the maintenance burden remains low enough that custom auth is not becoming a hidden risk

Revisit managed identity if:

- MFA, recovery, SSO, or operator lifecycle becomes materially more complex
- repeated auth bugs appear
- security review finds the custom path too fragile
