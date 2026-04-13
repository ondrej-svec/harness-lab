---
title: "Research notes — One Canvas dashboard rework"
type: research
date: 2026-04-13
for-plan: docs/plans/2026-04-13-refactor-one-canvas-dashboard-plan.md
---

# Research notes — One Canvas dashboard rework

Verification pass after Ondrej asked whether the plan was actually grounded in current (April 2026) docs vs. assumption-baked. Short answer: it wasn't grounded enough, and one load-bearing assumption (Motion `layoutId` as the mechanism for the admin→presenter morph) turned out to be contradicted by a still-open Next.js issue. This document captures the verified facts, sources, and the decisions that flipped as a result.

## Verification scope

- Next.js 16 intercepting + parallel routes syntax and behavior
- Motion library (`motion.dev`) current layout animation API and known issues with App Router
- React 19.2 `<ViewTransition>` component (released March 2026 — post my original cutoff)
- Next.js 16 `experimental: { viewTransition: true }` config and official guide
- Safari 18.x + iPadOS View Transitions API support status
- `useOptimistic` current API and the safe pattern for click-to-edit inline editing
- `overscroll-behavior` for iPadOS edge-swipe conflict mitigation
- Rauno Freiberg's site as a verified design reference
- Known open issues affecting any of the above

Context7 was quota-exhausted ("Monthly quota exceeded") on first call, so all verification went through `WebFetch` against canonical sources (Next.js official docs, React docs, WebKit blog, caniuse, GitHub issues) and targeted `WebSearch`.

## Findings that change the plan

### 1. Motion `layoutId` + Next.js App Router intercepting routes is a known unresolved problem

- **Next.js issue #49279** — "App router issue with Framer Motion shared layout animations" — still **open** since May 2023. Root cause identified: Next.js inserts `OuterLayoutRouter` components between layouts and templates, preventing Motion from properly setting up shared layout animations. `usePathname()` updates post-render, blocking key-based animation triggers. Vercel has acknowledged; there is no fix.
  - Source: https://github.com/vercel/next.js/issues/49279
- **Motion discussion #2143** — "Layout Transition with NextJS Intercepting Routes" — unresolved through November 2024. Multiple developers confirm transitions work for standard page navigation but break when routes are intercepted. One contributor posted a "working example" repo but never shared details in the thread.
  - Source: https://github.com/motiondivision/motion/discussions/2143

**Consequence:** the original plan's architectural foundation — *"use Motion `layoutId` for shared-element morph between admin and the intercepting presenter route"* — was not grounded in current community reality. It assumed a pattern that the community has not made reliably work.

### 2. React 19.2 `<ViewTransition>` component is the designed-for-this solution

- Released in **March 2026** alongside Next.js 16.
- **Import:** `import { ViewTransition } from 'react'` (directly from `react`, not `next`).
  - Earlier third-party sources (digitalapplied blog) referred to it as `unstable_ViewTransition` from Next — the *authoritative* pattern per official Next.js docs is to import from `react`.
- **Enablement:** `experimental: { viewTransition: true }` in `next.config.ts`.
- **Shared element pattern** (exact from official Next.js guide):
  ```tsx
  // grid thumbnail
  <ViewTransition name={`photo-${photo.id}`}>
    <Image src={photo.src} />
  </ViewTransition>

  // detail hero (different route)
  <ViewTransition name={`photo-${photo.id}`}>
    <Image src={photo.src} fill />
  </ViewTransition>
  ```
  Same `name` on both sides → browser performs FLIP morph automatically. No additional props required.
- **Activation:** `<ViewTransition>` animates on React Transitions, Suspense, and `useDeferredValue`. **In Next.js, route navigations are Transitions, so it activates automatically.** This means intercepting routes navigating via `<Link>` get the morph for free.
- **Directional navigation** via `transitionTypes` prop on `<Link>`:
  ```tsx
  <Link href={`/photo/${id}`} transitionTypes={['nav-forward']}>
  <Link href="/" transitionTypes={['nav-back']}>
  ```
  Then the `<ViewTransition>` `enter`/`exit` props map transition types to named CSS animations. Perfect for scene-to-scene swipe that should slide forward vs. back.
- **Anchoring elements** (keep outline rail / scene rail fixed while content morphs) — assign a `viewTransitionName` and disable animation in CSS:
  ```css
  ::view-transition-group(site-header) {
    animation: none;
    z-index: 100;
  }
  ```
- **Customization via CSS pseudo-elements:** `::view-transition-group(.class)`, `::view-transition-old(.class)`, `::view-transition-new(.class)`, `::view-transition-image-pair(.class)`. Full control over timing, easing, blur keyframes, directional slides.
- **Crossfade within same route via `key`:**
  ```tsx
  <ViewTransition key={slug} name="content" share="auto" enter="auto" default="none">
  ```
- **Reduced motion handled** via single CSS media query.
- **Bundle weight:** ~3kb added to React.
- **Browser feature detection:** automatic. Unsupported browsers (anything pre-Safari 18 / Chrome 111 / Firefox 144) get instant navigation without animation — no app code changes needed.
- **Production usage:** the Vercel dashboard itself uses this feature. `unstable_` prefix reflects browser-spec evolution, not implementation quality.
- **Official reference code:** `vercel-labs/react-view-transitions-demo` + live demo at `react-view-transitions-demo.labs.vercel.dev`.
  - Source: https://nextjs.org/docs/app/guides/view-transitions (version 16.2.3, lastUpdated 2026-04-08)
  - Source: https://react.dev/reference/react/ViewTransition

**Consequence:** this is the right primitive for the admin→presenter morph. It's designed for exactly this pattern, officially documented with working code, and doesn't hit the Motion `layoutId` incompatibility.

### 3. Motion is still the right tool for gesture-level work

The pivot is *not* "remove Motion entirely." Motion remains correct for:

- **Swipe-to-advance gesture** on presenter — `motion.div` with `drag="x"` + spring physics. This is a client-side interaction pattern, no route transition involved, so the App Router issue doesn't apply.
- **Auto-hide rail animations** — enter/exit with spring physics, triggered by idle timer and pointer events. No route involvement.
- **Inline-edit micro-interactions** — focus ring animations, optimistic-save pulse, error rollback shake. Pure component-level animation.
- **Background recede** when presenter overlay is active — `motion.div` scale + blur + opacity on the admin tree. Component-level, no shared-element crossing required.

Motion's layout/`layoutId` API is what has the known issue; its gesture and imperative animation APIs are unaffected.
- Source: https://motion.dev/docs/react-layout-animations

### 4. Next.js 16 intercepting routes syntax verified against current docs

Directly from the official Next 16.2.3 docs (lastUpdated 2026-04-08):

- `(.)` — match segments on the **same level**
- `(..)` — match segments **one level above**
- `(..)(..)` — match segments **two levels above**
- `(...)` — match segments from the **root** `app` directory
- **Parallel `@slot` folders do NOT count as route segments.** So `(..)photo` inside `app/@modal/(..)photo/` matches one segment up, not two file-levels up. This is the canonical modal + intercepting-route pattern.
- Hard-load (direct URL visit, refresh) bypasses the intercept and renders the real route. This is the exact dual-behavior the plan requires for deep-linkability.
- Official reference: `vercel-labs/nextgram` (intercepting-route modal example).
  - Source: https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes

### 5. Safari 18.x View Transitions support is solid

- **Same-document View Transitions:** supported since Safari 18.0 (iOS/iPadOS 18.0).
- **Cross-document View Transitions:** added in Safari 18.2 (December 2024).
- **`view-transition-name: auto`:** added in 18.2.
- **Global support (caniuse April 2026):** 90.94%.
- WebKit blog notes no outstanding bugs for 18.2 VT. The official Next.js guide caveat: "some animations may behave differently in Safari" — not a blocker, but an on-device check point.
  - Source: https://webkit.org/blog/16301/webkit-features-in-safari-18-2/
  - Source: https://caniuse.com/view-transitions

### 6. One open blocker: Cache Components mode + View Transitions

- **Next.js issue #85693** — "View Transition Error in Cache Component Mode" — open, reported November 2, 2025, not resolved. When `viewTransition: true` + `cacheComponents: true` are both on, morphs glitch (brief blur then abrupt cutoff).
- **This does NOT affect us.** The dashboard uses standard Next 16 caching, not the experimental Cache Components mode. We must **not** enable Cache Components until the issue is resolved.
  - Source: https://github.com/vercel/next.js/issues/85693

### 7. `useOptimistic` requires `startTransition` + reducer pattern

From the official React docs:

- Function signature: `const [optimisticState, setOptimistic] = useOptimistic(value, reducer?)`
- **Must be called inside `startTransition`** or an Action. Calling `setOptimistic` outside a Transition throws.
- **Error rollback is automatic** — if the Action throws, optimistic state reverts to whatever the parent's `value` currently is. No explicit rollback code needed for the happy path.
- **Reducer pattern is mandatory when base state can change concurrently.** Absolute setters (`setOptimistic(5)`) show stale data if the field value changes during an async save. Use `useOptimistic(count, (current, delta) => current + delta)` for relative updates.
- **Official docs do not give an example of blur-triggered save without a save button.** We're inventing the pattern. The safe implementation:
  ```tsx
  function handleBlur(newValue: string) {
    startTransition(async () => {
      setOptimistic(newValue);
      await updateField(newValue);
    });
  }
  ```
- Error surfacing for silent saves: `try/catch` around the server action call inside the transition, set an error state separately, surface via subtle indicator (not a toast per design contract).
  - Source: https://react.dev/reference/react/useOptimistic

**Consequence:** the plan's "inline editing everywhere" decision is still sound, but the *implementation* must use `startTransition` + (ideally) the reducer pattern. Phase 3 tasks must reflect this.

### 8. `overscroll-behavior-x: contain` is the documented iPad mitigation

- Confirmed pattern for preventing horizontal-drag → browser-back conflict. Works on iPadOS via WebKit.
- **Not specifically verified for iPadOS 18 edge-swipe-back gesture** — this still needs on-device testing in Phase 1 of the plan.
- An additional pattern: keep swipe targets ~24px away from screen edges so `overscroll-behavior` isn't the only line of defense.
  - Source: https://danburzo.ro/css-overscroll-behavior/

### 9. Rauno reference verified

- Snappy cubic-bezier `(0.2, 0.8, 0.2, 1)` for transitions.
- 8px spacing system (variables `--space-1` through `--space-11`).
- System fonts: `X, -apple-system, BlinkMacSystemFont, "Segoe UI"`, JetBrains Mono for monospace.
- Shadow definitions: small, medium, large, tooltip variants — depth without heaviness.
- Light-mode default with dark-mode support.
- Design philosophy motto: "Make it carefully."
  - Source: https://rauno.me

This gives concrete, copyable values for motion curves and spacing that we can target during Phase 6 polish without inventing our own.

## Mapping findings back to the plan

| Plan decision | Original | After verification |
|---|---|---|
| Q5: Motion library | "Use Motion v12 for shared-element morph AND gestures" | Split: **React `<ViewTransition>`** for the admin→presenter morph; **Motion** for swipe, drag, spring, rail enter/exit, inline-edit micro-interactions |
| A2: Motion `layoutId` works across client branches | Verified ✓ | **Falsified.** `layoutId` is fine in isolation, but the *App Router intercepting-route + layoutId morph* pattern is a known unresolved issue (#49279). Replaced by A2': React `<ViewTransition>` + `name` prop is the grounded mechanism |
| A3: Thin client boundary pattern for Motion | Verified ✓ | Still correct for Motion's gesture usage |
| A4: Safari 18.x VT reliability on iPad | Unverified | **Verified ✓** (Safari 18.0+ same-document, 18.2+ cross-document, 90.94% global) |
| A7: `useOptimistic` gives clean inline-edit feel | Unverified | **Partially verified** — API works, but requires `startTransition` wrapper and ideally reducer pattern; Phase 3 tasks updated |
| Motion bundle weight +18kb | Accepted | Reduced: ViewTransition is ~3kb; Motion is still needed but the load is lighter than "Motion does everything" |
| Architectural shape | `@presenter/(.)presenter/...` + Motion `layoutId` on scene cards | `@presenter/(.)presenter/...` + React `<ViewTransition name=...>` on shared elements + Motion on gestures |

## New assumptions added

| # | Assumption | Status | Evidence |
|---|---|---|---|
| A15 | `experimental: { viewTransition: true }` in Next 16.2.3 is safe to enable in production config | Verified | Official Next.js guide recommends it as the enablement step; Vercel dashboard uses it in production |
| A16 | The dashboard does NOT use `cacheComponents` mode and will not enable it during this refactor | Verified | Grep for `cacheComponents` returns nothing in dashboard config; plan explicitly bans enabling it due to #85693 |
| A17 | `<ViewTransition name=...>` shared-element pattern works across Next 16 intercepting routes without hitting the Motion-style App Router issue | Strong evidence, not on-device-verified | Official Next.js guide uses it for exactly this pattern; to be confirmed on Ondrej's iPad in Phase 1 |
| A18 | The `transitionTypes` prop on `<Link>` correctly triggers directional scene-to-scene slides | Documented | Per Next.js guide Step 3 |
| A19 | `overscroll-behavior-x: contain` prevents horizontal-drag conflict with iPadOS 18 edge-swipe back | Partially verified | CSS pattern documented and widely working; iPadOS 18 specific behavior still needs on-device check |
| A20 | Motion's gesture APIs (drag, spring) are unaffected by the App Router `layoutId` issue | Verified by reasoning | Issue #49279 is specifically about `OuterLayoutRouter` breaking Motion's layout detection; gesture APIs don't depend on layout detection |

## New risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `unstable_ViewTransition` API churns before stable release | Med | Low | Import path may change. Isolate usage to a small number of files (`<ViewTransition>` wrappers at route boundaries); one refactor pass if the API moves. |
| CSS `::view-transition-*` pseudo-elements behave differently on Safari vs Chromium | Med | Med | Phase 1 + Phase 6 on-device testing on iPad Safari AND desktop Safari AND desktop Chrome; document observed differences |
| React `<ViewTransition>` + intercepting routes has an undocumented edge case we hit | Med | Med | Phase 1 proof slice IS this verification; if it breaks, fall back to ... *(see fallback below)* |
| Fallback question: what if ViewTransition doesn't work for us either? | Low | High | **Fallback plan:** drop the shared-element morph entirely and use a Motion-powered background blur/scale + content crossfade (no "same element morphing" — just "admin recedes, presenter appears"). Less distinctive but still coherent with E+B aesthetic. Decision point: Phase 1 review gate. |

## Unknown unknowns we did NOT verify

Being honest about remaining gaps:

- **Performance of many simultaneous `<ViewTransition>` elements on iPad Pro hardware.** 30+ scene-block elements each wrapped in their own ViewTransition may or may not be smooth. Not tested.
- **Container queries in Tailwind v4** — planned to use but not verified against current Tailwind v4 syntax. Phase 0 should include a tiny syntax check.
- **Interaction between Next.js streaming / Suspense boundaries and `<ViewTransition>` in the intercepting route specifically.** The guide covers same-route Suspense reveals but not "Suspense inside an intercepting overlay while the parent layout stays mounted."
- **Motion's drag gesture behavior on iPadOS 18 specifically** — drag works on iPad broadly, but haven't verified current edge cases for multi-touch, pencil, or rapid gestures.
- **Accessibility audit of the ViewTransition + intercepting-route pattern** — screen reader announcement of "overlay opened" vs "navigated to page" is not documented in the official guide.
- **4:3 iPad mirrored to 16:9 projector behavior** — planned for Phase 6 testing, no research done on letterboxing best practices.
- **React 19 Server Components + `<ViewTransition>` boundary semantics** — the guide's examples all show ViewTransition inside client components (wrapping `<Image>`), not explicit about where the client boundary must live.

These are acknowledged gaps, not silent assumptions. They each have a Phase 0 or Phase 1 task assigned in the amended plan.

## Bottom line

The plan is now **materially more grounded** than before this verification pass. The core architectural decision (use React `<ViewTransition>` for the morph, keep Motion for gestures) is sourced from the official Next.js and React documentation, cross-checked against a known open issue, and supported by Vercel's own production usage. Confidence in the plan moves from `medium-high` → `high` on architecture, `medium` on execution details, `medium` on on-device behavior.

The one critical thing we cannot verify from documentation alone is whether this works *on Ondrej's specific iPad with real workshop content*. That's the Phase 1 proof-slice review gate, which stays as the load-bearing risk gate for the whole refactor.
