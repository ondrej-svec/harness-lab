---
title: "Facilitator UI Revamp"
type: brainstorm
date: 2026-04-19
participants: [Ondrej, Codex]
related:
  - 2026-04-07-facilitator-cockpit-ia-and-ux-redesign-brainstorm.md
  - 2026-04-08-facilitator-room-screen-and-presenter-flow-brainstorm.md
  - 2026-04-08-facilitator-presenter-rich-content-redesign-brainstorm.md
  - ../facilitator-dashboard-design-rules.md
  - ../facilitator-control-room-design-system.md
  - ../dashboard-surface-model.md
  - ../workshop-instance-runbook.md
  - ../plans/2026-04-16-feat-participant-management-and-team-formation-plan.md
---

# Facilitator UI Revamp

## Problem Statement

The current facilitator product is too overloaded for the job it actually needs to do during a live one-day workshop.

The core problem is not just visual density. The deeper issue is that the facilitator UI is still trying to be two things at once:

- a live workshop operating surface
- an instance-local authoring surface for agenda and presenter scenes

That mixed responsibility weakens the product in three ways:

1. the default screen carries too many jobs at once, so the facilitator has to parse structure before acting
2. the product is harder to demo as a strong "built with Codex" artifact because the main surface reads like an overloaded admin workbench
3. agenda and scene editing inside the UI pulls attention away from the live workshop moments that matter more: where we are, what is next, what the room should see, what the teams look like, and which action is safe now

The reframed problem is:

Build a facilitator product that is agenda-centered, calm under workshop pressure, and visibly simpler by removing authoring responsibilities that do not need to live in the UI.

## Context

### What the current repo already says

The repo already contains signals that the current shape is too heavy:

- [`../facilitator-dashboard-design-rules.md`](../facilitator-dashboard-design-rules.md) says the control room should feel calm under pressure and that the default live surface should be "run-the-room, not operate-everything."
- [`../facilitator-control-room-design-system.md`](../facilitator-control-room-design-system.md) says the canvas should be for reading and operating, not authoring.
- [`../dashboard-surface-model.md`](../dashboard-surface-model.md) still leaves room for runtime agenda and scene editing, which now appears to be the main source of the product contradiction.
- [`../workshop-instance-runbook.md`](../workshop-instance-runbook.md) still lists local agenda edits during a live event as part of the run flow.

The implementation confirms the overload:

- the instance control room still exposes agenda detail editing inline
- the agenda view still includes scene-add and scene-edit affordances
- the control room still carries multiple sections, overlays, and editing surfaces even when the facilitator mainly needs live operations

### What recent work changed

The People/Teams work is a real workshop-day need, not incidental admin:

- team formation is part of the live workshop method
- rotation can change team composition later in the day
- the facilitator needs to preserve team history, not only the current team state

This means simplification should not collapse the product into a single live runner. It should preserve the few sections that are operationally real.

### External grounding

A lightweight expert-panel pass and web research converged on a few stable rules:

- workshop facilitation works best when agenda blocks and transitions stay visible and purposeful, rather than hidden behind generic admin structure
- preparation and authoring material should sit beside the agenda system, not dominate the live operating canvas
- navigation should expose only the few places used constantly and progressively hide everything else

Relevant external references:

- PLOS on participatory live coding and careful use of the projected screen
- SessionLab on agenda blocks and purposeful transitions
- Atlassian on progressive disclosure and focused sidebar navigation

## Chosen Approach

Redesign the facilitator product around **four sections only**:

1. `Run`
2. `People`
3. `Access`
4. `Settings`

Within that model:

- `Run` becomes the default agenda-centered live runner
- `People` remains a first-class operational section because team formation and team reshaping are part of the workshop method
- `Access` remains available for participant-code handling and facilitator access management, but secondary to workshop flow
- `Settings` holds reset, archive, and similar safety operations

Crucially:

- agenda editing leaves the facilitator UI
- presenter scene editing leaves the facilitator UI
- reusable or instance-local content changes happen through the coding agent and CLI instead

This is not a general "remove complexity everywhere" move.
It is a deliberate narrowing of the UI to the parts that genuinely earn screen space during the workshop day.

## Why This Approach

This approach optimizes for:

- lower facilitator cognitive load during the live day
- a stronger demo artifact for "this was built with Codex"
- cleaner product boundaries between live operation and authored workshop design
- better alignment with the repo's own progressive-disclosure and control-room rules

It preserves what still matters in the UI:

- live workshop progression
- presenter launch and room-state control
- team formation and later rotation-driven team changes
- participant-access handling
- explicit safety operations

It removes what no longer earns default-canvas presence:

- agenda authoring
- presenter-scene authoring
- source-of-truth and storage details as visible operating furniture

## Subjective Contract

- Target outcome: the facilitator opens the product and immediately knows where the workshop is, what comes next, and the one safe action to take.
- Anti-goals:
  - a CMS disguised as a control room
  - generic enterprise dashboard density
  - "just in case" controls permanently visible on the live surface
  - scene editing surviving in the UI because of historical inertia
- References:
  - agenda-led facilitator tools such as SessionLab's planner logic
  - the repo's own facilitator design docs when they say "read and operate, not author"
- Anti-references:
  - overloaded multi-panel admin shells
  - desktop-first control rooms that collapse badly on iPad
  - subtle scene cards that read like metadata instead of actions
- Tone and taste rules:
  - agenda-centered, not dashboard-centered
  - operational, not decorative
  - clear section identity
  - strong progressive disclosure
- Rejection criteria:
  - if the default Run screen still contains editing fields
  - if the facilitator must visually scan multiple unrelated panels before acting
  - if the UI still feels like an authoring environment under a different name

## Preview And Proof Slice

- Proof slice: a redesigned `Run` section plus the simplified top-level section model (`Run`, `People`, `Access`, `Settings`)
- Required preview artifacts:
  - one static mockup of the default Run surface
  - one static mockup of the People surface with team-history affordance
  - one section map showing what moved out of the UI
- Rollout rule: do not propagate the redesign broadly until the Run surface clearly reads as a live runner instead of an editor

## Key Design Decisions

### Q1: What is the primary problem to solve? — RESOLVED

**Decision:** Reduce facilitator cognitive overload on the live workshop day.

**Rationale:** The user's strongest concern is that the admin surface already feels overloading by inspection, even before real facilitators are using it under pressure.

**Alternatives considered:** Focusing first on presenter polish alone was rejected because presenter quality matters, but the larger overload is in the facilitator control room.

### Q2: What should the default facilitator product feel like? — RESOLVED

**Decision:** An agenda-centered live runner.

**Rationale:** The product must support a one-day hackathon workshop, so the agenda and timeline are the right backbone. "Show caller" or "stage manager" framing was considered, but the agenda-centered runner is a better fit for the workshop's teaching structure.

**Alternatives considered:** A theatrical stage-manager metaphor was rejected as unnecessary for now. A generic timeline workbench was rejected because it does not narrow the live job enough.

### Q3: Should agenda and scene editing remain in the facilitator UI? — RESOLVED

**Decision:** No. Both leave the facilitator UI.

**Rationale:** The user explicitly does not see a strong reason for scene editing to live there, and the repo already has a credible CLI/agent path for content changes. Those editing affordances are a major source of the current overload.

**Alternatives considered:** Keeping editing but hiding it more deeply was rejected as insufficient. The problem is not only placement; it is that the authoring responsibility does not belong in the live facilitator product.

**Contradiction with prior work:** This reverses the earlier runtime-editing direction in [`2026-04-07-facilitator-cockpit-ia-and-ux-redesign-brainstorm.md`](2026-04-07-facilitator-cockpit-ia-and-ux-redesign-brainstorm.md), the surface model, and the runbook. Context changed: the current rendered evidence shows that even "local runtime authoring" is too much responsibility to keep on the live canvas.

### Q4: Which sections should remain in the facilitator product? — RESOLVED

**Decision:** Keep only `Run`, `People`, `Access`, and `Settings`.

**Rationale:** This keeps the real live-day jobs visible while sharply reducing navigation and product sprawl.

**Alternatives considered:** Keeping the larger current section set was rejected because it preserves the existing complexity. A near-single-screen product was rejected because People/Teams and access handling are still real workshop operations.

### Q5: Should People/Teams remain in the UI? — RESOLVED

**Decision:** Yes, as a first-class operational section.

**Rationale:** Team formation is part of the workshop method, and rotation may reshape teams later in the day. That work belongs in the facilitator product, not only in CLI/agent flows.

**Alternatives considered:** Moving People/Teams out of the product was rejected because it would remove a live operational capability that the facilitator genuinely needs.

### Q6: What team history should the product preserve? — RESOLVED

**Decision:** Preserve a timeline of team composition changes, not only a single before/after snapshot.

**Rationale:** Workshops and hackathons evolve on the spot. The facilitator may want one rotation or two, and the product should support that flexibility. A simple before/after model would be too rigid for real workshop adaptation.

**Alternatives considered:** A single snapshot per rotation was rejected because it fits only the currently expected flow, not the more flexible workshop reality.

### Q7: What belongs in Run versus elsewhere? — RESOLVED

**Decision:** `Run` should own the current moment, next moment, move-live control, presenter launch, and contextual handoff/participant state. `Access` and `Settings` should not compete with that default canvas.

**Rationale:** This matches both the repo's design rules and the external workshop-operating research.

**Alternatives considered:** A broader live canvas with safety actions and secondary operations mixed in was rejected because it recreates the exact overload this revamp is trying to remove.

## Open Questions

- What exact information hierarchy should the default Run screen use: one current card plus next-up strip, or timeline-first with a highlighted current block?
- Should People expose the team-history timeline inline on the section, or through a secondary drill-in per team or rotation event?
- Does Access need to stay a full section, or should part of it eventually move into a compact utility drawer while keeping participant-code rotation visible?
- What is the smallest useful presenter-launch affordance in Run: one "open room screen" action, or a slightly richer "open current / open participant mirror" pair?
- How much of the current header metadata should remain persistent once the section model is simplified?

## Out of Scope

- redesigning workshop scenes themselves
- rewriting room-facing content
- changing the blueprint/runtime architecture
- implementing the history model for team composition
- deciding the final visual language in component-level detail
- removing CLI or agent paths for operational mutation

## Next Steps

- `$plan` to turn this into an implementation plan
- define the exact section-level contract for `Run`, `People`, `Access`, and `Settings`
- define which current routes, overlays, and actions are removed versus moved
- define the team-composition history model needed for rotation flexibility
- create preview artifacts for the new Run and People surfaces before implementation

