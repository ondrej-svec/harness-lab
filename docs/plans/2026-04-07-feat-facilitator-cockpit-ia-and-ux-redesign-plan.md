---
title: "feat: facilitator cockpit IA and UX redesign"
type: plan
date: 2026-04-07
status: complete
brainstorm: /Users/ondrejsvec/projects/Bobo/harness-lab/docs/brainstorms/2026-04-07-facilitator-cockpit-ia-and-ux-redesign-brainstorm.md
confidence: medium
---

# Facilitator Cockpit IA and UX Redesign Plan

Refactor the facilitator experience from one overloaded `/admin` page into a two-level product: a workspace cockpit for workshop instances and a focused control room for a single live workshop.

## Problem Statement

The current facilitator surface in [`dashboard/app/admin/page.tsx`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/admin/page.tsx) mixes two distinct jobs:

- workspace-level instance management
- single-instance live operations

That collision causes both UX and DX problems:

- the interface wastes desktop width while compressing meaningful controls into narrow columns
- mobile turns into a long undifferentiated stream of unrelated concerns
- workshop instances are represented too much like technical ids and too little like real events
- the current tests, route shape, and view-model helpers all assume one admin page, so the architectural seam is currently hidden

This matters because the facilitator dashboard is supposed to teach and embody harness discipline. If the control plane itself is hard to scan and hard to reason about, it undermines the workshop’s own standards.

## Proposed Solution

Implement a two-level facilitator architecture:

1. `/admin` becomes a workspace cockpit for all workshop instances
2. `/admin/instances/[id]` becomes the control room for one workshop instance

The workspace cockpit should:

- represent instances as human-readable event cards
- support search and filtering from the start
- separate creation and management of instances from live workshop operations
- surface event metadata such as title, status, when, where, owner, team count, and current phase

The single-instance control room should:

- use a strong summary header for event context and live runtime state
- use a desktop section rail and a mobile section switcher
- group actions by operational job: `live`, `agenda`, `teams`, `signals`, `access`, `settings`
- keep safety actions visible but secondary

The implementation should be incremental rather than a full rewrite:

- extend the existing workshop metadata model first
- introduce new route and view-model helpers before deleting the old monolith assumptions
- migrate tests and screenshots alongside the routing split

## Detailed Plan Level

This is a **detailed** plan because it changes route structure, data presentation, view models, translation copy, responsive navigation, and regression coverage. It also touches a public-safe demo model that needs to stay coherent across both file mode and Neon mode.

## Decision Rationale

### Why split the route instead of keeping one improved page

The current problem is structural, not cosmetic. The one-page model currently forces workspace scope, live workshop status, section navigation, and destructive actions into a single shell. Better spacing would not fix the mixed mental model.

### Why use gallery-first workspace cockpit instead of a dense operations table

The domain object is a workshop event, not a database row. A gallery-first layout makes it easier to recognize and scan instances by title, status, time, and venue. Search and filters protect this approach from collapsing at larger scale.

### Why create the control room under `/admin/instances/[id]`

This keeps the workspace and single-instance scopes explicit in the URL, view-model helpers, and tests. It also gives the control room freedom to have its own navigation shell without pretending to be a subsection of the old monolithic page.

### Why expand event metadata now

The brainstorm and runtime docs both point to richer event semantics: real date, venue, room, status, and owner matter operationally. Without that metadata, the workspace cockpit would remain a prettier but still vague selector.

### Alternatives considered

#### Alternative 1: Keep `/admin` and re-skin it with stronger panels

Rejected because the route would still serve two conflicting levels of abstraction and keep the same cognitive overhead.

#### Alternative 2: Build a heavy enterprise-style admin shell first

Rejected because it would optimize for “product feel” before solving the actual information architecture. That would risk decorative complexity.

#### Alternative 3: Introduce dense table/list as the primary workspace view

Rejected because it would undersell the event model and optimize for scale before the product earns that density. A dense fallback can be added later if real scale demands it.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| The current `/admin` page is overloaded because it mixes workspace and instance scopes | Verified | Brainstorm findings plus direct review of [`dashboard/app/admin/page.tsx`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/admin/page.tsx) and current screenshots |
| Workshop instances should be represented as event records rather than id-first technical rows | Verified | [`docs/workshop-instance-runbook.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/workshop-instance-runbook.md), [`docs/private-workshop-instance-schema.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-schema.md), and existing `workshopMeta` usage |
| A separate route for the control room is feasible without breaking the underlying repository model | Verified | Current state and repository APIs are already instance-scoped in [`dashboard/lib/runtime-contracts.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/runtime-contracts.ts) |
| Search and filtering are sufficient to keep a card-based workspace cockpit usable at moderate scale | Unverified | Desired by user; no current evidence of real instance volume. Needs pragmatic day-one filter scope |
| Extending `workshopMeta` with richer location fields can happen without forcing private real-event data into the public template repo | Verified | Demo data remains sample-only, while real metadata stays private per [`docs/private-workshop-instance-data-classification.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-data-classification.md) |
| Mobile section switching can keep the control room understandable without making core actions too hidden | Unverified | Supported by general responsive guidance, but this specific surface needs validation through implementation and Playwright coverage |
| Existing admin copy can be refactored into workspace-level and control-room-level language without redesigning the entire i18n model | Verified | Current `adminCopy` is centralized in [`dashboard/lib/ui-language.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/ui-language.ts) |

## Risk Analysis

### Risk: Route split breaks admin flows or existing deep links

Moving from one page to `/admin` plus `/admin/instances/[id]` can break current links, tests, and assumptions in page helpers.

Mitigation:

- introduce new route and helper builders before removing old ones
- keep redirects or compatibility links where practical during the migration
- update unit and e2e coverage in the same phase as routing changes

### Risk: Metadata expansion leaks private real-event semantics into public demo artifacts

Adding venue/address/owner concepts could accidentally encourage storing real workshop data in tracked fixtures.

Mitigation:

- keep all sample/demo fixtures obviously fictional
- update docs and field naming to reinforce the public-safe/demo boundary
- restrict implementation to schema and UI support, not real private data capture in repo files

### Risk: Mobile control room becomes navigationally elegant but operationally weak

A mobile section switcher can hide important actions if the default section is wrong or the switcher is too subtle.

Mitigation:

- make `live` the default section
- keep live status and the section switcher visible high in the mobile layout
- add explicit Playwright mobile coverage for the control room

### Risk: Workspace cockpit becomes visually attractive but operationally shallow

Cards can look polished while failing to support real scanning and filtering needs.

Mitigation:

- define the card information model before designing the visuals
- include search and a minimal filter set in the first implementation
- favor readable status, date, venue, and owner labels over decorative layout

### Risk: The refactor becomes a large multi-file rewrite with too much coupling

The current page contains actions, layout, helper calls, and translations in one place. A naive rewrite would create a large unstable diff.

Mitigation:

- extract shared admin shell and helper pieces first
- split route/view-model responsibilities before polishing visual design
- preserve existing instance-scoped server actions while moving them behind the new control-room route

## Phased Implementation

### Phase 1: Define the facilitator product split and data contract

Goal: make workspace scope versus instance scope explicit in routes, metadata, and helper models.

Tasks:

- [x] Decide the canonical control-room route: `/admin/instances/[id]`
- [x] Define the workspace cockpit card contract: title, status, when, where, owner, team count, current phase, primary action
- [x] Define day-one search and filter scope: status, date, venue/location, owner, title/id query
- [x] Define the control-room section taxonomy and order: `live`, `agenda`, `teams`, `signals`, `access`, `settings`
- [x] Define minimal metadata expansion for `workshopMeta` or adjacent instance fields to support richer location semantics
- [x] Define how existing statuses (`created`, `prepared`, `running`, `archived`) map to facilitator-facing labels

Exit criteria:

- route split is explicit
- metadata contract is explicit
- `$work` can start implementation without reopening IA questions

### Phase 2: Prepare the data and view-model layer for the split

Goal: reduce monolith coupling before changing the UI.

Tasks:

- [x] Extend the workshop instance model to support richer event metadata needed by the workspace cockpit
- [x] Update create/update instance flows in [`dashboard/lib/workshop-store.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-store.ts) to accept the new metadata shape
- [x] Refactor admin view-model helpers so workspace-cockpit helpers and control-room helpers are separate concerns
- [x] Add helper builders for control-room hrefs and workspace filter/query persistence
- [x] Split admin translation copy into workspace-level and control-room-level clusters while preserving Czech/English parity

Exit criteria:

- route helpers and view models support two screens cleanly
- instance metadata supports the new UI without hardcoded formatting hacks

### Phase 3: Build the workspace cockpit at `/admin`

Goal: turn `/admin` into the event workspace instead of the control room.

Tasks:

- [x] Replace the selected-instance header pattern with a workspace overview header
- [x] Implement search and filter controls for instances
- [x] Implement event cards with the agreed metadata and clear primary actions
- [x] Implement instance creation flow in a way that fits the cockpit model rather than living as a cramped form block
- [x] Keep archive/remove and similar high-impact instance-level actions visible but not primary
- [x] Preserve auth/session/language/theme affordances without letting them dominate the workspace layout

Exit criteria:

- a facilitator can understand the available workshop instances quickly
- creating a new instance feels like workspace setup, not like an accidental side form on the control-room page

### Phase 4: Build the single-instance control room

Goal: create a focused event operations surface for one workshop.

Tasks:

- [x] Add the new instance-scoped route and shell
- [x] Build the top event summary with event status, when, where, owner, and live runtime markers
- [x] Implement desktop left-rail navigation and mobile section switcher
- [x] Move existing operational sections into the new control-room grouping
- [x] Keep `live` as the default section with the most urgent runtime actions
- [x] Move secondary or lower-frequency actions into `settings` or explicit safety blocks where appropriate

Exit criteria:

- desktop feels like a real product shell rather than one large stacked page
- mobile has a clear section-switching story without a giant one-column dump

### Phase 5: Migrate regression coverage and finalize documentation

Goal: ship the UX refactor with stronger trust boundaries than the current monolith.

Tasks:

- [x] Update unit tests in [`dashboard/app/admin/page.test.tsx`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/admin/page.test.tsx) or split them by route/helper concern
- [x] Update Playwright coverage in [`dashboard/e2e/dashboard.spec.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/e2e/dashboard.spec.ts) to cover workspace cockpit and control-room entry
- [x] Add mobile control-room coverage and at least one search/filter assertion for the workspace cockpit
- [x] Refresh screenshot baselines for both desktop and mobile facilitator views
- [x] Update or extend facilitator design docs if the route split supersedes parts of the one-page doctrine

Exit criteria:

- facilitator flows are covered by unit and browser regression tests
- the new structure is documented as the intended operating model

## Implementation Tasks

1. **Define contracts and route split**
- [x] Confirm `/admin` as workspace cockpit and `/admin/instances/[id]` as control room
- [x] Finalize the event card contract and day-one filters
- [x] Finalize metadata fields for title, status, when, where, owner, team count, and current phase

2. **Refactor data and helper layers**
- [x] Extend workshop instance metadata and update creation flows
- [x] Split admin href/view-model helpers into workspace and control-room concerns
- [x] Reorganize facilitator copy into workspace and control-room sections

3. **Implement workspace cockpit**
- [x] Build the new `/admin` layout with search, filtering, event cards, and instance creation
- [x] Preserve required auth/session/language/theme controls without letting them dominate the shell
- [x] Provide clear entry into the control room for each instance

4. **Implement instance control room**
- [x] Add the new route and product shell
- [x] Migrate existing operational panels into the new section model
- [x] Implement desktop rail and mobile section switcher
- [x] Reposition safety actions into secondary but visible areas

5. **Protect and document the refactor**
- [x] Update unit tests and Playwright coverage
- [x] Refresh screenshot baselines
- [x] Update facilitator design guidance where the route split changes previous doctrine

## Acceptance Criteria

- `/admin` clearly reads as a workspace cockpit for workshop instances rather than a selected-instance control page.
- Workshop instances are presented as event records with human-readable title first and technical id second.
- The workspace cockpit supports search and filtering for instances.
- Entering an instance opens a focused control-room route that is clearly scoped to one workshop.
- The control room has a strong event summary, grouped operational sections, desktop rail navigation, and a mobile section switcher.
- Desktop uses space substantially better than the current layout.
- Mobile no longer collapses into one long undifferentiated admin page.
- Existing facilitator-critical actions remain available after the route split.
- Unit tests and Playwright coverage validate both workspace cockpit and control-room flows.
- Public-safe demo data remains public-safe and clearly fictional.

## References

### Brainstorm

- [`docs/brainstorms/2026-04-07-facilitator-cockpit-ia-and-ux-redesign-brainstorm.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/brainstorms/2026-04-07-facilitator-cockpit-ia-and-ux-redesign-brainstorm.md)

### Related local context

- [`docs/facilitator-dashboard-design-rules.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/facilitator-dashboard-design-rules.md)
- [`docs/plans/2026-04-06-feat-agentic-ui-inspection-dashboard-ux-plan.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/plans/2026-04-06-feat-agentic-ui-inspection-dashboard-ux-plan.md)
- [`docs/workshop-instance-runbook.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/workshop-instance-runbook.md)
- [`docs/private-workshop-instance-data-classification.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-data-classification.md)
- [`docs/private-workshop-instance-schema.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-schema.md)

### Current implementation seams

- [`dashboard/app/admin/page.tsx`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/admin/page.tsx)
- [`dashboard/app/admin/page.test.tsx`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/admin/page.test.tsx)
- [`dashboard/e2e/dashboard.spec.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/e2e/dashboard.spec.ts)
- [`dashboard/lib/admin-page-view-model.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/admin-page-view-model.ts)
- [`dashboard/lib/workshop-data.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-data.ts)
- [`dashboard/lib/workshop-store.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-store.ts)
- [`dashboard/lib/workshop-instance-repository.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-instance-repository.ts)
- [`dashboard/lib/runtime-contracts.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/runtime-contracts.ts)
- [`dashboard/lib/ui-language.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/ui-language.ts)
