---
title: "Private Workshop Instance Model"
type: brainstorm
date: 2026-04-06
participants: [user, codex]
related:
  - /Users/ondrejsvec/projects/Bobo/harness-lab/docs/public-private-taxonomy.md
  - /Users/ondrejsvec/projects/Bobo/harness-lab/docs/public-private-repo-split-proposal.md
  - /Users/ondrejsvec/projects/Bobo/harness-lab/docs/deployment-strategy.md
  - /Users/ondrejsvec/projects/Bobo/harness-lab/docs/workshop-instance-runbook.md
  - /Users/ondrejsvec/projects/Bobo/harness-lab/docs/adr/2026-04-06-workshop-event-access-model.md
---

# Private Workshop Instance Model

## Problem Statement

How do we run real Harness Lab events from a public codebase in a way that is secure, operationally simple, open-source-safe, and exemplary of the engineering practices the workshop teaches?

This is not just a storage question. The real problem combines:

- public code with private runtime data
- one deployed system with many real workshop instances
- strong participant and facilitator trust boundaries
- a repository that can later be made public without leaking sensitive history or weak practice
- a delivery model that demonstrates harness engineering rather than merely describing it

## Context

Existing repo direction already points toward a layered model:

- [public-private-taxonomy.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/public-private-taxonomy.md) defines a public template repo, private workshop-instance layer, and separate team repos
- [deployment-strategy.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/deployment-strategy.md) already recommends one Vercel deployment backed by private production storage
- [workshop-instance-runbook.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/workshop-instance-runbook.md) already assumes many private workshop instances rather than a new app per event
- [ADR 2026-04-06 workshop event access model](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/adr/2026-04-06-workshop-event-access-model.md) already established public participant surfaces, shared event-code redemption, and separate facilitator auth

The new discussion clarified several important operating constraints:

- the dashboard code should remain public
- real workshop data must move out of git and git history must be cleaned before public exposure
- Vercel plus Neon is the preferred production direction
- the system must support multiple real workshop instances from day one
- those events are not expected to run concurrently
- facilitator operations should be API-first and skill-enabled rather than UI-heavy by default
- the repo should embody secure, testable, agent-era delivery practices including browser inspection, TDD/tracer bullets, and explicit architecture rules

## Chosen Approach

Use a **public template repo + private runtime instance layer** model.

The system should consist of:

1. one public `harness-lab` repository containing reusable code, doctrine, skills, content, and fictional demo data
2. one deployed dashboard system on Vercel
3. one private Neon-backed workshop-instance layer holding event-specific and operational data
4. many workshop instances inside that runtime system, one per real event
5. separate team repos for workshop outputs

The dashboard and participant skill should compose two sources of truth at runtime:

- public template content from the repo
- private event-instance state from the server-side backend

Facilitator operations should be API-first and skill-enabled, with UI reserved primarily for live in-room control.

## Why This Approach

This approach optimizes for:

- one canonical source of truth for the workshop method
- safe multi-event operations without deployment sprawl
- public/open-source readiness
- explicit runtime trust boundaries
- a better teaching example for harness engineering

It rejects two weaker alternatives:

- **Separate private repo/app per event**
  Rejected because it creates repo and deployment sprawl, invites drift, and uses GitHub/project boundaries as a substitute for application design.

- **Keep real event data in the public repo but sanitize later**
  Rejected because it creates history-leak risk, weakens public-safety guarantees, and teaches the wrong operational discipline.

## Key Design Decisions

### Q1: Repo topology — RESOLVED
**Decision:** Keep one public template repo and do not create a separate private code repo by default.
**Rationale:** The reusable method, dashboard code, and skill should evolve in one place. The primary private boundary is runtime data and operations, not duplicated source code.
**Alternatives considered:** A private repo per event or a shadow private code repo. Rejected because it adds sprawl and divergence before there is any proven need for private code.

### Q2: Deployment model — RESOLVED
**Decision:** Run one shared deployed dashboard system rather than one deployment per event.
**Rationale:** Four events in a short span are better handled as private instances within one system. This centralizes improvements and simplifies operations.
**Alternatives considered:** Per-event Vercel projects. Rejected as unnecessary operational overhead.

### Q3: Source-of-truth model — RESOLVED
**Decision:** Treat the system as a composition of public template content plus private event-instance state.
**Rationale:** Some workshop knowledge is reusable and public-safe; some is event-specific and must stay server-side. The dashboard and skill should consume both according to access level.
**Alternatives considered:** Serve everything from the private backend, or keep everything in repo content. Rejected because the first needlessly privatizes reusable knowledge and the second leaks or hardcodes live state.

### Q4: Multi-tenancy model — RESOLVED
**Decision:** Design the schema and auth boundaries as true multi-instance from day one, but do not overbuild concurrent-operations complexity.
**Rationale:** Multiple real events need isolated state and lifecycle management. However, because workshops are not expected to overlap in time, the first version does not need complex concurrent operator workflows.
**Alternatives considered:** Single-event-first design with future migration, or full concurrent multi-operator platform from day one. Rejected because the first underfits near-term needs and the second overbuilds beyond actual operational demand.

### Q5: Facilitator operations model — RESOLVED
**Decision:** Make facilitator capabilities API-first and skill-enabled. Reserve admin UI primarily for live workshop controls.
**Rationale:** The facilitator should be able to manage instances through authenticated APIs and AI assistance. This is more aligned with the workshop’s teaching than building a large back-office UI first.
**Alternatives considered:** Rich admin UI first. Rejected because it adds surface area without matching the most valuable facilitator workflow.

### Q6: Facilitator authentication model — RESOLVED
**Decision:** Use a global facilitator identity system with per-instance access grants.
**Rationale:** This avoids credential sprawl, supports repeated events, and scales better than separate facilitator credentials per workshop instance.
**Alternatives considered:** Per-instance facilitator identities. Rejected because it increases management burden and weakens long-term operator ergonomics.

### Q7: Security boundary — RESOLVED
**Decision:** Enforce privacy through server-side runtime boundaries, not through hidden source code.
**Rationale:** The code can be public if secrets, event state, and facilitator powers remain server-side and properly partitioned.
**Alternatives considered:** Security by repo privacy or client-side secrecy. Rejected because both are weaker and harder to reason about.

### Q8: Teaching posture — RESOLVED
**Decision:** The repo and platform should explicitly model agent-era engineering discipline.
**Rationale:** Harness Lab is not only a workshop artifact but also an example of how to work. Security rules, testing doctrine, browser inspection, architecture decisions, and review boundaries should be encoded in the repo.
**Alternatives considered:** Keep those practices implicit or facilitation-only. Rejected because the workshop would then fail to embody its own message.

## Assumption Audit

Assumption audit for the chosen approach:

- Bedrock: real workshop metadata and operational state must move out of git before the repo becomes truly public-safe
- Bedrock: one shared deployment with many private workshop instances is preferred over per-event app sprawl
- Bedrock: public workshop content and private event-instance state should be composed together at runtime
- Bedrock: facilitator auth must remain separate from participant event access
- Unverified: custom/lightweight auth without larger auth libraries will remain the best long-term security/maintenance tradeoff
- Unverified: a Vercel preview-to-production flow without separate staging will be sufficient for safe operations
- Unverified: facilitator workflows will be well served by API + skill operations without an earlier need for richer cross-instance UI
- Weak: “more libraries always means more risk, so fewer is automatically safer”

Notes on the weaker assumptions:

- Fewer dependencies can reduce attack surface, but security also depends on correctness, review quality, maintenance burden, and how much proven auth/session behavior you are re-implementing yourself.
- Preview-based release flow may be enough, but it should be paired with strong automated checks and explicit go-live rules rather than assumed safe by simplicity alone.

## Open Questions

- exact Neon schema for `workshop_instances`, participant sessions, grants, teams, checkpoints, and archives
- whether admin authentication should stay custom or move to a proven managed identity layer later
- what minimum SAST/DAST and dependency-scanning stack should be required for this repo
- what the release gate should be before production promotion on Vercel preview-based delivery
- what process will be used to scrub sensitive historical data from git history before the repo is opened publicly
- whether a small private facilitator ops workspace should exist outside the runtime data layer for logistics and event-specific notes

## Out of Scope

- detailed database schema design
- implementation of the private backend
- migration scripts
- concrete auth library selection
- a full facilitator back-office UI
- per-event deployment automation

## Next Steps

- `$plan` to create an implementation plan for the private workshop-instance architecture
- create an ADR locking the runtime topology if the team wants the decision formalized beyond this brainstorm
- create a git-history cleanup plan before any public launch
- consider `$compound` later for the doctrine pattern: public code + private runtime as a concrete harness-engineering example
