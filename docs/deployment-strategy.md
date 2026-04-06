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
2. set the root directory to `dashboard`
3. configure environment variables for admin protection
4. configure participant event access secrets and expiry
5. connect production storage outside the repo
6. treat each real workshop as a private instance record, not a separate deployment

## Why One Project

- avoids project sprawl
- keeps improvements centralized
- supports multiple workshop instances from one dashboard
- matches the public template + private instance model

## Minimum Secret Rules

- facilitator credentials and participant event codes must not live in the public repo
- event-code rotation should happen through runtime config, not source edits
- session storage must be private and server-side
