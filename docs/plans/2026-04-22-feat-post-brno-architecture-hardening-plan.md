---
title: "feat: post-Brno architecture hardening (drift prevention, auth atomicity, GDPR, live-event baseline, perf)"
type: plan
date: 2026-04-22
status: in_progress
brainstorm: ../2026-04-22-harness-lab-architecture-review.md
confidence: high
---

# Post-Brno Architecture Hardening

**One-line summary:** Close the seven architectural gaps surfaced in the 2026-04-22 architecture review — JSONB drift prevention with Zod, atomic Neon Auth account recovery with ephemeral reset codes, `/api/health` + deploy-freeze env + runbook incident scenarios, GDPR per-participant export/delete endpoints, three hot-path Neon query reductions, self-hosting env doc + author-ID cleanup, and a forward-only migration policy — as four days of dependency-ordered work in seven phases.

---

## Problem Statement

The 2026-04-22 monorepo architecture review (`docs/2026-04-22-harness-lab-architecture-review.md`) surfaced seven architectural problems that together form the backlog for making Harness Lab stable across the next workshop cohort and safer to self-host:

1. **The 2026-04-20 schema-drift incident class is not closed.** Three instance-level JSONB columns added since 2026-04-08 — `feedback_form`, `reference_groups`, `participant_copy` — have no read-time normalizer. The same structural pattern caused the production admin crash on 2026-04-20; the 04-22 `allow_quote_by_name` split-brain was a near-miss of the same class caught before production.
2. **Live-event operations rely on human vigilance.** No `/api/health` endpoint, no error monitoring beyond stdout, no mid-workshop deploy-freeze mechanism. A bad commit during a live workshop auto-deploys because the canonical deploy path is `git push origin main`. The Brno run survived on attention, not architecture.
3. **Mid-workshop password recovery has a critical gap.** `createParticipantAccount` in `dashboard/lib/participant-auth.ts:119-158` is a 2-step Neon Auth flow (control-plane user create + password set) with no atomicity. Step-1-success / step-2-failure produces an orphaned Neon Auth user, returned to the caller as `reason: "unknown"` (line 153-157). The admin reset-password endpoint requires `participant.neonUserId !== null` to recover, so participants whose first account-creation failed cannot be reset without direct SQL. On top of that, admin reset returns the plaintext temporary password in the JSON response body (`reset-password/route.ts:97-102`), which ends up in browser history and network logs.
4. **GDPR lifecycle is unimplemented.** No per-participant export, no hard-delete endpoint. Only soft-archive exists. Workshop participants in the EU (Brno was EU) have Art. 17/20 rights that the current codebase cannot fulfil without database surgery. `participant_feedback` and `workshop_feedback_submissions` accumulate indefinitely with no retention policy.
5. **Three hot-path query fan-outs are higher than they need to be.** Poll submit = 15 Neon HTTP calls per participant submission (`/api/participant/poll/route.ts:25` + `workshop-store.ts:1812-1841`). `replaceParticipants`/`replaceTeams` are serial N+1 loops (`participant-repository.ts:328-334`, `team-repository.ts:85-91`) — 51 sequential Neon calls to re-save 50 participants. Participant page poll is 30-second interval with 4-query `getWorkshopState` per tick (200 queries/30s at 50 concurrent, simultaneous burst on visibility-restore).
6. **Self-hosting docs miss five required env vars, and `.env.example:45-46` plus test scripts hardcode the template author's Neon project IDs as fallback.** `docs/self-hosting.md §4` lists 6 env vars; the code hard-requires 5 more (`HARNESS_EVENT_CODE_SECRET`, `NEON_API_KEY`, `HARNESS_NEON_PROJECT_ID`, `HARNESS_NEON_BRANCH_ID`, `BLOB_READ_WRITE_TOKEN`). Runtime path is clean — `admin-create-user.ts:54-60` returns `missing_credentials` when env is absent — but `.env.example:45-46` shows commented-out author IDs (`broad-smoke-45468927`, `br-hidden-firefly-aljj2dzm`) that a self-hoster could uncomment verbatim, and test/CI files default to those same IDs.
7. **Migration rollback policy is implicit.** Zero of 21 migrations have DOWN sections. `2026-04-22-feedback-consent-in-answers.sql` drops a column after backfill — permanently irreversible without a new forward migration. No written policy exists, so the first contributor who tries to "rollback a bad migration" has no guidance and no safety net.

Each problem is tractable on its own. Taken together they are the backlog that, once done, moves the platform from "works if Ondrej is paying attention during a workshop" to "works even when he isn't."

---

## Target End State

When this plan lands, the following is true:

1. **Zod parses every JSONB column on read.** `feedback_form`, `reference_groups`, `participant_copy`, and `workshop_state` all go through `safeParse`. Malformed rows normalize to defaults and emit a `HARNESS_RUNTIME_ALERT` line. A future required field in any JSONB shape is a parse-error-with-default, not an unhandled runtime crash.
2. **Live-event safety baseline is in place.** `/api/health` returns `{ok, mode, ts}` after a DB ping. UptimeRobot monitors it at 5-minute cadence with email alert. `HARNESS_WORKSHOP_ACTIVE=true` causes Vercel builds to abort, so a commit pushed during a live workshop does not auto-deploy. Runbook documents: dashboard-down mid-workshop, migration-fails-at-deploy, event-code emergency rotation, participant-redeem triage.
3. **Password recovery is atomic and log-safe.** `createParticipantAccount` detects `email_taken` on step 1 and routes through `setParticipantPasswordViaResetToken` on the existing Neon user instead of failing with `unknown`. Admin reset-password returns a 3-word ephemeral code (15 minute expiry) instead of a plaintext password; the participant is forced to set a new password on first login after using the code.
4. **GDPR Art. 17 and Art. 20 are implemented.** `GET /api/admin/participants/[id]/export` returns a JSON dump of all PII linked to that participant. `DELETE /api/admin/participants/[id]` hard-deletes across every linked table plus the Neon Auth user, all in a transaction. Both are facilitator-gated and audit-logged. `docs/privacy-participant-data.md` references the new endpoints.
5. **The three perf hotspots are fixed.** Poll submit is ≤5 Neon queries (down from 15). `replaceParticipants`/`replaceTeams` use single `INSERT ... ON CONFLICT` with `unnest` — 1 query to save N rows. Participant page polls a lean `/api/event-context/fingerprint` endpoint returning `{stateVersion, phaseLabel}` in a single query; full refresh only triggers on version change.
6. **Self-hosting docs + author-ID cleanup.** `.env.example:45-46` shows placeholders instead of real IDs. Test/CI scripts throw cleanly when env is absent instead of falling back to author IDs. `docs/self-hosting.md §4` and `docs/private-workshop-instance-env-matrix.md` list all 22 env vars including the 5 previously undocumented.
7. **Migration policy is written and visible.** `docs/migration-policy.md` describes forward-only + expand→contract + same-slice rules. Linked from `AGENTS.md` and `docs/internal-harness.md`.

---

## Scope and Non-Goals

### In scope

- Zod schema at repo boundary for all JSONB persistence (`workshop_state` + three instance-level JSONB columns)
- Atomic participant account creation (`participant-auth.ts`) with orphan recovery
- Ephemeral reset-code + force-change-on-login flow (replaces plaintext password in JSON)
- `/api/health` route (unauthenticated, minimal payload)
- UptimeRobot setup (external, via runbook — no secrets in repo)
- `HARNESS_WORKSHOP_ACTIVE` deploy-freeze env + Vercel buildCommand integration
- Four new runbook incident scenarios
- Three perf optimizations (poll submit, replaceParticipants/Teams, polling fingerprint)
- GDPR export + hard-delete endpoints, including Neon Auth user deletion
- Retention policy additions for `participant_feedback` and `workshop_feedback_submissions`
- CSP + HSTS headers on production
- Fail-closed defaults for file-mode admin credentials when `NODE_ENV=production`
- Rate-limiting on `/api/auth/device/start` + `/poll`
- `.env.example` cleanup (placeholders instead of author Neon IDs)
- Fail-loud test/CI scripts when Neon env absent
- Expanded `self-hosting.md §4` + env-matrix
- Forward-only migration policy document
- Delete orphaned `dashboard/data/facilitator-identities.json`

### Non-goals

- Rebuilding admin page with stale-while-revalidate caching (deferred; measure first post-fix)
- Sentry or full-stack error-tracking SaaS (stdout + UptimeRobot is the minimum viable tier per ADR 2)
- Self-service participant account portal with in-app export/delete UI (facilitator-mediated is sufficient at workshop scale)
- Job queue / background workers for archive or export (synchronous is fine at current scale)
- Migration framework swap (Prisma/Drizzle/Kysely) — current runner handles dual-mode correctly
- Normalizing JSONB into typed columns (Zod parsing is the chosen mitigation; column normalization is a bigger decision deferred)
- Redis or durable rate-limit store
- Multi-tenant facilitator isolation beyond current `instance_grants` model
- DOWN sections on existing migrations (the policy is forward-only; the 21 existing migrations remain as-is)
- Changing the 30-second participant polling cadence (only the per-poll cost, not the cadence)

---

## Proposed Solution

Seven phases, dependency-ordered. Each phase ends in a state that can ship independently. Phase 1 is the highest-ROI structural fix; Phases 2 and 6 add safety nets; Phases 3, 4, 5, 7 are smaller in risk and can be interleaved.

**Phase 1 — Close the open drift + auth atomicity class.** Add Zod to dependency tree. Write Zod schemas for the four JSONB shapes, parse on read with `safeParse`, normalize + alert on failure. In parallel, rewrite `createParticipantAccount` to recover from the orphan class and replace the admin reset-password response with an ephemeral code + force-change flow.

**Phase 2 — Live-event safety baseline.** Ship `/api/health`, register UptimeRobot monitor, wire `HARNESS_WORKSHOP_ACTIVE` env var into the Vercel buildCommand to abort deploys during live workshops, expand the runbook with four incident scenarios.

**Phase 3 — Performance fixes.** Pass already-fetched state through `submitActivePollResponse`. Rewrite `replaceParticipants`/`replaceTeams` as single `INSERT ... ON CONFLICT` with `unnest` array inputs. Add a lean `/api/event-context/fingerprint` endpoint for participant polling.

**Phase 4 — Self-hosting hardening.** Replace author Neon IDs in `.env.example` with placeholders, fail-loud in test/CI fallbacks, expand `self-hosting.md §4` and the env matrix.

**Phase 5 — GDPR lifecycle.** Per-participant export and hard-delete endpoints, including Neon Auth user deletion. Retention policy for feedback tables. Privacy policy doc update.

**Phase 6 — Security residuals.** CSP + HSTS headers. Fail-closed on default file-mode credentials in `NODE_ENV=production`. Rate-limit device-flow endpoints.

**Phase 7 — Migration policy + housekeeping.** Write `docs/migration-policy.md`. Delete orphaned `dashboard/data/facilitator-identities.json`.

---

## Detailed Plan Level

This is a **detailed** plan because it touches authentication atomicity (Phase 1), data persistence normalization (Phase 1), live-event operational infrastructure (Phase 2), participant PII deletion (Phase 5), security headers (Phase 6), and a live discrepancy between what `docs/self-hosting.md` claims and what the code requires (Phase 4). Multi-day scope, multiple independent risk surfaces, and the work should survive handoffs.

---

## Decision Rationale

### Why Zod at repo boundary, not alternatives

**Alternative considered: Expand `normalizeStoredWorkshopState` pattern to instance-level JSONB.** Rejected because the pattern is pure code duplication. A new required field means updating three normalizer functions that share no abstraction. The 2026-04-20 incident happened because the pattern existed but `participantCheckIns` wasn't covered; there is no type-level enforcement that every JSONB shape has a normalizer.

**Alternative considered: Migrate JSONB to normalized typed columns.** Strongest correctness but highest cost. `feedback_form` is genuinely shape-shifting per-instance (facilitator edits questions per workshop); normalizing it into rows would require a relational model for form questions, answers, and options that adds three tables and ~4 days of migration work. Deferred as a separate decision.

**Alternative considered: Ad-hoc normalizer only when a field becomes required.** This is the current state and the source of two near-incidents in 14 days. Rejected by ADR 1.

**Chosen: Zod schemas at repo boundary.** Single source of truth for each persisted shape (also usable for API request validation, doubling the value). `safeParse` + normalize-on-failure makes drift observable (`HARNESS_RUNTIME_ALERT`) rather than a 500. Type-level enforcement that the repo actually uses the schema. ~7h total for all four JSONB columns, one-time scaffold cost.

### Why ephemeral reset code + force-change, not just fixing atomicity

Admin reset-password today returns the plaintext password in the JSON response body (`reset-password/route.ts:101`). Network tabs, browser history, Vercel function logs, and any HTTP debugging tool cache this. Fixing just the atomicity issue leaves the log-leakage problem in place. The 3-word code format is already the project's speakable-secret convention (the initial password is generated in this format); reusing it for reset keeps the UX identical from the facilitator's perspective but removes the persistent-log exposure. Force-change-on-login closes the window where a cached reset code is still valid.

### Why UptimeRobot, not Sentry or Vercel log drain

ADR 2 chose the minimum viable stack. UptimeRobot free tier covers a single endpoint at 5-min cadence with email/SMS alert — sufficient to catch "the dashboard is down" during a workshop. Sentry's free tier (5k events/month) is fine for workshop scale but adds an SDK, an instrumentation call in every route, a source-map upload step, and a second dashboard to watch. For a solo operator, fewer dashboards is the right trade-off. Revisit post-Brno with actual incident logs.

### Why `HARNESS_WORKSHOP_ACTIVE` as a build-abort gate, not a feature flag

A feature flag would gate runtime behavior; the problem is at deploy time. Aborting the build at `vercel.json` buildCommand level is the cheapest intervention that stops a new deployment from promoting without disabling preview deploys or breaking CI on PRs. The env var can be flipped in the Vercel dashboard without a code commit (Vercel env var changes do trigger a redeploy by default — this is in the assumption audit).

### Why facilitator-mediated GDPR, not self-service

ADR 3 accepted this. At workshop scale (1-2 data-subject requests per year realistically) the cost of building a self-service portal (auth flow, session binding, abuse rate-limit, confirmation UX, undo window) vastly exceeds the cost of a facilitator handling each request manually via the admin endpoint. The endpoints are the minimum viable surface for a lawful GDPR response.

### Why fix all three perf hotspots now, not defer

User explicitly requested all three despite Brno having ended. The ~11h of work prevents 50-participant bursts from saturating the Neon HTTP endpoint in future cohorts, and two of the three are also incident-mitigations: the `replaceParticipants` serial N+1 could approach Vercel's 10s function timeout on reset paths, and the poll fan-out has an outage-amplification effect (if Neon slows down, the participant polling storm makes it worse).

### Why forward-only migrations, not DOWN sections

The existing 21 migrations have no DOWN sections, and most are structurally irreversible (column drops with backfills, constraint additions). Adding DOWN sections to new migrations only doesn't fix the existing ones, and expand→contract is the pattern that actually works in production: add new column → backfill → deploy bake-in → drop old column in a later migration. "Rollback" = write a new forward migration. This is already how the repo operates; the policy document just writes it down so future contributors follow the same rule.

---

## Constraints and Boundaries

- **Trunk-based development.** All work commits to `main`. No feature branches, no long-running topics. Per the `feedback_trunk_based_dev.md` memory entry.
- **Public-safety boundary.** Public template repo. No workshop-private data in committed files. `.env.example` and test fixtures stay demo-safe.
- **Dual-mode parity.** Every change that touches a repository must preserve `File*` + `Neon*` parity. File mode is not deprecated; it's the local-dev path.
- **AGENTS.md is the map, not the manual.** If a change adds a new recurring rule, document it in the relevant deeper doc and link from `AGENTS.md`, not inline.
- **Deploy via Git push.** Per the `feedback_deploy_via_git_not_cli.md` memory entry, deploys to `harness-lab-dashboard` come from `main` pushes, not manual `vercel --prod`. The `HARNESS_WORKSHOP_ACTIVE` mechanism must work with this flow.
- **Czech copy-editor gate.** Any participant-facing copy change runs through the `marvin:copy-editor` layer 1 + 2 passes per `.copy-editor.yaml`. Applicable to the new `/api/admin/participants/[id]/export` UI if one is added; the API itself has no participant-facing copy.
- **Pre-commit + pre-push Husky hooks.** Existing gates for generated content and copy-editor stay untouched. New CI checks (e.g., build-time env var validation for Neon mode) should run in the same workflow layer.
- **No Sentry, no Axiom, no Redis.** Per ADR 2 and the non-goals list. Minimum viable ops stack only.

---

## Assumptions

| # | Assumption | Status | Evidence / Verification Path |
|---|-----------|--------|------------------------------|
| 1 | Neon serverless HTTP driver supports `INSERT INTO ... SELECT unnest($1::text[]), ...` with multi-row upserts | Verified | Standard PostgreSQL syntax; Neon's HTTP driver is protocol-compatible. Confirm with a smoke test in Phase 3 before full implementation. |
| 2 | Zod parse overhead is negligible on Vercel Fluid cold start | Verified | Zod ~6KB gzipped, tree-shakeable. Adds <10ms to cold start per the zod bundle-size benchmarks. Smoke test bundle size in Phase 1 task 1. |
| 3 | Neon Auth control-plane API supports `auth.admin.setUserPassword` on an existing user (orphan recovery) | **Unverified** | Phase 1 task 3 must verify this before implementation. Fallback: if the API doesn't support it, the recovery path is to call `users.delete` then re-create — one extra API call, same end state. |
| 4 | UptimeRobot free tier handles a single 5-min monitor with email/SMS alerts | Verified | Free tier docs: 50 monitors at 5-min cadence, 10 contacts, email + SMS + webhook. Workshop-scale fits comfortably. |
| 5 | Vercel buildCommand non-zero exit fails the deploy without promoting | Verified | Standard Vercel behavior. Already relied on by `npm run db:migrate` in `vercel.json:3`. |
| 6 | `HARNESS_WORKSHOP_ACTIVE` env var change in Vercel dashboard triggers a redeploy | **Unverified** | Vercel env var changes *do* trigger redeploys by default for production, but the workshop-freeze mechanism needs to work before the redeploy completes. Verify in Phase 2 task 7: set the var, push a commit, confirm the build aborts. If Vercel queues the redeploy then processes, we need a different lever (e.g., disable the integration temporarily). |
| 7 | Neon Auth control-plane API supports user deletion via `DELETE /projects/{id}/branches/{id}/auth/users/{userId}` | **Unverified** | Required for GDPR hard-delete (Phase 5 task 17). Verify in Phase 5 research pass before writing the delete endpoint. If unsupported, fallback is to set the user to a disabled state + strip all PII from the record. |
| 8 | `/api/health` can run with `HARNESS_STORAGE_MODE=neon` without requiring facilitator auth | Verified by design | The endpoint is unauthenticated by design. It must not leak instance IDs, DB URL, or storage mode beyond the boolean `ok` + enum `mode: "neon" \| "file"`. Matches the 2026-04-08 companion posture. |
| 9 | The Zod schema for `FeedbackFormTemplate` can accommodate the existing feedback-consent-in-answers format (post-04-22 migration) | Verified | The schema is derived from the current TypeScript type. Existing rows already conform since the 2026-04-22 backfill migration. |
| 10 | `unnest` multi-row INSERT preserves input order for matching with parallel arrays | Verified | PostgreSQL guarantees array `unnest` order within a single row; joining two `unnest` columns produces ordered pairs. Documented behavior since PostgreSQL 9. |
| 11 | The ephemeral reset-code store (3-word codes with 15-min expiry) can be in-memory for workshop scale | Verified | ≤50 active participants × 1 reset at a time = trivial memory footprint. Lost on cold start is acceptable (participant re-requests code from facilitator). Same pattern as the existing initial-password code generation. |
| 12 | Participant page `router.refresh()` does not re-mount the tree, only re-fetches RSC data | Verified | Standard Next.js 16 App Router behavior. `router.refresh()` is specifically designed for this use case. |

**Unverified assumptions become blocking research tasks in the affected phase.**

---

## Risk Analysis

### R1: Zod migration breaks production reads on existing rows

**Likelihood:** Medium. **Impact:** High.

**Scenario:** The Zod schema is stricter than the actual DB state. A row that used to deserialize (silently dropping unknown fields) now fails `safeParse`, triggering normalization to defaults — which might lose real data.

**Mitigation:**
- Every Zod schema uses `.passthrough()` or `.catchall()` to tolerate extra fields during the bake-in window.
- Schema evolution rule: adding a new optional field is always safe; adding a required field requires a migration that backfills the default + a previous deploy that writes the new field.
- Ship Zod parsing first in "log-but-don't-normalize" mode (`safeParse` + alert + fall back to raw value), observe for a cohort, then flip to full normalization.
- Unit test each schema against production-shaped fixtures before merging.

**Detection:** `HARNESS_RUNTIME_ALERT` lines with `{category: "jsonb_parse_failure"}` in Vercel logs. UptimeRobot monitor will not catch this since it's non-fatal.

### R2: `unnest` INSERT pattern has a subtle correctness difference vs. sequential upserts

**Likelihood:** Low. **Impact:** High.

**Scenario:** The `DELETE + INSERT ... ON CONFLICT DO UPDATE` pattern must preserve the existing "atomic replace" semantics. A partial-failure window could leave some teams/participants absent.

**Mitigation:**
- Wrap the DELETE + INSERT in a single transaction (`BEGIN`/`COMMIT`) if Neon HTTP driver supports it in a single call; otherwise use `INSERT ... ON CONFLICT DO UPDATE` without the DELETE (upsert-only path) and soft-delete removed rows in a separate step.
- Unit test with a 50-participant fixture, verify final state matches sequential approach.
- Integration test with a concurrent-write scenario (two admin tabs hitting randomize).

**Detection:** Existing integration tests in `dashboard/lib/neon-runtime.integration.test.ts` should cover this — expand coverage for the replace path.

### R3: `HARNESS_WORKSHOP_ACTIVE` env var change triggers redeploy that races with the freeze

**Likelihood:** Medium. **Impact:** Medium.

**Scenario:** Ondrej flips the env var to `true` before a workshop. Vercel queues a redeploy to pick up the new env. That redeploy runs the buildCommand which aborts, leaving the previous (pre-freeze) deployment active. A subsequent commit pushes while the var is `true` — that build aborts correctly. Functional outcome is correct, but the UX is confusing: the act of *setting* the freeze triggers a no-op redeploy.

**Mitigation:**
- Documentation in runbook: "Setting HARNESS_WORKSHOP_ACTIVE triggers one redeploy that will be skipped; this is expected."
- Alternative: gate the freeze check on a combination of env var AND a timestamp window (requires more logic, less clean).
- Accept the confusing UX — it's one redeploy, not a cascade.

**Detection:** Phase 2 task 7 verification — confirm the abort-on-set behavior end to end and document.

### R4: Ephemeral reset-code loss on cold start strands a participant mid-workshop

**Likelihood:** Low. **Impact:** Low-Medium.

**Scenario:** Admin issues a reset code, the Vercel function cold-starts before the participant uses it, the in-memory code map is empty, participant gets "invalid code" error.

**Mitigation:**
- Facilitator re-issues the code from admin UI — same flow as the initial password reset. 30-second operation.
- Add a "reissue" button in the admin UI so this doesn't require re-navigating.
- Document in the runbook: "If a participant reports an invalid reset code, reissue — codes are ephemeral."

**Detection:** Support surface only — the participant reports it. No automated detection needed.

### R5: GDPR hard-delete cascade misses a table

**Likelihood:** Medium. **Impact:** Critical (non-compliance).

**Scenario:** The delete endpoint deletes from 6 tables, but a 7th table (e.g., a future `participant_notifications`) is added later without updating the cascade. Stale PII remains after a delete claim.

**Mitigation:**
- Centralize the cascade in a single `deleteParticipantAndLinkedData(participantId)` function. All FK relationships on `participants.id` must be enumerated in one place.
- Add a test that, for each table with a `participant_id` FK, confirms the cascade deletes the row. Use Postgres metadata (`information_schema.key_column_usage`) to generate the test matrix dynamically.
- Document in `docs/privacy-participant-data.md` that adding any new `participant_id` FK requires updating the cascade function in the same slice.
- Prefer DB-level `ON DELETE CASCADE` over application-layer cascade where possible.

**Detection:** Periodic audit query: `SELECT table_name FROM information_schema.key_column_usage WHERE referenced_table_name = 'participants'` — should match the centralized cascade list.

### R6: Running Phase 1 (Zod) partially and shipping could cause runtime-state read regressions

**Likelihood:** Low. **Impact:** High.

**Scenario:** Zod schemas added for 3 of 4 JSONB shapes. The 4th (`workshop_state`) is still using the legacy normalizer. A future change assumes Zod is everywhere and breaks the one non-Zod path.

**Mitigation:**
- Task ordering: complete all 4 Zod schemas in the same phase, as one unit.
- Checkbox completion in the plan tracks each schema individually but phase exit criteria require all four green.
- Add an eslint / grep rule (manual, documented) in `docs/internal-harness.md`: "Every JSONB column has a Zod schema at its repo boundary."

**Detection:** Phase 1 exit criterion — all four schemas implemented and tested.

### R7: Neon Auth user deletion is irreversible; accidental trigger of the GDPR endpoint is unrecoverable

**Likelihood:** Low. **Impact:** Critical.

**Scenario:** Facilitator clicks "delete participant" by mistake. Participant's Neon Auth account, all feedback, all responses, and team membership are gone. No undo.

**Mitigation:**
- Confirmation flow: the delete endpoint requires a `confirm: true` body parameter plus the participant's `displayName` as a confirmation string.
- Audit log entry on every delete with `actorNeonUserId` + `participantId` + timestamp. Retained beyond the 30-day policy for compliance.
- Admin UI shows a clear distinction between archive (reversible) and delete (not reversible) with a 5-second "undo" window on the soft-archive path.
- Documentation in `docs/privacy-participant-data.md`: "Hard-delete is for GDPR Art. 17 requests only. For other cleanup, use archive."

**Detection:** Audit log review. No automated undo possible by design.

---

## Implementation Tasks

Dependency ordering: tasks within a phase are ordered top-to-bottom. Phases can overlap at the boundaries but Phase 1 should complete before Phase 3 (both touch `workshop-store.ts`). Phase 2 is independent and can run in parallel with Phase 1.

### Phase 1 — Drift prevention + auth atomicity (~12h)

- [x] **1.1** Add `zod` to `dashboard/package.json` dependencies. Confirm bundle size impact (smoke test via `next build` output) and cold-start impact acceptable (<50ms added). (~0.5h)
- [x] **1.2** Write `FeedbackFormSchema` in `dashboard/lib/schemas/feedback-form-schema.ts`. Derive from the current `FeedbackFormTemplate` TypeScript type. Use `.passthrough()` on unknown fields during rollout. Unit test against malformed fixture + current-production fixture. (~1.5h)
- [x] **1.3** Write `ReferenceGroupsSchema` in `dashboard/lib/schemas/reference-groups-schema.ts`. Same pattern. (~1h)
- [x] **1.4** Write `ParticipantCopySchema` in `dashboard/lib/schemas/participant-copy-schema.ts`. Same pattern. (~0.5h)
- [x] **1.5** Write `WorkshopStateSchema` in `dashboard/lib/schemas/workshop-state-schema.ts`. Replaces `normalizeStoredWorkshopState` at `dashboard/lib/workshop-store.ts:645`. Preserve every existing default. Unit test against fixtures from the 2026-04-20 incident (missing `rotation`, missing `participantCheckIns`). (~3h) — **Scoped to a top-level shape guard** (not a full nested schema); the field-level defaults in `normalizeStoredWorkshopState` stay as the "fill in missing fields" layer. Delivers the observability win without writing ~20 nested schemas. See commit `23c15ed`.
- [x] **1.6** Wire Zod parse into `NeonWorkshopInstanceRepository` at the read path (replaces raw `row.feedback_form`, `row.reference_groups`, `row.participant_copy` passthroughs). On `safeParse` failure: emit `HARNESS_RUNTIME_ALERT` with `category: "jsonb_parse_failure"`, return the normalized default. (~2h)
- [x] **1.7** Wire Zod parse into `NeonWorkshopStateRepository` read path. Same alert pattern. Remove `normalizeStoredWorkshopState`. (~1h) — **`normalizeStoredWorkshopState` retained** per 1.5 scoping note; the shape guard runs at the repo boundary, the field normalizer downstream fills defaults. See commit `a4b7093`.
- [x] **1.8** **Research task (blocking 1.9):** Verify Neon Auth control-plane API behavior for `setParticipantPasswordViaResetToken` on an existing `neon_user_id` (orphan recovery). Test with a real orphan in a Neon preview branch. Document findings in a plan-scoped note if behavior differs from expectation. (~1h — blocks task 1.9) — **Finding:** `setParticipantPasswordViaResetToken` (see `lib/auth/server-set-password.ts`) takes a `neonUserId` and mints a reset-token + calls Neon Auth's `/reset-password` endpoint. It is indifferent to whether the user was just created or already exists — as long as the ID is valid. So orphan recovery works by looking up the existing user's `neonUserId` and calling this function. **Security gate:** orphan-recovery MUST verify the user has no password set (JOIN on `neon_auth.account` WHERE `providerId = 'credential'`); otherwise the flow would silently reset a legitimate user's password. Implemented in `findParticipantUserForRecovery` at `lib/auth/admin-create-user.ts`.
- [x] **1.9** Rewrite `createParticipantAccount` in `dashboard/lib/participant-auth.ts:119-158` to detect `email_taken` on step 1 and recover by calling `setParticipantPasswordViaResetToken` on the existing user. Unit test the orphan path. (~1h)
- [x] **1.10** Design the ephemeral reset-code flow: 3-word code (reuse the existing speakable-secret generator), 15-minute expiry, in-memory store per function instance, single-use. (~0.5h)
- [x] **1.11** Implement the ephemeral reset-code store + issue/consume API in `dashboard/lib/participant-reset-codes.ts`. (~1h)
- [x] **1.12** Rewrite `/api/admin/participants/[id]/reset-password/route.ts:97-102` response to return `{ok: true, participantId, displayName, resetCode}` (no `temporaryPassword`). Update admin UI to display the code. (~0.5h)
- [x] **1.13** Add force-change-on-login: participant uses the reset code at a new `/api/participant/redeem-reset-code` endpoint, is required to set a new password on first login, old code is consumed. Update participant UI to route through this path when `require_password_change: true` on the session. (~1h — extends scope slightly but needed for the security contract) — **Scoped to: the participant exchanges the code for a password they choose** (code + new-password in one request). Achieves the security goal (no plaintext in JSON, single-use, short TTL) without adding a session-lifecycle "require_password_change" flag. Best-effort session revocation after redeem preserves the "stale session dies on reset" property from the old admin-side flow.

**Phase 1 exit criteria:**
- `npm run test` passes including new Zod fixture tests
- Manual smoke test of participant account creation with the orphan scenario returns `ok: true` on retry (not `reason: "unknown"`)
- Manual smoke test of admin reset-password returns a 3-word code, participant uses it, is forced to set new password, old code is rejected on reuse

### Phase 2 — Live-event safety baseline (~4h)

- [x] **2.1** Write `dashboard/app/api/health/route.ts`. `GET` returns `{ok: true, mode, ts}` after `SELECT 1` DB ping. No instance IDs, no DB URL, no storage diagnostics. (~0.5h)
- [x] **2.2** Unit test the health endpoint: verify it works in both `file` and `neon` modes, and that it returns `503` (not `500`) if DB ping fails in neon mode. (~0.5h)
- [ ] **2.3** Set up UptimeRobot monitor (external, manual). Single HTTPS monitor on `https://harness-lab-dashboard.vercel.app/api/health`, 5-minute cadence, email alert to `os@ondrejsvec.com`. (~0.25h) — **External action for Ondrej.** Documented in runbook "Health and Uptime Monitoring" section.
- [x] **2.4** Write `dashboard/scripts/check-workshop-freeze.mjs`. Reads `process.env.HARNESS_WORKSHOP_ACTIVE`; if `=== "true"`, writes a message to stderr and exits 1. (~0.25h)
- [x] **2.5** Update `dashboard/vercel.json:3` buildCommand to run the freeze check before migrations + build: `node scripts/check-workshop-freeze.mjs && npm run db:migrate && npm run build`. (~0.25h)
- [ ] **2.6** Verify freeze mechanism end-to-end: set `HARNESS_WORKSHOP_ACTIVE=true` in Vercel, push a commit, confirm the build aborts without promoting. Document the redeploy-on-set behavior in runbook. (~0.75h — resolves assumption #6) — **External action for Ondrej.** Redeploy-on-set behavior documented in runbook "Live-Event Deploy Freeze" section. Script verified locally (exit 1 with flag set, exit 0 without).
- [x] **2.7** Expand `docs/workshop-instance-runbook.md` with four new scenarios: "Dashboard down mid-workshop", "Migration fails at deploy time", "Event-code emergency rotation", "Participant redeem stops working". Each is a 5-minute playbook with commands. (~1.5h)

**Phase 2 exit criteria:**
- `/api/health` returns 200 in production with `mode: "neon"` payload
- UptimeRobot monitor is active and sends a test alert to confirm wiring
- Freeze check aborts a live build when `HARNESS_WORKSHOP_ACTIVE=true`
- Runbook covers all four scenarios with copy-pasteable commands

### Phase 3 — Performance fixes (~11h)

- [x] **3.1** Modify `submitActivePollResponse` in `dashboard/lib/workshop-store.ts:1812-1841` to accept a pre-fetched `state` parameter. Update `/api/participant/poll/route.ts:25` to pass the state from the initial `getActivePollSummary` call. Remove the duplicate fetch. (~1.5h)
- [x] **3.2** Unit test poll-submit path to confirm query count dropped from 15 to ≤5. (~0.5h) — **5 tests in `workshop-store.poll-perf.test.ts` assert the pre-fetch pass-through skips state + list refetch.** Realistic HTTP-call floor is now 7 per submit (getWorkshopState: 4 parallel + list: 1 + member: 1 + upsert: 1), down from 15. Reaching ≤5 requires collapsing `getWorkshopState` into a single joined query — deferred as a bigger shape change.
- [ ] **3.3** Load test: 50 simulated concurrent poll submissions against a Neon preview branch. Verify no timeout, no error rate increase. (~1h) — **External action for Ondrej.** Requires a running Neon preview branch and a load-test harness not checked in.
- [x] **3.4** Rewrite `NeonParticipantRepository.replaceParticipants` at `dashboard/lib/participant-repository.ts:328-334`. Replace the DELETE + sequential upsert loop with: `DELETE FROM participants WHERE instance_id = $1 AND id != ALL($2::text[])` followed by a single `INSERT INTO participants (...) SELECT * FROM unnest($3::text[], $4::text[], ...) ON CONFLICT (id) DO UPDATE ...`. (~2h)
- [x] **3.5** Rewrite `NeonTeamRepository.replaceTeams` at `dashboard/lib/team-repository.ts:85-91` with the same pattern. (~1h)
- [x] **3.6** Integration test both `replaceParticipants` and `replaceTeams` with 50-row fixtures. Verify final state identical to the sequential implementation. (~1h) — **Added integration tests** (`participant-repository.integration.test.ts` + new `team-repository.integration.test.ts`). Gated on `HARNESS_TEST_DATABASE_URL`. Tests cover the 50-row round-trip, partial-replace (20 kept + 10 new), and empty-replace (full delete).
- [x] **3.7** Write `dashboard/app/api/event-context/fingerprint/route.ts`. `GET` returns `{stateVersion, phaseLabel}` from a single SQL: `SELECT state_version, workshop_state->'liveMoment'->>'currentPhaseLabel' AS phase_label FROM workshop_instances WHERE id = $1`. Participant session auth. (~1h) — **Phase label path corrected to `workshop_state->'workshopMeta'->>'currentPhaseLabel'`** (where the field actually lives).
- [x] **3.8** Update `dashboard/app/components/participant-live-refresh.tsx` polling logic: hit `/api/event-context/fingerprint` every 30s; only call `router.refresh()` when `stateVersion` changes. On visibility-restore, hit the fingerprint endpoint first (not `router.refresh()` directly). (~2h)
- [x] **3.9** Integration test the participant polling flow: verify `router.refresh()` is only invoked on actual state changes, not on every tick. (~1h) — **`participant-live-refresh.test.tsx`** (happy-dom) with 4 tests covering steady-state-no-refresh, version-change-refresh, phase-label-change-refresh, and network-error-skip.

**Phase 3 exit criteria:**
- Poll submit path measured at ≤5 Neon queries (via Neon SQL query log or instrumentation)
- `replaceParticipants` single-query path passes existing integration tests
- Participant polling, measured via browser network tab, makes ≤1 query per 30s in steady state (not 4)

### Phase 4 — Self-hosting hardening (~2.5h)

- [ ] **4.1** Replace `.env.example:45-46` commented-out author IDs with placeholder values: `HARNESS_NEON_PROJECT_ID=your-neon-project-id` and `HARNESS_NEON_BRANCH_ID=your-neon-branch-id`, with inline comment linking to `https://console.neon.tech/app/projects`. (~0.25h)
- [ ] **4.2** Modify `dashboard/scripts/create-test-branch.mjs:20` and `dashboard/scripts/delete-test-branch.mjs:19` to throw with a clear error when `HARNESS_NEON_PROJECT_ID` is not set, instead of defaulting to `broad-smoke-45468927`. (~0.25h)
- [ ] **4.3** Modify `dashboard/playwright.neon.config.ts:52,54` to throw instead of falling back to author IDs. (~0.25h)
- [ ] **4.4** Modify `dashboard/e2e/neon-mode/fixtures.ts:59,62` to throw instead of writing author IDs to `process.env`. (~0.25h)
- [ ] **4.5** Expand `docs/self-hosting.md §4 Configure Environment Variables` with: `HARNESS_EVENT_CODE_SECRET` (required, ≥32 chars in Neon mode), `NEON_API_KEY` (required for participant creation), `HARNESS_NEON_PROJECT_ID` (required), `HARNESS_NEON_BRANCH_ID` (required), `BLOB_READ_WRITE_TOKEN` (required for artifact feature). Include generation commands where applicable (e.g., `openssl rand -base64 48` for the secret). (~1h)
- [ ] **4.6** Expand `docs/private-workshop-instance-env-matrix.md` with the same 5 vars plus authoritative source-of-truth details (which file reads the var, default behavior, failure mode). (~0.5h)

**Phase 4 exit criteria:**
- Grep for hardcoded `broad-smoke-45468927` outside `.env.example` returns only commented documentation references
- Fresh `npm run test:e2e:neon` on a machine without author IDs set throws a clear error (not a silent auth failure later)
- `docs/self-hosting.md §4` lists all 11 Neon-mode env vars

### Phase 5 — GDPR lifecycle endpoints (~4h)

- [ ] **5.1** **Research task (blocking 5.3):** Verify Neon Auth control-plane API supports `DELETE /projects/{id}/branches/{id}/auth/users/{userId}`. If not, document the fallback (disable + PII strip). (~0.5h — resolves assumption #7)
- [ ] **5.2** Write `dashboard/lib/participant-data-export.ts` — function `exportParticipantData(participantId, instanceId)` that returns a JSON structure: participant row, sessions, team memberships, feedback messages, feedback submissions, poll responses, check-ins, audit log entries referencing this participant. (~1h)
- [ ] **5.3** Write `dashboard/lib/participant-data-deletion.ts` — function `deleteParticipantAndLinkedData(participantId, instanceId)`. Enumerates every table with a `participant_id` FK, deletes in dependency order within a transaction. Includes Neon Auth user deletion (or fallback from task 5.1). Returns a summary `{deletedRowsByTable, neonAuthUserDeleted}`. (~1.5h)
- [ ] **5.4** Write `dashboard/app/api/admin/participants/[id]/export/route.ts`. `GET` gated on facilitator-session + instance-grant, returns `exportParticipantData(...)` as JSON with `Content-Disposition: attachment`. Audit log entry. (~0.5h)
- [ ] **5.5** Write `dashboard/app/api/admin/participants/[id]/route.ts` `DELETE` handler. Requires body `{confirm: true, confirmDisplayName: string}`. Validates confirmation string against participant row before calling `deleteParticipantAndLinkedData`. Audit log entry with full pre-delete participant snapshot in metadata. (~0.5h)
- [ ] **5.6** Add retention cleanup for `participant_feedback` and `workshop_feedback_submissions` in `workshop-store.ts` alongside the existing `monitoringRetentionDays`/`auditRetentionDays` pattern. 90-day retention post-instance-archival. (~0.5h)
- [ ] **5.7** Update `docs/privacy-participant-data.md` with: "Individual participant data export and deletion is available via facilitator-invoked endpoints. See `docs/plans/archive/<this-plan>` for the implementation." List the endpoints and the tables covered by the cascade. (~0.25h)
- [ ] **5.8** Integration test: create a participant with feedback + poll responses + check-ins, call the export endpoint, verify all PII present. Then call the delete endpoint, verify all tables cleaned, Neon Auth user deleted. (~0.75h)

**Phase 5 exit criteria:**
- Export endpoint returns all linked PII in a single JSON payload
- Delete endpoint cascades across all `participant_id` FK tables + deletes the Neon Auth user (or applies documented fallback)
- Audit log contains pre-delete snapshots for all deletes
- `docs/privacy-participant-data.md` references the endpoints

### Phase 6 — Security residuals (~2.5h)

- [ ] **6.1** Add CSP + HSTS headers to `dashboard/next.config.ts:4-9`. CSP: start with `default-src 'self'; script-src 'self' 'nonce-{botid-nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.neon.tech https://*.vercel-storage.com; frame-ancestors 'none'`. HSTS: `max-age=63072000; includeSubDomains`. Verify no existing feature breaks (e.g., inline scripts in the admin surface). (~1h)
- [ ] **6.2** Modify `dashboard/lib/admin-auth.ts:60-65` `getExpectedFileModeCredentials()` to throw when `NODE_ENV=production` and the env vars match the default values (`facilitator`/`secret`). Unit test both branches. (~0.5h)
- [ ] **6.3** Add rate limiting to `dashboard/app/api/auth/device/start/route.ts:5-11` and `dashboard/app/api/auth/device/poll/route.ts`. Mirror `redeem-rate-limit.ts` pattern: 5 attempts per 10 min per fingerprint, logging `HARNESS_RUNTIME_ALERT` on limit. (~1h)

**Phase 6 exit criteria:**
- CSP + HSTS verified in browser devtools on production deployment
- `NODE_ENV=production` with default creds set throws at startup (tested in a preview deploy)
- Device-auth endpoints return 429 after 5 rapid requests

### Phase 7 — Migration policy + housekeeping (~1h)

- [ ] **7.1** Write `docs/migration-policy.md`. Rules: forward-only (no DOWN sections), expand→contract (add new → backfill → drop old in later migration after deploy bake-in), same-slice (code + migration in one commit), MIGRATION_ORDER pin is legacy and not required for new migrations (filename sort is sufficient). (~0.5h)
- [ ] **7.2** Link `docs/migration-policy.md` from `AGENTS.md` Framework Guidance section and from `docs/internal-harness.md`. (~0.25h)
- [ ] **7.3** Delete `dashboard/data/facilitator-identities.json` from the local working tree. Verify it stays gitignored. (~0.1h)

**Phase 7 exit criteria:**
- `docs/migration-policy.md` exists and is linked from `AGENTS.md`
- `dashboard/data/facilitator-identities.json` removed from local checkout

---

## Acceptance Criteria

Measurable signals that this plan is complete. Each maps back to a target end state above.

1. **Drift prevention:** `grep -r 'normalizeStoredWorkshopState' dashboard/` returns zero matches. All four JSONB shapes (`workshop_state`, `feedback_form`, `reference_groups`, `participant_copy`) go through a Zod `safeParse` at their repo boundary. A crafted malformed fixture produces a `HARNESS_RUNTIME_ALERT` line with `category: "jsonb_parse_failure"` and returns a normalized default without throwing.
2. **Live-event baseline:** `curl https://harness-lab-dashboard.vercel.app/api/health` returns `200 {"ok":true,"mode":"neon","ts":"..."}`. UptimeRobot dashboard shows an active monitor. Setting `HARNESS_WORKSHOP_ACTIVE=true` in Vercel and pushing a commit to `main` causes the build to abort without promoting.
3. **Atomic password recovery:** A test participant creation where step 1 succeeds and step 2 is artificially failed, followed by a retry with the same email, succeeds on retry (not `reason: "unknown"`). Admin reset-password returns `{resetCode}`, not `{temporaryPassword}`. Participant using the code is forced to set a new password; attempting to reuse the code returns `409 code_already_used`.
4. **GDPR:** `GET /api/admin/participants/{id}/export` returns a JSON payload containing at least: participant row, all team memberships, all feedback rows, all poll responses, all check-ins, audit log entries. `DELETE /api/admin/participants/{id}` with valid confirmation body removes all rows from all linked tables and the Neon Auth user (or applies the documented fallback); verified by a pre/post row count across all `participant_id` FK tables.
5. **Performance:** Poll submit measured in Neon query log shows ≤5 queries per request (down from 15). `replaceParticipants` integration test with 50 rows completes in ≤1 single query. `/api/event-context/fingerprint` returns in a single query. Participant polling in browser network tab shows ≤1 fingerprint request per 30-second window in steady state.
6. **Self-hosting:** `docs/self-hosting.md §4` lists all 11 Neon-mode env vars (up from 6). `grep -r broad-smoke-45468927 dashboard/` returns results only from `.env.example` comment annotations, not from code or config defaults. Test scripts throw when Neon env is absent.
7. **Migration policy:** `docs/migration-policy.md` exists, is linked from `AGENTS.md` Framework Guidance, and the standard is cited in the next migration's commit message.

---

## Phased Implementation Summary

| Phase | Focus | Effort | Blocks | Blocked by |
|-------|-------|--------|--------|------------|
| 1 | Drift prevention + auth atomicity | 12h | 3, 7 | — |
| 2 | Live-event safety baseline | 4h | — | — (independent) |
| 3 | Performance fixes | 11h | — | 1 (shared touch on `workshop-store.ts`) |
| 4 | Self-hosting hardening | 2.5h | — | — (independent) |
| 5 | GDPR lifecycle endpoints | 4h | — | 1 (reuses Zod patterns), 4 (docs consistency) |
| 6 | Security residuals | 2.5h | — | — (independent) |
| 7 | Migration policy + housekeeping | 1h | — | — (last; captures the discipline across phases) |
| **Total** | | **37h (~4 working days)** | | |

Recommended order if sequential: 1 → 2 → 3 → 4 → 5 → 6 → 7. If parallelizing: 1 + 2 + 4 can run concurrently; 3 waits for 1; 5 waits for 1; 6 + 7 at the end.

---

## References

- **Brainstorm / review source:** `docs/2026-04-22-harness-lab-architecture-review.md`
- **Prior reviews (superseded):** `docs/2026-04-06-private-workshop-instance-architecture-review.md`, `docs/2026-04-08-harness-lab-architecture-review.md` + companion
- **Prior related solutions:** `docs/solutions/infrastructure/facilitator-admin-production-state-and-schema-drift.md` (the 2026-04-20 incident this plan closes)
- **Prior related plans:**
  - `docs/plans/2026-04-19-fix-dashboard-owasp-security-remediation-plan.md` (status: complete — resolved earlier OWASP findings)
  - `docs/plans/2026-04-19-feat-participant-auth-hardening-and-identify-plan.md` (prior participant auth work)
  - `docs/plans/2026-04-20-refactor-retire-current-workshop-instance-singleton-plan.md` (retired `HARNESS_WORKSHOP_INSTANCE_ID`)
  - `docs/plans/2026-04-21-feat-cohort-artifacts-plan.md` (Vercel Blob integration — relevant for Phase 5 data export)
- **Relevant source files (non-exhaustive):**
  - `dashboard/lib/workshop-store.ts` — central mutation facade (touched in Phases 1, 3)
  - `dashboard/lib/participant-auth.ts` — 2-step Neon Auth creation (Phase 1)
  - `dashboard/lib/workshop-instance-repository.ts` — JSONB passthrough paths (Phase 1)
  - `dashboard/lib/auth/admin-create-user.ts` — control-plane user creation (Phase 1, 5)
  - `dashboard/app/api/participant/poll/route.ts` — 15-query hot path (Phase 3)
  - `dashboard/lib/participant-repository.ts` + `team-repository.ts` — N+1 loops (Phase 3)
  - `dashboard/app/components/participant-live-refresh.tsx` — 30s polling (Phase 3)
  - `dashboard/next.config.ts` — security headers (Phase 6)
  - `dashboard/vercel.json` — buildCommand (Phase 2)
  - `dashboard/.env.example` — author Neon IDs (Phase 4)
- **Doctrine + standards referenced:**
  - `AGENTS.md` — Working Rules, Trust Boundaries
  - `docs/plan-lifecycle-standard.md` — plan status transitions
  - `docs/harness-doctrine.md` — durable artifacts matching reality
  - `docs/workshop-instance-runbook.md` — operational surface touched by Phase 2
  - `docs/privacy-participant-data.md` — updated in Phase 5
  - `docs/self-hosting.md` — expanded in Phase 4
  - `docs/private-workshop-instance-env-matrix.md` — expanded in Phase 4
