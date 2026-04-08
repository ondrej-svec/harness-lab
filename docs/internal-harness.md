# Internal Harness

This page is the maintainer-facing entry point for operating and evolving Harness Lab.

Read this before editing core workshop behavior, participant surfaces, or architecture boundaries.

## What This Covers

The internal harness is the backstage operating system of this repo:
- doctrine
- architecture boundaries
- testing and verification rules
- public/private classification
- workshop-instance operations
- contributor expectations

It is not the participant handout. That lives in the learner resource kit.

See:
- [`resource-packaging-model.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/resource-packaging-model.md)
- [`learner-resource-kit.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/learner-resource-kit.md)

## Read Order

### 1. Working Doctrine

Start here to understand how work should be done in this repo.

- [`AGENTS.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/AGENTS.md)
- [`docs/agents-md-standard.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/agents-md-standard.md)
- [`docs/harness-doctrine.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/harness-doctrine.md)
- [`docs/contributing.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/contributing.md)

### 2. Public/Private Boundaries

Read these before adding new data, routes, copy, or workshop operations.

- [`docs/public-private-taxonomy.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/public-private-taxonomy.md)
- [`docs/private-workshop-instance-data-classification.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-data-classification.md)
- [`docs/workshop-event-context-contract.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/workshop-event-context-contract.md)

### 3. Dashboard And Runtime Model

Read these before changing participant or facilitator behavior.

- [`docs/dashboard-surface-model.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/dashboard-surface-model.md)
- [`docs/deployment-strategy.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/deployment-strategy.md)
- [`docs/workshop-instance-runbook.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/workshop-instance-runbook.md)

### 4. Testing And Trust Boundaries

Read these before changing UI flows, auth, or agent-facing behavior.

- [`docs/dashboard-testing-strategy.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/dashboard-testing-strategy.md)
- [`docs/agent-ui-testing.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/agent-ui-testing.md)
- [`docs/private-workshop-instance-security-gates.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-security-gates.md)

### 5. Architecture Decisions

Read the ADRs when changing topology, auth, or workshop-instance responsibilities.

- [`docs/adr/2026-04-06-private-workshop-instance-runtime-topology.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/adr/2026-04-06-private-workshop-instance-runtime-topology.md)
- [`docs/adr/2026-04-06-private-workshop-instance-auth-boundary.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/adr/2026-04-06-private-workshop-instance-auth-boundary.md)
- [`docs/adr/2026-04-06-workshop-event-access-model.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/adr/2026-04-06-workshop-event-access-model.md)

## Operator Bundle

If you only need the minimum backstage set, use this bundle:

1. [`AGENTS.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/AGENTS.md)
2. [`docs/agents-md-standard.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/agents-md-standard.md)
3. [`docs/contributing.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/contributing.md)
4. [`docs/public-private-taxonomy.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/public-private-taxonomy.md)
5. [`docs/dashboard-testing-strategy.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/dashboard-testing-strategy.md)
6. [`docs/workshop-instance-runbook.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/workshop-instance-runbook.md)

## Missing Or Repeated Friction

When the same maintainership problem appears more than once:
- do not fix only the immediate symptom
- update the internal harness with a rule, checklist, index link, or stronger verification step
- update the learner kit only if the issue also affects what participants should be taught
