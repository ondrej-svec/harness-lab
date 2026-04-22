# Harness Lab — Architecture Review

**Date:** 2026-04-22
**Author:** Heart of Gold (Opus 4.7)
**Repo:** `harness-lab` (full monorepo)
**Audience:** Ondrej (sole developer + AI agents), post-Brno hardening, future handoff
**Supersedes:** `docs/2026-04-06-private-workshop-instance-architecture-review.md` (Codex),
`docs/2026-04-08-harness-lab-architecture-review.md` + companion (HoG Opus 4.6)

---

## Architecture Decision Records

Seven decisions taken during this review. Each is actionable in the Execution
Order below.

| # | ADR | Decision | Rationale |
|---|-----|----------|-----------|
| 1 | JSONB drift prevention | Zod schemas at every repo boundary | Incident 04-20 and the 04-21→04-22 `allow_quote_by_name` split-brain both match the same pattern: JSONB column, no read-time normalizer, new field becomes required. Zod makes drift a parse error + normalized default, not a crash. |
| 2 | Live-event safety | `/api/health` + UptimeRobot + `HARNESS_WORKSHOP_ACTIVE` deploy-freeze env var | Three problems with one minimum-viable stack. No paid services. Covers silent outage, mid-workshop auto-deploy, and missing monitor. |
| 3 | PII lifecycle (GDPR Art. 17/20) | Facilitator-initiated per-participant export + hard-delete | Workshop-scale: maybe 1-2 data-subject requests/year. Building self-service portal is overkill. Export + hard-delete endpoints are bounded, auditable, and sufficient. |
| 4 | Password reset secret transport | One-time ephemeral reset code + force-change-on-login + atomic account recovery | Fixes two linked issues: plaintext-password-in-JSON exposure and the 2-step Neon Auth user creation orphan class. |
| 5 | Performance priorities | Fix all three hot paths (poll submit, replaceParticipants/Teams N+1, participant polling fingerprint) | User note: Brno has ended; doing perf work now as no-pressure optimization. Cuts live-workshop Neon load by ~4× at 50 concurrent. |
| 6 | Self-hosting hardening | Remove author Neon IDs from `.env.example` + fail-loud in test scripts when env missing + expand `self-hosting.md` §4 + env-matrix | Runtime path is clean (`admin-create-user.ts:54-60` returns `missing_credentials` when env absent), but `.env.example:45-46` and test/CI scripts (`create-test-branch.mjs:20`, `delete-test-branch.mjs:19`, `playwright.neon.config.ts:52,54`, `e2e/neon-mode/fixtures.ts:59,62`) hardcode the author's Neon IDs. Plus 5 undocumented required vars. One slice closes all three. |
| 7 | Migration rollback policy | Forward-only with expand→contract discipline | Zero of 21 migrations have DOWN sections; most are structurally irreversible already. Formalize the current reality with a written policy. |

---

## Executive Summary

Harness Lab is more architecturally coherent today than at the 2026-04-08 review.
The follow-up on that review landed: security headers, Neon-mode fail-closed,
optimistic locking, retryable 409 conflict responses, and the global error
boundary are all in the code. The `HARNESS_WORKSHOP_INSTANCE_ID` singleton
retirement on 2026-04-20 removed a whole class of cross-instance bug. The
2026-04-20 facilitator-admin incident (`docs/solutions/infrastructure/
facilitator-admin-production-state-and-schema-drift.md`) was handled well in
the moment, and the runtime-state normalizer pattern is now being used.

**But the same structural incident class is still live.** Three instance-level
JSONB columns added since 2026-04-08 — `feedback_form`, `reference_groups`,
`participant_copy` — have no read-time normalizer. If any field in those
shapes becomes required, old rows will crash again. The 04-22
`allow_quote_by_name` split-brain was this pattern caught before production.
The next one may not be.

**5 Key Findings:**

| # | Finding | Severity | ADR |
|---|---------|----------|-----|
| 1 | Instance-level JSONB columns (`feedback_form`, `reference_groups`, `participant_copy`) have no read-time normalizer — drift incident class not closed | **High** | ADR 1 |
| 2 | 5 env vars required in Neon mode but undocumented in `self-hosting.md` (`HARNESS_EVENT_CODE_SECRET`, `NEON_API_KEY`, `HARNESS_NEON_PROJECT_ID`, `HARNESS_NEON_BRANCH_ID`, `BLOB_READ_WRITE_TOKEN`); `.env.example:45-46` shows commented-out author Neon IDs that a self-hoster could uncomment verbatim; test/CI scripts hardcode author IDs as fallback | **High** | ADR 6 |
| 3 | No `/api/health`, no error monitoring, no mid-workshop deploy freeze — relied on human vigilance during Brno | **Medium** | ADR 2 |
| 4 | 2-step Neon Auth user creation (`participant-auth.ts:120-160`) is not atomic; admin reset-password returns plaintext in JSON response (`reset-password/route.ts:98`) | **Medium** | ADR 4 |
| 5 | Poll submit = 15 Neon queries per submit; `replaceParticipants` serial N+1 (51 calls for 50 participants) — live-event fan-out higher than necessary | **Medium** | ADR 5 |

**What's working well:**

- Auth enforcement on every API route is solid. Participant identity is
  session-instance-scoped; cross-instance reads require valid grants.
- Optimistic locking on `workshop_state` is wired end-to-end and used in
  every facilitator mutation path.
- The runtime-state normalizer pattern (added in response to the 2026-04-20
  incident) correctly tolerates missing `rotation` and missing
  `participantCheckIns` fields.
- CI covers unit tests, Playwright E2E, Semgrep SAST, gitleaks, npm audit,
  CodeQL, OpenSSF Scorecard, and dependency review.
- Migrations apply at Vercel build-time (`vercel.json:3`) — schema-before-code
  gate is structurally correct.
- No raw SQL interpolation, no `dangerouslySetInnerHTML`, `rehype-sanitize`
  wired on every markdown path, `botid` active on redeem.
- Cookies: httpOnly + sameSite + conditional `secure` on both participant
  and facilitator sessions.

---

## Current Architecture

### Tech Stack (verified 2026-04-22 against `dashboard/package.json`)

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js (App Router) | ^16.2.3 |
| UI | React | ^19.2.4 |
| Language | TypeScript (strict) | ^6.0.2 |
| Runtime | Node.js | 22.x |
| Database | Neon Postgres (serverless HTTP driver) | `@neondatabase/serverless` ^1.0.2 |
| Auth | Neon Auth (managed) | `@neondatabase/auth` ^0.2.0-beta.1 |
| Blob storage | Vercel Blob | `@vercel/blob` ^2.3.3 |
| Bot detection | Vercel BotId | `botid` ^1.5.11 |
| Unit tests | Vitest + v8 coverage | ^4.1.4 |
| E2E tests | Playwright (Chromium) | ^1.59.1 |
| Hosting | Vercel (Fluid Compute) | — |

### Repository Structure

Seven top-level concerns. Per `AGENTS.md:65-81`:

- `dashboard/` — Next.js 16 app, the main deliverable
- `harness-cli/` — `@harness-lab/cli`, participant install + facilitator ops
- `workshop-skill/` — Claude Code / Codex skill bundle
- `workshop-blueprint/` — canonical reusable workshop definition
- `workshop-content/` — bilingual agenda scene source-of-truth
- `content/` — participant-facing briefs, talks, facilitation material
- `docs/` — architecture, ADRs, runbooks, plans, brainstorms

### Data Flow (verified)

```
workshop-blueprint agenda (canonical template)
         ↓
createWorkshopStateFromInstance() — deep copy + reset
         ↓
workshop-store.ts — central mutation facade (2111 lines)
    ├── WorkshopStateRepository (file JSON / Neon JSONB + state_version)
    ├── TeamRepository (file JSON / Neon `teams` + `team_members`)
    ├── CheckpointRepository (file JSON / Neon `checkpoints`)
    ├── MonitoringSnapshotRepository (file / Neon `monitoring_snapshots`)
    ├── ParticipantRepository (file / Neon `participants`)
    ├── RotationSignalRepository + LearningsLogRepository
    ├── ParticipantFeedbackRepository + PollResponseRepository
    ├── FeedbackSubmissionRepository (post-workshop form)
    ├── InstanceGrantRepository (facilitator authorization)
    ├── ArtifactRepository (Vercel Blob + DB metadata)
    └── (and 10 more — see Appendix C)
         ↓
getWorkshopState() — 4-way Promise.all read assembly
         ↓
API routes (57 `route.ts` files) + admin Server Components
```

### Three UI Surfaces

| Surface | Path | Auth | Purpose |
|---------|------|------|---------|
| Participant | `/` + `/admin/instances/[id]/participant` | Event code → session → identify | Mobile-first workshop orientation |
| Facilitator | `/admin` + `/admin/instances/[id]` | Neon Auth session + DB instance-grant | Workspace cockpit + instance control room |
| Presenter | `/admin/instances/[id]/presenter` | Facilitator auth | Room-facing display (agenda-driven scenes) |

---

## Security

### What Materially Improved Since 2026-04-08

- Baseline security headers shipped in `dashboard/next.config.ts:4-9`:
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy:
  camera=(), microphone=(), geolocation=()`.
- `assertValidNeonAuthConfiguration` throws at startup when Neon mode is
  requested without `NEON_AUTH_BASE_URL` + `NEON_AUTH_COOKIE_SECRET`
  (`dashboard/lib/runtime-auth-configuration.ts:11-21`).
- Sample event-code seeding only runs in Neon mode when `HARNESS_EVENT_CODE`
  is explicitly provided; no silent production fallback
  (`dashboard/lib/participant-event-access-repository.ts`).
- Optimistic locking with `state_version` column shipped
  (`dashboard/db/migrations/2026-04-08-workshop-state-optimistic-locking.sql`
  + `dashboard/lib/workshop-state-repository.ts:129-157`).
- Participant identity is consistently session-instance-scoped; every
  `findParticipant` call takes `session.instanceId` as first argument.
- `botid` is actively wired (`dashboard/lib/redeem-guard.ts:47-55`), not just
  a listed dependency.
- 57 API routes audited — every mutating route has auth + origin-check
  +instance-scope binding (route matrix in Appendix A).

### Findings

**S-1 — HIGH: No CSP or HSTS header.** `next.config.ts:4-9` adds four headers
but omits `Content-Security-Policy` and `Strict-Transport-Security`. Without
CSP, any future XSS has unrestricted exfiltration. Without HSTS, first-load
over HTTP on custom domains is a downgrade vector. Fix: add CSP (start with
`default-src 'self'` + inline-script nonce via `withBotId`) and
`Strict-Transport-Security: max-age=63072000; includeSubDomains`. Track A, §F-2.

**S-2 — MEDIUM: File-mode defaults `facilitator:secret` still shipped.**
`dashboard/lib/admin-auth.ts:61-64` uses `process.env.HARNESS_ADMIN_USERNAME
?? "facilitator"` / `process.env.HARNESS_ADMIN_PASSWORD ?? "secret"`.
`dashboard/.env.example:25-26` ships those as example values. In Neon-mode
production deploys this path is dead. In file-mode or a botched self-host
deploy that forgets `HARNESS_STORAGE_MODE=neon`, basic-auth with these
defaults unlocks `/admin`. Fix: throw at startup when `NODE_ENV=production`
and the env vars are still at defaults.

**S-3 — MEDIUM: Device-flow endpoints unrate-limited.**
`/api/auth/device/start` and `/api/auth/device/poll` (`dashboard/app/api/auth/
device/start/route.ts:5-11`) have no rate limit. Mirror the existing
`redeem-rate-limit.ts` pattern (5 attempts / 10 min per fingerprint).

**S-4 — LOW: Cross-instance facilitator auto-bootstrap.**
`resolveFacilitatorGrantWithBootstrap` at `facilitator-auth-service.ts:84`
creates an owner grant for the first authenticated session on an instance
with no existing grants. A facilitator who owns instance A can become owner
of fresh instance B if they hit it before anyone else. Acceptable for single-
tenant self-hosting; flag if multi-tenant isolation becomes a requirement.

**S-5 — LOW: In-memory rate limiters reset on cold-start.**
`dashboard/lib/suggest-rate-limit.ts:16-18` — module-level `Map`. Vercel
serverless resets it per function instance. Document as known limitation;
workshop-scale is fine.

**S-6 — LOW: `x-forwarded-for` fingerprinting is Vercel-specific.**
`dashboard/lib/redeem-rate-limit.ts:11-16` takes the first value of the
header. Vercel sanitizes this header; other hosts do not. Comment the source
to flag the dependency on Vercel's edge behavior.

### Still-Holding Positives

- No raw SQL string interpolation anywhere. `sql.query` calls at
  `facilitators/route.ts:46-49` and `access.ts:92-95` use parameterized `$1`.
- Zero `dangerouslySetInnerHTML` in any `.tsx` file.
- `rehype-sanitize` applied on every markdown path via `markdown-body.tsx:3,46`.
- No `NEXT_PUBLIC_*` secrets — only two non-sensitive repo-URL hints.
- No CORS wildcards; `isTrustedOrigin` enforced on all mutating routes.
- Timing-safe comparison on event-code verification
  (`event-access.ts:72-79`).

---

## Architecture Bottlenecks

### Bottleneck 1: JSONB drift at the instance-column level (ADR 1)

The `workshop_state` JSONB is now normalized correctly on read
(`normalizeStoredWorkshopState` in `workshop-store.ts:645`). But three new
instance-level JSONB columns have no normalizer:

- `workshop_instances.feedback_form` (added 2026-04-21) — read raw in
  `NeonWorkshopInstanceRepository`.
- `workshop_instances.reference_groups` (added 2026-04-22) — read raw.
- `workshop_instances.participant_copy` (added 2026-04-24) — read raw.

If a future change makes any field in `FeedbackQuestion`,
`GeneratedReferenceGroup`, or `OverridableParticipantCopy` required, old
rows will produce undefined-field-access crashes. This is the exact class
of the 2026-04-20 incident.

**Fix (ADR 1):** Zod schema at every repo boundary. Schema parses on read;
`safeParse` failures normalize to a default and emit
`HARNESS_RUNTIME_ALERT`. Drift becomes observable, not a 500.

### Bottleneck 2: Poll submission is a 15-query round-trip (ADR 5)

`/api/participant/poll` PATCH at `route.ts:25` calls `getActivePollSummary`
(5 queries), then `submitActivePollResponse` at
`workshop-store.ts:1812-1841` calls `getActivePollSummary` *again* (5
queries), and `getWorkshopState` inside runs a 4-query `Promise.all`. Net:
15 Neon HTTP calls per single poll submit. At 50 simultaneous participants
submitting during a poll window, that's ~750 concurrent Neon round-trips.

**Fix (ADR 5):** Pass already-fetched state into `submitActivePollResponse`
instead of re-fetching. Removes 10 of 15 queries per submit.

### Bottleneck 3: `replaceParticipants` and `replaceTeams` serial N+1 (ADR 5)

`dashboard/lib/participant-repository.ts:328-334`:
```ts
await this.sql`DELETE FROM participants WHERE instance_id = $1`;
for (const participant of participants) { await this.upsertParticipant(...) }
```
Same pattern in `team-repository.ts:85-91`. 50 participants = 51 sequential
Neon HTTP calls. On Vercel Hobby/Pro the 10-second function timeout
(`vercel.json` has no override) gives headroom, but team randomize + reset
chains these sequentially and can approach 3-5 seconds of blocking I/O.

**Fix (ADR 5):** Single `INSERT INTO ... SELECT unnest($1::text[]), ...
ON CONFLICT DO UPDATE`. Cuts randomize from ~1s blocking to <100ms.

### Bottleneck 4: Admin page fan-out without caching

`dashboard/app/admin/instances/[id]/page.tsx:30-35` is `force-dynamic` and
fires ~16 Neon queries per navigation: 7 from `admin-page-loader.ts:130-148`
plus `getActivePollSummary` (5) + `listParticipantFeedback` (1) +
`getFeedbackSubmissionRepository().list` (1) + other admin page-view-model
reads. Summary-tab data is always computed, even when the facilitator is on
the "run" section.

**Fix:** Move feedback + poll summary to client-fetch-on-demand. Cuts
admin navigation from 16 queries to ~8. Deferred per user — revisit
post-first re-deploy with real metrics.

### Bottleneck 5: Participant polling storm (ADR 5)

`dashboard/app/components/participant-live-refresh.tsx:6` polls every 30s.
At 50 participants that's 200 Neon queries per 30s window in steady state,
and all 50 fire simultaneously on visibility-restore
(`participant-live-refresh.tsx:52-61`).

**Fix (ADR 5):** Dedicated lean fingerprint endpoint:
`SELECT state_version FROM workshop_instances WHERE id = $1`. Client
polls this, only triggers the full `router.refresh()` on version change.
Cuts steady-state from 200 queries/30s to 50.

---

## Edge Cases and Failure Modes

### Drop-off Table

| Lifecycle Step | Persisted | Lost on Failure | Recovery | Severity |
|---|---|---|---|---|
| 1. Create instance | `workshop_instances` + initial state + empty teams/checkpoints/monitoring across 5 sequential writes | Partial rows — non-transactional | Re-create with same ID (idempotent guard, `workshop-store.ts:1443`); partial state requires SQL | High |
| 2. Config saved | `workshop_state` JSONB via CAS | Last unsaved admin-UI edit | Facilitator re-edits | Low |
| 3. Event-code redeem | Session + event-access row + audit log (3 non-transactional writes) | Silent audit gap if audit append fails | Admin sees session; no UI re-emit | Low-Medium |
| 4. Participant identify | `participants` row + session update linking `participantId` | Session-bind race at `event-access.ts:260-265` returns `{ok:true}` even when session update didn't happen; participant looks anonymous to facilitator | Log out + re-identify; no admin re-bind UI | High |
| 5. Set password (Neon Auth) | 2-step: Neon user create + password set | Step 1 succeeds, step 2 fails → orphan user, `email_taken` mapped to `unknown`; participant permanently blocked without admin reset | Admin reset endpoint only works if `neonUserId` already linked | Critical |
| 6. Team randomize | `team_members` replace + history append (2 writes) | History append fails → assignment OK, audit gap | Re-randomize; history has a gap | Low |
| 7. Scene rotation | `workshop_state` via CAS | CAS conflict throws; no auto-retry in route handlers | Facilitator refreshes + retries manually | Medium |
| 8. Rotation signal + learnings | `rotation_signals` + `learnings_log` (2 writes, no tx) | Learnings log out-of-sync | SQL only | Medium |
| 9a. In-workshop feedback | `participant_feedback` append (no dedup) | Duplicate row on double-submit | Ignore visually; no delete UI | Low |
| 9b. Post-workshop form | `workshop_feedback_submissions` upsert (Neon) / file read-then-write | Two-tab race: last write wins within lock window | No draft save | Medium |
| 10. Archive + end | `instance_archives` + `workshop_instances.status='ended'` (2 writes) | Archive OK, status not flipped → instance still looks "live" | PATCH endpoint if it exposes status, else SQL | High |

### Critical Gaps

1. **Neon Auth account creation atomicity** (ADR 4). Two HTTP calls, no
   transaction. Orphaned users block mid-workshop recovery because
   `/api/admin/participants/[id]/reset-password` requires
   `participant.neonUserId !== null`
   (`dashboard/app/api/admin/participants/[id]/reset-password/route.ts:63`).

2. **Session-bind race on identify.** `bindParticipantToSession` at
   `event-access.ts:260-265` detects missing session after the read but
   still returns `{ok: true, participantId}`. The cookie session has
   `participantId: null` on the next request. Participant looks anonymous
   to the facilitator with no recovery UI.

3. **Instance creation non-transactional.** `createWorkshopInstance` at
   `workshop-store.ts:1476-1492` fires 5 sequential awaits without a
   transaction wrapper. A Neon error mid-sequence leaves partial rows.
   Fallback to `seedWorkshopState` at line 646 silently masks the
   inconsistency.

### Race Conditions

| Scenario | Defense | Gap |
|---|---|---|
| Two participants submit post-workshop feedback | Neon upsert with unique index; within lock window last-write-wins | No audit/warning of overwrite |
| Facilitator randomize during redeem rush | `replaceMembers` replaces; no auto-placement for late arrivals | Late arrivals stranded with `participantId` but no `team_member` row |
| Facilitator + participant concurrent write | Optimistic `state_version` CAS; throws `WorkshopStateConflictError` | No auto-retry in route handlers; facilitator re-submits manually |
| Two facilitator tabs, same action | Same CAS; one wins | UI doesn't surface 409 as "refresh & retry"; error bubble is generic |
| In-workshop feedback double-submit | None — pure append | Duplicate rows visible to facilitator |
| Brute-force event codes | 5 failures per 10 min per fingerprint | Fingerprint-based, not instance-based; distributed attack under the threshold succeeds |

### Mid-Workshop Deploy Safety

No freeze mechanism exists. Memory indicates deploys to
`harness-lab-dashboard` come from pushes to `main` (per the
`feedback_deploy_via_git_not_cli.md` memory entry), so a well-intentioned
mid-workshop commit auto-deploys. Impact profile:

- Participant cookies survive (stateless DB validation, 12h sliding).
- Presenter page does NOT survive — client React bundle is invalidated,
  chunk-load error on next navigation.
- In-memory rate limiter is wiped.

**Fix (ADR 2):** `HARNESS_WORKSHOP_ACTIVE=true` env var on Vercel. A
pre-build CI step reads it; aborts the build if set. One line in
`vercel.json` buildCommand or a dedicated workflow check.

### Delta Since 2026-04-08 — New Failure Surfaces

- `/api/participant/poll` (15-query hot path) didn't exist.
- `workshop_feedback_submissions` upsert race within the 24h edit window.
- Admin reset-password returns plaintext in the response body at
  `reset-password/route.ts:98` — captured by browser history / network
  logs (ADR 4).
- `sendParticipantPasswordResetEmail` proxies to Neon Auth; returns
  `{ok:true}` at the API level whether or not mail actually delivered.
  Silent email failure is undetectable from the app.
- `computeDisambiguators` in `participant-disambiguator.ts:72` falls back
  to a random 4-char UUID suffix when two participants share first name
  and have no tag and no email — meaningless to a live-room participant.

---

## Data Architecture and GDPR

### Migration-to-Repo Parity

21 migrations, all with corresponding repo consumers in `dashboard/lib/`.
Dual-mode parity (`File*` + `Neon*` repos) verified for all 21.
Migration-to-repo matrix in Appendix B. **Zero migrations have DOWN
sections** — formalize forward-only policy per ADR 7.

### PII Inventory

| Data | Location | Access | Deletion |
|---|---|---|---|
| Participant `displayName` | `participants` / `data/<id>/participants.json` | Facilitator admin; participant (own session) | Soft `archivedAt`; hard via CASCADE on instance delete |
| Participant `email` (opt-in) | Same | Facilitator only | Same |
| Neon Auth link (`neon_user_id`) | `participants.neon_user_id` | Server-only | Managed externally in Neon console |
| Feedback free-text answers | `workshop_feedback_submissions.answers` JSONB | Facilitator summary UI | Instance CASCADE only |
| Testimonial quote consent | `answers["quote-ok"].checked` (single source since 2026-04-22) | Facilitator summary UI (`feedback-summary.ts:34`) | Same |
| Poll responses | `participant_poll_responses` | Facilitator | CASCADE; `deletePoll` by ID |
| Rotation signal free-text | `rotation_signals.free_text` | Facilitator only | CASCADE |
| Audit log metadata | `audit_log.metadata` JSONB | Facilitator only (no public endpoint) | 30-day retention (`workshop-store.ts:122`) |
| Redeem fingerprints | `participant_redeem_attempts.fingerprint` | Server-only | 7-day retention (`workshop-store.ts:121`) |
| Blob artifacts | Vercel Blob + `workshop_artifacts` row | Authenticated via `/participant/artifact/[id]` | Application-layer cleanup on teardown |

**GDPR gaps (ADR 3 addresses):**

- No per-participant export endpoint (Art. 20).
- No per-participant hard-delete endpoint (Art. 17) — only
  `archiveParticipant` soft-delete.
- No retention policy on `participant_feedback` (free-text
  `message TEXT NOT NULL`) or `workshop_feedback_submissions`.
- No cookie/consent banner code.
- No documented Privacy Policy in public template (mentioned in internal
  classification doc only).

### External Data Processors

| Provider | Data | Consent / DPA |
|---|---|---|
| Neon | All Neon-mode workshop data including PII, feedback text, session tokens | Neon DPA; region per project config (not verifiable from code) |
| Vercel Blob | Facilitator-uploaded artifacts (private mode) | Vercel DPA; blobs served via authenticated route only |
| Neon Auth (control plane) | Participant email + password on admin user-create | Same DPA as Neon |
| `botid` | Client-side device fingerprint for redeem rate-limit | Runs in-browser; fingerprint sent to own API only |

No email sending SDK, no analytics, no error monitoring, no Slack, no
other external `fetch()` targets found.

### Orphaned Local File

`dashboard/data/facilitator-identities.json` exists on disk with a
SHA-256 password hash. Table was dropped in Neon
(`2026-04-06-drop-facilitator-identities.sql`). Gitignored correctly
(`.gitignore:18`). No runtime effect. Recommend deleting from local dev
setups as housekeeping.

---

## Self-Hosting + Ops Readiness

### Gap Table (reconciling `docs/self-hosting.md` with actual code)

| Step | Doc says | Code requires | Severity |
|---|---|---|---|
| §4 env vars | Lists 6 vars | Also hard-requires `HARNESS_EVENT_CODE_SECRET` (≥32 chars) in Neon mode via `participant-event-access-repository.ts:25` | **Critical** |
| §4 env vars | No botid mention | `next.config.ts:2` wraps config in `withBotId()`, `instrumentation-client.ts:4` calls `initBotId()` | **High** |
| §4 env vars | No Neon control-plane keys | `NEON_API_KEY` + `HARNESS_NEON_PROJECT_ID` + `HARNESS_NEON_BRANCH_ID` required by `lib/auth/admin-create-user.ts:55-57` | **High** |
| §4 env vars | No blob mention | `BLOB_READ_WRITE_TOKEN` required for artifact feature | **Medium** |
| §4 env vars (author IDs in non-runtime paths) | — | **Runtime path is clean** — `admin-create-user.ts:54-60` returns `missing_credentials` when env absent, no silent fallback. But `.env.example:45-46` shows commented-out author IDs (`broad-smoke-45468927`, `br-hidden-firefly-aljj2dzm`); a self-hoster uncommenting verbatim would route against the author's Neon. Test/CI scripts (`create-test-branch.mjs:20`, `delete-test-branch.mjs:19`, `playwright.neon.config.ts:52,54`, `e2e/neon-mode/fixtures.ts:59,62`) hardcode author IDs as fallback — only affects tests if overrides not set. | **Medium** |
| §5 migrations | Says run `npm run db:migrate` manually | `vercel.json:3` runs it automatically during build | **Low (ambiguity)** |
| §6 create first facilitator | Script referenced | Requires same Neon control-plane keys as above | **Medium** |

### Env Var Inventory (required first)

Full inventory in Appendix C. 22 vars total. **Undocumented but required in
Neon mode:** `HARNESS_EVENT_CODE_SECRET`, `NEON_API_KEY`,
`HARNESS_NEON_PROJECT_ID`, `HARNESS_NEON_BRANCH_ID`, `BLOB_READ_WRITE_TOKEN`
(for artifact feature).

### Observability — What Exists

- `dashboard/instrumentation-client.ts:1-6` — botid only; no Sentry.
- `HARNESS_RUNTIME_ALERT` structured stdout lines for 5 categories
  (`runtime-alert.ts:13-32`): auth failures, redeem throttling, bot
  signals, archive events. Visible in Vercel function logs.
- No `/api/health` — confirmed absent.
- No Vercel Cron jobs (`vercel.json` has none).
- No in-app alerting.

### Minimum Viable Observability (ADR 2)

1. `/api/health` (25-line route). `GET` returns `{ok, mode, ts}` after
   trivial DB ping. Response must not leak storage mode, instance IDs, or
   DB diagnostics — matches the 2026-04-08 companion posture.
2. UptimeRobot free tier: single monitor on `/api/health`, 5-minute
   cadence, email/SMS alert.
3. `HARNESS_WORKSHOP_ACTIVE` env var. Pre-build step aborts CI/Vercel
   build if set. Flip it on via Vercel dashboard before a workshop,
   flip off after.

### CI Matrix (what runs today)

| Check | Where | Required for self-hoster |
|---|---|---|
| Unit tests (Vitest) | GitHub Actions | No extra config |
| Lint + build | GitHub Actions | No |
| Playwright E2E | GitHub Actions (PR) + self-hosted ARM64 (push) | **Self-hoster ARM64 job silently skips** — CI reports green without running |
| Neon integration | GitHub Actions, only if `HARNESS_TEST_DATABASE_URL` secret set | Needs own Neon test branch |
| Semgrep SAST, gitleaks, npm audit, CodeQL, Scorecard, dependency review | GitHub Actions | Some require public-repo permissions |
| Pre-commit: copy-editor, bilingual content verify | Husky | Skips gracefully if `bun`/toolkit absent |

**Missing:** Migration smoke test (CI never applies `db:migrate` against a
throwaway DB). `tsc --noEmit` separate from `next build`.

### Runbook Gaps

`docs/workshop-instance-runbook.md` covers create → prepare → run → reset
→ archive. Scenarios NOT covered:

- "Dashboard down mid-workshop" — no Vercel rollback procedure, no
  "previous deployment is still serving" explainer.
- "Migration fails at deploy time" — same.
- "Participant redeem stops working" — `HARNESS_RUNTIME_ALERT` mentioned
  retroactively; no live-triage flow.
- "Neon goes down" — no fallback, no participant communication template.
- "Event code leaked" — capability exists; rotation procedure not written.
- First-deploy smoke-check for self-hosters.

---

## Execution Order

Phased work. Effort estimates are honest (added up, not hand-waved).

### Phase 1 — Close the open drift + auth atomicity class (~1.5 days)

Highest-ROI structural fixes. Prevents the next 2026-04-20-class incident.

1. **Zod at repo boundary, three instance JSONB columns first** (ADR 1,
   ~4h). Add `zod` dependency. Write `FeedbackFormSchema`,
   `ReferenceGroupsSchema`, `ParticipantCopySchema`. Parse on read in
   `workshop-instance-repository.ts`; `safeParse` failures log
   `HARNESS_RUNTIME_ALERT` and return normalized defaults. Unit test
   each with a malformed fixture.
2. **Expand Zod to `workshop_state` JSONB and all remaining JSONB
   columns** (ADR 1, ~3h). Replace `normalizeStoredWorkshopState` with
   the Zod version; keep the legacy field-by-field normalization as
   defaults in the Zod schema.
3. **Atomic participant account creation** (ADR 4, ~2h). In
   `participant-auth.ts:120-160`, detect `email_taken` and recover by
   calling `setParticipantPasswordViaResetToken` on the existing Neon
   user. Unit test the orphan-recovery path.
4. **One-time ephemeral reset code + force-change-on-login** (ADR 4,
   ~3h). Admin reset-password endpoint returns a 3-word code (same
   speakable format as today) valid for 15 min. Participant is forced
   to set a new password on next login. Remove plaintext password from
   response body.

### Phase 2 — Live-event safety baseline (~4h)

ADR 2 minimum-viable stack.

5. **`/api/health` route** (~0.5h). Unauthenticated. Returns `{ok, mode,
   ts}` after DB ping. No leakage of instance IDs or DB diagnostics.
6. **UptimeRobot monitor** (~0.5h). Single HTTP monitor, email alert,
   document in runbook.
7. **`HARNESS_WORKSHOP_ACTIVE` deploy-freeze** (~1h). Add a pre-build
   check in `dashboard/scripts/` that exits non-zero if the env var is
   set. Wire into `vercel.json` buildCommand. Document the flow.
8. **Runbook incident scenarios** (~2h). Dashboard-down procedure,
   migration-fails-at-deploy, participant-redeem-triage, event-code
   emergency rotation. Each a 5-minute playbook.

### Phase 3 — Performance fixes (~11h)

ADR 5. All three paths.

9. **Poll submit single-fetch** (~4h). Modify `submitActivePollResponse`
   to accept the already-fetched state. Update
   `/api/participant/poll/route.ts` to pass it through. Removes 10 of
   15 queries per submit.
10. **`replaceParticipants` + `replaceTeams` multi-row INSERT** (~4h).
    Single `INSERT ... ON CONFLICT DO UPDATE` using `unnest($1::text[])`
    arrays. Benchmark before/after with 50 participants.
11. **Participant polling fingerprint endpoint** (~3h). New
    `/api/event-context/fingerprint` returning only
    `{stateVersion, currentPhaseLabel}`. Update
    `participant-live-refresh.tsx` to poll this and only trigger
    `router.refresh()` on change.

### Phase 4 — Self-hosting hardening (~2.5h)

ADR 6. Close the author-ID confusion paths and fix the doc gap.

12. **Remove commented-out author IDs from `.env.example:45-46`** (~0.25h).
    Replace with placeholder like `your-neon-project-id` with a link to
    the Neon console. Runtime is already safe — this prevents blind
    copy-paste.
13. **Fail-loud in test/CI scripts when env missing** (~0.75h). Change
    `create-test-branch.mjs:20`, `delete-test-branch.mjs:19`,
    `playwright.neon.config.ts:52,54`, and `e2e/neon-mode/fixtures.ts:59,62`
    to throw when their respective env vars aren't set, instead of
    falling back to the author's IDs.
14. **Expand `docs/self-hosting.md` §4** (~1h). Add:
    `HARNESS_EVENT_CODE_SECRET`, `NEON_API_KEY`, `HARNESS_NEON_PROJECT_ID`,
    `HARNESS_NEON_BRANCH_ID`, `BLOB_READ_WRITE_TOKEN`, botid config.
15. **Expand `docs/private-workshop-instance-env-matrix.md`** (~0.5h).
    Same list with authoritative source-of-truth details.

### Phase 5 — GDPR lifecycle endpoints (~4h)

ADR 3.

16. **`GET /api/admin/participants/[id]/export`** (~1.5h). JSON dump of
    the participant's feedback, poll responses, check-ins,
    participant_feedback messages. Facilitator-auth + instance-grant +
    body validation. Audit log entry.
17. **`DELETE /api/admin/participants/[id]`** (~2h). Hard-delete
    across `participants`, `participant_sessions`, `team_members`,
    `participant_feedback`, `participant_poll_responses`, related
    `workshop_feedback_submissions`, and the Neon Auth user. All in a
    single transaction where the DB supports it; sequential with
    recovery otherwise. Audit log entry. Unit test the cascade.
18. **Privacy policy doc** (~0.5h). `docs/privacy-participant-data.md`
    already exists; update to reference the new endpoints.

### Phase 6 — Security residuals (~2.5h)

19. **CSP + HSTS headers** (S-1, ~1h). Add to `next.config.ts:4-9`.
20. **Throw-on-default facilitator creds in `NODE_ENV=production`**
    (S-2, ~0.5h). `dashboard/lib/admin-auth.ts:61-64`.
21. **Rate-limit `/api/auth/device/start` + `/poll`** (S-3, ~1h).
    Mirror `redeem-rate-limit.ts` pattern.

### Phase 7 — Migration policy + housekeeping (~1h)

22. **Write `docs/migration-policy.md`** (ADR 7, ~0.5h). Expand→contract
    discipline, same-slice rule (code + migration in one commit), no
    DOWN sections.
23. **Delete `dashboard/data/facilitator-identities.json`** (~0.1h).
    Orphan file, gitignored, no runtime effect.

**Total effort:** ~4 days of focused solo work (Phase 1: 12h, Phase 2: 4h,
Phase 3: 11h, Phase 4: 2.5h, Phase 5: 4h, Phase 6: 2.5h, Phase 7: 1h ≈
37h). Split across commits safely — no cross-phase dependencies except
Zod first enables cleaner validation elsewhere.

---

## Component Summary

| Component | State | Recommendation |
|---|---|---|
| Vercel hosting (Fluid Compute) | good fit | keep |
| Neon Postgres (serverless HTTP driver) | good fit | keep |
| Neon Auth | good fit | keep; needs better admin-UX around orphan recovery |
| Vercel Blob (private mode) | good fit | keep; add reconciliation scan for orphaned blobs |
| botid | actively wired | keep |
| Dual-mode storage (file/Neon) | clean abstraction | keep |
| Optimistic locking on `workshop_state` | correct | keep; add auto-retry at the route-handler level |
| `workshop_state` JSONB normalizer | correct | replace with Zod schema (ADR 1) |
| Instance-level JSONB columns | no normalizer | add Zod schemas (ADR 1) |
| `/api/health` | missing | add (ADR 2) |
| Error monitoring | stdout-only | add UptimeRobot + document log drain (ADR 2) |
| PII deletion/export | missing | add per-participant endpoints (ADR 3) |
| Password reset flow | plaintext in JSON + orphan class | redesign (ADR 4) |
| Hot-path Neon fan-out | high | optimize three paths (ADR 5) |
| Self-hosting docs | 5 vars missing + leak path | close in one slice (ADR 6) |
| Migration rollback policy | implicit | document forward-only (ADR 7) |

### Deliberately Not Added

- Kubernetes.
- Separate deploy per workshop.
- Full participant self-service portal with account page.
- Job queue / background workers (Neon HTTP driver + synchronous archive
  is adequate at workshop scale).
- Sentry or equivalent error-tracking SaaS (revisit post-Brno metrics).
- Redis / durable rate-limit store (in-memory + fingerprint is adequate).
- Migration framework (Prisma/Drizzle/Kysely) — current runner handles
  dual-mode correctly; switching cost not justified.

The architecture's main residual problems are structural patterns, not
missing platform sophistication. The execution order above is four days
of work, not a rewrite.

---

## Appendices

### A. Route Matrix (verified 2026-04-22)

57 `route.ts` files. All mutating routes gate on auth + origin +
instance-scope. Full matrix in Track A report (see
`/private/tmp/.../tasks/a7859b6b487dd0ac9.output` during review; inline
summary below).

**Participant plane** (13 routes): `/api/event-access/*`,
`/api/event-context/*`, `/api/participant/*`, `/api/briefs`,
`/api/challenges`, `/api/agenda` GET, `/api/rotation` GET,
`/api/checkpoints` GET, `/api/teams`. Gated on participant session
cookie with `instanceId` bound from DB.

**Facilitator plane** (~32 routes): `/api/admin/*`, `/api/workshop/*`,
`/api/agenda` PATCH, `/api/rotation` PATCH, `/api/checkpoints` POST,
`/api/monitoring`, `/api/rotation-signals`, `/api/challenges/[id]/complete`.
Gated on Neon Auth session + DB instance-grant check.

**Device-auth plane** (6 routes): `/api/auth/device/*`. `start` + `poll`
are unauthenticated by design (OAuth device flow); `approve` / `deny` /
`session` / `logout` gated on session cookie or bearer token.

**Platform auth** (1 route): `/api/auth/[...path]` — Neon Auth SDK proxy.

### B. Migration Inventory (21 migrations)

Date order (all dated):

1. `2026-04-06-private-workshop-instance-runtime` (foundation: 11 tables)
2. `2026-04-06-facilitator-identity-simplification`
3. `2026-04-06-drop-facilitator-identities`
4. `2026-04-07-facilitator-cli-device-auth` (2 tables)
5. `2026-04-07-instance-lifecycle-and-agenda-authoring`
6. `2026-04-08-workshop-state-optimistic-locking` (`state_version`)
7. `2026-04-08-facilitator-platform-session-bootstrap`
8. `2026-04-16-participants-and-team-members` (2 tables)
9. `2026-04-19-team-composition-history`
10. `2026-04-20-participant-auth` (`neon_user_id` + `allow_walk_ins`)
11. `2026-04-20-participant-feedback-and-polls` (2 tables)
12. `2026-04-20-redeem-attempts-nullable-instance`
13. `2026-04-20-rotation-signals-and-learnings-log` (2 tables)
14. `2026-04-21-team-mode-enabled`
15. `2026-04-21-checkpoints-participant-subject`
16. `2026-04-21-workshop-feedback` (form + submissions)
17. `2026-04-22-instance-reference-groups`
18. `2026-04-22-feedback-consent-in-answers` (DROP + backfill)
19. `2026-04-23-instance-reference-bodies`
20. `2026-04-24-instance-participant-copy`
21. `2026-04-25-workshop-artifacts` (Blob + metadata)

All consumed by corresponding `*-repository.ts` files in `dashboard/lib/`.
Zero DOWN sections — ADR 7 formalizes this.

### C. Environment Variable Inventory

| Variable | Mode | Required | Default | Documented in self-hosting.md? |
|---|---|---|---|---|
| `HARNESS_STORAGE_MODE` | both | Yes | `file` | Yes |
| `HARNESS_DATABASE_URL` | neon | Yes | falls back to `DATABASE_URL` | Yes |
| `DATABASE_URL` | neon | fallback | — | Implicit |
| `NEON_AUTH_BASE_URL` | neon | Yes | none | Yes |
| `NEON_AUTH_COOKIE_SECRET` | neon | Yes | none | Yes |
| `HARNESS_EVENT_CODE_SECRET` | neon | **Yes** (hard-required ≥32 chars) | dev fallback in file mode only | **No** (ADR 6) |
| `NEON_API_KEY` | neon | **Yes** (for admin participant create) | throws | **No** (ADR 6) |
| `HARNESS_NEON_PROJECT_ID` | neon | **Yes** | none at runtime (test scripts default to `broad-smoke-45468927`) | **No** (ADR 6) |
| `HARNESS_NEON_BRANCH_ID` | neon | **Yes** | none at runtime (test scripts default to `br-hidden-firefly-aljj2dzm`) | **No** (ADR 6) |
| `BLOB_READ_WRITE_TOKEN` | both | Yes if artifact feature used | — | **No** (ADR 6) |
| `HARNESS_ADMIN_USERNAME` | file | Recommended | `facilitator` | Implicit |
| `HARNESS_ADMIN_PASSWORD` | file | Recommended | `secret` | Implicit |
| `HARNESS_EVENT_CODE` | both | Optional bootstrap | none | Yes |
| `HARNESS_EVENT_CODE_EXPIRES_AT` | both | Optional | none | Yes |
| `ARTIFACT_MAX_BYTES` | both | Optional | 25 MiB | No |
| `HARNESS_DATA_DIR` | file | Optional | `<cwd>/data` | No |
| `HARNESS_PUBLIC_BASE_URL` | neon | Optional | `NEON_AUTH_BASE_URL` | No |
| `HARNESS_DASHBOARD_URL` | CLI | Optional | `http://localhost:3000` | No |
| `NEXT_PUBLIC_HARNESS_REPO_URL` | both | Optional | none | No |
| `NEXT_PUBLIC_HARNESS_REPO_BRANCH` | both | Optional | none | No |
| `HARNESS_TEST_DATABASE_URL` | CI | CI only | — | N/A |
| `PLAYWRIGHT_INCLUDE_VISUAL_TOUR` | CI | CI only | — | N/A |

Plus whatever botid requires for hosted deploys (not reverse-engineered
from code; check `botid/next/config` docs). Add to ADR 6 scope.

### D. Key File References

Cited throughout this review:

- `dashboard/lib/workshop-store.ts` — 2111 lines; central mutation facade
- `dashboard/lib/workshop-state-repository.ts` — optimistic locking
- `dashboard/lib/event-access.ts` — 519 lines; participant session + identify
- `dashboard/lib/participant-auth.ts` — 289 lines; Neon Auth account creation
- `dashboard/lib/admin-auth.ts` — 136 lines; file-mode basic auth
- `dashboard/lib/participant-disambiguator.ts` — first-name collision fallback
- `dashboard/lib/participant-repository.ts` — N+1 replaceParticipants
- `dashboard/lib/team-repository.ts` — N+1 replaceTeams
- `dashboard/lib/feedback-submission-repository.ts` — 24h edit window race
- `dashboard/lib/runtime-alert.ts` — stdout-only HARNESS_RUNTIME_ALERT
- `dashboard/lib/suggest-rate-limit.ts` — in-memory limiter (lost on cold start)
- `dashboard/lib/redeem-rate-limit.ts` — fingerprint-based (Vercel XFF trust)
- `dashboard/lib/auth/admin-create-user.ts` — hardcoded Neon IDs (ADR 6)
- `dashboard/next.config.ts` — security headers (CSP/HSTS still missing)
- `dashboard/vercel.json` — 4 lines; buildCommand runs migrations
- `dashboard/app/components/participant-live-refresh.tsx` — 30s polling
- `dashboard/app/admin/instances/[id]/page.tsx` — 16-query admin fan-out
- `dashboard/app/admin/instances/[id]/_lib/admin-page-loader.ts` — 7-parallel

---

*End of review. Execution order above is the tracked backlog — split into
separate plans under `docs/plans/` as Ondrej starts each phase.*
