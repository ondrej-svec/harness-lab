# Participant Management API Sketch — 2026-04-16

Reviewer-facing preview for the endpoints introduced by `docs/plans/2026-04-16-feat-participant-management-and-team-formation-plan.md`. Not runtime truth. Final shapes may adjust during Phase 2, but auth boundaries and classifications are fixed.

## Auth model summary

Three zones:

- **Public (no auth)** — nothing new; existing `/api/event-access/redeem` stays public.
- **Participant-gated** — session cookie `harness_event_session` required; endpoint acts on the session's own instance only.
- **Facilitator-gated** — `instance_grants` check via Better-Auth / Neon Auth; role `owner | operator | observer`. `observer` is read-only.

All new participant-gated and facilitator-gated endpoints preserve the existing guards from `dashboard/app/api/event-access/redeem/route.ts`: botid check, trusted-origin check, rate-limit where a write is involved.

## Endpoints

### 1. `POST /api/event-access/redeem` — extended (public)

Existing endpoint. Extended to accept optional `displayName`.

**Request:**

```jsonc
{
  "eventCode": "amber4-canvas3-north7",
  "displayName": "Ada Lovelace"   // NEW, optional, 1..80 chars
}
```

**Response (200, name provided):**

```jsonc
{
  "ok": true,
  "instanceId": "sample-studio-a",
  "expiresAt": "2026-04-23T20:00:00.000Z",
  "participantId": "p_01HZ..."     // NEW when name was provided
}
```

**Response (200, no name):** unchanged from current behavior — no `participantId`.

**Errors:** `401 { ok: false, error: "invalid_code" | "expired" | "revoked" }`, `429 rate_limited`, `400 invalid_display_name`.

**Behavior:** if `displayName` is present and non-empty, create a `Participant` row and bind the session via `session.participant_id`. Idempotent within a session cookie lifetime — resubmitting the same display name returns the same `participantId`. Display name is trimmed; leading/trailing whitespace stripped.

### 2. `POST /api/event-access/identify` — new (participant-gated)

For sessions that redeemed without a name and now want to self-identify.

**Request:**

```jsonc
{ "displayName": "Ada Lovelace" }
```

**Response (200):**

```jsonc
{
  "ok": true,
  "participantId": "p_01HZ..."
}
```

**Errors:** `401 { ok: false, error: "no_session" }`, `409 { ok: false, error: "already_bound" }`, `400 invalid_display_name`.

**Behavior:** reads session from cookie, creates a `Participant` if the session has none bound, and writes `session.participant_id`. Does not allow rebinding — a session with an existing `participant_id` returns `409`.

### 3. `GET /api/admin/participants?instanceId=…` — new (facilitator-gated)

List pool + assignment state for one instance.

**Response (200):**

```jsonc
{
  "ok": true,
  "pool": [
    {
      "id": "p_01HZ...",
      "displayName": "Ada Lovelace",
      "email": null,
      "emailOptIn": false,
      "tag": "senior",
      "archivedAt": null
    }
    // …
  ],
  "assignments": [
    { "teamId": "t1", "participantId": "p_01HZ..." }
    // …
  ]
}
```

**Errors:** `401 unauthorized`, `403 forbidden_role`, `404 instance_not_found`.

### 4. `POST /api/admin/participants` — new (facilitator-gated, owner|operator)

Smart paste intake. Accepts entries with required `displayName`, optional `email`, optional `tag`. UI auto-parses the paste textarea (name / name, email / name, email, tag) into this shape client-side before posting — see mockup preview table.

**Request:**

```jsonc
{
  "instanceId": "sample-studio-a",
  "entries": [
    { "displayName": "Ada Lovelace" },
    { "displayName": "Linus Torvalds", "email": "linus@example.com" },
    { "displayName": "Grace Hopper", "email": "grace@example.com", "tag": "senior" }
  ]
}
```

**Response (200):**

```jsonc
{
  "ok": true,
  "created": [
    { "id": "p_01HZ...A", "displayName": "Ada Lovelace", "email": null, "emailOptIn": false, "tag": null },
    { "id": "p_01HZ...B", "displayName": "Linus Torvalds", "email": "linus@example.com", "emailOptIn": false, "tag": null },
    { "id": "p_01HZ...C", "displayName": "Grace Hopper", "email": "grace@example.com", "emailOptIn": false, "tag": "senior" }
  ],
  "skipped": [
    { "input": { "displayName": "Ada Lovelace" }, "reason": "duplicate" },
    { "input": { "displayName": "x", "email": "not-an-email" }, "reason": "invalid_email" }
  ]
}
```

**Errors:** `400 invalid_input` (entries array empty, all entries invalid), `401`, `403`, `429`.

**Behavior:**
- Trim + dedupe input by `displayName` (case-insensitive) against the existing pool in the same instance.
- `email` is validated with a soft format check; failed rows are skipped, not rejected — other rows proceed.
- **`emailOptIn` always defaults to `false` on paste intake.** Pasting an email never implies consent. The facilitator flips consent per-row via `PATCH` after gathering it, or the participant opts in themselves (Phase 7).
- `tag` is free-text; no controlled vocabulary. Convention labels (`senior`, `mid`, `junior`) are UI suggestions only.
- Return per-entry success/skip so the UI can surface inline feedback beside each preview row.

**Parser hint (client-side, non-normative):** the paste textarea accepts these shapes per line, separators `,` `\t` `;`:

| Line | Parsed |
|---|---|
| `Ada Lovelace` | `{ displayName: "Ada Lovelace" }` |
| `Linus, linus@example.com` | `{ displayName: "Linus", email: "linus@example.com" }` |
| `Grace,grace@example.com,senior` | `{ displayName: "Grace", email: "grace@example.com", tag: "senior" }` |
| `Alan Kay, senior` | `{ displayName: "Alan Kay", tag: "senior" }` — email-shaped detection: if the second column has `@`, treat as email; else treat as tag |
| `Name,Email,Tag` (first row, header-ish) | Skipped if all three cells are header-like strings; otherwise treated as data |

Header-row detection is optional; facilitators typically paste without headers. If unsure, show the parse in the preview and let the facilitator remove the header manually.

### 5. `PATCH /api/admin/participants/:id` — new (facilitator-gated, owner|operator)

Update fields on one participant. Only provided keys are updated.

**Request:**

```jsonc
{
  "displayName": "Ada Lovelace",   // optional
  "email": "ada@example.com",       // optional; set null to clear
  "emailOptIn": true,               // optional; consent checkbox state
  "tag": "senior"                   // optional; set null to clear
}
```

**Response (200):** updated record shape (same as pool entry above).

**Errors:** `400 invalid_email | empty_display_name`, `401`, `403`, `404 not_found`, `409 email_opt_in_without_email` (cannot set `emailOptIn: true` while `email` is null).

### 6. `DELETE /api/admin/participants/:id` — new (facilitator-gated, owner|operator)

Soft-delete. Sets `archived_at`, nulls `session.participant_id` for any bound session, removes `team_members` row.

**Response (200):** `{ ok: true }`.

**Errors:** `401`, `403`, `404 not_found`.

### 7. `POST /api/admin/team-members` — new (facilitator-gated, owner|operator)

Assign a participant to a team.

**Request:**

```jsonc
{
  "instanceId": "sample-studio-a",
  "participantId": "p_01HZ...",
  "teamId": "t1"
}
```

**Response (200):** `{ "ok": true, "teamId": "t1", "participantId": "p_01HZ..." }`.

**Errors:** `400 team_not_in_instance | participant_archived`, `401`, `403`, `404`, `409 already_assigned` (unique on `participant_id` — moving is a separate call; see note below).

**Behavior:** `UNIQUE(participant_id)` is the invariant — a participant belongs to exactly one team per instance. To move, call `DELETE` first or use the idempotent `assign-or-move` variant below.

### 8. `PUT /api/admin/team-members` — new (facilitator-gated, owner|operator)

Assign-or-move. Preferred for the UI "drag from team A to team B" case.

**Request:** same as POST.

**Response (200):** `{ "ok": true, "teamId": "t1", "participantId": "p_01HZ...", "movedFrom": "t2" | null }`.

### 9. `DELETE /api/admin/team-members` — new (facilitator-gated, owner|operator)

Unassign.

**Request body:** `{ "instanceId": "…", "participantId": "…" }`.

**Response (200):** `{ ok: true }`.

### 10. `POST /api/admin/team-formation/randomize` — new (facilitator-gated, owner|operator)

Cross-level distribution.

**Request:**

```jsonc
{
  "instanceId": "sample-studio-a",
  "teamCount": 3,
  "strategy": "cross-level",   // or "random"
  "tagField": "tag",            // optional; defaults to "tag"
  "createMissingTeams": true    // optional; if N > existing team count, create
}
```

**Response (200):**

```jsonc
{
  "ok": true,
  "preview": false,
  "assignments": [
    { "participantId": "p_...A", "teamId": "t1" },
    { "participantId": "p_...B", "teamId": "t2" }
    // …
  ],
  "tagDistribution": {
    "t1": { "senior": 1, "junior": 2, "mid": 1, "untagged": 0 },
    "t2": { "senior": 1, "junior": 1, "mid": 2, "untagged": 0 }
  }
}
```

**Preview mode:** pass `?preview=true` (or `"preview": true` in body) to compute without writing. Returns the same shape with `"preview": true`. UI uses this before the confirm modal.

**Errors:** `400 team_count_invalid | no_participants`, `401`, `403`, `409 pool_already_fully_assigned` (nothing to distribute).

### 11. `POST /api/admin/participants/export-emails` — POST-EVENT (Phase 7)

Returns CSV of opted-in `(display_name, email)` for the instance. Not in the pre-04-23 scope — documented here so the full contract is reviewable now.

---

## Denormalized projection contract

Every write that touches `team_members` (endpoints 7, 8, 9, 10) MUST update `teams.payload.members: string[]` in the same transaction (Neon) or file update (file-mode). The projection is derived as `SELECT display_name FROM participants JOIN team_members USING (participant_id) WHERE team_members.team_id = $1`. Order: insertion order of team_members rows.

Existing clients (`GET /api/event-context/teams`, `GET /api/teams`) are not affected — they keep reading `teams.payload.members` as they do today.

A drift-detection test runs at the end of the repository test suite and compares the projection against the join source. Drift fails the build.

## Rate limits

- `POST /api/event-access/redeem`: existing limits unchanged.
- `POST /api/event-access/identify`: same bucket as redeem (identical botid + origin guards, per-fingerprint rate limit).
- `POST /api/admin/participants`: 30 calls / minute / facilitator session. Paste-list with 50 names counts as 1 call, not 50.
- `POST/PUT/DELETE /api/admin/team-members`: 120 calls / minute / facilitator session (drag-assign can be chatty).
- `POST /api/admin/team-formation/randomize`: 10 calls / minute / facilitator session.

## Classification

All endpoint responses containing `displayName`, `email`, or `tag` are participant-private per `docs/private-workshop-instance-data-classification.md`. Logs must not include these fields. Alert payloads must not include these fields. `participantId` is safe to log (opaque identifier).

## Open contract questions

Resolve during Phase 2 implementation; do not block Phase 0 sign-off:

1. Should `GET /api/admin/participants` paginate? v1 answer: no — we don't expect > 100 per event. Revisit if we ever do.
2. Does the participant-gated `/api/event-context/core` bundle include the logged-in participant's own name? Likely yes, for header display. Confirm in Phase 4.
3. If the CLI refactor plan (2026-04-10) adds a `role` field to sessions, where exactly does `participant_id` sit relative to it? Task 2.13 in the plan handles this.

## Success shape for review

This sketch is signed off if the reviewer can answer "yes" to:

- The auth zones are correct (no facilitator operation leaks to participant, no PII leaks to unauthed).
- The soft-binding model respects the 2026-04-06 access-model ADR.
- The `UNIQUE(participant_id)` invariant is the right shape for v1 (one participant, one team).
- The denormalized-projection contract is unambiguous.
- The opt-in/consent shape is separable from display-name collection.

If any of those is "no," return to planning instead of adjusting in Phase 2.
