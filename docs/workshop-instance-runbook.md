# Workshop Instance Runbook

This runbook is operational guidance. Architecture decisions and security gates now live in:

- [`2026-04-06-private-workshop-instance-runtime-topology.md`](adr/2026-04-06-private-workshop-instance-runtime-topology.md)
- [`2026-04-06-private-workshop-instance-auth-boundary.md`](adr/2026-04-06-private-workshop-instance-auth-boundary.md)
- [`private-workshop-instance-schema.md`](private-workshop-instance-schema.md)
- [`private-workshop-instance-auth-model.md`](private-workshop-instance-auth-model.md)
- [`private-workshop-instance-deployment-spec.md`](private-workshop-instance-deployment-spec.md)

## Current Deployment Baseline

- canonical Vercel project: `svecond2s-projects/harness-lab-dashboard`
- production URL: `https://harness-lab-dashboard.vercel.app`
- production branch: `main`
- preview deployments are protected by Vercel authentication before app routes execute
- production facilitator protection remains application-layer auth on protected routes
- Neon runtime project: `harness-lab` in `aws-eu-central-1`
- current Neon branch model: production `main`, preview `preview`

## Instance Configuration Model

Default company-scale model:

- one dashboard codebase
- one deployment
- many private workshop instances
- one private runtime layer as the source of truth for live event state

For four hackathons under one company, configure each event as a separate private instance record with:

- `instance_id`
- `template_id`
- real date
- venue and room
- participant event code and expiry
- facilitator auth config
- private workshop state and session storage

## Lifecycle

### 1. Create

- create a private workshop instance record
- choose the public blueprint reference it imports from
- attach real metadata outside the public repo:
  - date
  - venue
  - room
  - participant roster if needed
  - facilitator notes
- record which blueprint id/version or repo commit the instance imported

### 2. Prepare

- verify dashboard deployment
- verify `HARNESS_STORAGE_MODE=neon` deployments fail closed if Neon Auth env is incomplete; do not accept fallback to file-mode auth
- verify the target instance is in `prepared` state with the correct blueprint binding
- verify admin protection
- verify the required preview or production environment variables match [`private-workshop-instance-env-matrix.md`](private-workshop-instance-env-matrix.md)
- issue or rotate the shared participant event code
- verify the participant event code expiry window
- verify the facilitator can inspect participant access from the protected UI or `harness workshop participant-access`
- verify workshop skill files
- verify the chosen instance starts in a clean state
- verify participant access path and QR code
- verify anonymous `GET /api/workshop` returns only the public-safe projection, not facilitator-grade instance records
- verify preview or production checks required by [`private-workshop-instance-security-gates.md`](private-workshop-instance-security-gates.md) for any recent architecture-sensitive change

### 3. Run

During the workshop, facilitator uses the control plane to:
- run the live workshop from the `Run`, `People`, `Access`, and `Settings` sections
- move the live workshop moment
- register teams and repos
- review team-composition history when reshaping teams
- capture sprint updates and challenge completion signals
- reveal the continuation window at the right time from the live handoff context or the secondary recovery path
- review monitoring snapshots
- confirm the participant event code still works when onboarding late arrivals
- rotate the event code if it leaks or needs emergency reset

Agenda and presenter-scene changes do not happen through the dashboard UI anymore. For those changes, use the facilitator CLI/agent paths that call the instance-scoped runtime APIs directly.

Operator note:
- after a facilitator rotates participant access, the runtime keeps the hash as the durable record; the newly issued raw code should be copied from the protected response at that time rather than expected to remain perpetually revealable later

### 4. Reset

After a workshop:
- archive the live instance state from the protected admin surface or `POST /api/workshop/archive`
- revoke active participant sessions
- reset the next workshop by re-importing the selected blueprint into a clean runtime instance instead of reusing the archived one in place
- remove stale instances from the active control list only through the safe remove flow, not raw database deletion
- confirm no live team data remains in the active public-facing view
- if schema changes are pending, apply them through `cd dashboard && npm run db:migrate` against the intended database before validation or promotion

When public workshop content changes before an upcoming event:
- refresh the portable bundle first so installer-facing workshop guidance matches the repo sources
- treat existing instances as stale if the change affects blueprint-owned agenda, presenter, or participant-facing content that was imported during instance creation
- re-import the affected instance from the current blueprint with `harness instance reset <instance-id> [--template-id blueprint-default]`
- to skip the deployment wait, use `harness instance reset <instance-id> --from-local` after running `bun scripts/content/generate-views.ts` locally
- for a one-off local event variant that must stay out of git, use `harness instance reset <instance-id> --blueprint-file <path-to-local-pack.json>`
- if the live instance should keep its operational state and you only need to patch content, use `harness instance sync-local <instance-id> --blueprint-file <path-to-local-pack.json>` to update matching agenda items and scenes through the protected content APIs
- do not reset just for dashboard-only code changes unless the imported instance content itself changed

### 5. Archive

- store the final workshop-state snapshot in private storage
- note that reset now creates an automatic pre-reset archive before clearing runtime state
- export any closing notes or retrospective inputs
- keep public repo improvements separate from private event records
- apply retention and cleanup rules from [`private-workshop-instance-schema.md`](private-workshop-instance-schema.md)
- review structured `HARNESS_RUNTIME_ALERT` log lines for auth failures, redeem throttling, and archive events
- use platform monitoring or protected surfaces for runtime diagnostics; do not add public instance or DB diagnostics to anonymous endpoints without an explicit review

## Rule

Do not create a new public repo or a new Vercel project per workshop unless there is a very strong operational reason.

Default model:
- one public template repo
- one dashboard codebase
- many private workshop instances

## Event Access Rules

- one active participant event code per workshop instance
- participant event code is separate from facilitator auth
- participant sessions are short-lived and can be renewed by re-entering the same event code
- the participant dashboard stays public until private context is requested
- `workshop-skill` should prefer `/workshop login` as the explicit auth path
- facilitator identity is global, but authorization remains per instance grant
- facilitator login bootstrap should not require the target workshop instance record to pre-exist
- the admin workspace and instance-creation flow are platform-scoped surfaces; they should not require a grant on an arbitrary first workshop
- control-room pages and workshop mutations stay instance-scoped and should fail clearly when the target instance is unknown or the default instance is missing
- facilitator skill privileged commands should route through the `harness` CLI for local auth/session handling
