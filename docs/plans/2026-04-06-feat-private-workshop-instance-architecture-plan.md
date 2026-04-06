---
title: "feat: private workshop-instance architecture"
type: plan
date: 2026-04-06
status: complete
brainstorm: /Users/ondrejsvec/projects/Bobo/harness-lab/docs/brainstorms/2026-04-06-private-workshop-instance-model-brainstorm.md
confidence: medium
---

# Private Workshop-Instance Architecture Plan

Build the production architecture that lets one public Harness Lab codebase run many real workshop events safely through a private runtime layer on Vercel and Neon, while keeping the repository public-safe and aligned with the workshop’s harness-engineering doctrine.

## Problem Statement

Harness Lab is currently shaped like a public template repo with a private-instance concept, but the boundary is only partially enforced. Real event data and operational state still risk leaking into tracked files or git history, the production storage model is not yet formalized, and facilitator operations are not yet designed as a secure API-first system.

This matters for three reasons:

1. real workshops need isolated private state without per-event app sprawl
2. the repo needs to be safely openable without leaking client or event data
3. the system should model good agent-era engineering practice rather than rely on informal discipline

## Proposed Solution

Implement a production-ready private workshop-instance architecture with these properties:

- one public template repo remains the canonical source for dashboard code, participant skill, doctrine, and fictional sample data
- one shared Vercel deployment hosts the dashboard application
- one Neon-backed private runtime layer stores real workshop-instance state, participant sessions, facilitator grants, and live operational records
- public template content and private instance data are composed at runtime through server-side APIs
- facilitator capabilities are API-first and skill-enabled, with admin UI reserved for live workshop control
- repo doctrine, security checks, release gates, and git-history cleanup rules ship as part of the architecture, not as follow-up hygiene

## Detailed Plan Level

This is a **detailed** plan because it spans data architecture, authentication boundaries, deployment model, security posture, release workflow, and public/private repository hygiene.

## Decision Rationale

### Why one public repo plus one private runtime layer

- It keeps the workshop method, dashboard, and skill evolving in one source of truth.
- It avoids per-event repo and deployment sprawl.
- It puts the trust boundary in runtime auth and storage, where it belongs.
- It keeps the system aligned with the workshop’s teaching: public code can still be safe if context, permissions, and validation are engineered correctly.

### Why Vercel plus Neon

- Vercel is already the natural deployment target for the Next.js dashboard.
- Neon’s Vercel integration supports isolated database branches for preview deployments, which fits a preview-driven release flow.
- One shared project plus runtime instance records matches the chosen operating model better than per-event deployments.

### Why API-first facilitator operations

- The facilitator’s higher-leverage workflow is agent-assisted operation against explicit APIs, not a large back-office UI.
- It creates a better teaching example for skill-enabled work.
- It limits early UI surface area while still supporting secure live workshop control.

### Why security and repo hygiene are part of the same plan

- The architecture is incomplete if private data can still remain in git history.
- The platform is not credible as a teaching artifact if release, review, and security checks are implied rather than encoded.
- This repo should demonstrate feedforward plus sensors: clear rules first, then tests, browser inspection, static checks, and human review.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| One shared deployed system with many workshop instances is the correct operating model | Verified | Chosen in the brainstorm and already reflected in [`deployment-strategy.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/deployment-strategy.md) and [`workshop-instance-runbook.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/workshop-instance-runbook.md) |
| Real event state must move out of tracked source and stay server-side | Verified | Chosen in the brainstorm and consistent with [`public-private-taxonomy.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/public-private-taxonomy.md) |
| Public content plus private event-instance state should be composed at runtime | Verified | Chosen in the brainstorm and consistent with [`workshop-event-context-contract.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/workshop-event-context-contract.md) |
| Facilitator auth must remain separate from participant event access | Verified | Accepted in [`ADR 2026-04-06 workshop event access model`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/adr/2026-04-06-workshop-event-access-model.md) and aligned with OWASP authentication and authorization guidance |
| Vercel preview deployments plus Neon preview branches are a suitable release model for this app | Verified | Supported by current Vercel preview-promotion guidance and Neon preview-branch integration docs |
| Custom/lightweight facilitator auth will remain preferable to a managed identity layer | Unverified | Current repo uses lightweight auth, but the security/maintenance tradeoff is not yet proven |
| Preview-to-production without a separate staging environment is sufficient if release gates are strong | Unverified | Plausible for this system, but depends on disciplined checks and rollback procedures |
| API-first facilitator operations will be enough before richer cross-instance UI is needed | Unverified | Chosen direction, but operational usage still needs validation across several events |

## Risk Analysis

### Risk: private event data remains in git history even after source cleanup

If old commits still contain real workshop data, making the repo public later will still leak sensitive information.

Mitigation:
- audit current and historical tracked data for private artifacts
- create a history-rewrite plan before any public launch
- define a hard launch gate: repo is not opened publicly until the history scrub is complete and verified

### Risk: custom auth becomes a silent security liability

If facilitator auth, session handling, or grant checks are homegrown without enough rigor, the system may be simpler on paper but weaker in practice.

Mitigation:
- isolate auth behind explicit interfaces
- test authn/authz flows as first-class product behavior
- add security review checkpoints and threat-model review before production use
- leave an adapter seam for moving to managed identity later if the custom path proves weak

### Risk: multi-instance boundaries are implemented incompletely

If instance IDs are not enforced consistently in reads, writes, and logs, sequential events can still leak state across each other.

Mitigation:
- make `instance_id` part of every private data model and API path/lookup
- default-deny cross-instance access
- add unit, integration, and e2e coverage around authorization and scoping
- log sensitive state transitions with instance attribution

### Risk: preview-based release flow is too casual for a security-sensitive public app

If preview review becomes informal, the absence of a separate staging environment can turn into weak change control.

Mitigation:
- define explicit promotion gates for preview deployments
- require automated checks plus exploratory browser inspection before promotion
- require rollback instructions and post-promotion verification in the runbook

### Risk: security guidance is documented but not enforced

If SAST, dependency review, auth tests, and browser checks remain optional, the repo will again drift away from what it teaches.

Mitigation:
- add required CI/security checks
- encode the workflow in `AGENTS.md`, contributor docs, and deployment docs
- make the architecture slice incomplete until the harness slices are implemented too

## Phased Implementation

### Phase 1: Lock the architecture and trust boundaries

Goal: turn the runtime model into repo-native decisions and constraints before implementation expands.

Tasks:
- [x] Write an ADR for the private workshop-instance topology: one public repo, one shared deployment, one private runtime layer, optional private ops workspace.
- [x] Write an ADR for the auth boundary model: public content, participant-authenticated instance context, facilitator-only operations, and global facilitator identity with per-instance grants.
- [x] Define the production data classification table for every currently known artifact: public, participant-private, facilitator-private, secret, or ephemeral runtime state.
- [x] Define the minimum release gate and security gate the repo must enforce before production promotion.

Exit criteria:
- a new contributor can tell where any piece of state lives and who may access it
- architecture decisions are explicit enough that implementation does not need to rediscover the system shape

### Phase 2: Design the Neon-backed private instance model

Goal: formalize the multi-instance production schema and repository seams.

Tasks:
- [x] Design the core private schema for `workshop_instances`, `facilitator_identities`, `instance_grants`, `participant_event_access`, `participant_sessions`, `teams`, `team_assignments`, `workshop_state`, `checkpoints`, `monitoring_snapshots`, and `instance_archives`.
- [x] Define lifecycle state for a workshop instance: created, prepared, running, archived, and resettable.
- [x] Define retention, archival, and cleanup rules for sessions, monitoring outputs, and archived event state.
- [x] Define repository interfaces in the dashboard code for production storage so the current file-backed repositories remain development adapters only.
- [x] Decide how public template content keys reference private runtime records without copying content into the private database unnecessarily.

Exit criteria:
- the schema supports multiple isolated events from day one
- the application can be implemented against clear repository/service interfaces without embedding file-backed assumptions

### Phase 3: Design authentication and authorization properly

Goal: make authn/authz rigorous enough for real production use without prematurely committing to the wrong identity stack.

Tasks:
- [x] Define the facilitator identity model, credential lifecycle, and per-instance grant rules.
- [x] Define participant event-code redemption, session issuance, session rotation, expiry, logout, and revocation behavior.
- [x] Define how authorization is enforced on every facilitator and participant-private API.
- [x] Define audit logging requirements for login success/failure, grant checks, state mutations, exports, and archive operations.
- [x] Produce a short threat model covering session fixation, CSRF, credential leakage, guessed identifiers, cross-instance access, and admin escalation.
- [x] Decide whether the first implementation remains custom auth or introduces a managed identity provider, with explicit criteria for revisiting that decision later.

Exit criteria:
- auth/session behavior is specified tightly enough to test
- every privileged operation has a clear authz story and audit trail expectation

### Phase 4: Operationalize Vercel and release workflow

Goal: make the deployment model concrete and safe without adding unnecessary environment sprawl.

Tasks:
- [x] Define the canonical Vercel project layout, environment-variable model, and environment separation for local, preview, and production.
- [x] Define how Neon preview branches will be used for preview deployments and schema verification.
- [x] Define the preview-to-production promotion checklist, including health checks, browser inspection, error-log inspection, and rollback procedure.
- [x] Define secret handling rules for facilitator credentials, participant event codes, and database access.
- [x] Decide which production telemetry and alerting signals are required from day one.

Exit criteria:
- the team can explain exactly how a change moves from branch to preview to production
- the release process is simple but explicit, with rollback and verification built in

### Phase 5: Enforce repository hygiene and public-safe history

Goal: make the repo genuinely public-safe, not just forward-safe.

Tasks:
- [x] Audit the current repository for remaining private data, operational notes, and ambiguous artifacts that do not belong in the public template.
- [x] Create a git-history cleanup plan covering sensitive files, replacement strategy, verification, and communication steps.
- [x] Separate fictional demo fixtures from any real operational data with naming and storage rules that prevent future confusion.
- [x] Define what, if anything, belongs in a small private facilitator ops workspace outside the runtime data layer.

Exit criteria:
- the tracked working tree is public-safe by policy
- there is a credible plan to make git history public-safe too before launch

### Phase 6: Encode the harness and security sensors

Goal: ensure the repo embodies the engineering discipline it teaches.

Tasks:
- [x] Define the required automated test layers for this architecture: unit tests, repository/integration tests, authz tests, and critical e2e flows.
- [x] Define the required exploratory browser pass for participant and facilitator surfaces before production promotion.
- [x] Add required static/security checks to the delivery policy: linting, dependency review, code scanning, and at least one lightweight DAST path for protected previews or production-safe endpoints.
- [x] Update `AGENTS.md`, contributor docs, and deployment/runbook docs so the feedforward rules and sensor expectations are explicit.
- [x] Define what human review must verify when agents implement security-sensitive changes.

Exit criteria:
- architecture work is inseparable from tests, browser validation, static/security scanning, and documented review rules
- the repo clearly teaches the same method it expects participants to use

## Implementation Tasks

- [x] Create ADRs for runtime topology and auth boundary decisions.
- [x] Write the production data-classification matrix and private-state inventory.
- [x] Write the Neon schema and lifecycle design doc for workshop instances and related tables.
- [x] Write the auth/session/threat-model doc for facilitator and participant access.
- [x] Write the Vercel + Neon deployment and promotion spec, including preview-branch and rollback rules.
- [x] Write the git-history cleanup and public-readiness plan.
- [x] Write the security and quality gate spec: tests, browser inspection, CodeQL or equivalent code scanning, dependency review, and lightweight DAST expectations.
- [x] Update the existing runbook/doctrine docs so they point at the new architecture documents instead of leaving the model implicit.

## Acceptance Criteria

- There is a documented production architecture that defines where public content, private runtime state, and secrets live.
- There is a documented schema and lifecycle model for running multiple workshop instances from one deployed system.
- There is a documented authentication and authorization model separating participant and facilitator capabilities.
- There is a documented release workflow for preview verification, promotion, and rollback on Vercel with Neon-backed data.
- There is a documented and reviewable plan for removing private data from git history before any public launch.
- There is a documented minimum security and quality gate covering auth/session testing, browser inspection, static analysis, dependency review, and release verification.
- A new contributor could start `$work` on the architecture without asking where to store event data, how instance scoping works, or what security checks are non-negotiable.

## References

- Brainstorm: [2026-04-06-private-workshop-instance-model-brainstorm.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/brainstorms/2026-04-06-private-workshop-instance-model-brainstorm.md)
- Existing runtime direction: [deployment-strategy.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/deployment-strategy.md)
- Existing operating model: [workshop-instance-runbook.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/workshop-instance-runbook.md)
- Existing repo-boundary taxonomy: [public-private-taxonomy.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/public-private-taxonomy.md)
- Repo split proposal: [public-private-repo-split-proposal.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/public-private-repo-split-proposal.md)
- Existing event access ADR: [2026-04-06-workshop-event-access-model.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/adr/2026-04-06-workshop-event-access-model.md)
- Harness doctrine: [harness-doctrine.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/harness-doctrine.md)
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP Session Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- Vercel preview promotion guidance: https://vercel.com/docs/deployments/promote-preview-to-production
- Vercel deployment protection: https://vercel.com/docs/security/deployment-protection
- Neon Vercel integration guide: https://neon.com/docs/guides/vercel/
- GitHub CodeQL code scanning: https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning-with-codeql
- GitHub dependency review: https://docs.github.com/en/code-security/concepts/supply-chain-security/about-dependency-review
- Semgrep JavaScript support: https://semgrep.dev/docs/languages/javascript
- Trunk-based development background: https://www.atlassian.com/continuous-delivery/branch-deployments-in-continuous-delivery-pipelines
