# Deployment Strategy

## Goal

Run one canonical dashboard codebase on Vercel while keeping real workshop-instance data outside the public template repo.

## Recommended Runtime Model

### Code

- one public GitHub repository
- one Vercel project for `dashboard/`

### Data

- local file-backed storage for development
- private workshop-instance storage for production

Recommended production shape:
- `workshop_instances`
- `workshop_state`
- `participant_event_access`
- `participant_sessions`
- `teams`
- `checkpoints`
- `monitoring_snapshots`
- `rotation_events`

The current seam for replacing local storage is:
- [`workshop-state-repository.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-state-repository.ts)

Authoritative follow-on specs:

- [`2026-04-06-private-workshop-instance-runtime-topology.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/adr/2026-04-06-private-workshop-instance-runtime-topology.md)
- [`private-workshop-instance-schema.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-schema.md)
- [`private-workshop-instance-deployment-spec.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-deployment-spec.md)
- [`private-workshop-instance-security-gates.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-security-gates.md)

## Access Model

- participant surface may be public or lightly protected with one shared event password
- facilitator surface must be protected
- admin mutations must require credentials

Current local/prototype mechanism:
- `HARNESS_ADMIN_PASSWORD`
- optional `HARNESS_ADMIN_USERNAME`

Participant event access additions:
- `HARNESS_EVENT_CODE`
- optional `HARNESS_EVENT_CODE_EXPIRES_AT`
- file-backed or hosted session storage for redeemed participant sessions
- HTTP-only cookie transport on the dashboard participant surface

## Vercel Setup

Recommended:

1. create one Vercel project for `dashboard/`
2. set the root directory to `dashboard` if you use Vercel's native Git integration
3. configure environment variables for admin protection
4. configure participant event access secrets and expiry
5. connect production storage outside the repo
6. treat each real workshop as a private instance record, not a separate deployment

## Git-Driven Deployments

This project is configured to use Vercel's native Git integration against the linked GitHub repository:

- pull requests create preview deployments
- pushes to `main` create production deployments

Current production-safe setup:

1. one Vercel project linked to `ondrej-svec/harness-lab`
2. Vercel project root directory set to `dashboard`
3. production branch set to `main`
4. runtime secrets stored in Vercel project environment variables

Verification on 2026-04-06:

- project: `harness-lab-dashboard`
- owner scope: `svecond2s-projects`
- root directory: `dashboard`
- production redeploy completed successfully after the root-directory fix

Recommended deployment check wiring in Vercel:

- require `Dashboard CI / deploy-ready` before production promotion
- let `Dashboard CI / deploy-ready` aggregate build, test, e2e, secret scan, Semgrep SAST, and optional PR dependency review
- enable repository variable `ENABLE_DEPENDENCY_REVIEW=true` only if the repository plan supports GitHub dependency review for private repos

Why this setup exists:

- it removes the current root-directory mismatch that breaks repo-root builds
- it keeps preview and production deploys on the default Vercel Git path
- it avoids maintaining a second deploy system in GitHub Actions

## Why One Project

- avoids project sprawl
- keeps improvements centralized
- supports multiple workshop instances from one dashboard
- matches the public template + private instance model

## Minimum Secret Rules

- facilitator credentials and participant event codes must not live in the public repo
- event-code rotation should happen through runtime config, not source edits
- session storage must be private and server-side
- preview deployments should be protected when they expose private-runtime integrations

See also:

- [`private-workshop-instance-data-classification.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-data-classification.md)
- [`public-launch-history-cleanup-plan.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/public-launch-history-cleanup-plan.md)
