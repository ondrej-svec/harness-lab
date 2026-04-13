---
title: "One Canvas — dashboard motion + admin rework"
type: brainstorm
date: 2026-04-13
participants: [ondrej, claude]
related:
  - dashboard/app/admin/instances/[id]/page.tsx
  - dashboard/app/admin/instances/[id]/presenter/page.tsx
  - dashboard/app/admin/admin-ui.tsx
  - dashboard/lib/workshop-data.ts
---

# One Canvas — dashboard motion + admin rework

## Problem Statement

The dashboard's two main surfaces — the **facilitator admin** and the **live presenter view** — both feel chunky and unpleasant to use. The pain is real and present (Ondrej is the primary user) and applies to *both* desktop and iPad contexts.

The surfaces are not independent. The facilitator navigates *from* admin *into* presenter for each agenda item. They are two states of one journey, not two products.

**Reframed:** This is not "add animations to the presenter." It is: **reshape the admin↔presenter relationship as a single continuous canvas with a coherent motion language, iPad-first, that feels like it was made by someone with taste in April 2026.**

## Context

### Scout findings (see `dashboard/` tree)

- **Stack:** Next.js 16.2.3 (App Router, RSC), React 19.2.4, Tailwind CSS v4.2.2, CSS-only animations today (no motion library).
- **Presenter surface** (`app/admin/instances/[id]/presenter/page.tsx`, 643 lines): server component, renders `RoomScene` and `TeamTrailScene`. Navigation via `ScenePager` using URL query params (`?agendaItem=X&scene=Y`). Prev/next buttons only.
- **Admin surface** (`app/admin/instances/[id]/page.tsx`, 2000+ lines): sticky-sidebar layout (`xl:grid-cols-[16rem_minmax(0,1fr)]`), 5 conditional sections (Agenda, Teams, Signals, Access, Settings), forms scattered across sections, nested `<details>` collapsibles in Agenda, overlays via `AdminSheet` + `AdminDialog`.
- **Design tokens:** Rosé Pine Dawn (light) + Rosé Pine Moon (dark) CSS custom properties in `app/globals.css`. No design system beyond tokens.
- **Responsive:** fluid with max-width constraints; admin hides sidebar below `xl` breakpoint. Nothing is specifically designed for iPad-in-landscape touch ergonomics.

### Device model (decided)

- **Presenter = iPad-first, mirrored to a big screen.** One surface doing double duty as both control and stage. Touch-first; no presenter-notes panel (what you see is what the room sees).
- **Admin = iPad and Mac, both first-class.** iPad-first design assumption: if touch ergonomics work, mouse/keyboard inherit for free.
- **iPad Pro is ~4:3; projectors are typically 16:9.** Mirroring will letterbox. Parked for `/plan` phase — presenter layout should be designed 4:3-first with graceful 16:9 fallback.

## Chosen Approach — "One Canvas"

Admin and presenter are **two states of the same surface**, not two pages. The admin is a focused canvas with an outline rail; tapping an agenda scene **morphs that card into the full presenter view** via shared-element transitions. Background admin recedes (blur + scale-down, stays mounted). Swipe-down or Escape morphs it back.

### The three pillars

1. **Shared-element morph admin → presenter.** The agenda/scene card that is tapped becomes the presenter view. Same element, new shape. Background admin stays alive underneath. Implemented as an **intercepting/overlay route** rather than a separate Next.js page, so the morph is same-document (rock-solid) rather than cross-document.
2. **Right-edge vertical scene rail on presenter.** Thumb-reachable in iPad landscape. Auto-hides after ~2s of stillness; returns on touch or mouse-move. A collapsed live-morph of the current agenda item's scene tree. Swipe-left/right between scenes with spring physics as the primary gesture; rail is the secondary jump mechanism.
3. **Admin as focused canvas + left-edge outline rail.** Kills the 5-section sidebar and conditional-render chunkiness. One canvas shows one thing at a time. Outline rail is always visible, thumb-reachable in portrait and mouse-reachable on laptop. **Inline editing everywhere** — no scattered forms, no "scroll to find the right section." Click a field, it becomes editable; click out, it saves.

### Motion language

- **Motion library:** [Motion](https://motion.dev) (formerly Framer Motion), ~18kb, for spring physics and shared-element orchestration. View Transitions API as a progressive enhancement where it helps.
- **Feel:** Rauno-school restraint on *durations* and *easing* (short, damped, almost unnoticeable unless you're looking). Vision-school ambition on *what moves* (shared elements morph; nothing ever swaps when it can transform).
- **Anti-goal:** bouncy-springy-everything. If it feels like a tech demo it is wrong.

## Why This Approach

Optimizes for: **feeling unreasonably good to use, distinctive enough to notice, cohesive enough that admin and presenter feel like one thing.**

Rejected:
- **Approach B — "Quiet Rails" (restraint-school cohesion).** Separate routes, conceptual echo rather than shared-element morph, zero-library-first. Rejected because the user explicitly wants "really cool stuff, not what everyone is doing," and restraint-only reads as "clean" rather than distinctive.
- **Approach C — "Workshop OS."** OS-like window metaphor, multi-workshop multi-context. Rejected as overengineered for current need.
- **Original user instinct: dot-scroller (vertical dots + scroll-snap, portfolio-style).** Initially pushed back because scroll-snap on a big screen is twitchy. *Reversed* once iPad context was clarified — vertical right-edge rail (not scroll-snap-driven, swipe-driven with rail as jump indicator) is the right answer for iPad-in-landscape thumb ergonomics.

## Subjective Contract

- **Target outcome:** Using the dashboard should feel like using a well-made piece of software by someone with taste. When Ondrej demos it, a person whose judgment he respects should notice something — not say "nice app," but "wait, how did it do that?"
- **Anti-goals:**
  - Tech-demo animation theatre (bouncy springs, gratuitous scale/rotate)
  - Generic SaaS fade-slides, hover-lift cards
  - 2024-era "add Framer Motion to everything" instincts
  - Restraint so total it reads as unfinished
- **References:**
  - Vercel v0 / Rauno Freiberg's personal site — confident typography, spring physics on layout shifts, subtle depth
  - Vision OS — shared-element morphs, fluid state changes, nothing ever swaps when it can transform
- **Anti-references:**
  - Current `dashboard/app/admin/instances/[id]/page.tsx` layout (chunky, form-scattered, 5-section conditional render)
  - Current `ScenePager` prev/next buttons (clunky, non-native on iPad)
  - Linear's command palette as a *primary* nav (great as secondary; wrong as primary for a touch-first app)
- **Tone / taste rules:**
  - Motion durations short and damped. If you need to slow it down to notice it, it's wrong.
  - Nothing ever swaps when it can transform.
  - The rail should feel like it's attached to the content, not laid over it.
  - Inline editing should feel instantaneous. No save buttons. No confirmation toasts for normal edits.
- **Rejection criteria (concrete reasons to say "wrong"):**
  - Presenter feels laggy or stuttery on iPad hardware during swipe
  - Shared-element morph glitches visibly on admin→presenter transition
  - Facilitator can't find a setting they could find before (regression in discoverability)
  - Motion feels theatrical on second use
  - iPad thumb can't reach the rail without re-gripping

## Preview And Proof Slice

- **Proof slice:** The admin→presenter morph for a *single* agenda item + scene. Specifically: tapping the first scene card of the first agenda item in the focused-canvas admin should morph into the full presenter view for that scene, with the right-edge rail visible and swipe navigation working. This slice proves the core mechanic.
- **Required preview artifacts before broad implementation:**
  1. Static HTML/CSS comp of the focused-canvas admin (one agenda item, one outline rail, inline editing)
  2. Static HTML/CSS comp of the presenter view with right-edge rail visible
  3. Working prototype of the shared-element morph between #1 and #2 (even if only one scene-type wired up)
- **Rollout rule:** The proof slice must feel right on Ondrej's actual iPad before any other admin section is touched. If the slice doesn't feel unreasonably good, the approach is wrong and we reconsider before propagating.

## Key Design Decisions

### Q1: What aesthetic school? — RESOLVED
**Decision:** E + B — Vision/Dynamic Island morph language *plus* Vercel/Rauno restraint.
**Rationale:** The two schools share DNA (spring physics, shared-element transitions, restraint). Combining ambition-in-concept with restraint-in-execution is the hedge against over-animation fatigue.
**Alternatives considered:**
- Linear/Raycast school — rejected as too command-palette-primary for a touch-first app
- Arc Browser/Family.app school — rejected as too playful/theatrical for a workshop tool
- Things 3/iA Writer school — rejected as too quiet for the "noticeable" goal

### Q2: iPad as remote or iPad as stage? — RESOLVED
**Decision:** iPad *is* the presenter view, mirrored to a big screen. Single surface doing double duty.
**Rationale:** Simplest product model, touch-first unlocks obvious patterns (swipe, right-edge thumb rail). No two-surface sync problem.
**Alternatives considered:**
- iPad as remote + big screen as stage (Keynote-style) — rejected as needing two distinct designs and a sync protocol
- Mac-only — rejected; Ondrej already uses iPad for this context

### Q3: Navigation mechanic on presenter? — RESOLVED
**Decision:** Swipe-to-advance (primary) with spring-physics page transitions + right-edge auto-hiding vertical scene rail (secondary jump). No persistent prev/next buttons.
**Rationale:** Touch-native on iPad, works with mouse on laptop, thumb-reachable in landscape, rail auto-hides so the content is the interface.
**Alternatives considered:**
- Prev/next buttons (status quo) — rejected as clunky and non-native
- Scroll-snap dot rail (original user instinct) — rejected for big-screen twitchiness and lack of semantic landmarks
- Segmented progress rail (Instagram stories) — rejected as over-communicating progress for a facilitator-driven context
- Keyboard-only invisible nav — rejected as hostile to iPad

### Q4: Admin↔presenter relationship? — RESOLVED
**Decision:** Shared-element morph via intercepting/overlay route. Presenter is a UI state on top of admin, not a separate Next.js page.
**Rationale:** Same-document View Transitions are rock-solid; cross-document are not (yet). Morph is the distinctive *moment* of Approach A; it must work flawlessly.
**Consequence:** Current `app/admin/instances/[id]/presenter/page.tsx` route needs to be restructured as a parallel/intercepting route or client-side state. URL-shareable bookmarks to specific presenter states need a fallback (deep link resolves to admin with presenter auto-open).
**Alternatives considered:**
- Cross-document VT between separate routes — rejected as risky on iPad Safari
- Plain modal/sheet without shared-element morph — rejected as losing the core distinguishing feature
- Fully client-side SPA with no route for presenter — rejected as losing deep-linkability

### Q5: Motion library or zero-library? — RESOLVED
**Decision:** Motion library (~18kb).
**Rationale:** Spring physics, shared-element orchestration, and layout animations need imperative choreography across React component boundaries. CSS + View Transitions API can do pieces but not the whole.
**Alternatives considered:**
- Zero-library (CSS + View Transitions only) — rejected as insufficient for shared-element morph orchestration
- React Spring — rejected as less active than Motion
- Framer Motion classic — same library, renamed to Motion

### Q6: Admin refactor scope? — RESOLVED
**Decision:** Full refactor. Rewrite the 2000-line `app/admin/instances/[id]/page.tsx` as a focused canvas with left-edge outline rail and inline editing. No more 5-section sidebar with conditional render.
**Rationale:** Without the refactor, the shared-element morph has nothing beautiful to morph *from*. Shipping presenter polish on top of chunky admin misses the point.
**Risk accepted:** Biggest disruption, biggest payoff. Ondrej confirmed appetite.
**Alternatives considered:**
- Phased (one section at a time) — rejected as leaving the surface in permanent flux
- Presenter-first, admin-later — rejected as deferring the harder half of the pain

### Q7: Inline editing vs forms? — RESOLVED
**Decision:** Kill the forms. Inline editing everywhere. Click a field, it becomes editable; click out, it saves.
**Rationale:** Ondrej confirmed "scattered forms" means forms are the wrong pattern, not just the wrong placement. Inline everywhere is coherent with the focused-canvas + outline-rail admin model.
**Risk:** Inline-everywhere is less forgiving than forms with save buttons. No "cancel" affordance by default. Undo becomes load-bearing.
**Mitigation (for `/plan`):** optimistic local state with a global undo stack; per-field validation inline; destructive actions (delete team, delete agenda item) still require confirmation.
**Alternatives considered:**
- Keep forms, redesign placement — rejected per user confirmation
- Hybrid (inline for simple, forms for complex) — rejected as introducing two mental models

### Q8: View Transitions reliability risk mitigation? — RESOLVED
**Decision:** Proceed and adapt. Build with Motion + View Transitions, crossfade fallback if we hit issues on iPad Safari.
**Rationale:** Ondrej prefers velocity over upfront verification. Acceptable because same-document VT (enforced by Q4's intercepting-route decision) is much more reliable than cross-document.
**Alternatives considered:**
- Upfront spike (build one test morph first) — rejected by user for velocity
- Architect around VT limitations from day one — already implicitly done via Q4

## Open Questions

These are genuine unknowns to resolve during `/plan` or early implementation — not decisions we dodged.

1. **iPad aspect ratio + 16:9 mirroring.** Should presenter layout be designed 4:3-first (iPad native) with graceful 16:9 letterboxing on projectors, or 16:9-first with iPad showing pillarboxed content? Needs a real test on Ondrej's hardware.
2. **Undo stack scope.** Inline editing implies undo is load-bearing. Per-field? Per-agenda-item? Global cross-session? What's the minimum viable?
3. **Deep-linkability of presenter state.** Approach A makes presenter a UI state. A shareable URL that opens admin-with-presenter-open on a specific scene should still work. How — query param, intercepting-route URL structure, or `/presenter` as a thin redirect?
4. **What happens during admin refactor.** Are any workshops running live against current code? Branch strategy (feature flag, worktree, trunk with tests)? Test coverage of the existing 2000-line file?
5. **Motion curves — the actual values.** Spring stiffness, damping, durations. These are taste decisions that need a preview artifact to converge on.
6. **Discoverability regression check.** Facilitator should not "lose" any setting in the refactor. Need an explicit inventory of current admin capabilities before rebuild so nothing silently drops.
7. **Agenda-rail ↔ scene-rail morph choreography.** The admin left-edge outline rail and the presenter right-edge scene rail are conceptually the *same component* in different states. How literally do they share identity during the morph? Same DOM node? Separate nodes with a FLIP transition?
8. **Gesture conflict on iPad.** Swipe-left/right for scene navigation may conflict with iPadOS system gestures (back navigation, multitasking). Needs testing on hardware.

## Out of Scope

- Multi-workshop / multi-instance UX (Approach C's "Workshop OS" direction)
- Offline support beyond whatever Next.js gives for free
- Voice control, Apple Pencil-specific interactions
- Dark/light theme changes (keep existing Rosé Pine tokens)
- Command palette (⌘K) — may come later as secondary nav, not in this pass
- Participant-facing surfaces — this pass is facilitator-only (admin + presenter)
- Shareable public presenter URLs (view-only links for remote participants)
- Analytics / telemetry on motion perf

## Next Steps

- `/plan 2026-04-13-one-canvas-rework` to turn these decisions into a phased implementation plan
- Plan should lead with the **proof slice** (single agenda item + scene morph) before any broad refactor work
- Plan should explicitly sequence: (1) admin capability inventory, (2) proof slice, (3) validate on Ondrej's iPad, (4) admin refactor, (5) presenter rail + swipe, (6) propagate across all scene types
- Candidate `/compound` target after shipping: "iPad-first shared-element morph patterns with Motion + Next.js App Router intercepting routes" — likely novel enough to document for future work
