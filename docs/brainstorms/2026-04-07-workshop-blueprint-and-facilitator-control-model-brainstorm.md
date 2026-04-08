---
title: "Workshop Blueprint And Facilitator Control Model"
type: brainstorm
date: 2026-04-07
participants: [Ondrej, Codex]
related:
  - ../dashboard-surface-model.md
  - ../public-private-repo-split-proposal.md
  - ../workshop-instance-runbook.md
  - ../workshop-event-context-contract.md
  - ../private-workshop-instance-data-classification.md
---

# Workshop Blueprint And Facilitator Control Model

## Problem Statement

Harness Lab currently hides too much of its operating model inside dashboard runtime code and sample state. That creates poor UX and DX for two important audiences:

- first-time facilitators preparing an event
- outside readers trying to understand what Harness Lab is and how to run their own version

The actual problem is not just "the agenda is hard to find." The deeper problem is that the public repo does not yet expose a clear, editable, reusable workshop blueprint, while the dashboard already behaves like a runtime control plane. This makes the workshop method hard to discover and the boundary between repo design and live instance state hard to understand.

We need a model where:

- the public repo clearly explains the workshop and contains the reusable blueprint
- the dashboard clearly acts as runtime control plane for private workshop instances
- facilitators know what is edited in the repo versus what is edited at runtime
- the facilitator dashboard and facilitator skill operate over one coherent runtime API model

## Context

Existing docs already point in the right direction:

- [`docs/public-private-repo-split-proposal.md`](../public-private-repo-split-proposal.md) already recommends one public template repo plus one private workshop-instance runtime layer rather than repo duplication.
- [`docs/private-workshop-instance-data-classification.md`](../private-workshop-instance-data-classification.md) already classifies agenda shape and public workshop framing as public repo content, while live event state belongs in private runtime.
- [`docs/workshop-instance-runbook.md`](../workshop-instance-runbook.md) already describes runtime instances as private records created from a template.
- [`docs/workshop-event-context-contract.md`](../workshop-event-context-contract.md) already treats dashboard and skill as two surfaces over shared event context.

What is missing is a first-class artifact and product model that makes these boundaries visible to humans:

- there is no explicit "workshop blueprint" concept in the repo structure
- the agenda currently feels buried in dashboard seed/runtime files
- facilitators do not have a clear mental model for repo blueprint vs instance-local runtime edits
- the current facilitator skill/auth story is not yet nailed for secure privileged operations

External precedent on auth and CLI design supports a stronger local facilitator tool:

- OAuth Device Flow is a standard CLI/browser auth pattern: RFC 8628, https://www.rfc-editor.org/rfc/rfc8628
- GitHub CLI uses browser/device auth plus system credential storage: https://cli.github.com/manual/gh_auth_login
- Azure CLI supports device code for CLI auth: https://learn.microsoft.com/en-us/cli/azure/get-started-tutorial-1-prepare-environment
- Claude Code documents secure local credential handling and helper-based credential retrieval: https://docs.anthropic.com/en/docs/claude-code/team

## Chosen Approach

Introduce a small repo-native workshop blueprint folder as the canonical reusable design for Harness Lab, and make runtime workshop instances import from that blueprint.

At the same time:

- keep runtime edits instance-local only
- require deliberate GitHub repo edits to publish improvements back into the reusable blueprint
- treat dashboard and facilitator skill as equal control planes over the same runtime APIs
- introduce a small but real cross-platform `harness` CLI for facilitator authentication, secure local credential/session handling, and operational bootstrap

Participant flows remain simpler:

- participants do not need the CLI
- participants continue to use dashboard + event-code redemption
- participant skill stays public-first and runtime-aware, but not privileged

## Why This Approach

This approach optimizes for clarity, product coherence, and operational safety.

It solves the repo discoverability problem:

- the workshop method becomes legible in the public repo
- the agenda and operating model are no longer buried in dashboard internals
- first-time facilitators can learn the workshop from the repo without confusing it with live event state

It solves the runtime/control-plane problem:

- the dashboard is clearly the place where live workshop instances are operated
- runtime edits do not silently mutate the reusable public design
- facilitators can understand that instance changes are temporary unless they intentionally publish a repo change

It solves the privileged skill/auth problem:

- facilitator skills do not need to become ad hoc secret stores
- privileged operations can depend on a narrower local security surface
- dashboard and CLI can share one API contract instead of inventing multiple control paths

### Alternatives considered

#### Alternative 1: Keep the repo mostly docs-only and let the dashboard own operational structure

Rejected because:

- it preserves the core discoverability failure
- it leaves the workshop design implicit instead of explicit
- it keeps "how the workshop works" and "how to run it" too buried in runtime code

#### Alternative 2: Let runtime-edited instances promote changes back into the blueprint automatically

Rejected because:

- it blurs the boundary between temporary live adaptation and intentional method design
- it creates hidden mutation paths for the reusable workshop design
- it weakens the repo as deliberate human-owned source of truth

#### Alternative 3: Keep facilitator skill auth entirely inside the skill without a local broker/CLI

Rejected because:

- it makes the skill its own auth client and token store
- it creates a weaker, less auditable security boundary
- it conflicts with the desire to design facilitator operations safely rather than as a quick fix

## Key Design Decisions

### Q1: Where should the reusable workshop definition live? — RESOLVED

**Decision:** The reusable workshop definition should live in a repo-native workshop blueprint folder in the public repo.

**Rationale:** The public repo is the open operating manual for Harness Lab. The workshop method must be understandable there without opening dashboard internals or sample runtime JSON.

**Alternatives considered:** Leaving the definition implicitly spread across dashboard files was rejected because it hides the method. Keeping only prose docs was rejected because it weakens editability and reuse.

### Q2: What is the relationship between blueprint and runtime instance? — RESOLVED

**Decision:** Runtime instances import from the blueprint, then diverge locally. Runtime edits remain instance-local only.

**Rationale:** This preserves a clean distinction between reusable design and live event operations. It also matches the existing public/private boundary already described in repo docs.

**Alternatives considered:** Automatic sync back from runtime to blueprint was rejected because it would make temporary event changes mutate the canonical method without deliberate review.

### Q3: How should improvements be published back into the reusable design? — RESOLVED

**Decision:** Improvements to the reusable blueprint must be made deliberately through GitHub repo edits, not through runtime promotion.

**Rationale:** This keeps the reusable workshop method human-reviewed and intentionally authored. It also keeps the public repo as the durable design history.

**Alternatives considered:** Dashboard-driven promotion back to blueprint was rejected because it would encourage accidental or unreviewed method changes.

### Q4: What should the dashboard be? — RESOLVED

**Decision:** The dashboard should be the runtime control plane for private workshop instances, not the hidden home of the workshop design.

**Rationale:** This makes the product model easier to understand: repo defines the recommended workshop blueprint, dashboard runs the private live instance.

**Alternatives considered:** Treating the dashboard as both blueprint editor and runtime controller on day one was rejected because it would reintroduce confusion about what is reusable method versus live event data.

### Q5: How should facilitator operations be exposed? — RESOLVED

**Decision:** Dashboard and facilitator skill should be equal control planes over the same runtime APIs.

**Rationale:** The same operations should not have multiple inconsistent backdoors. One API contract yields better product coherence, better testing, and a clearer security model.

**Alternatives considered:** Making the facilitator skill a secondary convenience layer was rejected because it weakens the long-term product model and keeps skill-driven facilitation half-supported.

### Q6: How should privileged facilitator auth be handled? — RESOLVED

**Decision:** Privileged facilitator skill operations should depend on a small cross-platform `harness` CLI that handles auth, secure local storage, and session brokerage.

**Rationale:** This keeps raw credential/session handling out of arbitrary skill state, follows proven CLI auth patterns, and creates a safer local security boundary for facilitator automation.

**Alternatives considered:** Direct skill-held tokens were rejected as too weak. Ad hoc scripts were rejected as operationally brittle. A giant CLI product was rejected as unnecessary scope creep.

### Q7: What should participant auth and tooling look like? — RESOLVED

**Decision:** Participants should stay simple: dashboard + event-code redemption, with no CLI requirement.

**Rationale:** Participants may be on constrained corporate laptops, mixed operating systems, and zero-prep environments. Requiring CLI installation would add friction and risk to the workshop promise.

**Alternatives considered:** Requiring a participant CLI or local auth broker was rejected because it conflicts with the workshop’s low-friction onboarding goal.

### Q8: What should be inside the day-one workshop blueprint? — RESOLVED

**Decision:** The blueprint should be a small folder that covers at least:

- what Harness Lab is
- how the day works
- how to run one
- what participants use
- facilitator control paths
- what is editable where

**Rationale:** The workshop needs more than an agenda file. It needs a navigable package of method, operations, participant experience, and control-surface boundaries.

**Alternatives considered:** A single giant file was rejected because it would become hard to navigate. A docs-only sprawl without a blueprint concept was rejected because it would remain too diffuse.

## Assumption Audit

Assumption audit for the chosen approach:

- ✓ **Bedrock:** Reusable workshop method and private runtime state should remain separate. Existing repo docs already support this boundary.
- ✓ **Bedrock:** Runtime edits should not auto-promote back into the reusable blueprint. The user explicitly chose deliberate repo edits instead.
- ✓ **Bedrock:** Dashboard and facilitator skill should share one runtime API model. The user explicitly chose this.
- ? **Unverified:** Requiring facilitators to install a `harness` CLI will be acceptable in practice across their environments.
- ? **Unverified:** Cross-platform packaging and secure local storage for the CLI can be made smooth enough on macOS and Windows.
- ? **Unverified:** The workshop blueprint folder can stay compact and comprehensible rather than turning into another diffuse documentation surface.
- ✗ **Weak:** "A full CLI is automatically better design." This is only true if CLI scope stays intentionally small and focused on auth/bootstrap/operations, not if it becomes a second product backend.

The unverified assumptions were discussed and accepted for planning, with implementation specifics deferred to the plan.

## Open Questions

- What exact folder and file structure should the workshop blueprint use?
- Which blueprint parts should be structured data versus human-readable markdown?
- How should runtime instance creation/import work operationally: on reset, on create, or both?
- Which facilitator operations belong in the first version of the `harness` CLI versus dashboard-only initially?
- What is the best cross-platform packaging/distribution path for the CLI: npm global install, `npx`, `bunx`, standalone binaries, or a hybrid model?
- How should secure local storage be abstracted across macOS, Windows, and Linux?
- How should skill installation and workshop bootstrap flow be designed around the CLI without making participant setup heavier?

## Out of Scope

- final CLI implementation details
- exact OAuth/provider implementation choice for the CLI
- final blueprint file schema
- detailed dashboard refactor plan
- participant CLI support
- automatic promotion of runtime edits back into blueprint

## Next Steps

- `$plan` to turn this into an implementation plan
- define the workshop blueprint folder structure and import model
- define the `harness` CLI scope and auth/storage boundaries
- redesign repo/dashboard navigation around the blueprint vs runtime distinction
- consider `$compound` later if the blueprint/runtime boundary and facilitator control-path pattern become reusable doctrine beyond this feature
