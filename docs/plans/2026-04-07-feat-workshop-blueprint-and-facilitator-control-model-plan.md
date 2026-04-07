---
title: "feat: workshop blueprint and facilitator control model"
type: plan
date: 2026-04-07
status: in_progress
brainstorm: /Users/ondrejsvec/projects/Bobo/harness-lab/docs/brainstorms/2026-04-07-workshop-blueprint-and-facilitator-control-model-brainstorm.md
confidence: medium
---

# Workshop Blueprint And Facilitator Control Model Plan

Establish a first-class workshop blueprint in the public repo, make private workshop instances import from it, and introduce a secure facilitator control model where dashboard and facilitator skill share the same runtime APIs with privileged local auth handled by a small cross-platform `harness` CLI.

## Problem Statement

Harness Lab currently has the right high-level architecture but the wrong product ergonomics.

Today:

- the public repo contains the workshop method in scattered form rather than as an explicit blueprint
- the agenda and other operationally important workshop data feel buried inside dashboard seed/runtime files
- first-time facilitators preparing an event cannot quickly answer "how does this workshop run?" or "what exactly do I edit where?"
- outside readers can see the code, but not the workshop operating model clearly enough to understand or adopt it
- the facilitator dashboard is drifting toward a runtime control plane without the repo exposing the canonical design it is meant to run
- facilitator skill auth still lacks a nailed, secure, cross-platform privileged path

This matters because Harness Lab is not only a dashboard app. It is an open workshop system. The public repo must teach and embody the workshop method, while the dashboard must operate private live instances of that method.

## Proposed Solution

Implement the chosen model in five coordinated slices:

1. create a repo-native workshop blueprint folder that becomes the public, reusable definition of Harness Lab
2. refactor repo and dashboard information architecture so users can clearly distinguish blueprint from runtime instance state
3. introduce a blueprint import model for private workshop instances, with runtime edits remaining instance-local only
4. define and ship a small cross-platform `harness` CLI that owns privileged facilitator auth, local secure storage, and operational bootstrap
5. align dashboard, facilitator skill, and runtime APIs so they become equal control planes over one workshop-instance backend

The operating rule becomes explicit:

- edit the public reusable method in the repo blueprint
- operate live workshop instances in the dashboard or facilitator skill
- publish reusable improvements back through deliberate GitHub edits, never through automatic runtime promotion

Participant posture remains intentionally lighter:

- participants keep event-code-based access only
- no participant CLI requirement
- participant skill and participant dashboard continue to rely on the documented event-access model

## Detailed Plan Level

This is a **detailed** plan because it spans repository structure, product information architecture, runtime import semantics, API contracts, cross-platform auth/tooling, and workshop operational doctrine.

## Decision Rationale

### Why start with the workshop blueprint instead of the CLI

- The discoverability failure exists even if the CLI never ships.
- First-time facilitators and outside readers are currently lost because the workshop method is not explicit in the repo.
- The CLI only makes sense after the blueprint/runtime boundary is clear.

### Why use a small blueprint folder instead of a single file

- The workshop method is broader than an agenda.
- A single file would quickly become a hard-to-navigate dumping ground.
- A small folder allows one explicit concept with manageable internal separation: workshop overview, agenda/phase model, runbook-facing blueprint material, participant usage, and control-surface boundaries.

### Why keep runtime edits instance-local

- Real workshops need temporary adjustments without mutating the canonical reusable design.
- Automatic promotion would blur event adaptation and workshop design.
- Deliberate GitHub edits preserve human review and keep the public repo as the durable design history.

### Why make dashboard and facilitator skill equal control planes

- One runtime system should not have multiple inconsistent operational paths.
- Equal control planes force a cleaner API model and reduce hidden backdoors.
- This better matches the workshop’s own teaching about explicit interfaces and reusable operating systems.

### Why introduce a real `harness` CLI instead of storing facilitator auth in the skill

- Privileged auth material should not live in arbitrary skill state by default.
- Mature tools use browser/device auth plus local secure storage.
- A small CLI gives a narrower, more auditable trust boundary for auth, bootstrap, and privileged operations.

### Why not require the CLI for participants

- Participant onboarding must stay zero-prep and resilient to locked-down corporate machines.
- Event-code redemption already fits the low-friction participant model.
- Requiring CLI installation would weaken the workshop promise of "works from zero on the day."

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| The public repo should be the canonical source for the reusable workshop method | Verified | Chosen in the brainstorm and already consistent with [`docs/public-private-repo-split-proposal.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/public-private-repo-split-proposal.md) |
| Live workshop state should stay in the private runtime layer, not in tracked repo files | Verified | Existing runtime/data-classification docs already enforce this boundary |
| Runtime edits must not auto-promote back into the blueprint | Verified | Explicit brainstorm decision |
| Dashboard and facilitator skill should share the same runtime APIs | Verified | Explicit brainstorm decision |
| Participants should remain event-code-first with no CLI requirement | Verified | Explicit brainstorm decision and existing event-access contract |
| A small workshop blueprint folder can replace the current scattered discoverability surface without becoming another doc maze | Unverified | No current structure exists yet; needs strong IA discipline |
| Facilitators will accept installing a `harness` CLI for privileged operations | Verified | User explicitly accepted this for planning |
| Cross-platform packaging and secure storage for the CLI are practical enough on macOS and Windows | Unverified | Research supports the pattern, but implementation specifics remain open |
| The first version of the CLI can stay intentionally small and not balloon into a second backend/product | Unverified | Requires scope discipline in implementation |
| Existing dashboard runtime import/reset flows can absorb blueprint-import semantics without a full rewrite | Unverified | The current runtime model is close, but it does not yet expose blueprint as a first-class concept |

Unverified assumptions should be converted into early design and tracer-bullet tasks before broad implementation.

## Risk Analysis

### Risk: The blueprint becomes another scattered doc surface instead of the canonical operating manual

If the blueprint folder is too loose, the repo will still feel fragmented and first-time facilitators will remain lost.

Mitigation:

- define a small, opinionated blueprint structure up front
- keep "what is editable where" as a first-class blueprint section
- link dashboard and repo navigation explicitly around the blueprint concept

### Risk: Users confuse blueprint edits with live runtime edits

If repo pages and dashboard pages do not clearly explain their roles, users will still assume editing the repo mutates the live event or vice versa.

Mitigation:

- add explicit boundary copy in repo and dashboard
- ensure blueprint import semantics are visible during instance creation/reset
- require deliberate GitHub edits for reusable changes

### Risk: The CLI grows into an oversized parallel product

If the `harness` CLI becomes a catch-all tool, it will add maintenance burden and duplicate dashboard responsibilities badly.

Mitigation:

- constrain v1 scope to auth, secure local session storage, skill/bootstrap help, and a small operational command set
- make CLI consume the same runtime APIs as dashboard
- defer anything not needed for facilitator bootstrap or privileged operations

### Risk: Facilitator auth/storage is underdesigned across platforms

If secure local storage is weak or packaging/install is awkward, the CLI may become friction rather than safety.

Mitigation:

- explicitly evaluate macOS Keychain, Windows Credential Manager, and Linux Secret Service abstraction early
- keep device/browser auth as the default interactive login path
- treat insecure fallback storage as explicit and exceptional if it exists at all

### Risk: Dashboard, skill, and CLI diverge in language or capabilities

If each surface uses slightly different nouns or commands, the workshop system becomes harder to teach and operate.

Mitigation:

- define one control-surface vocabulary
- define one shared runtime API contract
- make blueprint sections the naming authority for agenda, phases, participant flow, and facilitator controls

### Risk: Skill installation and workshop bootstrap remain clumsy

If the CLI is introduced without a clear bootstrap story, facilitators may still be unsure how participants or facilitators are meant to install and use the right tools.

Mitigation:

- include installation/bootstrap as part of CLI scope
- document "participant path" and "facilitator path" explicitly in the blueprint
- encode the same paths in repo docs, skill docs, and CLI help text

## Phased Implementation

### Phase 1: Define the workshop blueprint artifact and information architecture

Goal: make the workshop method explicit and navigable in the public repo before changing runtime mechanics.

Tasks:
- [x] Define the blueprint folder path and structure, including at least:
  - what Harness Lab is
  - how the day works
  - how to run one
  - what participants use
  - facilitator control paths
  - what is editable where
- [x] Decide which blueprint elements are structured data versus human-readable markdown.
- [x] Inventory existing workshop method content and map each current source into blueprint, dashboard runtime, or private ops/runtime layers.
- [x] Add a top-level repo navigation story that points newcomers toward the blueprint first instead of forcing them into dashboard internals.
- [x] Update doctrine/docs to explain the product model clearly: public blueprint vs private runtime instance.

Exit criteria:
- the repo contains one explicit workshop blueprint concept
- a first-time facilitator can find the recommended workshop definition without opening dashboard code
- no blueprint-critical concept remains buried only in dashboard seed files

### Phase 2: Introduce blueprint import semantics for runtime workshop instances

Goal: make the runtime layer explicitly import from blueprint rather than hiding that behavior inside seed state.

Tasks:
- [x] Define the blueprint import contract used when creating or resetting an instance.
- [x] Decide which runtime fields are copied directly from blueprint and which are instance-specific overrides.
- [x] Refactor current sample/seed logic so it becomes an implementation of blueprint import rather than an implicit hidden seed path.
- [x] Make runtime-local edits explicit in the dashboard and APIs, including messaging that changes stay local to the active instance.
- [x] Define how blueprint version/reference is tracked on a workshop instance for auditing and support.

Exit criteria:
- runtime instance creation/reset can be described as "import blueprint into instance"
- the system can distinguish reusable blueprint state from instance-local runtime state
- dashboard copy no longer implies that current runtime values are the canonical workshop design

### Phase 3: Redesign dashboard and repo UX around blueprint vs runtime

Goal: make the boundary obvious to humans in both the repo and the dashboard.

Tasks:
- [x] Redesign dashboard IA and copy so facilitator pages clearly read as runtime control surfaces.
- [x] Add explicit links from dashboard to the blueprint location for reusable workshop design changes.
- [x] Add explicit links from repo blueprint docs to runtime/operator surfaces for live event control.
- [x] Ensure the agenda is visible and understandable in both places, with editing affordances matched to the right layer.
- [x] Clarify onboarding copy for outside readers versus first-time facilitators versus live facilitators.

Exit criteria:
- users can tell where to read the workshop method
- users can tell where to operate a live workshop instance
- users can tell where to edit reusable design versus runtime-only data

### Phase 4: Define and ship the small `harness` CLI foundation

Goal: create the secure local facilitator control broker without overbuilding a second product.

Tasks:
- [x] Define the CLI scope boundary for v1:
  - facilitator login/logout/status
  - secure local session storage
  - workshop/skill bootstrap assistance
  - a small operational command set over the shared runtime APIs
- [x] Choose the cross-platform packaging/distribution posture for v1 and document install expectations for macOS and Windows.
- [x] Design browser/device auth and callback flow for local and remote/SSH-style usage.
- [x] Design local secure-storage abstraction and explicit failure behavior when secure storage is unavailable.
- [x] Define how facilitator skills call into the CLI for privileged operations without duplicating auth logic.
- [x] Ensure participant flows remain independent of the CLI.

Exit criteria:
- the CLI has a deliberately small scope
- facilitator privileged auth no longer depends on raw skill-held secrets
- the installation and bootstrap story is coherent enough to teach

### Phase 5: Align dashboard, facilitator skill, and runtime APIs

Goal: make all facilitator control surfaces first-class clients of the same runtime model.

Tasks:
- [x] Define the shared facilitator runtime API contract and vocabulary.
- [x] Audit current facilitator dashboard operations and map each one to shared API capabilities.
- [x] Define which facilitator skill commands are day-one supported through the CLI-backed auth path.
- [x] Update workshop skill and facilitator docs so control paths are explicit and consistent.
- [x] Add testing strategy coverage for:
  - blueprint import behavior
  - runtime-local edits
  - dashboard control flows
  - CLI-authenticated facilitator operations
  - participant event-code-only paths remaining unaffected

Exit criteria:
- dashboard and facilitator skill can be explained as equal control planes
- no privileged operation requires the skill to invent its own secret storage
- participant flows remain simpler and separate

### Phase 6: Tighten publishing and feedback loops

Goal: ensure the reusable workshop method improves deliberately rather than accidentally.

Tasks:
- [x] Define the human workflow for turning runtime learnings into blueprint changes through GitHub edits.
- [x] Add contributor guidance for when a workshop change belongs in runtime only versus the reusable blueprint.
- [x] Define how facilitators capture runtime learnings for later repo edits without implying automatic promotion.
- [x] Ensure docs, CLI help, and dashboard copy repeat the same publishing rule.

Exit criteria:
- reusable improvements have an intentional repo-edit path
- runtime tweaks do not masquerade as durable workshop design
- contributors understand how the workshop method evolves over time

## Implementation Tasks

- [x] Create the workshop blueprint concept and folder structure in the public repo.
- [x] Classify existing workshop information into blueprint, runtime instance state, and private-only ops/runtime data.
- [x] Define blueprint import semantics for instance create/reset flows.
- [x] Refactor current seed logic to behave as blueprint import rather than hidden dashboard sample state.
- [x] Redesign repo and dashboard navigation/copy around blueprint vs runtime distinction.
- [x] Define the small `harness` CLI scope, auth model, storage model, and packaging posture.
- [x] Align facilitator skill commands and dashboard operations to one shared runtime API contract.
- [x] Document the deliberate publish-back workflow from runtime learning to repo blueprint edits.
- [x] Add verification coverage for blueprint import, runtime-local edits, dashboard control paths, and CLI-backed facilitator operations.

## Acceptance Criteria

- A first-time facilitator can open the public repo and find one explicit blueprint area that explains how Harness Lab works and how to run it.
- The agenda and workshop operating model are no longer discoverable only through dashboard seed/runtime code.
- The repo and dashboard both clearly communicate the difference between reusable blueprint content and live runtime instance state.
- Runtime instance creation/reset explicitly imports from the blueprint and does not imply automatic promotion back.
- Dashboard and facilitator skill operate over the same facilitator runtime APIs.
- Privileged facilitator skill operations depend on the `harness` CLI rather than storing raw auth/session material directly in skill state.
- Participants can still use the workshop without installing a CLI.
- The publish-back path for reusable workshop improvements is explicit, deliberate, and GitHub-edit based.

## References

- Brainstorm: [2026-04-07-workshop-blueprint-and-facilitator-control-model-brainstorm.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/brainstorms/2026-04-07-workshop-blueprint-and-facilitator-control-model-brainstorm.md)
- Public/private model: [public-private-repo-split-proposal.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/public-private-repo-split-proposal.md)
- Runtime operations: [workshop-instance-runbook.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/workshop-instance-runbook.md)
- Event access contract: [workshop-event-context-contract.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/workshop-event-context-contract.md)
- Data classification: [private-workshop-instance-data-classification.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-data-classification.md)
- Existing skill/event-access plan: [2026-04-06-feat-workshop-skill-event-access-model-plan.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/plans/2026-04-06-feat-workshop-skill-event-access-model-plan.md)
- Existing runtime build plan: [2026-04-06-feat-private-workshop-instance-build-plan.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/plans/2026-04-06-feat-private-workshop-instance-build-plan.md)
- Existing facilitator skill auth discussion: [2026-04-06-feat-facilitator-identity-simplification-plan.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/plans/2026-04-06-feat-facilitator-identity-simplification-plan.md)
