# Continuation Shift Eval — Design

> Design document for Stream D of the expert audit remediation plan
> (`docs/plans/2026-04-09-feat-expert-audit-remediation-plan.md`).
> Companion ADR: `docs/adr/2026-04-09-continuation-shift-as-eval.md`.

## Problem

The continuation shift at midday — when a fresh afternoon team inherits the
morning team's work cold, with no verbal rescue — is the workshop's strongest
pedagogical idea. But today it is purely experiential. The expert audit
called this out: the workshop produces anecdotes about whether the handoff
worked, not evidence.

Specifically missing:

- which repo artifacts the receiving team actually touched before their
  first edit (and which ones they ignored)
- how long it took each receiving team to reach a productive state
- which friction patterns recur across cohorts ("where is the plan?",
  "this test references a file that doesn't exist", "the `AGENTS.md`
  contradicts the runbook")
- qualitative observations from facilitators walking the room during the
  shift

Without these signals, the blueprint cannot learn from cohort N before
running cohort N+1. The workshop teaches continuation-quality discipline
but does not practice it on its own feedback loop.

## Goal

Turn the continuation shift into an eval harness for handoff quality.
Produce durable, queryable signals that:

1. Inform the facilitator of patterns during the current cohort (fast
   loop).
2. Inform the maintainer of patterns across cohorts (slow loop, fed into
   blueprint updates via ADRs and plan updates).
3. Never feel like homework during the workshop itself. Capture must be
   opt-in and fast.

## Non-goals

- **Automated artifact-touch detection.** Would require git hooks or file
  watchers inside participant repos. Defer to a later cohort.
- **Rubric for interpreting signals.** The first cohort produces raw
  data; the rubric comes after we have >5 real signals to pattern-match
  against. Tracked as a task in the D2 ADR's "Consequences" section.
- **Statistical dashboards.** The learnings log is line-delimited JSON
  and can be analyzed with `jq`, Python, or a notebook. A dashboard view
  is a future cohort concern.
- **Receiving-team self-capture from the participant surface.** v1 is
  facilitator-only to keep the auth and UI surface small. Revisit in
  Phase E3 dogfooding.
- **Migration of any pre-existing facilitator notes.** There are none in
  a structured form today; nothing to migrate.
- **Gating phase progression on signal capture.** Capture is optional.
  The phase advances on the facilitator's schedule regardless.

## Data shape

One type, intentionally loose, stored twice (instance-local + cross-cohort).

```ts
type RotationSignal = {
  id: string;                    // uuid v4
  instanceId: string;            // workshop instance this signal belongs to
  capturedAt: string;            // ISO8601, server time
  capturedBy: "facilitator" | "participant" | "auto";
  teamId?: string;               // receiving team, optional
  tags: string[];                // free-text, e.g. ["agents_md_helped",
                                 //   "missing_runbook", "plan_out_of_date"]
  freeText: string;              // the actual observation, the primary field
  artifactPaths?: string[];      // repo paths the receiving team touched
                                 //   before their first edit, if known
};
```

**Why the schema is this loose:** the workshop has never captured
rotation signals before. We do not know yet which fields matter. A tight
schema would freeze assumptions before we have evidence. The rubric
(Phase E3) formalizes tag vocabulary once we can pattern-match against
real data. Until then, every field except `id`, `instanceId`,
`capturedAt`, `capturedBy`, and `freeText` is optional.

## Persistence — two tiers

### Tier 1: instance-local store

Path (file mode):
`$HARNESS_DATA_DIR/<instanceId>/rotation-signals.json`

Shape:

```json
{
  "version": 1,
  "signals": [
    { "id": "...", "instanceId": "...", "capturedAt": "...", ... }
  ]
}
```

**Rules:**

- Lives inside the private workshop instance layer per
  `docs/public-private-taxonomy.md` and
  `docs/private-workshop-instance-data-classification.md`.
- Classification: **facilitator-private** (same class as facilitator
  monitoring notes). Not visible to the participant surface in v1.
- Deleted when the instance is deleted. This is expected — once an
  instance is torn down, the useful signals have already been flushed
  to the cross-cohort learnings log.
- Atomic rename write pattern (same as `MonitoringSnapshotRepository`
  and `AuditLogRepository`) so a crash during write cannot corrupt the
  file.

### Tier 2: cross-cohort learnings log

Path (file mode):
`$HARNESS_DATA_DIR/learnings-log.jsonl`

Format: line-delimited JSON. Each line is one signal plus a small
wrapper with cohort metadata:

```json
{"cohort":"2026-Q2","instanceId":"...","signal":{"id":"...","capturedAt":"...","tags":[...],"freeText":"...","teamId":"..."},"loggedAt":"..."}
```

**Rules:**

- **Lives outside any instance directory.** This is the load-bearing
  detail. If the learnings log lived under an instance path, it would
  die with the instance and defeat the whole point. Placing it at the
  root of `$HARNESS_DATA_DIR` makes it survive instance teardown,
  makes it trivially queryable with `jq`, and makes it the obvious
  file to read into a notebook for retrospective analysis.
- **Append-only.** Never edit or delete lines; corrections are new
  lines with a `supersedes` pointer. This gives us an audit trail for
  how our understanding of a cohort's signals evolves.
- **No version gate.** Readers tolerate unknown fields; schema can
  grow without breaking historical lines.

### Neon mode

For parity with other repositories, Neon mode uses two Postgres tables:

- `rotation_signals` — instance-scoped rows, mirrors the instance-local
  JSON file. Columns: `id uuid pk`, `instance_id text`, `captured_at
  timestamptz`, `captured_by text`, `team_id text nullable`, `tags
  jsonb`, `free_text text`, `artifact_paths jsonb nullable`.
- `learnings_log` — cross-cohort append-only table. Columns: `id
  bigserial pk`, `cohort text`, `instance_id text`, `logged_at
  timestamptz`, `signal jsonb`. No updates or deletes; inserts only.

Selection between file mode and Neon mode uses `HARNESS_STORAGE_MODE`
like every other repository in the dashboard.

## API

One new endpoint, following the `/api/rotation` route pattern at
`dashboard/app/api/rotation/route.ts:11-28`.

### `POST /api/rotation-signals`

**Auth:** `requireFacilitatorRequest()`. Facilitator-only in v1.

**Request body:**

```ts
{
  instanceId: string;    // optional if a current instance is selected
                         // in the facilitator session; required otherwise
  teamId?: string;
  tags: string[];        // at least one OR non-empty freeText
  freeText: string;
  artifactPaths?: string[];
}
```

**Response:** `{ ok: true, signal: RotationSignal }`

**Side effects:**

1. Generate `id` (uuid v4), `capturedAt` (server now), `capturedBy`
   ("facilitator" in v1).
2. Append to the instance-local store via
   `RotationSignalRepository.append(instanceId, signal)`.
3. Append to the learnings log via
   `LearningsLogRepository.append({ cohort, instanceId, signal })`.
   `cohort` is derived from `instanceId` metadata or
   `WorkshopMeta.cohort` if set; else falls back to the ISO year-quarter
   of `capturedAt`.
4. Return the persisted signal.

### `GET /api/rotation-signals?instanceId=<id>`

**Auth:** `requireFacilitatorRequest()`.

**Response:**

```ts
{
  ok: true,
  signals: RotationSignal[]   // ordered by capturedAt ascending
}
```

Used by the facilitator UI to re-render the capture panel when the page
reloads mid-workshop.

## Repository layer

Two new files, matching the structure of `checkpoint-repository.ts` and
`monitoring-snapshot-repository.ts`:

- **`dashboard/lib/rotation-signal-repository.ts`** — defines the
  `RotationSignalRepository` interface, exports the runtime selector
  `getRotationSignalRepository()` that dispatches on
  `HARNESS_STORAGE_MODE`, and provides the `FileRotationSignalRepository`
  implementation.
- **`dashboard/lib/rotation-signal-repository.neon.ts`** — provides the
  `NeonRotationSignalRepository` implementation. Lazy-imported from the
  runtime selector so file-mode installs do not pay the Neon client
  cost.

Same two-file split for the learnings log:

- **`dashboard/lib/learnings-log-repository.ts`** — interface + file
  impl.
- **`dashboard/lib/learnings-log-repository.neon.ts`** — Neon impl.

Interface sketch (both repositories):

```ts
interface RotationSignalRepository {
  append(instanceId: string, signal: RotationSignal): Promise<void>;
  list(instanceId: string): Promise<RotationSignal[]>;
}

interface LearningsLogRepository {
  append(entry: LearningsLogEntry): Promise<void>;
  // No list method in v1. Read via `jq` or the filesystem / SQL directly
  // until we have a real use case for a listing endpoint.
}
```

## Store façade

One addition to `dashboard/lib/workshop-store.ts`:

```ts
export async function captureRotationSignal(
  input: RotationSignalInput,
  instanceId: string,
): Promise<RotationSignal> {
  const signal = materializeSignal(input);  // fills id, capturedAt, capturedBy
  await getRotationSignalRepository().append(instanceId, signal);
  await getLearningsLogRepository().append({
    cohort: resolveCohort(instanceId, signal.capturedAt),
    instanceId,
    signal,
    loggedAt: signal.capturedAt,
  });
  return signal;
}

export async function listRotationSignals(
  instanceId: string,
): Promise<RotationSignal[]> {
  return getRotationSignalRepository().list(instanceId);
}
```

**Important:** `captureRotationSignal` does NOT call `updateWorkshopState`.
Rotation signals are orthogonal to `WorkshopState` — they live in their
own repositories. This keeps the signal stream from inflating the hot
path of state reads and avoids a write-amplification on every signal.

## UI — minimal capture panel

Extend the existing `HandoffMomentCard` component in
`dashboard/app/admin/instances/[id]/page.tsx:2045-2096`.

Behavior:

- Panel is visible only when the rotation phase is `current` or recently
  `done` (within the current workshop session).
- Panel is collapsed by default. A header button reads `Capture signal
  (N)` where N is the count of signals already captured for this
  instance.
- Expanded panel contains:
  - a `<textarea>` for `freeText` (required, the primary field)
  - a tag input that accepts free-text chips (0..N tags)
  - an optional team selector (dropdown of team IDs from
    `state.teams`)
  - a `Save signal` button (primary) and a `Cancel` button
- After save: the panel collapses, the counter increments, and a small
  toast confirms the save. No modal, no navigation.
- Below the capture form: a read-only list of the last three signals
  captured for this instance, sorted newest first. Each row shows
  `capturedAt` (relative time), team (if any), the first 80 characters
  of `freeText`, and tags as chips.

**No new component file.** The panel lives inline in
`HandoffMomentCard` because it is tightly bound to the rotation phase
visibility logic already there (`isHandoffAgendaItem`, `handoffIsLive`).

## Test plan

- **Unit tests for `rotation-signal-repository.ts` (file impl)**
  - appends to empty store
  - appends to existing store without overwriting prior signals
  - list returns signals in `capturedAt` ascending order
  - atomic rename survives simulated crash (write fails mid-write,
    next read returns the previous valid state)
- **Unit tests for `learnings-log-repository.ts` (file impl)**
  - appends line to empty log
  - appends line to existing log without rewriting prior lines
  - tolerates unknown fields in historical lines (forward compat)
- **API tests for `/api/rotation-signals`**
  - POST requires facilitator auth (401 without)
  - POST with valid body writes to both tiers
  - POST with empty `freeText` and empty `tags` returns 400
  - POST with unknown `instanceId` returns 404
  - GET returns empty array for an instance with no signals
  - GET returns persisted signals in order
- **Store façade test**
  - `captureRotationSignal` calls both repositories
  - if the instance-local write succeeds but the learnings log write
    fails, the error is surfaced (no silent partial success)
- **UI test for `HandoffMomentCard`** (Playwright, existing harness)
  - capture panel is hidden before the rotation phase starts
  - capture panel appears when phase becomes `rotation`
  - submitting a signal updates the count
  - the signal appears in the read-only list after save
- **No change to existing tests.** If anything breaks, fix it before
  shipping.

## Success criteria

- Facilitator can capture at least one signal during a live rotation
  phase without leaving the `HandoffMomentCard` view.
- Both the instance-local file and the learnings log file exist and
  contain matching data after one captured signal.
- `rm -rf $HARNESS_DATA_DIR/<instanceId>` deletes the instance-local
  file but leaves the learnings log untouched.
- A Python one-liner or `jq` can read the learnings log and print all
  signals tagged `missing_runbook` across all cohorts in the log.
- 49/49 existing tests still green. New tests for the signal
  repositories, the API route, and the store façade bring the count to
  ~60.

## Rollout

1. D1 (this doc) — write.
2. D2 (ADR) — write.
3. **Stop. Check in with the maintainer.** No code until the written
   design is approved.
4. Repository layer (file impls first, then Neon).
5. Store façade.
6. API route.
7. UI extension.
8. Tests throughout, not only at the end.
9. Sync + verify + full test run before commit.
10. Commit + push. No deploy is required by the code itself; the
    dashboard picks it up on next deploy. If the deploy is triggered
    for unrelated reasons, smoke-test the rotation capture panel in
    the first live cohort after deploy.

## Open questions (surfaced deliberately for the ADR)

1. **Cohort identifier source.** `resolveCohort()` derives the cohort
   from `WorkshopMeta.cohort` if set, else falls back to the ISO
   year-quarter of `capturedAt`. Should we require cohort to be set
   explicitly on each instance to avoid the fallback? The fallback is
   deterministic but fuzzy across New Year or quarter boundaries.
2. **Learnings log rotation.** The log is append-only and will grow
   without bound. Do we want a rotation policy (annual, quarterly, or
   size-based)? Deferred; not a concern until the log exceeds ~10 MB,
   which is years away at expected signal volumes.
3. **Retention vs. privacy.** The learnings log contains
   facilitator-private notes that may name teams or patterns from
   specific cohorts. If the data volume hosts multiple customers in
   the future, the log needs a customer-scope field and a per-customer
   read gate. Not a concern in v1 (single-tenant Neon).

These three questions become "consequences" in the ADR, not blockers
for shipping v1.
