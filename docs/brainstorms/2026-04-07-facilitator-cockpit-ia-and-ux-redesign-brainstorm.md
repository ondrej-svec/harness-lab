---
title: "Facilitator Cockpit IA and UX Redesign"
type: brainstorm
date: 2026-04-07
participants: [Ondrej, Codex]
related:
  - /Users/ondrejsvec/projects/Bobo/harness-lab/docs/facilitator-dashboard-design-rules.md
  - /Users/ondrejsvec/projects/Bobo/harness-lab/docs/plans/2026-04-06-feat-agentic-ui-inspection-dashboard-ux-plan.md
  - /Users/ondrejsvec/projects/Bobo/harness-lab/docs/brainstorms/2026-04-07-workshop-blueprint-and-facilitator-control-model-brainstorm.md
  - /Users/ondrejsvec/projects/Bobo/harness-lab/docs/workshop-instance-runbook.md
  - /Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-data-classification.md
  - /Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-schema.md
  - /Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/admin/page.tsx
  - /Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-data.ts
---

# Facilitator Cockpit IA and UX Redesign

## Problem Statement

The problem is not just that the current facilitator UI looks bad.

The deeper issue is that the current `/admin` surface is trying to be two products at once:

- a workspace-level cockpit for all workshop instances
- a single-instance live control room for running one event

That mixed information architecture creates bad UX and bad DX:

- facilitators cannot quickly tell whether they are managing the fleet of events or operating one live workshop
- the page wastes desktop space while compressing real controls into narrow stacked columns
- mobile collapses into one long undifferentiated stream of setup, status, navigation, and high-impact actions
- the current data model already knows instances are real event records, but the UI still presents them like technical rows and form fragments

The actual problem to solve is:

Build a facilitator cockpit that makes workshop instances feel like understandable real events, separates workspace-level management from inside-an-instance live control, and still keeps high-impact operations calm and obvious on both desktop and mobile.

## Context

### What exists

- [`docs/facilitator-dashboard-design-rules.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/facilitator-dashboard-design-rules.md) already defines the intended tone: calm under pressure, explicit scope, grouped actions by intent, safety actions visible but not dominant.
- [`docs/plans/2026-04-06-feat-agentic-ui-inspection-dashboard-ux-plan.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/plans/2026-04-06-feat-agentic-ui-inspection-dashboard-ux-plan.md) already identifies the facilitator surface as a control plane that needs stronger structure.
- [`docs/brainstorms/2026-04-07-workshop-blueprint-and-facilitator-control-model-brainstorm.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/brainstorms/2026-04-07-workshop-blueprint-and-facilitator-control-model-brainstorm.md) already says the dashboard should act as runtime control plane for private workshop instances rather than hiding the workshop design inside dashboard internals.
- [`docs/workshop-instance-runbook.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/workshop-instance-runbook.md) describes workshop instances as private event records with real date, venue, room, participant access, facilitator auth, and lifecycle state.
- [`docs/private-workshop-instance-schema.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-schema.md) proposes first-class instance fields such as `display_name`, `event_date`, `venue_name`, `room_name`, `status`, and `current_phase`.
- [`dashboard/lib/workshop-data.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-data.ts) already carries event-like metadata such as title, subtitle, city, date range, and current phase label.

### What the current UI shows

Review of the current rendered facilitator overview and the implementation in [`dashboard/app/admin/page.tsx`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/admin/page.tsx) shows:

- the top of the page mixes instance switching, instance creation, instance removal, language/theme/session controls, section navigation, summary stats, and workshop operations in one shell
- desktop leaves large areas visually idle while compressing actual actions into narrow columns
- mobile becomes a long single-column document where workspace scope, section switching, live state, and destructive controls all compete in one reading order

### External grounding

External UI guidance supports the separation:

- responsive layouts should favor one dominant hierarchy on small screens and allow summary-plus-detail only when space supports it
- tabs are best for peer views within one context, not as a substitute for broader app structure or multiple stacked hierarchy levels

Inference:

- `/admin` should become the workspace-level overview of workshop instances
- entering an instance should open a separate control room with its own navigation shell
- mobile should not preserve desktop side-rail behavior mechanically; it should switch to a more compact section switcher

## Chosen Approach

Adopt a two-level facilitator information architecture with a stronger product shell:

1. `/admin` becomes a workspace cockpit centered on workshop instances as real event records
2. each instance opens into a focused control room for that single workshop

The workspace cockpit should be gallery-first, but not naive:

- instance cards use human event title as the primary label
- technical instance id becomes secondary metadata
- cards show event-level context such as when, where, status, owner, team count, and current phase
- search and filtering are built in from the start so the gallery can scale

The inside-of-instance control room should use:

- a strong top summary for event context and live state
- a left section rail on desktop
- a top section switcher on mobile
- grouped operational areas such as `live`, `agenda`, `teams`, `signals`, `access`, and `settings`
- safety actions kept nearby but visually subordinate

## Why This Approach

This approach optimizes for clarity first, then visual polish.

It solves the biggest structural issue:

- workspace-wide instance management and single-event operation no longer fight inside one page

It makes the domain legible:

- facilitators understand they are managing workshops as events, not manipulating a pile of ids and forms

It uses desktop space properly:

- the wider viewport can support a real product shell and clearer hierarchy instead of empty margins plus cramped control stacks

It respects mobile reality:

- mobile gets a deliberate hierarchy shift instead of a collapsed desktop composition

It leaves room for real product feeling without enterprise-dashboard clutter:

- strong shell, stronger object model, better grouping, better type hierarchy
- not more ornamental chrome, noise, or faux complexity

## Key Design Decisions

### Q1: Should one route continue to serve both workspace management and live workshop control? — RESOLVED

**Decision:** No. Split the facilitator experience into a workspace cockpit and a separate single-instance control room.

**Rationale:** This is the core structural fix. The current surface is overloaded because it tries to manage both levels at once.

**Alternatives considered:** Keeping one page with clearer grouping was rejected because it still preserves the same conceptual collision. A heavy app-shell admin for everything was rejected because it would be too large a leap before fixing the IA.

### Q2: What should `/admin` primarily represent? — RESOLVED

**Decision:** `/admin` should represent the facilitator workspace across all workshop instances.

**Rationale:** This matches the user's stated mental model: see what workshops exist, create new ones, then enter one and run it.

**Alternatives considered:** Keeping `/admin` as a selected-instance surface with a thin instance switcher was rejected because it hides the fleet-level model and keeps the wrong default focus.

### Q3: How should workshop instances be represented in the workspace cockpit? — RESOLVED

**Decision:** Represent them as real event records with human event title as the primary label and technical id as secondary metadata.

**Rationale:** The runtime docs and schema already describe workshop instances as events with date, venue, room, status, and lifecycle. The UI should expose that model directly.

**Alternatives considered:** Technical-id-first representation was rejected because it makes the system harder to scan and understand. A pure operations table was rejected as the default because the user wants a more product-like workspace and the event model benefits from richer card presentation.

### Q4: What default metadata should an instance card carry? — RESOLVED

**Decision:** Default instance cards should carry at least:

- title or client name
- status
- when
- where, including richer location context beyond city
- facilitator owner
- team count
- current phase
- primary action to open the control room

**Rationale:** Without when/where/ownership/current state, instances remain abstract and facilitators must reconstruct meaning from ids or sparse labels.

**Alternatives considered:** Using only city and date-range fragments was rejected as too shallow. Hiding ownership and current phase was rejected because those are operationally important.

### Q5: Should the workspace cockpit include search and filters from the start? — RESOLVED

**Decision:** Yes.

**Rationale:** Even if initial scale is modest, search and filtering prevent the gallery from becoming a brittle visual-only picker and prepare the surface for larger event sets.

**Alternatives considered:** Gallery without search/filtering was rejected as too optimistic about future scale. Table-only view was rejected as too dense as the primary entry.

### Q6: What navigation pattern should the single-instance control room use? — RESOLVED

**Decision:** Use a top summary plus desktop section rail and mobile top section switcher.

**Rationale:** This keeps the real-product feeling on desktop while respecting mobile constraints. It also gives each operational area a clearer home.

**Alternatives considered:** Horizontal tabs everywhere were rejected because the control room is broader than a few peer views. A theatrical “mission control canvas” was rejected because it risks style over clarity.

### Q7: How should “real product feel” be interpreted? — RESOLVED

**Decision:** Real product feel means stronger hierarchy, better object modeling, clearer navigation, and better use of space. It does not mean heavier chrome or decorative dashboard noise.

**Rationale:** The current problem is structural confusion. More chrome would only hide that problem.

**Alternatives considered:** Adding more panels, denser enterprise-style widgets, or ornamental shell patterns was rejected as weak taste masquerading as sophistication.

### Q8: Does this contradict the existing facilitator design rule that one page can show the whole system? — RESOLVED

**Decision:** Yes, partially, and the context has changed.

**Rationale:** [`docs/facilitator-dashboard-design-rules.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/facilitator-dashboard-design-rules.md) said one page can show the whole system if it does not force the user to parse the whole system at once. The current rendered evidence shows that the one-page model is not surviving contact with the real UI. The redesign therefore chooses a clearer workspace-level page plus focused instance control room.

**Alternatives considered:** Preserving the one-page doctrine unchanged was rejected because the current execution demonstrates its practical limits for this product.

## Open Questions

- What exact status taxonomy should the workspace cockpit use: `draft`, `ready`, `live`, `archived` or the existing runtime labels translated differently?
- Which filters matter most on day one: status, date, venue, owner, blueprint, search by title/id?
- Should the workspace cockpit support both card and dense list views, or only cards initially?
- What exact location schema should be captured in runtime metadata: venue name, street address, room name, notes, arrival instructions?
- How should owner be displayed when multiple facilitators have grants on one instance?
- Should the control room route be nested under `/admin/instances/[id]` or another path?
- Which section order best matches live workshop behavior inside the instance control room?
- On mobile, should the section switcher be sticky, segmented, or a select/menu trigger?
- Which actions stay on the default `live` section versus moving to `settings` or `safety`?
- What empty states, drafts, and “not ready yet” states should exist before an instance is prepared or live?

## Out of Scope

- exact route implementation
- exact component inventory
- detailed visual design system tokens
- final runtime schema migration
- final copywriting for all facilitator states
- implementation of card/list view switching
- implementation of search behavior and filter persistence

## Assumption Audit

Assumption audit for the chosen approach:

- ✓ **Bedrock:** The current `/admin` is overloaded because it mixes workspace management and single-instance operations. Verified by direct review of the current implementation and rendered layout.
- ✓ **Bedrock:** Workshop instances should be represented as real event records. Verified by the runbook, schema, data-classification docs, and existing workshop metadata model.
- ✓ **Bedrock:** The single-instance control room needs a stronger shell than the current flat multi-panel page. Verified by user preference and by the mismatch between current structure and intended operational use.
- ? **Unverified:** A gallery-first cockpit will remain the best default even when the number of instances grows. Mitigation: include search and filtering from the start; consider dense list fallback during planning if needed.
- ? **Unverified:** Richer location metadata can stay lightweight enough for facilitators to maintain. Mitigation: define a compact required field set and keep advanced details optional.
- ? **Unverified:** Mobile section switching can stay elegant without hiding too much context. Mitigation: validate with explicit mobile-first control-room planning and browser regression once implemented.
- ✗ **Weak:** “Real product feel” means more chrome, more widgets, or more administrative ornament. Rejected as habit and aesthetic inertia, not user need.

## Next Steps

- `$plan` to turn this IA and UX direction into an implementation plan
- define the workspace cockpit information model and instance card/filter schema
- define the control-room route structure and section taxonomy
- define the event metadata fields needed for title, status, when, where, owner, and current phase
- test the mobile section-switcher approach during planning before implementation
- consider `$compound` later if the workspace-cockpit versus single-instance-control-room pattern becomes reusable doctrine elsewhere in the repo
