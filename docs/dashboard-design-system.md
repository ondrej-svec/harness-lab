# Dashboard Design System

This document is the top-level design system for every dashboard surface in Harness Lab:

- public homepage
- participant room surface
- facilitator workspace and control room
- presenter / room screen

Use this as the first stop before changing dashboard UI, layout, interaction patterns, or visual hierarchy.

It defines the shared system. Surface-specific docs refine that system for their own jobs; they should not invent a separate visual language.

## Why One System

Harness Lab is one product with multiple trust boundaries, not four unrelated apps.

That means:

- the homepage, participant room, facilitator desk, and presenter surface should feel related
- they can differ in density, emphasis, and interaction model because their jobs differ
- they should still share one foundation for hierarchy, actions, tokens, navigation logic, and progressive disclosure

If a surface-specific redesign contradicts the shared system, update this document or justify the exception explicitly.

## Source Of Truth Structure

Use the design docs in this order:

1. this file for dashboard-wide rules
2. [`public-and-participant-design-rules.md`](./public-and-participant-design-rules.md) for public and participant behavior
3. [`facilitator-dashboard-design-rules.md`](./facilitator-dashboard-design-rules.md) for facilitator product rules
4. [`facilitator-control-room-design-system.md`](./facilitator-control-room-design-system.md) for facilitator control-room layout and interaction patterns
5. [`dashboard-surface-model.md`](./dashboard-surface-model.md) for surface responsibilities and trust boundaries

## Product Principle

Every surface must answer one dominant question quickly:

- homepage: what is Harness Lab and how do I enter the room context?
- participant: what should I do right now in this room?
- facilitator: what is live, what matters next, and which action is safe now?
- presenter: what should the room see right now?

If the first screen fails to answer its dominant question, the UI is off-system even if it looks polished.

## Shared Foundations

### 1. Calm before clever

Prefer a quiet, operational interface over decorative flourish.

Use:

- restrained color contrast
- clear type hierarchy
- deliberate spacing
- a small number of surface elevations

Avoid:

- many competing accent treatments
- excessive card nesting
- ornamental chrome that does not help scanning

### 2. One visual family

All dashboard surfaces should share:

- semantic color tokens
- typography family and hierarchy logic
- button semantics
- focus and hover behavior
- spacing rhythm

Surface-specific pages may change density and scale, but not the core language.

### 3. Progressive disclosure by default

Do not dump all available information onto the default canvas.

Preferred disclosure ladder:

1. default canvas for current context and primary actions
2. inline expansion for short secondary detail
3. sheet / drawer for medium-complexity editing
4. modal for confirmation or short required input
5. full page only for genuinely separate tools

### 4. Read mode and edit mode must be visually distinct

Operational dashboards should default to read mode.

The main canvas is for:

- state
- current context
- next step
- lightweight actions

Heavy editing belongs in a sheet or dedicated editor view.

### 5. Navigation is location, not decoration

Navigation should tell the user where they are in the product.

Rules:

- use links for movement
- use buttons for actions
- keep navigation weight below primary task actions
- do not let selected nav feel more important than the current work

### 6. Action hierarchy is explicit

Every area gets a clear action hierarchy:

- `primary`: the single main action for this area
- `secondary`: supporting actions
- `ghost`: inspect, jump, or low-emphasis movement
- `danger`: destructive actions only

Do not render multiple competing primary actions in the same local context without a strong reason.

### 7. Links must look like links

Reference material, source documents, and off-product destinations need explicit affordance.

Do not style important links so softly that they read like metadata tags.

### 8. Mobile is not a fallback

The participant surface is mobile-first. Facilitator and presenter surfaces must still work cleanly on smaller viewports.

Rules:

- vertical reading order must remain obvious
- controls must stay tappable
- key status should remain visible near the top
- no giant dead areas caused by desktop-only composition

## Shared Surface Hierarchy

Use only a small set of surface roles:

1. canvas
2. panel
3. inset
4. overlay

If a new UI requires many custom card species, the structure probably needs simplification instead.

## Surface-Specific Emphasis

### Homepage

- product framing first
- entry path early
- light navigation
- low application chrome

### Participant

- live phase first
- one obvious next move
- room context as working material, not architecture explanation
- facilitator-only concepts removed

### Facilitator

- speed and safety over exposition
- persistent status context
- explicit grouping by operational intent
- editing separated from live control

### Presenter

- projection-safe hierarchy
- room-facing framing, not admin chrome
- agenda-linked scenes
- no privileged operational state on default room view

## Governance Rules

When changing dashboard UI:

1. read this file and the relevant surface-specific doc first
2. if the change introduces a new recurring pattern, document it here or in the relevant surface doc
3. if the change breaks a current rule, either revise the rule or document the exception in the same slice of work
4. update tests and screenshots when visual hierarchy or disclosure changes

## Review Checklist

Before shipping a dashboard UI change, verify:

1. Does the first screen answer the dominant question for that surface?
2. Is the primary action obvious?
3. Are read mode and edit mode clearly separated?
4. Does navigation read as navigation and not as a competing CTA?
5. Are links visually distinguishable from passive text?
6. Does the page stay coherent on mobile?
7. Did the change preserve one visual family across dashboard surfaces?
