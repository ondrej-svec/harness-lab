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

## Motion

Motion in the dashboard is operational, not decorative. It confirms that an action registered, directs the eye to what changed, and connects state transitions so users do not lose their place. If a motion rule here contradicts a surface-specific doc, this file wins.

### When motion earns its place

- Confirming a click or submit (press states, pending spinners, form result).
- Orienting after a navigation or view change (entrance fades, staggered reveals).
- Signalling that something is live or updating (pulsing status dots on truly live state only).

Motion must not be the only signal for state. Color, icon, or text label must also carry the meaning, so reduced-motion users still get it.

### Durations

- Micro (hover, press, toggle): **120–200ms**.
- Standard (button lift, card lift, small layout): **200–300ms**.
- View entrance (hero stagger, section fade-up, drawer): **400–500ms**.
- Nothing functional exceeds **600ms**. Ambient drift layers (the homepage hero glow) may be slower because they are decorative and not functional UI.

### Easing

- Default: `cubic-bezier(0.2, 0.8, 0.2, 1)` — a soft ease-out. Use this for entrances, button lifts, and card hovers.
- Linear is only allowed for indeterminate spinners.
- Never use ease-in alone on an entrance — it delays the signal and feels laggy.

### Utility classes (already in `app/globals.css`)

- `dashboard-motion-card` — for panels and tiles. 240ms transform, −4px lift on hover, shadow bloom. Use on `panel` and `inset` surface roles.
- `dashboard-motion-button` — for buttons and button-shaped links. 220ms, −2px lift on hover.
- `dashboard-motion-link` — for inline text links and soft navigation. 220ms, 2px right translate on hover.

These classes respect `prefers-reduced-motion: reduce` via the block at the bottom of `globals.css`. Do not add new bespoke hover animations that duplicate what these classes already do — extend the classes or consult first.

### Pending-state rule (non-negotiable)

Every control that triggers a navigation, form submission, or server round-trip must show pending state **within 100 ms** of the user action. This is a direct application of Nielsen's response-time research (0.1 s feels instant, 1 s is the limit before users disengage) and WCAG 2.3.3 (Animation from Interactions) on clear feedback.

Use:

- `AdminRouteLink` (`app/admin/admin-route-link.tsx`) for any internal navigation link in the admin surface. It wraps `next/link` with `useTransition` + a spinner and sets `aria-busy`.
- `useFormStatus` via the existing `SubmitButton` / `AdminSubmitButton` components for any form.
- `ExternalOpenButton` (`app/admin/external-open-button.tsx`) for any `target="_blank"` control. It flashes a transient 600 ms pending state so the user knows the click registered, even when the new tab takes a moment to open on mobile.

A plain `<a>` or `<Link>` with no pending state is not acceptable for a navigation action anywhere on the dashboard.

### Entrance motion in React

For React entrances use `motion/react` (library: `motion` v12). Shared components live in `app/components/`:

- `FadeUp` — `whileInView` fade-and-lift for on-scroll entrances. Default 400 ms, 16 px offset, ease-out, `viewport={{ once: true }}`.
- `HeroStagger` + `HeroStaggerChild` — parent/child pair for an above-the-fold stagger. Default 60 ms stagger, 400 ms children.

Both consult `useReducedMotion()` and collapse to instant transitions when reduced-motion is requested — content remains visible from the first paint. Do not invent a parallel entrance pattern; extend these.

### Stagger rules

- 40–80 ms between siblings. Default 60 ms.
- Do not stagger more than **six** children at once — the last child lands too late and the user starts reading before the motion finishes.
- Never stagger inside a table, grid of results, or any structure the user is scanning.

### Reduced motion is mandatory

Every motion addition must have a reduced-motion path, verified in code, not left implicit:

- CSS motion utilities must have a `@media (prefers-reduced-motion: reduce)` override that zeroes transform and animation.
- React motion components must consult `useReducedMotion()` and either return a plain element or pass `duration: 0` to the transition.
- Motion must never be the only indicator of a state change.

If a Playwright test sets `reducedMotion: 'reduce'`, the final DOM and the first-paint DOM must be identical for all motion-wrapped content.

### Anti-patterns

- Parallax or scroll-linked motion on readable body copy.
- Infinite looping motion behind text beyond the existing ambient drift on the hero.
- Motion longer than 600 ms on functional UI.
- Motion without a pending state on the same control (spinner and fade-up are not substitutes for each other — a button needs both: hover motion and pending feedback).
- Re-implementing what `dashboard-motion-*` classes or `FadeUp` / `HeroStagger` already do.

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
8. Does every navigation trigger show pending state within 100 ms? (see Motion → Pending-state rule)
9. Does every motion addition have a verified reduced-motion path?
