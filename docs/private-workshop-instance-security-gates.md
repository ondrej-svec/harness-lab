# Private Workshop-Instance Security and Quality Gates

This document defines the minimum non-negotiable checks for architecture and implementation work that touches private workshop-instance behavior.

## Principle

Harness Lab should not claim secure, agent-era engineering discipline unless the repo encodes both feedforward rules and practical sensors.

## Required Automated Checks

### Unit tests

Cover:

- auth/session utilities
- repository scoping and `instance_id` enforcement
- permission evaluation
- state transitions for workshop lifecycle logic

### Repository and integration tests

Cover:

- production repository adapters against realistic schemas
- file-backed development adapters where parity matters
- archive, retention, and cleanup behaviors

### Authorization tests

Cover:

- participant access to allowed instance data
- participant denial on facilitator routes
- facilitator denial on missing or revoked grants
- cross-instance denial paths for both participant and facilitator requests

### Critical e2e flows

Cover at minimum:

- participant event-code redemption and session renewal
- facilitator login
- one protected facilitator mutation
- one archive or reset flow when implemented

Current repo gate:

- `Dashboard CI` runs unit, lint, build, and Playwright regression
- `Private Runtime Preview Gate` runs on DB/auth-sensitive pull requests and requires a preview-grade Neon test database secret for runtime adapter verification

## Required Static and Supply-Chain Checks

- linting for the dashboard and supporting code
- dependency review on pull requests
- code scanning such as CodeQL or an equivalent maintained static-analysis path
- secret scanning for tracked files and pull requests
- one lightweight DAST path against a protected preview or other production-safe endpoint set

## Required Browser Validation

Before production promotion, a human or controlled exploratory pass must validate:

- participant mobile entry path
- participant login or event-code redemption flow
- facilitator login flow
- one protected facilitator control path
- obvious auth boundary failures, broken redirects, or leaked private data in rendered UI

Exploratory inspection should be followed by repeatable Playwright coverage for critical flows when the feature becomes stable enough to automate.

## Human Review Requirements

Human review must explicitly check:

- whether any new state belongs in the private runtime layer rather than the repo
- whether `instance_id` scoping is enforced end to end
- whether participant and facilitator paths remain separated
- whether logs or telemetry risk exposing secrets or private event data
- whether docs and ADRs were updated when trust boundaries changed

## Release Gate

Production promotion is blocked if any of these are true:

- auth or authz tests are failing
- required browser validation did not happen
- code scanning or dependency review found unresolved blocking issues
- secrets or private event data appear in the branch
- rollback steps are missing for a risky change

## Documentation Gate

Architecture work is incomplete until:

- the relevant ADRs are updated
- the runbook and deployment guidance point to the current source of truth
- contributor guidance states the required sensors for security-sensitive work
