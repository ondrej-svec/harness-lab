---
title: "feat: dashboard motion polish, pending-state loaders, and design-system motion rules"
type: plan
date: 2026-04-14
status: approved
brainstorm: null
confidence: high
---

# Dashboard motion polish, pending-state loaders, and design-system motion rules

One-line summary: close the loader gap on navigation buttons that currently give no feedback, lift the landing page with restrained entrance motion, and codify what "good motion" means in the dashboard design system so the rule gets enforced going forward.

## Problem Statement

Recent work added motion and animation primitives to the dashboard (`dashboard-motion-*` CSS classes, `motion/react` provider, scene-density rollout) and the product feels noticeably more alive. Three gaps remain:

1. **Silent navigation buttons.** "Open instance" on the admin workspace list (`app/admin/page.tsx:445`) and "facilitator login" on the landing page (`app/page.tsx:149`) are plain `<Link>` / `<a>` elements. The user clicks and nothing visibly changes until the next route paints. On a slow network or cold server component that can be 500–1500ms of dead air — users re-click or assume it's broken. The presenter / participant-mirror buttons in `agenda-section.tsx:246,358` open in a new tab and similarly give no press feedback.
2. **Landing page feels static next to the rest of the product.** The hero has ambient drift layers, but headline, lead, tiles, and phase steps appear instantly with no entrance. Against the newly-animated admin/presenter surfaces, the marketing door now feels the flattest surface in the product — exactly backwards.
3. **Design system has no motion section.** `docs/dashboard-design-system.md` predates the motion rollout. It defines hierarchy, disclosure, and action semantics but says nothing about timing, easing, pending-state feedback, or reduced-motion. That means every future contributor (human or agent) will re-invent conventions, and reviewers have nothing to cite.

## Target End State

When this lands:

- Every navigation trigger on the dashboard that causes a route change shows pending state within 100ms of click (spinner, opacity, `aria-busy`).
- The three identified buttons use `AdminRouteLink` or an equivalent pending-aware wrapper.
- The landing page hero and content sections fade-and-lift into view on first paint and on scroll, staggered, and instantly resolve to their final state under `prefers-reduced-motion: reduce`.
- `docs/dashboard-design-system.md` has a canonical "Motion" section that other docs can reference, covering durations, easing, entrance patterns, pending-state rule, and reduced-motion requirements.
- Existing Playwright motion coverage still passes; reduced-motion path still results in the same final DOM.

## Scope and Non-Goals

**In scope:**
- `AdminRouteLink` adoption on the three identified buttons.
- A small pending-state wrapper for `target="_blank"` buttons in `agenda-section.tsx` that flashes briefly on click (new tab opens, so `useTransition` doesn't fire).
- Landing page hero stagger + `whileInView` section entrances using the already-installed `motion/react` library.
- Motion section added to `dashboard-design-system.md`.
- Update `docs/dashboard-testing-strategy.md` only if the motion section forces a rule change there (likely a one-line cross-reference).

**Out of scope (explicit non-goals):**
- New motion library, new design tokens, new color work.
- Page transitions via the View Transitions API — browser support is still uneven and it's not "simple."
- Parallax, hero 3D, scroll-linked timelines. Calm before clever.
- Touching participant or presenter motion. This slice is landing page + two admin buttons + one doc.
- Refactoring `dashboard-motion-*` CSS classes. They work. Leave them.

## Proposed Solution

### 1. Loaders (smallest, ship first)

- Replace `<Link>` at `app/admin/page.tsx:445` with `<AdminRouteLink>`. No styling change needed; the component merges `className`.
- Replace the `<a href={withLang("/admin", lang)}>` at `app/page.tsx:149` with `<AdminRouteLink>`. Note: landing page is a server component — `AdminRouteLink` is `"use client"`, so it renders fine as a client island inside it.
- For `agenda-section.tsx:246,358` (two `target="_blank"` buttons): these open external tabs, so `useTransition` doesn't help. Instead add a tiny client component `ExternalOpenButton` that on click sets a 600ms pending state (spinner + `aria-busy="true"`) then auto-clears. This confirms the click registered. Don't block the native `<a>` navigation.

### 2. Landing page motion

Convert `app/page.tsx` hero content and the three repeating sections to use `motion/react` with a shared stagger variant:

- Hero column: `motion.div` parent with `variants` that stagger children (eyebrow → h1 → lead → body → tiles → link row). Duration 400ms, stagger 60ms, `ease-out` (`[0.2, 0.8, 0.2, 1]`).
- `SignalTile`, `SimpleRule`, `PhaseStep`: wrap each in `motion.div` with `whileInView={{ opacity: 1, y: 0 }}`, `initial={{ opacity: 0, y: 16 }}`, `viewport={{ once: true, amount: 0.4 }}`.
- All of the above gated on `useReducedMotion()` → render as plain static divs when `true`. Do this via a shared `<FadeUp>` client component so the landing page's server component stays server-side except for the motion islands.
- No new CSS classes. No changes to `globals.css`.

### 3. Design system motion section

Add a new H2 "Motion" section after "Shared Foundations" in `docs/dashboard-design-system.md`. Contents:

- **Why motion at all.** One short paragraph: motion confirms action, directs attention, and connects state changes. It is not decoration.
- **Durations.** Micro (100–200ms) for hover/press, standard (200–300ms) for button state + card lift, view entrance (400–500ms) for hero/section fade-up. Numbers match what we already ship.
- **Easing.** Default `cubic-bezier(0.2, 0.8, 0.2, 1)` (ease-out). Linear is banned except for indeterminate spinners.
- **The three existing utility classes** (`dashboard-motion-card`, `dashboard-motion-button`, `dashboard-motion-link`) — when to use each, with one-line descriptions.
- **Pending-state rule.** Every control that causes a route change or server round-trip must show pending state within 100ms. Use `AdminRouteLink` for navigation; use `useFormStatus` for form submissions; use a transient state hook for `target="_blank"` openers. Cite WCAG 2.3.3 and Nielsen's 0.1/1/10-second response-time thresholds.
- **Reduced motion.** `prefers-reduced-motion: reduce` must collapse to instant state changes. All `motion/react` components must consult `useReducedMotion()`; all CSS motion utilities must have a reduced-motion fallback (they already do).
- **Stagger.** 40–80ms between siblings. Never stagger more than ~6 children at once.
- **Anti-patterns.** Parallax on content text, infinite looping ambient motion behind readable copy beyond the existing drift, motion as sole indicator of state, motion >600ms on functional UI.

Cross-link from `public-and-participant-design-rules.md` and `facilitator-control-room-design-system.md` in a one-line pointer each.

## Decision Rationale

**Why `AdminRouteLink` over adding view-transitions API?**
The View Transitions API would give smoother cross-page morphs but (a) requires Next 15 `unstable_ViewTransition` or manual browser API, (b) doesn't solve the "did my click register?" feedback problem, which is the actual user complaint, and (c) Safari support is still patchy. Pending-state spinner is the boring, correct answer. We can add view transitions later as a layer on top.

**Why wrap `target="_blank"` buttons at all?**
The new tab opens in ~50ms on a desktop but on mobile Safari it can be >1s while the OS decides whether to prompt the user. Those users currently see nothing. A 600ms transient pending state gives confirmation without ever blocking the native navigation — if the tab opens fast, they barely see it; if it opens slow, they know it worked.

**Why `motion/react` on landing page when the rest of the page is server-rendered?**
We already pay the `motion` bundle cost for admin/presenter. Adding client islands on landing reuses the same library — no new dependency, identical DX. The alternative (IntersectionObserver + CSS keyframes) is more code for strictly less power.

**Why not centralize the motion utility classes into a component library?**
Considered, rejected. The utility classes work, they compose with Tailwind, and abstracting them into `<MotionCard>` / `<MotionButton>` components would force every call site to rewrite. Not worth it. Document them, don't re-engineer them.

**Why update the design system doc in the same slice as the code changes?**
Because governance rule #2 in the existing design system file says: "if the change introduces a new recurring pattern, document it here or in the relevant surface doc." The pattern is already recurring — we're catching the doc up to reality. Splitting the doc update into a later slice means it probably never happens.

## Constraints and Boundaries

- **Calm before clever.** The existing design-system principle is binding. Any motion added must be quiet and operational, not decorative. If a reviewer says "this looks like a landing page template," the motion is wrong.
- **One visual family.** Landing motion must feel like the admin motion. Same easing curve, same duration range, same hover lift values. No bespoke splines.
- **No performance regressions.** Budget: landing page Time-to-Interactive must not regress. Use `motion/react`'s `LazyMotion` if bundle size becomes an issue (it currently isn't).
- **Reduced motion is not optional.** Every motion addition must have a reduced-motion path verified in code, not left to a CSS fallback alone.
- **No copy changes.** This plan does not touch Czech/English strings. If motion forces a copy change it's a sign the motion is wrong.
- **Trunk-based.** Small commits to `main`, no feature branch. (Per user's durable preference.)

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| `AdminRouteLink` renders cleanly inside a server component as a client island | Verified | `"use client"` directive on line 1; already used from server contexts in `app/admin/page.tsx` |
| `motion/react` (`motion` v12) is fully installed and the `motion-provider` wraps pages that need it | Verified | `package.json` shows `motion` 12.38.0; provider exists at `app/admin/instances/[id]/_components/motion-provider.tsx` |
| Landing page does not currently need a motion provider wrapper for `whileInView` to work | Verified | `motion/react` `whileInView` works without a LayoutGroup parent; provider is only needed for shared layout animations |
| `useFormStatus` on `SubmitButton` already handles the landing access form loader | Verified | `app/page.tsx:141-145` uses `SubmitButton` which is a known `useFormStatus` wrapper |
| `prefers-reduced-motion` CSS fallbacks in `globals.css` still match the new motion behavior | Verified | Lines 237–264 of `globals.css` zero out the motion utility classes under reduced-motion |
| Playwright motion coverage tests are deterministic under both motion and reduced-motion | Needs spot check | Recent commit `fcd5e6c` added dashboard motion coverage — verify it passes before and after this slice |
| Safari + iOS Safari handle `motion/react` `whileInView` + `once: true` without flicker | Unverified | Needs manual smoke test in browser during task execution |

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Landing page hydration flash (FOUC): server renders static, client swaps to motion initial state (hidden), brief flicker | Medium | Medium | Set `initial={false}` on the first mount OR render initial state server-side matching `opacity: 0` and animate in on client. Verify in Chrome + Safari. |
| `AdminRouteLink` swap breaks styling on the admin list button (existing className uses `dashboard-motion-button` which expects specific DOM) | Low | Low | `AdminRouteLink` wraps children in `<span className="inline-flex">`. Test hover + focus states after swap. Trivially reversible. |
| Reduced-motion users see an empty hero because `opacity: 0` initial state never animates to `1` | Low | High | `useReducedMotion()` short-circuit renders the static tree with no motion wrapping. Add a Playwright test that sets `reducedMotion: 'reduce'` and asserts hero content is visible on first paint. |
| Design system doc sprawl — adding a Motion section tempts subsequent sections to grow | Low | Low | Keep Motion section under ~80 lines. If it needs more, spin it out to `docs/dashboard-motion-system.md` and leave a pointer. |
| New tab opener flash lingers after the tab opens, confusing users | Low | Low | Fixed 600ms timeout clears regardless. No race with unload. |
| Motion work conflicts with in-flight facilitator cockpit redesign (prior plan from 2026-04-07) | Low | Medium | Scope is carefully limited to landing + 3 buttons + 1 doc. Does not touch cockpit IA. Confirm nothing in `app/admin/instances/[id]/_components/` is mid-refactor before editing sibling file `agenda-section.tsx`. |

## Implementation Tasks

Dependency-ordered. Each checkbox is a work unit for `/work`.

### Phase 1 — Loaders (ship-first, fully reversible)

- [ ] Swap `<Link>` at `app/admin/page.tsx:445-447` for `<AdminRouteLink>`. Verify hover lift and focus ring still match adjacent buttons.
- [ ] Swap `<a href={withLang("/admin", lang)}>` at `app/page.tsx:149` for `<AdminRouteLink>`. Client island inside server component.
- [ ] Create `app/admin/instances/[id]/_components/external-open-button.tsx`: client component, accepts `href` + `children` + className, renders `<a target="_blank" rel="noreferrer">` with local 600ms pending state on click (spinner + `aria-busy`).
- [ ] Replace both presenter/mirror `<a>` tags in `agenda-section.tsx:246-254, 358-365` with `<ExternalOpenButton>`.
- [ ] Manual smoke test: click each of the 4 buttons on dev server, confirm loader appears within 100ms.
- [ ] Run existing Playwright suite. Fix any selector drift caused by the new wrapper `<span>`.
- [ ] Commit to `main`: `feat: pending-state loaders on admin navigation and external openers`.

### Phase 2 — Landing page motion

- [ ] Create `app/components/fade-up.tsx`: client component. Props: `children`, `delay?`, `as?`. Consults `useReducedMotion()`; returns plain `<div>` if reduced, else `motion.div` with `initial={{ opacity: 0, y: 16 }}` / `whileInView={{ opacity: 1, y: 0 }}` / `viewport={{ once: true, amount: 0.4 }}` / `transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}`.
- [ ] Create `app/components/hero-stagger.tsx`: client wrapper that provides staggered entrance for hero children. `motion.div` with `variants` that animate children in sequence, 60ms stagger, 400ms duration, same easing.
- [ ] Update `app/page.tsx`: wrap hero left column content in `<HeroStagger>`, wrap each `SignalTile` / `SimpleRule` / `PhaseStep` render in `<FadeUp>`. Server component stays server; the two new components are the client islands.
- [ ] Verify: first paint with JS enabled shows stagger. First paint with JS disabled shows static content (no permanent hidden state — SSR renders opacity 1 then client animates, OR accept a one-frame flash).
- [ ] Verify under `prefers-reduced-motion: reduce` — content visible immediately, no motion.
- [ ] Add Playwright coverage: one test for motion path (hero h1 visible after 500ms), one for reduced-motion path (hero h1 visible on first paint).
- [ ] Commit to `main`: `feat: landing page hero stagger and section fade-up`.

### Phase 3 — Design system motion section

- [ ] Draft "Motion" H2 section in `docs/dashboard-design-system.md`, inserted between "Shared Foundations" and "Shared Surface Hierarchy".
- [ ] Cover: purpose, durations, easing, utility classes, pending-state rule, reduced-motion requirement, stagger guidance, anti-patterns. Target ≤80 lines.
- [ ] Add one-line pointer in `public-and-participant-design-rules.md` and `facilitator-control-room-design-system.md` referencing the Motion section.
- [ ] Update `docs/dashboard-design-system.md` "Review Checklist" with a new item: *"Does every navigation trigger show pending state within 100ms?"*
- [ ] Commit to `main`: `docs: design system motion section and pending-state rule`.

### Phase 4 — Verify and close

- [ ] Run full Playwright suite + vitest unit tests.
- [ ] Manual pass: landing page on desktop Chrome, mobile Safari simulator, reduced-motion toggled on macOS System Settings.
- [ ] Check Lighthouse: landing page performance score must not regress more than 2 points.
- [ ] `/compound` the slice if anything non-obvious came out of it.

## Acceptance Criteria

Measurable and testable:

1. Clicking "open instance" on the admin workspace list shows a spinner within 100ms of click — verified by Playwright with a throttled navigation.
2. Clicking "facilitator login" on the landing page shows a spinner within 100ms of click — verified by Playwright.
3. Clicking either "open presenter" or "open participant mirror" in the agenda section shows a transient pending state — verified by Playwright checking `aria-busy="true"` within 100ms of click.
4. The landing page hero `h1` has `opacity: 0` at initial client render and reaches `opacity: 1` by 500ms in the motion path — verified by Playwright.
5. The same `h1` has `opacity: 1` on first paint under `reducedMotion: 'reduce'` — verified by Playwright.
6. `docs/dashboard-design-system.md` contains an H2 "Motion" section with subsections for durations, easing, pending-state rule, and reduced-motion — verified by reading the diff.
7. All existing Playwright dashboard motion tests still pass — `pnpm test:e2e` green on `main`.
8. Landing page Lighthouse performance ≥ baseline − 2 — verified in DevTools.

## References

- Existing loader pattern: `app/admin/admin-route-link.tsx`
- Existing motion utilities: `app/globals.css` lines 188–264
- Existing motion provider: `app/admin/instances/[id]/_components/motion-provider.tsx`
- Recent related work: `docs/plans/archive/2026-04-10-feat-landing-page-sharpening-and-agent-handoff-plan.md`, `docs/plans/2026-04-08-fix-dashboard-design-system-audit-remediations-plan.md`
- Prior design system audit commit: `fcd5e6c Add dashboard motion coverage`
- Governing design doc: `docs/dashboard-design-system.md`
- External best practices confirmed: 100–200ms micro, 300–500ms view transitions, ease-out for entrances, `prefers-reduced-motion` mandatory, WCAG 2.3.3 Animation from Interactions, Nielsen response-time thresholds (0.1s / 1s / 10s).
