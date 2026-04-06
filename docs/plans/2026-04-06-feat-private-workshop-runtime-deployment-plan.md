---
title: "feat: deploy private workshop runtime to preview and production"
type: plan
date: 2026-04-06
status: in_progress
brainstorm: /Users/ondrejsvec/projects/Bobo/harness-lab/docs/brainstorms/2026-04-06-private-workshop-instance-model-brainstorm.md
confidence: medium
---

# Private Workshop Runtime Deployment Plan

Move Harness Lab from a locally runnable, deployment-prepared state into a real Vercel + Neon preview/production setup with explicit bootstrap steps, promotion gates, secret handling, and rollback rules.

## Problem Statement

The application runtime is now production-shaped, but the actual deployment path is still only partially operational.

Today the repo has:

- a documented Vercel + Neon deployment model in [`private-workshop-instance-deployment-spec.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-deployment-spec.md)
- CI and preview-safety validation in [`dashboard-ci.yml`](/Users/ondrejsvec/projects/Bobo/harness-lab/.github/workflows/dashboard-ci.yml) and [`private-runtime-preview-gate.yml`](/Users/ondrejsvec/projects/Bobo/harness-lab/.github/workflows/private-runtime-preview-gate.yml)
- a runtime that can run in file mode or Neon mode from [`dashboard/.env.example`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/.env.example)
- no checked-in Vercel project config, no linked project metadata, no automated deployment workflow, and no confirmed secret inventory loaded into real preview/production environments

This matters because the system is now implementationally ready enough that the main remaining gap is operational: if preview and production are not bootstrapped deliberately, the repo will keep claiming a deployment model that exists only on paper.

## Proposed Solution

Adopt a two-layer deployment model:

1. use **Vercel Git integration** as the canonical steady-state delivery path for preview and production deployments
2. use the **Vercel CLI** only for bootstrap, environment-variable management, local environment pulls, and emergency/manual recovery

Pair that with Neon’s Vercel integration so preview deployments get isolated preview database branches, while production points at one stable production branch/database. Treat GitHub Actions as the release gate and Vercel as the deployment executor.

Concretely, the plan does four things:

- bootstrap one canonical Vercel project for `dashboard/`
- connect one production Neon project plus preview-branch automation
- load and verify preview/production environment variables and protection rules
- rehearse the promotion path from branch -> protected preview -> production

## Detailed Plan Level

This is a **detailed** plan because deployment here touches infrastructure ownership, secret handling, environment separation, preview database branching, CI integration, and production rollback.

## Decision Rationale

### Why use Vercel Git integration as the default deployment path

- The repo is already structured as a standard Next.js app under `dashboard/`, which fits Vercel’s native Git-driven deployment model.
- The deployment spec already assumes one preview deployment per branch or pull request and one production deployment from the production branch.
- Letting Vercel own deployment triggering is simpler and less fragile than rebuilding that behavior in GitHub Actions.

### Why still use the Vercel CLI

- The CLI is the right tool for first-time project linking, environment-variable pulls, emergency redeploys, and explicit operator actions.
- The official CLI supports path-scoped deploys and environment management, which is useful because this repo is not rooted at `dashboard/`.
- Using CLI for bootstrap avoids checking in local `.vercel` state while still giving operators a repeatable setup path.

### Why not make GitHub Actions deploy to Vercel first

- The repo already has GitHub Actions as verification gates, not deployment workers.
- A GitHub-driven deploy job would duplicate Vercel’s preview behavior and increase secret surface with little benefit.
- The cleaner operating model is: GitHub Actions verify, Vercel deploys, Neon provisions preview branches through the integration.

### Why prefer Neon’s Vercel integration over custom branch automation first

- Neon’s official Vercel integration already supports one branch per preview and environment-variable injection.
- That is closer to the deployment spec already accepted by the project than building a custom GitHub Action branch workflow first.
- Custom branch automation remains a fallback only if the native integration turns out to be operationally awkward.

### Why split bootstrap from go-live

- The first risk is configuration drift or missing secrets, not application code.
- A dry run through preview should happen before any production cutover so missing env vars, auth boundaries, and migration assumptions surface under lower pressure.
- This keeps the first real production deployment from being the first time the infra shape is exercised.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| One Vercel project rooted at `dashboard/` is still the correct operating model | Verified | The original brainstorm chose one shared deployment, and [`private-workshop-instance-deployment-spec.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-deployment-spec.md) defines one Vercel project for `dashboard/` |
| GitHub Actions should remain release gates rather than the primary deployment runner | Verified | The repo currently contains verification workflows only and no deployment workflow, which aligns with the deployment spec’s preview/promotion model |
| Vercel CLI is appropriate for bootstrap and emergency operations but not required for every normal deployment | Verified | Vercel’s current CLI supports project linking and manual preview/production deploys, while official env docs treat Git-driven preview and production as the normal path [Vercel CLI docs](https://vercel.com/docs/cli/deploy), [env docs](https://vercel.com/docs/projects/environment-variables) |
| Neon’s Vercel integration can provide one database branch per preview deployment | Verified | Neon’s current integration docs explicitly describe one isolated database branch per preview plus environment-variable injection [Neon guide](https://neon.com/docs/guides/vercel/), [branch-per-preview](https://neon.com/flow/branch-per-preview) |
| Preview deployments can be protected at the Vercel project layer without breaking middleware-based auth | Verified | Vercel’s current deployment protection docs state protection applies to all requests, including Middleware [Deployment Protection](https://vercel.com/docs/deployment-protection) |
| Production deployment protection requirements will fit the chosen Vercel plan | Unverified | Current Vercel docs show stronger production protection options depend on plan level, and the actual team/project plan is not yet confirmed |
| The repo’s current environment-variable surface is complete enough for preview and production bootstrapping | Unverified | [`dashboard/.env.example`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/.env.example) still reflects mostly local/demo defaults, not a finalized production env inventory |
| Preview branches should inherit production-like schema but not necessarily real workshop data | Verified | The architecture review explicitly recommended schema-only or sanitized preview data for privacy-sensitive previews |
| The current build pipeline is sufficient to apply database migrations during preview/prod deploys | Unverified | The repo has runtime SQL migration files but no checked-in migration runner in Vercel build settings yet |

Unverified assumptions should be resolved during bootstrap phases before production promotion is considered complete.

## Risk Analysis

### Risk: project bootstrap is done inconsistently between local CLI state and the Vercel dashboard

If the project is partially linked through CLI but environment settings live only in someone’s browser state, the deployment process becomes tribal knowledge.

Mitigation:

- treat CLI steps as reproducible bootstrap commands, not private one-off actions
- record the exact dashboard settings and env-variable matrix in repo docs during the work
- avoid committing `.vercel/` metadata unless the team explicitly chooses that pattern

### Risk: preview deployments point at the wrong database or wrong secrets

If preview and production env vars are mixed, a normal branch preview could read or mutate production workshop data.

Mitigation:

- connect Neon preview branching before broad preview usage
- use separate preview and production environment variables in Vercel
- verify a preview deployment shows a preview-grade `HARNESS_STORAGE_MODE=neon` path without production workshop records

### Risk: deployment protection assumptions do not match the actual Vercel plan

The docs support strong preview protection broadly, but production-domain protection depends on Vercel plan tier.

Mitigation:

- verify the account plan before finalizing protection posture
- treat preview protection as mandatory and production-domain protection as a plan-sensitive configuration item
- keep application-layer facilitator auth as the real protected-route boundary regardless of plan tier

### Risk: migrations are applied manually and drift from deployments

The runtime schema exists in the repo, but no automated production migration step is wired into deployment yet.

Mitigation:

- make migration execution an explicit deployment phase with one owner and one command path
- verify migrations on preview Neon branches before production promotion
- document whether migrations run in Vercel build, a separate operator command, or a dedicated one-off workflow

### Risk: first production deployment doubles as first integrated systems test

If preview, Neon branching, env injection, and protection are all only tested at production cutover, failures will compound.

Mitigation:

- require a dry-run preview branch with full runtime checks before production
- treat preview validation as a real rehearsal, not just a green CI badge
- block production until the preview rehearsal succeeds end to end

## Phased Implementation

### Phase 1: Define the deployment contract and secret inventory

Goal: freeze exactly what must exist in Vercel and Neon before any bootstrap begins.

Tasks:
- [x] Inventory the real environment variables needed for file/demo, preview, and production, replacing the current demo-biased `.env.example` assumptions with a deployment-grade env matrix.
- [x] Decide the canonical production branch and the exact preview trigger model: `main` is the canonical production branch and Vercel Git-connected preview deployments remain enabled for preview branches.
- [x] Decide whether production will rely only on application-layer auth or also on Vercel production-domain deployment protection, based on the actual Vercel plan.
- [x] Decide how migrations are executed: Vercel build step, separate operator command, or dedicated workflow.
- [x] Update deployment docs so the bootstrap path names the required dashboards, integrations, secrets, and owners explicitly.

Exit criteria:

- one written env inventory exists for preview and production
- one written migration path exists
- protection posture is explicit rather than assumed

### Phase 2: Bootstrap the Vercel project and local operator path

Goal: create the real Vercel project and a repeatable local operator flow without deploying production yet.

Tasks:
- [x] Create one Vercel project for `dashboard/` and set its root directory correctly.
- [x] Link the local repo with `vercel link` or equivalent CLI flow and verify operators can pull env vars with `vercel env pull`.
- [x] Confirm the Git repository is connected so non-production branches create preview deployments automatically.
- [x] Configure preview deployment protection in the Vercel dashboard and verify it covers Middleware and protected routes.
- [x] Document the exact bootstrap commands and dashboard settings used so another operator can repeat them from scratch.

Exit criteria:

- one Vercel project exists and is linked to this repo
- operators can pull development/preview env vars locally through the CLI
- preview protection is active and verified

### Phase 3: Connect Neon and preview database branching

Goal: make previews data-safe and schema-safe.

Tasks:
- [x] Create or select the canonical Neon production project/branch for Harness Lab.
- [ ] Connect the Neon project to Vercel using the official integration, choosing Preview and Production environments deliberately.
- [ ] Enable one-database-branch-per-preview behavior for preview deployments.
- [x] Verify preview deployments receive injected database environment variables and do not share the production branch directly.
- [x] Decide whether preview branches use schema-only/sanitized data and document the policy explicitly.
- [ ] Define cleanup behavior for obsolete preview branches after PR close or merge.

Exit criteria:

- preview deployments get isolated Neon branches
- production points to one stable production database path
- preview data policy is explicit and privacy-safe

### Phase 4: Wire promotion-grade validation

Goal: make previews meaningful enough that promotion is a real decision point.

Tasks:
- [ ] Add or refine any missing GitHub secrets required for `dashboard-ci.yml` and `private-runtime-preview-gate.yml` to pass against the real preview-grade Neon test database.
- [ ] Verify the preview-sensitive workflow runs on a DB/auth change and blocks promotion when the Neon secret is missing or invalid.
- [ ] Run one branch through the full path: CI -> protected preview deploy -> exploratory browser pass -> facilitator and participant flow validation.
- [ ] Verify archive/reset, participant redemption, and admin-protected actions behave correctly on the preview deployment.
- [ ] Inspect runtime logs/alerts for expected `HARNESS_RUNTIME_ALERT` signals and confirm they are observable in the real hosting environment.

Exit criteria:

- preview validation is exercised on a real branch
- CI and hosting behavior are consistent with each other
- browser and runtime checks prove the preview is promotion-worthy

### Phase 5: Production cutover and rollback rehearsal

Goal: move from preview-ready to actually operable in production.

Tasks:
- [x] Load the production environment variables in Vercel with explicit environment scoping.
- [x] Apply the production database schema through the chosen migration path before or during the first production release.
- [x] Perform one intentional production deployment from the canonical production branch.
- [ ] Validate participant public entry, participant event-code redemption, facilitator login, one read-only protected path, and one protected write path in production.
- [ ] Confirm rollback steps are executable: previous deployment visibility in Vercel, schema rollback/branch strategy in Neon, and secret rotation rules if auth material leaks.
- [x] Record the first production deployment result and any follow-up infra corrections in the runbook.

Exit criteria:

- one successful production deployment exists
- one real production verification pass is documented
- rollback is not theoretical

## Implementation Tasks

Dependency-ordered tracker for `$work`:

- [x] Audit the current env surface and write a deployment-grade preview/production env matrix.
- [x] Decide and document the migration execution path for preview and production.
- [x] Bootstrap the canonical Vercel project for `dashboard/` and verify local CLI linking.
- [x] Configure preview deployment protection and confirm the chosen production protection posture.
- [ ] Connect Neon to Vercel and enable one branch per preview deployment.
- [x] Verify preview deployments receive the correct database env vars and branch isolation.
- [ ] Load GitHub Actions secrets required for preview-grade integration checks.
- [ ] Exercise one full preview rehearsal from branch push to browser validation and log inspection.
- [x] Load production env vars, run the production schema path, and perform the first real production deployment.
- [ ] Rehearse rollback and update the runbook with the final operator-grade deployment procedure.

## Acceptance Criteria

- one real Vercel project is linked to `dashboard/` and connected to the repo’s Git provider
- preview deployments are protected and use preview-scoped environment variables
- DB/auth-sensitive previews use isolated Neon branches rather than the production database directly
- GitHub Actions gates required by the repo can run against real preview-grade secrets
- the team can name one exact command/dashboard path for linking, env pull, preview validation, and production promotion
- one preview rehearsal and one production verification pass have both been completed and documented
- rollback steps are concrete enough that an operator can execute them without rediscovery

## Current Execution Notes

- The canonical Vercel project `harness-lab-dashboard` now exists under the `svecond2s-projects` scope and `dashboard/` is linked locally through the Vercel CLI.
- `ondrej-svec/harness-lab` is connected to the Vercel project and `main` is the intended production branch.
- Local operator verification works through `cd dashboard && vercel env pull .env.vercel.local --scope svecond2s-projects`.
- Preview and Production Vercel environment variables are loaded for `HARNESS_STORAGE_MODE`, `HARNESS_WORKSHOP_INSTANCE_ID`, `HARNESS_DATABASE_URL`, `HARNESS_ADMIN_USERNAME`, `HARNESS_ADMIN_PASSWORD`, `HARNESS_EVENT_CODE`, and `HARNESS_EVENT_CODE_EXPIRES_AT`.
- The canonical Neon project is `harness-lab` (`broad-smoke-45468927`) in `aws-eu-central-1`, with production branch `main` and a schema-only preview branch `preview`.
- Database schema migrations have been applied successfully to both the production and preview Neon branches through `cd dashboard && npm run db:migrate`.
- The preview deployment is live at `https://harness-lab-dashboard-5cqclkwyz-svecond2s-projects.vercel.app` and is protected by Vercel authentication at the deployment layer.
- The production deployment is live at `https://harness-lab-dashboard.vercel.app`.
- Manual/runtime verification completed so far:
  - preview root returns a Vercel authentication wall
  - preview protected API access is blocked before app middleware runs
  - production root is publicly reachable
  - production protected API access without facilitator auth returns `401`
- The official Neon Vercel integration and one-branch-per-preview automation are still not enabled. The current deployment uses manually scoped `HARNESS_DATABASE_URL` values in Vercel instead.
- GitHub Actions secret wiring, full browser rehearsal, and rollback rehearsal remain unfinished.

## References

- Brainstorm: [`2026-04-06-private-workshop-instance-model-brainstorm.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/brainstorms/2026-04-06-private-workshop-instance-model-brainstorm.md)
- Deployment spec: [`private-workshop-instance-deployment-spec.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-deployment-spec.md)
- Deployment strategy: [`deployment-strategy.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/deployment-strategy.md)
- Runbook: [`workshop-instance-runbook.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/workshop-instance-runbook.md)
- CI workflow: [`dashboard-ci.yml`](/Users/ondrejsvec/projects/Bobo/harness-lab/.github/workflows/dashboard-ci.yml)
- Preview gate workflow: [`private-runtime-preview-gate.yml`](/Users/ondrejsvec/projects/Bobo/harness-lab/.github/workflows/private-runtime-preview-gate.yml)
- Vercel CLI deploy docs: https://vercel.com/docs/cli/deploy
- Vercel environment variables docs: https://vercel.com/docs/projects/environment-variables
- Vercel deployment protection docs: https://vercel.com/docs/deployment-protection
- Neon Vercel integration docs: https://neon.com/docs/guides/vercel/
- Neon branch-per-preview guide: https://neon.com/flow/branch-per-preview
