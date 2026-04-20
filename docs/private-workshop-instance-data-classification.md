# Private Workshop-Instance Data Classification

This document classifies the known Harness Lab artifacts so contributors can tell where each type of state belongs, who may access it, and how it should be handled.

## Classes

- `public`: safe for any participant or GitHub visitor before an event
- `participant-private`: visible only after participant event-code redemption for one workshop instance
- `facilitator-private`: visible only to authorized facilitators for one or more workshop instances
- `secret`: credentials or tokens that must never appear in repo content, client bundles, or normal logs
- `ephemeral-runtime`: temporary runtime state that may exist briefly in memory, cache, or short-lived jobs but should not become durable application data unless explicitly persisted

## Classification Matrix

| Artifact | Class | System of record | Allowed readers | Notes |
|----------|-------|------------------|-----------------|-------|
| Dashboard code in `dashboard/` | public | public repo | everyone | Must use fictional/sample data only |
| Participant skill in `workshop-skill/` | public | public repo | everyone | Runtime auth paths may reference private APIs but cannot embed real secrets |
| Public workshop framing, agenda shape, challenge cards, reference sheets | public | public repo | everyone | Participant-facing content remains Czech where applicable |
| Demo fixtures and fictional workshop metadata | public | public repo | everyone | Must be clearly named as demo/sample |
| Real workshop instance metadata (`date`, `venue`, `room`, instance status) | participant-private or facilitator-private | private runtime | participants for participant-safe fields, facilitators for full record | Participant surfaces should receive only the subset needed for the live event |
| Participant event code hash and expiry | secret | private runtime or secret manager | server-side only | Never log raw codes |
| Participant sessions | participant-private | private runtime | scoped server-side access only | Session IDs/tokens are secrets |
| Team list and team assignments for a live event | participant-private | private runtime | participants of that instance, facilitators | May become public later only through explicit post-event publishing |
| Team repo URLs for a live event | participant-private | private runtime | participants of that instance, facilitators | Do not commit live registry to repo |
| Checkpoints and sprint updates | participant-private | private runtime | participants of that instance, facilitators | Archived copies remain private by default |
| Monitoring snapshots and agent scan output | facilitator-private | private runtime | authorized facilitators | Never expose on participant routes |
| Facilitator notes, incident notes, ops commentary | facilitator-private | private runtime or private ops workspace | authorized facilitators | Use the private ops workspace only for non-product logistics or planning |
| Facilitator identities and instance grants | facilitator-private | private runtime | authorized facilitators and auth services | Identity credentials themselves are secrets |
| Participant Neon Auth accounts (`neon_auth.user` rows with `role="participant"`) | participant-private | Neon Auth managed | server-side via control-plane API only | Created by `lib/auth/admin-create-user.ts` using `NEON_API_KEY`. Public signup is permanently disabled at the Neon Auth instance. Password hashes live in `neon_auth.account` and are managed by better-auth — application code never reads them. See ADR `2026-04-19-name-first-identify-with-neon-auth.md`. |
| `NEON_API_KEY` (control-plane credential) | secret | secret manager / Vercel env | server-side only | Project-wide scope (auth + database + branches). Rotate periodically. Required for participant account creation in Neon mode. |
| Database URLs, auth signing keys, Vercel secrets | secret | secret manager / deployment config | server-side only | Must not appear in tracked files or preview logs |
| Rate-limit counters, CSRF nonces, transient request context | ephemeral-runtime | runtime memory/cache | server-side only | Persist only when needed for audit or abuse controls |
| Archived workshop exports | facilitator-private | private runtime archival store | authorized facilitators | Retention policy applies |

## Handling Rules

- Anything needed to run a real workshop but unsafe to expose before the event belongs in the private runtime layer unless it is pure facilitator logistics, in which case it may live in a separate private ops workspace.
- Any new artifact that mixes public and private fields must be split into explicit public and private views instead of using a single ambiguous record.
- Secrets must be stored only in deployment configuration or dedicated secret storage and should be redacted from logs, traces, screenshots, and support exports.
- Demo data must use names like `sample`, `demo`, or `fictional` so contributors do not confuse it with real operations.
- Archived event data remains private by default; publishing any subset later requires a deliberate export/sanitization step.
