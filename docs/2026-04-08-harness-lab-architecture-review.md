# Harness Lab — Full Architecture Review

**Date:** 2026-04-08
**Author:** Heart of Gold (Opus 4.6)
**Repo:** `harness-lab` (full monorepo)
**Audience:** Ondrej (sole developer), hackathon readiness, future handoff
**Prior review:** `docs/2026-04-06-private-workshop-instance-architecture-review.md` (Codex, focused on private runtime)

---

## Architecture Decision Records

Decisions made during this review, reflecting the current state and hackathon priorities:

| # | ADR | Decision | Rationale |
|---|-----|----------|-----------|
| 1 | Security headers | Add minimal set now | No CSP/X-Frame-Options/HSTS currently. Add via `next.config.ts` headers. ~30 min. |
| 2 | Observability | Add `/api/health` endpoint | No health check or error monitoring exists. Health endpoint is minimum viable for a live event. |
| 3 | Default credentials | Fail-closed in Neon mode | Remove `facilitator`/`secret` and sample event code fallbacks when `HARNESS_STORAGE_MODE=neon`. Crash on missing env vars. |
| 4 | Concurrent writes | Add optimistic locking | Add `version` column to `workshop_state`. Reject stale writes. Prevents data loss during live facilitation. |
| 5 | Concurrency (prior) | Accept single-facilitator model | The app is designed for one facilitator per instance. Multi-writer safety is deferred beyond optimistic locking. |
| 6 | Background work (prior) | Stay synchronous | Archive/export remain synchronous. Acceptable for current scale. |
| 7 | Hosting (prior) | Keep one shared Vercel project | One Vercel deployment + Neon branching. No per-event deployment sprawl. |

---

## Executive Summary

Harness Lab is a well-documented, architecturally intentional workshop platform for teaching AI harness engineering. The codebase is clean, the dual-storage pattern is well-executed, and the CI pipeline (unit tests, E2E, secret scanning, SAST) is stronger than most solo-developer projects.

**5 Key Findings:**

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | No security headers anywhere (CSP, X-Frame-Options, HSTS) | **High** | ADR: fix now |
| 2 | Hardcoded default credentials activate silently if env vars are unset | **High** | ADR: fail-closed |
| 3 | No optimistic locking — concurrent facilitator writes silently overwrite each other | **Medium** | ADR: add version column |
| 4 | No error monitoring or health endpoint for live events | **Medium** | ADR: add health check |
| 5 | No input validation library — all API validation is manual presence-checking | **Low** | Document, fix post-hackathon |

**What's working well:**

- Dual-mode storage (file/Neon) with clean repository interfaces and test injection
- CI pipeline: Vitest 80% coverage, Playwright E2E, gitleaks, Semgrep SAST, dependency review
- Auth separation: participant event-code plane vs. facilitator Neon Auth plane
- Blueprint/runtime split: canonical reusable template vs. mutable instance state
- Atomic file writes (temp + rename pattern) prevent torn reads
- No `NEXT_PUBLIC_` env vars — all secrets server-side only
- Secret files (`.env.local`, `.env.vercel.local`) are gitignored and never committed

---

## Current Architecture

### Tech Stack (verified against `package.json` and source)

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js (App Router) | 16.2 |
| UI | React | 19.2 |
| Language | TypeScript (strict) | 5.8 |
| Styling | Tailwind CSS | v4 |
| Database | Neon Postgres (serverless) | `@neondatabase/serverless` 1.0 |
| Auth | Neon Auth | `@neondatabase/auth` 0.2-beta |
| Unit tests | Vitest + v8 coverage | 4.1 |
| E2E tests | Playwright (Chromium) | 1.59 |
| CLI | Node.js ESM + chalk | — |
| Hosting | Vercel | — |

### Repository Structure

```
harness-lab/
├── dashboard/           Next.js 16 app (the main deliverable)
│   ├── app/             App Router: pages, layouts, API routes
│   ├── lib/             All business logic, repositories, services
│   ├── db/migrations/   Hand-written SQL migrations (5 files)
│   ├── scripts/         Migration runner, facilitator creation
│   ├── e2e/             Playwright E2E tests
│   └── data/            File-mode JSON storage (runtime)
├── harness-cli/         @harness-lab/cli (npm, participant/facilitator CLI)
├── workshop-skill/      Claude Code skill bundle (Markdown)
├── workshop-blueprint/  Canonical reusable workshop definition
├── content/             Facilitation materials (Czech)
├── docs/                Architecture, ADRs, plans, brainstorms
├── monitoring/          Repo scanning scripts
├── capture/             Voice → structured notes pipeline
└── .github/workflows/   CI: dashboard-ci.yml, harness-cli-publish.yml
```

### Data Flow

```
workshop-blueprint-agenda.json (static template)
         ↓
createWorkshopStateFromInstance() — deep copy + reset
         ↓
workshop-store.ts — central mutation facade
    ├── WorkshopStateRepository (file JSON or Neon JSONB)
    ├── TeamRepository (file JSON or Neon table)
    ├── CheckpointRepository (file JSON or Neon table)
    └── MonitoringSnapshotRepository (file JSON or Neon table)
         ↓
getWorkshopState() — assembles from 4 parallel repo reads
         ↓
API routes (external clients) or direct import (admin Server Components)
```

### Three UI Surfaces

| Surface | Path | Auth | Purpose |
|---------|------|------|---------|
| Participant | `/` | Event code session | Mobile-first workshop orientation |
| Facilitator | `/admin`, `/admin/instances/[id]` | Neon Auth / Basic Auth | Workspace cockpit + instance control room |
| Presenter | `/admin/instances/[id]/presenter` | Facilitator auth | Room-facing display (agenda-driven scenes) |

---

## Security

### Authentication Architecture

**Two separate auth planes** (by design, well-documented in ADRs):

1. **Participant event access:** Single event code per instance → SHA-256 hashed → short-lived httpOnly session cookie. Rate-limited redemption (5 failures / 10 min). Origin-checked mutations. Properly implemented.

2. **Facilitator identity (Neon Auth):** Email/password via `@neondatabase/auth`. Session cookies (httpOnly, signed, short-lived with rotation). Three roles: owner / operator / observer. First-user auto-bootstrap as owner.

3. **File-mode fallback:** HTTP Basic Auth with hardcoded defaults `facilitator`/`secret`. **This is the highest security risk** — see finding below.

### API Route Audit (39 routes verified)

**Unprotected GET endpoints (intentional for participant access):**

| Route | Exposes |
|-------|---------|
| `GET /api/agenda` | Full agenda items with statuses |
| `GET /api/briefs` | All project briefs including `firstAgentPrompt` |
| `GET /api/challenges` | All challenges |
| `GET /api/rotation` | Rotation state |
| `GET /api/workshop` | Workshop meta, templates, **all instance IDs** |

These are intentional for the workshop context. `GET /api/workshop` exposing all instance records is worth auditing — consider filtering to only `prepared`/`running` instances for unauthenticated requests.

**All mutation endpoints require facilitator or participant auth.** No unprotected write endpoints found.

### Security Findings

#### S1: Hardcoded Default Credentials (HIGH) — ADR: fail-closed

**File:** `lib/facilitator-auth-service.ts:26-27`
```ts
const expectedPassword = process.env.HARNESS_ADMIN_PASSWORD ?? "secret";
const expectedUsername = process.env.HARNESS_ADMIN_USERNAME ?? "facilitator";
```

**File:** `lib/participant-event-access-repository.ts:11`
```ts
const sampleEventCode = "lantern8-context4-handoff2";
```

If env vars are unset in production, these publicly-known defaults silently apply. The fix: throw at startup in Neon mode if required env vars are missing.

#### S2: No Security Headers (HIGH) — ADR: add minimal set

No CSP, `X-Frame-Options`, `X-Content-Type-Options`, HSTS, `Referrer-Policy`, or `Permissions-Policy` configured anywhere — not in `next.config.ts`, not in `vercel.json`. The app is vulnerable to clickjacking and MIME sniffing.

**Recommended minimal set for `next.config.ts`:**
```ts
headers: async () => [{
  source: "/(.*)",
  headers: [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-DNS-Prefetch-Control", value: "on" },
  ],
}]
```

#### S3: Non-Timing-Safe Password Comparison (MEDIUM)

**File:** `lib/facilitator-auth-service.ts:29` — File-mode Basic Auth uses `===` instead of `timingSafeEqual`. Minor timing oracle. Fix: use `crypto.timingSafeEqual` with Buffer comparison.

#### S4: No Rate Limiting on Device Auth Flow (MEDIUM)

`POST /api/auth/device/approve` has no rate limit. The 8-character user code (~37 bits entropy) is brute-forceable if an attacker knows a device authorization is pending. Add rate limiting or increase code length.

#### S5: No Input Validation Library (LOW)

No Zod, Joi, or similar. All API validation is manual `if (!body.field)`. No format, length, or type validation. Email addresses accepted as any non-empty string. SQL injection is not a risk (parameterized queries throughout), but malformed data can enter storage.

#### S6: Beta Auth Package (LOW)

`@neondatabase/auth@^0.2.0-beta.1` is a beta package handling production authentication. Monitor for stability issues and pin to a known-good version before the hackathon.

### Secret Management

| Check | Status |
|-------|--------|
| `.env.local` files in `.gitignore` | ✅ Confirmed |
| Secret files ever committed to git | ✅ Never committed |
| `NEXT_PUBLIC_` env vars exposing secrets | ✅ None found |
| Hardcoded secrets in source | ⚠️ Default credentials (S1) |
| gitleaks running in CI | ✅ v8.30.1 |
| Semgrep SAST | ✅ Auto-config |

---

## Architecture Bottlenecks

### B1: Whole-Document State Persistence (MEDIUM → being normalized)

`workshop_state` is a monolithic JSONB blob. The codebase is actively migrating to normalized tables (`teams`, `checkpoints`, `monitoring_snapshots`), with a dual-write bridge:

```ts
// Keep the workshop-state projection aligned during the migration window.
await getWorkshopStateRepository().saveState(instanceId, { ...state, teams: nextTeams });
```

**Risk:** The dual writes are not atomic. A crash between the dedicated-table write and the blob write leaves them out of sync. For hackathon: acceptable given single-facilitator model. Post-hackathon: complete the migration and drop the blob projection.

### B2: No Optimistic Locking (MEDIUM → ADR: fix)

`updateWorkshopState()` does read-modify-write with no version check. Two concurrent requests can silently overwrite each other. The fix is a `version` column on `workshop_instances` with a `WHERE version = $expected` guard on UPDATE.

**Implementation path:**
1. Add migration: `ALTER TABLE workshop_instances ADD COLUMN version INTEGER NOT NULL DEFAULT 1`
2. Include `version` in `WorkshopState` reads
3. In `updateWorkshopState()`, pass expected version to save, reject if mismatched
4. Return a clear error (409 Conflict) so the UI can retry

### B3: Delete-and-Reinsert Pattern for Teams/Sessions (LOW)

`replaceTeams()` does `DELETE FROM teams WHERE instance_id = $1` followed by sequential `INSERT`s — not transactional. A crash mid-sequence leaves partial data. Use a transaction or `ON CONFLICT` upsert pattern instead.

---

## Edge Cases and Failure Modes

### Lifecycle Drop-Off Table

| Failure Point | State Saved | State Lost | Recovery Path |
|---|---|---|---|
| Instance creation crashes after `createInstance` but before `saveState` | Instance record exists | No workshop state | Delete orphaned instance, recreate |
| Agenda mutation crashes mid-write | File mode: nothing (atomic write succeeded or didn't). Neon mode: partial blob update | Other concurrent changes | Re-read and retry; optimistic locking will prevent silent overwrite |
| Archive creation fails | State still live | Archive not persisted | Retry archive; no data loss |
| Presenter scene update races with agenda advance | Last write wins for scene order | Facilitator's intent for scene ordering | Optimistic locking resolves this |
| Participant redeems code during instance reset | Session may reference cleared state | Participant sees empty/broken state | Reset clears sessions; participant re-redeems |
| Migration fails during Vercel build | Build fails, deployment rejected | No production impact | Fix migration, re-push |
| Neon Auth service is down | `/admin/sign-in` fails | Cannot authenticate | File-mode fallback available locally; production has no fallback (by design) |

### Critical Gap

**Instance creation is not transactional.** `createWorkshopInstance()` writes to 6 different stores sequentially. A failure after step 2 leaves an instance record with associated state but no teams/checkpoints/monitoring initialization. The stores are independently consistent, but the instance may be in a partially-initialized state.

**Mitigation for hackathon:** Add a `status: "creating"` initial state and only transition to `"created"` after all stores are initialized. Check for `"creating"` status in the UI and show a retry prompt.

---

## Operational Readiness

| Capability | Status | Hackathon Action |
|------------|--------|-----------------|
| CI pipeline (unit + E2E + SAST) | ✅ Strong | None needed |
| Vercel deploy gating (`deploy-ready` status) | ✅ Implemented | Verify Vercel protected branch config |
| Error monitoring | ❌ None | ADR: defer (accept Vercel logs) |
| Health check endpoint | ❌ None | ADR: add `/api/health` |
| Global error boundary | ❌ None | Add `app/global-error.tsx` (minimal) |
| Security headers | ❌ None | ADR: add minimal set |
| Database backups | ⚠️ Relies on Neon managed backups | Verify Neon backup/PITR config |
| Log aggregation | ⚠️ Vercel function logs only | Accept for hackathon |
| Uptime monitoring | ❌ None | Consider free-tier UptimeRobot pointing at `/api/health` |
| Explicit `tsc --noEmit` in CI | ❌ Missing | Add to `verify-dashboard` job |

### CI Pipeline Summary

| Job | What It Does | Status |
|-----|-------------|--------|
| `verify-harness-cli` | Cross-platform (ubuntu/macos/windows) npm test + pack + smoke | ✅ |
| `verify-dashboard` | Vitest unit tests + lint + build + optional Neon integration | ✅ |
| `e2e-dashboard` | Playwright Chromium E2E (file mode) | ✅ |
| `secret-scan` | gitleaks v8.30.1 on commit range | ✅ |
| `sast-semgrep` | Semgrep auto-config on app/lib/scripts | ✅ |
| `dependency-review` | GitHub dependency review (PR only) | ✅ |
| `deploy-ready` | Aggregate gate → Vercel commit status | ✅ |

### E2E Coverage

Playwright covers: participant homepage (CS/EN), event code redemption, facilitator sign-in, workspace cockpit, instance control room, presenter view, facilitator API auth. Visual regression snapshots for key views. **Single browser (Chromium), single worker.**

---

## Code Quality & Patterns

### What's Done Well

1. **Repository pattern with test injection:** Every repository has `set*RepositoryForTests()` — clean dependency injection without a DI framework.
2. **Functional state updates:** `updateWorkshopState(updater, instanceId)` takes an updater function — immutable-style state transitions.
3. **`normalizeStoredWorkshopState()`** — self-healing reads that repair missing fields using seed defaults. Defensive against schema evolution.
4. **Blueprint/runtime split:** Canonical template (`workshop-blueprint-agenda.json`) is never mutated. Instances import and diverge.
5. **Presenter view model:** Pure derivation layer (`presenter-view-model.ts`, `presenter-scenes.ts`) — no I/O, just computed state. Easy to test.
6. **Atomic file writes:** temp + rename pattern prevents torn reads in file mode.
7. **Structured runtime alerts:** `emitRuntimeAlert()` with category/severity/metadata — good foundation for observability.

### Patterns to Watch

1. **Dual-write migration bridge:** Teams, checkpoints, and monitoring are written to both dedicated tables and the `workshop_state` blob. This is explicitly temporary but adds complexity and inconsistency risk.
2. **No API versioning or OpenAPI schema:** API contracts are implicit TypeScript types. Acceptable for a solo project but blocks external tooling.
3. **Manual validation everywhere:** No Zod or equivalent. Inconsistent validation depth across routes.
4. **Server Component direct imports:** Admin pages import `workshop-store.ts` directly (bypassing HTTP). This is a valid Next.js pattern but means the API routes and Server Components have different error handling paths.

---

## Hackathon Readiness — Execution Order

### Phase 1: Critical (before hackathon, ~3-4 hours)

| # | Task | Effort | Depends On |
|---|------|--------|-----------|
| 1.1 | Add security headers in `next.config.ts` | 30 min | — |
| 1.2 | Fail-closed: crash if `HARNESS_ADMIN_PASSWORD` / `HARNESS_EVENT_CODE` unset in Neon mode | 45 min | — |
| 1.3 | Add optimistic locking: `version` column + migration + store update | 2 hr | — |
| 1.4 | Add `/api/health` endpoint (returns storage mode, instance ID, Neon connectivity) | 30 min | — |
| 1.5 | Verify Vercel env vars are all set for production | 15 min | 1.2 |

### Phase 2: Important (before hackathon if time, ~2 hours)

| # | Task | Effort | Depends On |
|---|------|--------|-----------|
| 2.1 | Add `app/global-error.tsx` with minimal error UI | 30 min | — |
| 2.2 | Fix timing-safe comparison in Basic Auth (`timingSafeEqual`) | 15 min | — |
| 2.3 | Add rate limiting on device auth approve endpoint | 45 min | — |
| 2.4 | Add explicit `tsc --noEmit` step to CI | 15 min | — |
| 2.5 | Set up free-tier UptimeRobot on `/api/health` | 15 min | 1.4 |

### Phase 3: Post-Hackathon Improvements

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 3.1 | Complete migration from `workshop_state` blob to normalized tables | 4-6 hr | Remove dual-write bridge |
| 3.2 | Add Zod validation to all API routes | 2-3 hr | Start with mutation endpoints |
| 3.3 | Transactional instance creation (wrap 6 store writes) | 2 hr | Requires Neon transaction support |
| 3.4 | Add Sentry or equivalent error monitoring | 1 hr | Free tier sufficient |
| 3.5 | Cross-browser E2E (Firefox, WebKit) | 1 hr | Config change, may need snapshot updates |
| 3.6 | Filter `GET /api/workshop` to exclude non-active instances for unauthenticated requests | 30 min | Reduces information exposure |
| 3.7 | Pin `@neondatabase/auth` to a specific known-good version | 15 min | When stable release ships |
| 3.8 | Content Security Policy (CSP with nonces) | 2-3 hr | More complex than basic headers |

---

## Component Summary

| Component | Current State | Hackathon Action | Post-Hackathon |
|-----------|--------------|-----------------|----------------|
| Security headers | ❌ Missing | Add minimal set | Add full CSP |
| Default credentials | ⚠️ Hardcoded fallbacks | Fail-closed in Neon mode | — |
| Optimistic locking | ❌ Last-write-wins | Add version column | — |
| Health endpoint | ❌ Missing | Add `/api/health` | — |
| Error boundary | ❌ Missing | Add `global-error.tsx` | — |
| Error monitoring | ❌ Missing | Accept gap | Add Sentry |
| Input validation | ⚠️ Manual only | Accept for hackathon | Add Zod |
| Rate limiting | ⚠️ Partial (redeem only) | Add to device auth | Evaluate broader rate limiting |
| CI type checking | ⚠️ Implicit (build only) | Add `tsc --noEmit` | — |
| State migration | ⚠️ Dual-write bridge | Accept for hackathon | Complete normalization |
| Auth package | ⚠️ Beta (`0.2.0-beta.1`) | Monitor | Pin to stable |

**Deliberately not added:**
- Kubernetes, containers, or multi-region deployment (solo dev, Vercel handles this)
- Background job queue (synchronous is fine for current scale)
- OpenAPI spec generation (no external API consumers)
- Multi-browser E2E (Chromium is sufficient for hackathon validation)
- Full GDPR implementation (workshop is a controlled event, not a public SaaS)

---

## Appendix A: Environment Variable Inventory

| Variable | Required In | Purpose |
|----------|------------|---------|
| `HARNESS_STORAGE_MODE` | All | `"file"` or `"neon"` |
| `HARNESS_WORKSHOP_INSTANCE_ID` | Production | Active instance context |
| `HARNESS_DATABASE_URL` | Neon mode | Postgres connection string |
| `DATABASE_URL` | Neon mode (fallback) | Alternative connection string |
| `HARNESS_TEST_DATABASE_URL` | CI (optional) | Integration test database |
| `NEON_AUTH_BASE_URL` | Neon mode | Neon Auth API endpoint |
| `NEON_AUTH_COOKIE_SECRET` | Neon mode | Session cookie signing (32+ chars) |
| `HARNESS_ADMIN_USERNAME` | File mode | Basic Auth username |
| `HARNESS_ADMIN_PASSWORD` | File mode / Neon (fail-closed) | Basic Auth password |
| `HARNESS_EVENT_CODE` | Production | Active event access code |
| `HARNESS_EVENT_CODE_EXPIRES_AT` | Production | Code expiry timestamp |
| `HARNESS_DATA_DIR` | File mode | Root data directory |
| `HARNESS_PUBLIC_BASE_URL` | CLI device auth | Public URL for verification redirect |

## Appendix B: API Route Summary (39 routes)

| Auth Level | Count | Routes |
|------------|-------|--------|
| Public (no auth) | 6 | `GET /api/agenda`, `GET /api/briefs`, `GET /api/challenges`, `GET /api/rotation`, `GET /api/workshop`, `POST /api/event-access/redeem` |
| Participant session | 3 | `GET /api/event-context/core`, `GET /api/event-context/teams`, `GET /api/teams` |
| Facilitator | 25 | All `/api/workshop/*` mutations, `/api/admin/*`, `/api/monitoring`, `/api/checkpoints` POST, etc. |
| Device auth flow | 5 | `/api/auth/device/*` (mixed: start/poll open, approve/deny require session) |

## Appendix C: Migration Files

| File | Date | Purpose |
|------|------|---------|
| `2026-04-06-private-workshop-instance-runtime.sql` | 2026-04-06 | Core tables: instances, grants, sessions, teams, state |
| `2026-04-06-facilitator-identity-simplification.sql` | 2026-04-06 | Align grants with Neon Auth user IDs |
| `2026-04-06-drop-facilitator-identities.sql` | 2026-04-06 | Remove deprecated identity table |
| `2026-04-07-facilitator-cli-device-auth.sql` | 2026-04-07 | Device authorization flow tables |
| `2026-04-07-instance-lifecycle-and-agenda-authoring.sql` | 2026-04-07 | Instance lifecycle + agenda/scene CRUD |

---

*"The ships hung in the sky in much the same way that bricks don't." — but this architecture actually holds together rather well. The foundations are solid; what's needed now is tightening the bolts before the first real passengers board.*
