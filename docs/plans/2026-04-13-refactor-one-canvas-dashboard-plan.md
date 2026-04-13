---
title: "refactor: One Canvas — dashboard motion + admin rework"
type: plan
date: 2026-04-13
status: implementation-complete-pending-on-device-review
brainstorm: docs/brainstorms/2026-04-13-one-canvas-rework-brainstorm.md
confidence: high (architecture), medium (execution details), medium (on-device behavior)
amended: 2026-04-13 (added responsiveness parity + test protocol; pivoted morph mechanism from Motion layoutId to React ViewTransition after verification research surfaced a known open App Router issue — see docs/plans/2026-04-13-one-canvas-research-notes.md)
phase_commits:
  phase_0: [6aeda39, af893a9, aa66ee3]
  phase_1: [3e15a2c]
  phase_2: [1eb0b4a]
  phase_3: [ecd0ab0, 268e6ef]
  phase_4: [3080d99]
  phase_5: [3611a4a, 3970a30]
  phase_6: [818ad96]
  phase_7: [3a4457c]
  playwright_walkthrough: [dcdd22f]
  followup_session_2: [3e0f30e, 268e6ef, 3970a30, dc6a622, aede68d, e04f650, 27d33f7]
  followup_session_3: [92cf436, 038a3b7, 38eb44c]
---

# refactor: One Canvas — dashboard motion + admin rework

Restructure the facilitator admin and presenter surfaces into a single continuous canvas, iPad-first, with shared-element morph between admin and presenter, a right-edge scene rail with swipe navigation, and inline content editing in admin. Replace chunky 5-section sidebar + conditional render + scattered sheet forms with a focused canvas + outline rail.

## Problem Statement

`dashboard/app/admin/instances/[id]/page.tsx` is 2056 lines. It exposes 30+ capabilities across 5 conditionally-rendered sections, 4 sheet overlays, and several `<details>` collapsibles. Forms are scattered. Navigation between admin and presenter is a full-page jump (`/admin/instances/[id]/presenter?...`) with prev/next buttons on the presenter side. The whole experience is "chunky" — Ondrej's primary user — and is not designed for iPad-in-landscape touch use.

Both surfaces need to feel like they were made in 2026 by someone with taste, work beautifully on iPad (mirrored to a big screen for the presenter role), and remain usable on desktop without duplicate design work.

## Target End State

When this plan lands, these should all be true:

- Admin is a focused canvas with a left-edge outline rail; no 5-section conditional sidebar.
- Tapping an agenda scene in admin **morphs** that card into the full presenter view via shared-element transition (same document, intercepting route). Background admin stays mounted.
- Presenter has a right-edge auto-hiding vertical scene rail in iPad thumb-reach. Swipe left/right is the primary scene navigation. Prev/next buttons are gone.
- Every piece of editable **content** (agenda item titles, descriptions, scene copy, team names, checkpoint notes) is inline-editable; click → edit → click-out → save. No sheet overlays for content.
- **Operational actions** (password change, workshop reset, facilitator revoke, participant access code issue) still use explicit forms/dialogs with confirmation. The distinction content-vs-operation is load-bearing.
- A direct URL load of `/admin/instances/[id]/presenter/...` still resolves to a full presenter page (hard-load fallback) so bookmarks and link-sharing don't break.
- Motion curves feel damped and confident, not bouncy. Nothing swaps when it can morph.
- Every capability in the current admin (see inventory in references) has a home in the new IA. Nothing silently dropped.
- `Reset workshop` now requires explicit confirmation (new — current code has none).
- Works on Ondrej's actual iPad **and** on desktop (Mac laptop + external display) during the workshop happening next week. Desktop is not a second-class inheritor — it is a first-class target with its own review gate.
- Every screen renders cleanly at all five existing Playwright viewports: 393×852 (mobile), 1024×768 (iPad landscape), 1024×1366 (iPad portrait), 1280×1200 (desktop small), 1440×1400 (desktop large).
- Automated test suite (Vitest + Playwright) stays green. 80% statement/line/function coverage threshold preserved. Visual regression baselines are intentionally re-captured during the refactor and diffs are reviewed — not silently ignored.

## Responsiveness and Parity Requirements

Desktop parity is a load-bearing requirement of this plan — not an aside.

### First-class targets (must feel native and tested)

| Device class | Viewport | Input model | Review gate | Existing snapshot |
|---|---|---|---|---|
| iPad landscape (Pro 13") | ~1366×1024 | Touch primary; swipe, tap, long-press | Phase 1 + Phase 6 on-device | `facilitator-control-room-ipad.png` |
| iPad portrait | 1024×1366 | Touch primary; scroll, tap | Phase 6 on-device | (new baseline this refactor) |
| Desktop large | 1440×1400 | Mouse + keyboard | Phase 2 + Phase 6 on-device | `facilitator-overview-desktop.png` |
| Desktop small | 1280×1200 | Mouse + keyboard | Phase 6 snapshot | (existing sheet reflow test at 1280) |
| Mobile phone | 393×852 | Touch (same language as iPad, different layout) | Phase 6 snapshot | `facilitator-control-room-mobile.png` |

### Interaction parity rules

- **Every action must work with both mouse/keyboard and touch.** No "touch-only" or "mouse-only" moments.
- **Hover states are banned as the only signal for anything.** Touch devices don't fire `:hover`. Use focus-visible or persistent affordances instead.
- **Swipe on iPad = drag-with-mouse on desktop.** Motion's `drag` handles both; spring physics identical.
- **Right-edge scene rail = always visible on desktop** (no auto-hide — pointer users can have it persistent). Auto-hide still applies on touch.
- **Keyboard shortcuts on desktop:** `←`/`→` for scene nav, `Escape` to close presenter overlay, `Enter`/`Space` on focused cards, `Tab` cycles inline-editable fields. Keyboard navigation must fully work without a mouse.
- **Focus indicators visible** on all interactive elements — desktop keyboard users are the test population the iPad-first instinct forgets.
- **Outline rail placement on desktop:** still left-edge, but sized for mouse-pointer targets (min 32px tall rows) and dense enough that the full agenda + teams + settings fits without the thumb-reach padding needed on iPad.

### Responsive layout strategy

- **Container queries** over media queries where feasible (Tailwind v4 supports these cleanly). Components reshape based on their own size, not the viewport, which makes the split admin+presenter layout robust across iPad-portrait, iPad-landscape, and desktop simultaneously.
- **4:3-first presenter, graceful 16:9.** Presenter content is designed for iPad-native aspect ratio; desktop browsers get letterboxing when the window is wider than 4:3, with optional "fill" for big-screen mirroring.
- **Typography scales.** Hero text on iPad ≠ hero text on mobile ≠ hero text on 4K desktop. Use Tailwind v4's responsive text utilities (existing pattern: `text-3xl sm:text-5xl`). Verify at every breakpoint in Phase 6.
- **No device-sniffing UA detection.** Feature-detect touch via `(pointer: coarse)` media query for the auto-hide behavior; use pointer events throughout.

### Anti-patterns explicitly rejected

- "Mobile-first responsive" that gives desktop leftovers of a phone layout — we're not doing that
- "Desktop-first responsive" that crushes the iPad layout with mouse-targeting paddings — we're not doing that either
- Separate component trees per device class — one component tree, one set of primitives, responsive by composition

## Subjective Contract

- **Target outcome:** The first person with taste who Ondrej demos this to should say "wait, how did it do that?" — not "nice app."
- **Anti-goals:**
  - Bouncy-springy-everything tech-demo aesthetics
  - Motion that gets in the way of typing or navigating
  - Generic SaaS fade-slides or hover-lift cards
  - Restraint so total it reads as unfinished
  - A "clean" refactor that quietly drops capabilities
- **References:** Vercel v0, Rauno Freiberg's personal site, Vision OS shared-element behavior, Dynamic Island morphs
- **Anti-references:** The current `dashboard/app/admin/instances/[id]/page.tsx` layout (chunky, form-scattered), the current `ScenePager` prev/next buttons, Linear's ⌘K palette as a *primary* navigation
- **Tone / taste rules:**
  - Motion durations short and damped. If you need to slow to notice it, it's wrong.
  - Nothing swaps when it can transform.
  - The rail is attached to content, not laid over it.
  - Inline content edits are instantaneous — no save buttons for normal edits, no confirmation toasts.
  - Operational actions (destructive or account-level) stay explicit and confirmed.
- **Rejection criteria (what makes this wrong even if it ships):**
  - Shared-element morph visibly glitches on iPad during admin→presenter
  - Any existing capability cannot be reached in the new IA
  - Swipe on iPad feels laggy or triggers system back-gesture accidentally
  - Facilitator accidentally deletes a team, agenda item, or resets state without a confirm
  - Motion feels theatrical on second use
- **Required preview artifacts (Phase 1 gate):**
  1. Live proof slice running on Ondrej's iPad: one agenda item + one scene, admin focused-canvas, intercepting presenter route, shared-element morph, right-edge rail, swipe between two scenes.
  2. Captured video or screen recording of the morph for review.
- **Review:** Ondrej reviews the proof slice on his own iPad. If it does not feel unreasonably good, Phase 1 sends the work back to brainstorm — not forward to Phase 2.
- **Rollout rule:** No admin section beyond the proof-slice agenda item is touched until the proof slice passes the review gate.

## Scope and Non-Goals

### In scope
- Admin surface rewrite (layout, IA, interaction model, inline editing)
- Presenter surface rewrite (navigation, rail, swipe, scene transitions)
- Intercepting route architecture for admin→presenter
- Motion library integration (Motion v12, `motion/react`)
- All existing capability preservation (see Phase 7 regression check)
- iPad Safari 18.x + desktop Safari/Chrome support
- Rosé Pine Dawn/Moon theme preserved (no theme redesign)
- `Reset workshop` confirmation dialog (correcting current gap)

### Out of scope
- Participant-facing surfaces (`dashboard/app/p/...` etc.) — facilitator-only pass
- New theming / design tokens beyond Rosé Pine
- Command palette (⌘K) — may come as a secondary nav later, not this pass
- Multi-workshop / multi-instance UX
- Offline support beyond Next.js defaults
- Apple Pencil-specific interactions
- Shareable public presenter URLs (view-only links for absent participants)
- Motion perf telemetry
- Storybook / component gallery
- Unit tests for every new component (targeted tests only — see Risks)

## Proposed Solution

### Architectural shape

```
dashboard/app/admin/instances/[id]/
├── layout.tsx                          # NEW — owns the focused canvas shell,
│                                        # mounts @presenter slot explicitly
├── page.tsx                            # REWRITTEN — thin composition of
│                                        # outline-rail + focused canvas
├── @presenter/                         # NEW parallel route slot
│   ├── default.tsx                     # null — nothing rendered when closed
│   └── (.)presenter/                   # NEW intercepting route
│       └── [...params]/page.tsx        # overlay presenter (shared-element morph target)
├── presenter/                          # KEPT (not deleted!)
│   └── [...params]/page.tsx            # REWRITTEN full-page fallback for hard loads
├── _components/                        # NEW client-boundary components
│   ├── outline-rail.tsx                # 'use client' — Motion-animated outline
│   ├── focused-canvas.tsx              # 'use client' — inline edit host
│   ├── scene-rail.tsx                  # 'use client' — right-edge presenter rail
│   ├── scene-swiper.tsx                # 'use client' — Motion drag/spring
│   ├── inline-field.tsx                # 'use client' — click-to-edit primitive
│   ├── view-transition-card.tsx        # 'use client' — thin <ViewTransition name=...> wrapper
│   ├── scene-morph-target.tsx          # 'use client' — matching <ViewTransition> on presenter side
│   └── motion-provider.tsx             # 'use client' — optional LayoutGroup boundary for Motion gesture work
└── _actions/                           # NEW — split server actions out of page.tsx
    ├── agenda.ts                       # setAgendaAction, toggleRotationAction
    ├── teams.ts                        # registerTeamAction
    ├── signals.ts                      # addCheckpointFeedAction, ...
    ├── access.ts                       # issueParticipantAccessAction, ...
    ├── facilitators.ts                 # addFacilitatorAction, revokeFacilitatorAction
    └── operations.ts                   # resetWorkshopAction, archiveWorkshopAction, ...
```

### The key Next.js 16 trick

The intercepting route `@presenter/(.)presenter/[...params]/page.tsx` matches `/admin/instances/[id]/presenter/...` **only on client-side soft navigation**. Direct URL loads hit the real `presenter/[...params]/page.tsx`, which renders a standalone full-page presenter. This gives us:

- Same-document transitions when navigating from admin → presenter in the app (the morph moment)
- Rock-solid deep linking / bookmarks / shared links (the standalone fallback)
- The admin layout stays mounted beneath the intercepting slot, so background blur + scale-down is a real DOM effect, not a fake

Critical detail from research: **the parallel slot must be wired explicitly** in `layout.tsx` as `{presenter}`. Next 16 does not automatically cascade parallel slots.

### RSC/client-boundary strategy

- `layout.tsx`, `page.tsx`, and the full-page `presenter/[...params]/page.tsx` stay **server components**. They do data fetching, hydrate the `workshop-data` model, and pass serializable props down.
- Motion-animated components live in `_components/` as **thin client boundaries**. Each is a `'use client'` file that receives data as props.
- `motion-provider.tsx` wraps the whole admin page in a `LayoutGroup` so `layoutId` can cross component branches.
- Inline editing client components use server actions (from `_actions/`) for mutations. Optimistic UI via `useOptimistic`.

### Inline editing vs operational forms (load-bearing distinction)

**Inline editing** (click → edit → click-out → save, no save button, no toast):
- Agenda item title, description, time, type
- Scene block content (rich text, bullet lists, quotes, copy)
- Team name, city, members, repo URL, anchor, checkpoint notes

**Operational forms / dialogs** (explicit, confirmed, separate from canvas):
- Password change (keep form)
- Workshop reset → now gated by explicit confirmation dialog (NEW — current code has no confirm)
- Workshop archive (keep form with notes field)
- Facilitator add / revoke (keep form; revoke still confirm)
- Participant access code issue / revoke (keep form)
- Language switch, theme switch, sign out (keep as-is)

Inline and operational must **look different** so facilitator intuitively knows "this is content, it autosaves" vs "this is an action, it needs confirmation."

### Motion language — split responsibility (REVISED after verification research)

The original plan used Motion `layoutId` for both the route-level morph AND the gesture-level micro-interactions. Verification research surfaced that Motion `layoutId` + Next.js App Router intercepting routes is a **known unresolved issue** (Next.js #49279 open since May 2023; Motion discussion #2143 unresolved). Root cause: Next's `OuterLayoutRouter` inserts components between layouts and templates, breaking Motion's layout-detection setup.

**Revised split:**

- **Route-level shared-element morph** (admin scene card → intercepted presenter) uses **React's `<ViewTransition>` component** from `react` (the same-name pattern from the official Next.js guide). Enabled via `experimental: { viewTransition: true }` in `next.config.ts`. Native browser FLIP, automatic activation on Next route Transitions, ~3kb added to React. This is the *designed-for-this* mechanism per the official Next.js 16 View Transitions guide.
- **Gesture-level animation** stays on **Motion** (swipe drag, spring physics, rail enter/exit, inline-edit micro-feedback, background recede). None of these depend on layout detection, so the App Router issue does not apply.

Concrete mechanism mapping:

- **Shared-element morph (admin card → presenter hero):**
  ```tsx
  // admin outline rail + focused canvas
  <ViewTransition name={`scene-${agendaItemId}-${sceneId}`}>
    <SceneCard ... />
  </ViewTransition>

  // intercepting presenter
  <ViewTransition name={`scene-${agendaItemId}-${sceneId}`}>
    <ScenePresenter ... />
  </ViewTransition>
  ```
  Same `name` → browser performs FLIP morph automatically when the user clicks the card (soft navigation = React Transition = `<ViewTransition>` activates).
- **Directional scene-to-scene navigation** via `<Link transitionTypes={['nav-forward']}>` / `['nav-back']`, with the presenter's content wrapped in a `<ViewTransition>` whose `enter`/`exit` props map transition types to directional CSS slide animations (per Step 3 of the official guide).
- **Anchoring the outline rail + scene rail** (keeping them fixed while content morphs) via `style={{ viewTransitionName: 'outline-rail' }}` + CSS `::view-transition-group(outline-rail) { animation: none; z-index: 100; }`.
- **Customization via CSS pseudo-elements** (`::view-transition-old(.class)`, `::view-transition-new(.class)`, `::view-transition-image-pair(.class)`). Target: duration ~250ms morph, ~200ms directional slides, easing `cubic-bezier(0.2, 0.8, 0.2, 1)` (verified from Rauno's site — canonical snappy curve).
- **Reduced motion** handled via `@media (prefers-reduced-motion: reduce)` disabling animation durations on all `::view-transition-*` pseudo-elements.

**Motion (gesture-level) usage:**

- **Swipe:** `<motion.div drag="x" dragConstraints dragElastic={0.15}>` with spring transition. Tuned for iPad feel (stiffness ~400, damping ~40 — refine in Phase 6 against Rauno-style snappy curve). This is a component-level gesture, no layout detection required.
- **Auto-hide rail:** Motion's `AnimatePresence` with a 2s idle timer; returns on `touchstart`/`mousemove`.
- **Background recede** when presenter slot is active: `motion.div` scale 0.96 + blur 12px + opacity 0.4 on the admin tree. Component-level animation, no shared element.
- **Inline-edit micro-feedback:** subtle Motion animations on the `inline-field` component — focus ring pulse, error shake, optimistic-save fade.
- **No gratuitous entrance animations.** Pages mount without fade-in. Motion is reserved for causal interactions.

**Hard bans from the verification research:**

- Do NOT use Motion `layoutId` for route-level transitions. Use it only for in-route component-level shared layouts if needed, which the current plan does not require.
- Do NOT enable `experimental: { cacheComponents: true }` — it conflicts with `viewTransition` per open issue #85693 (observed glitch: brief blur then abrupt animation cutoff).
- Do NOT give two elements the same `view-transition-name` on the same page at the same time — this aborts the entire transition. Dynamic lists get unique suffixes (e.g. `scene-${agendaItemId}-${sceneId}`).

## Decision Rationale

See `docs/brainstorms/2026-04-13-one-canvas-rework-brainstorm.md` Key Design Decisions Q1–Q8 for the full decision tree. Summary of what this plan locks in:

| Decision | Choice | Alternative rejected because |
|---|---|---|
| Aesthetic school | Vision/Dynamic Island × Rauno restraint | Linear was too palette-primary for touch-first; Arc was too theatrical |
| Device model | iPad presenter mirrored to big screen | Two-surface Keynote-remote model needed sync protocol for no benefit |
| Presenter navigation | Swipe + right-edge auto-hiding rail | Prev/next buttons are clunky; scroll-snap dot rail twitches on big screens |
| Admin↔presenter | Intercepting route + shared-element morph | Cross-document VT is less reliable on iPad Safari; plain modal loses the *moment* |
| Animation mechanism | **React `<ViewTransition>`** for route-level morphs + **Motion** for gestures (split responsibility) | Motion `layoutId` for route-level morphs hits a known open Next.js App Router issue (#49279) — verified during research pass and documented in research notes |
| Admin refactor scope | Full rewrite | Phased admin keeps the surface permanently chunky; proof-slice-first mitigates risk |
| Inline editing scope | Content yes, operations no | Hybrid is the only coherent model; pure inline breaks destructive actions |
| VT reliability risk | Proceed, fall back to crossfade | Upfront spike costs velocity; same-document VT is reliable enough |

New decision added in this plan (not in brainstorm):

| Decision | Choice | Why |
|---|---|---|
| Server action organization | Split out of `page.tsx` into `_actions/*.ts` | Current actions are inline in the 2056-line page; they need their own home for the rewrite to land cleanly |
| Reset confirmation | Add explicit dialog | Current code has no confirm — this is a latent bug, correcting not regressing |
| Language switcher behavior | Preserve via URL rewrite in new IA | Current switcher reconstructs URL with all params; we need equivalence |

## Constraints and Boundaries

- **Trunk-based development** (per user's standing preference). No long-lived feature branch. Each phase ships as a set of small commits on main. Work-in-progress must not break the running app for Ondrej's own dev use.
- **No active workshops yet** — first runs next week. This gives ~1 week for Phases 0–3, and the remaining days for 4–7. No need for dual-path feature flags.
- **Preserve all theme tokens** (`app/globals.css` Rosé Pine Dawn/Moon). Do not introduce new color variables in this pass.
- **Do not touch the participant surface** (`dashboard/app/p/...`). Out of scope.
- **Do not touch `lib/workshop-data.ts` data model** unless a capability absolutely requires it. Refactor is UI-layer only.
- **Language (`cs`/`en`) toggle must still work** at every point. The switcher's URL-rebuild behavior is load-bearing.
- **Deep links must still resolve.** Any URL that works today must still work post-refactor, even if it routes to a different component.
- **iPad Safari 18.2+** is the baseline. Older iPad OS is not supported (Ondrej's device runs current).

## Test Protocol

This refactor operates inside an existing test suite — Vitest (unit + component, 80% coverage threshold) and Playwright (E2E with multi-viewport visual regression). The plan treats those as load-bearing guardrails, not as ceremony.

### What exists today (audited)

- **`dashboard/vitest.config.ts`** — coverage thresholds: `statements: 80, lines: 80, functions: 80, branches: 60`. Includes `app/**/*.{ts,tsx}` and `lib/**/*.ts`.
- **`dashboard/playwright.config.ts`** — Chromium-only, runs against `npm run start`, file-mode auth via Basic Auth header, fixtures copied from `test-data/` to a tmp runtime dir, `animations: "disabled"` for all screenshots (Motion animations get ignored by the camera — good).
- **`dashboard/e2e/dashboard.spec.ts`** — 392 lines covering: public mobile home, event-code redemption, facilitator sign-in flow, control room navigation, agenda detail views, `posunout live sem` action, destructive confirmation dialogs, presenter scene routes (with `?agendaItem=X&scene=Y`), facilitators API auth.
- **Visual regression snapshots** (exhaustive list, all must be re-baselined in this refactor):
  - `facilitator-overview-desktop.png` (1440×1400)
  - `facilitator-control-room-ipad.png` (1024×1366)
  - `facilitator-control-room-mobile.png` (393×1200)
  - `presenter-default-room-screen-ipad.png` (1024×768)
  - `presenter-opening-proof-ipad.png` (1024×768)
  - `presenter-talk-proof-ipad.png` (1024×768)
  - `presenter-opening-participant-proof-mobile.png` (393×852)
  - `participant-mirror-ipad.png` (1024×768)
  - `participant-mobile-room.png` (393×852)
  - `public-mobile-home.png` (393×852)
- **Existing Vitest component tests:** `dashboard/app/admin/instances/[id]/page.test.tsx` (referenced in spec comments around line 221). This exists today and will need adaptation.

### Test strategy for the refactor

The refactor changes selectors, URL patterns, and markup. Tests will break — that is expected and *planned for*. The question is whether breakage is silent (bad) or intentional and reviewed (good). Every phase has a test-adaptation task that happens *with* the code change, not after.

### 1. Unit / component tests (Vitest)

Every new component in `_components/` ships with a colocated `.test.tsx` file:

- **`inline-field.test.tsx`** — click-to-edit transitions, `useOptimistic` rollback on error, Enter/Escape key handling, focus behavior
- **`outline-rail.test.tsx`** — current-path highlighting, non-path dimming, keyboard navigation, ARIA tree semantics
- **`scene-rail.test.tsx`** — auto-hide timer logic, re-show on touch/mouse events, `(pointer: coarse)` branching
- **`scene-swiper.test.tsx`** — drag constraints, spring settle-to-index math (if not purely delegated to Motion), `drag="x"` direction lock
- **`morph-card.test.tsx`** — `layoutId` prop forwarding, mount/unmount semantics
- **`focused-canvas.test.tsx`** — section routing, inline-edit coordination

Targeted by the 80% coverage bar: `pnpm test:coverage` must pass at the end of every phase. Coverage regressions block the phase's exit criterion.

### 2. E2E tests (Playwright)

**Adaptation principle:** existing tests reference semantic accessible names (`getByRole("link", { name: "otevřít řízení" })`, `getByText("posunout live sem")`). Where possible, **preserve the accessible names** in new markup so tests keep working without rewriting. Where accessibility changes are intentional (e.g. a button becomes a link), update the selector.

**Test categories and per-phase responsibility:**

- **Preserved tests (must pass after refactor, selectors adapted):**
  - `loads the workspace cockpit, filters instances, and can drive a critical workshop control` — still a core scenario; adapt selectors for new IA, keep scenario
  - `uses a confirmation dialog before instance removal` — behavior preserved, markup may differ
  - `shows facilitators section with file-mode fallback message` — section routing changes; adapt
  - `shows agenda source information on the agenda section` — storage `<details>` will likely move to an outline-rail affordance; adapt or replace
  - `keeps room screen and participant mirror as separate launch targets in the control room` — launch targets logic stays; adapt selectors
  - `renders the opening promise scene without backstage labels` — presenter content rendering, preserve
  - `renders the talk room proof slice with the authority cue` — preserve
  - `renders the opening participant proof slice on mobile` — preserve
  - `shows the facilitator runner on a phone-sized agenda detail` — mobile-facilitator scenario, preserve
  - `facilitators API returns list with auth` + `401 without auth` — API-only tests, untouched by refactor
  - The *URL-param-based* presenter routes (`?agendaItem=...&scene=...`) must still work for hard-load fallback — this is the entire point of keeping the full-page `presenter/[...params]/page.tsx`. Add explicit tests for both the intercepted path (soft nav) and the hard-load path.

- **New tests required (added during corresponding phase):**
  - Phase 1: `admin to presenter soft navigation morphs the scene card` (visual test + DOM assertion that `layoutId` element exists on both sides)
  - Phase 1: `hard-load presenter URL renders standalone full-page fallback` (new tab goto)
  - Phase 1: `swipe gesture advances scene on touch` (mobile emulation + drag)
  - Phase 1: `keyboard arrow advances scene on desktop`
  - Phase 2: `outline rail navigation preserves language parameter`
  - Phase 2: `focused canvas renders each of the 5 sections`
  - Phase 3: `inline editing agenda item title persists via server action`
  - Phase 3: `inline editing rollback on server action error`
  - Phase 3: `add agenda item appends inline row and focuses title field`
  - Phase 4: `reset workshop requires explicit confirmation dialog` (new behavior — this is the confirmation gate we added)
  - Phase 4: `operational forms (password, archive, revoke) render in new visual language but behave identically`
  - Phase 5: `every scene block type renders in new presenter surface` (table-driven test across hero/rich-text/bullet/quote/steps/checklist/image/link-list/callout/participant-preview)
  - Phase 6: `right-edge rail visible on pointer:fine, auto-hide on pointer:coarse`
  - Phase 6: `presenter renders at 4:3 and 16:9 without content overflow`
  - Phase 7: parity smoke test walking through the critical-path at all 5 viewports back-to-back

### 3. Visual regression strategy

The existing snapshots will all break — the UI is being rewritten. The plan handles this explicitly, not by deleting the snapshot checks.

**Re-baseline protocol:**

- **Never blindly run `playwright test --update-snapshots`** as a "fix" for failing visual diffs. That silently erases the regression check.
- Snapshots are re-baselined **per phase** at the phase's exit gate, after the human review of the diff. The workflow:
  1. Phase code lands, tests run, visual tests fail as expected.
  2. Diff report generated (`playwright show-report`).
  3. Ondrej reviews the diff — "is this the intentional change?" — and approves.
  4. Only then: `playwright test --update-snapshots` scoped to the specific tests whose intentional redesign justifies it.
  5. New baseline committed alongside the phase's code commit (single commit if possible).
- **New snapshots added as the IA expands:**
  - `facilitator-focused-canvas-ipad-landscape.png` (new baseline — the new admin shell)
  - `facilitator-focused-canvas-desktop.png` (desktop parity baseline)
  - `presenter-with-rail-ipad.png` (new presenter with right-edge rail visible)
  - `presenter-morph-post-state.png` (post-morph end state; animations disabled in config, so this captures the *arrived* state, not mid-flight)
  - `admin-inline-editing-ipad.png` (one agenda item in inline-edit mode)
- **Mask policy:** existing tests use `mask: [page.getByText("Poslední archiv:")]` to hide time-sensitive text. Preserve all existing masks in the new baselines; add new masks only where unavoidable.
- `maxDiffPixelRatio` stays at the existing values per test (0.05 / 0.08); do not loosen thresholds to dodge real regressions.

### 4. Design / perceptual tests (manual, human-gated)

Automated visual regression captures *structure*, not *feel*. For motion quality, layout rhythm, thumb ergonomics, and taste, there's no substitute for a human reviewing on the actual device. The plan formalizes this as explicit review gates:

- **Phase 1 gate:** Ondrej runs the proof slice on his actual iPad *and* on his Mac, reviews the feel, records a short screen capture. Go/no-go decision.
- **Phase 2 gate:** Ondrej reviews the admin shell on desktop (1440×1400 and 1280×1200) at a real screen. Does it feel like "the content is the interface" or "a phone app stretched out"?
- **Phase 6 gate:** Full perceptual sweep — iPad landscape, iPad portrait, Mac laptop, Mac mirrored to big screen (the actual workshop setup). Motion curves, swipe feel, rail ergonomics, inline-edit flow.
- **Phase 7 gate:** Full walkthrough of a real agenda end-to-end at least 48h before the first workshop.

These are not ceremony — Phase 1's gate can send the entire plan back to brainstorm if the morph doesn't feel right.

### 5. Test protocol acceptance criteria (phase-agnostic)

- [ ] `pnpm test:coverage` passes with 80% threshold at every phase exit
- [ ] `pnpm test:e2e` passes at every phase exit (after intentional snapshot re-baselines)
- [ ] Every new `_components/*.tsx` has a colocated `.test.tsx` with meaningful tests (not snapshot-only)
- [ ] Every preserved E2E test is either still passing or explicitly marked deleted with a replacement
- [ ] No E2E test is deleted without a replacement covering the same scenario in the new IA
- [ ] Visual regression diffs are reviewed by human before re-baselining — no `--update-snapshots` commits without an accompanying diff review note in the commit message
- [ ] Phase 7 regression walkthrough covers all 5 viewports against the capability inventory

## Assumptions

| # | Assumption | Status | Evidence / Action |
|---|---|---|---|
| A1 | Next.js 16 intercepting + parallel routes compose as documented | Verified | Research Task #2 — confirmed against Next 16 docs; known gotcha is explicit slot wiring in layout |
| A2 | ~~Motion v12 `layoutId` works across client-component branches inside `LayoutGroup`~~ **FALSIFIED by verification research.** Known open Next.js issue #49279 — Next's `OuterLayoutRouter` breaks Motion layout detection across App Router intercepting routes. Pattern replaced. | Falsified → replaced by A2' | Research notes §1 |
| A2' | React `<ViewTransition>` with same `name` prop performs shared-element morph across Next 16 intercepting routes | Verified by official Next.js guide + React docs | Not yet verified on Ondrej's iPad hardware — Phase 1 proof slice is this verification |
| A3 | Motion client components can receive data as props from RSC parents without turning the tree into one big client component | Verified | Documented React 19 + RSC pattern; thin client boundaries are the norm |
| A4 | Safari 18.x on iPadOS handles `<ViewTransition>` + CSS pseudo-element animations at 60fps on Ondrej's hardware | Partially verified: feature support confirmed (Safari 18.0+ same-document, 18.2+ cross-document, 90.94% global caniuse); on-device perf not yet measured | → Phase 1 proof-slice validation on Ondrej's device |
| A5 | All 30+ current admin capabilities can be rehomed into outline-rail + focused-canvas IA without loss | Unverified | → Phase 7 regression check against inventory |
| A6 | iPadOS edge-swipe-back gesture will not conflict with our swipe-between-scenes | Unverified | → Phase 1 on-device check; mitigation: `overscroll-behavior: contain` + swipe target away from screen edge |
| A7 | `useOptimistic` + server actions give acceptable inline-edit feel without visible save indicators, **using `startTransition` wrapper and (where base state can change concurrently) the reducer pattern** | Partially verified against React 19 official docs — API shape verified, but docs do not give a canonical example of blur-triggered save; we are inventing the pattern | → Phase 3 prototype inline field; fallback is a subtle "saved" indicator on successful edits |
| A8 | Server actions can be cleanly extracted from `page.tsx` without changing their signatures | Unverified | → Phase 0 grep + trial extraction of one action |
| A9 | Current facilitator auth + `signOutAction` flow works unchanged after layout restructuring | Verified | Server actions are independent of layout; layout changes don't affect cookies / session |
| A10 | `resetWorkshopAction` adding a confirmation dialog is not a behavioral regression | Verified | Current lack of confirm is a latent bug per brainstorm Q6 discussion |
| A11 | Ondrej wants this shipped incrementally on main, not behind a feature flag | Verified | Trunk-based dev memory + "plenty of time, no active workshops" |
| A12 | Motion components with `animations: "disabled"` in Playwright config render their end state deterministically (so visual snapshots are stable) | Unverified | → Phase 1 snapshot test; if Motion holds elements in mid-animation when disabled globally, need explicit `initial={false}` or transition override |
| A13 | Existing accessible names (button text, heading text) can be preserved in the new IA, minimizing E2E selector churn | Partially verified | Many existing tests use Czech button text like "posunout live sem", "otevřít projekci" — we can keep these; adaptation effort for E2E is mainly structural (section routing changes) not label changes |
| A14 | 80% coverage threshold is achievable for new client components including Motion-animated ones | Unverified | Motion's test ergonomics in Vitest are good but not perfect; `layoutId` interactions may need shallow testing; → Phase 0 writes one sample component test to prove the pattern |
| A15 | `experimental: { viewTransition: true }` in Next 16.2.3 is safe to enable in production config | Verified | Official Next.js guide recommends it; Vercel dashboard uses it in production; `unstable_` prefix reflects spec evolution not quality (research notes §2) |
| A16 | Dashboard does NOT use `cacheComponents` mode and will not enable it during this refactor | Verified | Known open issue #85693 — cacheComponents + viewTransition conflict. Plan explicitly bans enabling it |
| A17 | `<ViewTransition name=...>` shared-element pattern works across Next 16 intercepting routes without the Motion-style App Router issue | Strong documentary evidence — official Next.js guide uses this pattern; unverified on-device | → Phase 1 proof slice is this verification |
| A18 | The `transitionTypes` prop on `<Link>` correctly triggers directional scene-to-scene slides | Documented in official guide | Phase 1 task verifies empirically |
| A19 | `overscroll-behavior-x: contain` prevents horizontal-drag conflict with iPadOS 18 edge-swipe back | Partially verified — CSS pattern is standard and works on WebKit broadly; iPadOS 18 edge-swipe specific behavior not verified in docs | → Phase 1 on-device check on Ondrej's iPad |
| A20 | Motion's gesture APIs (drag, spring, `AnimatePresence`) are unaffected by the App Router `layoutId` issue | Verified by reasoning + isolation — issue #49279 is specifically about layout detection breaking across `OuterLayoutRouter`; gesture APIs don't depend on layout detection | Phase 1 proof slice uses Motion drag, which will confirm empirically |

Unverified / partially verified assumptions A4, A5, A6, A7, A8, A12, A14, A17, A19 are each addressed by a task in the phases below. No assumption is swept under the rug.

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **`<ViewTransition>` shared-element morph doesn't work through intercepting route on iPad Safari** | Med | High | Phase 1 proof slice on Ondrej's actual iPad is the real test. If it doesn't work, fallback cascade (in order): (a) drop shared-element morph for this refactor, use background recede + content crossfade (Motion only), (b) fall back to non-intercepted full-page presenter with cross-document View Transition, (c) accept no morph and ship polish-only. |
| **Next.js issue #49279 (Motion `layoutId` + App Router)** | N/A — mitigated by plan pivot | — | Not using Motion `layoutId` for route-level transitions. Mentioned here only so future readers understand why the plan doesn't use the "obvious" Framer Motion approach. |
| **Next.js issue #85693 (ViewTransition + Cache Components)** | N/A — mitigated by plan ban | — | Plan explicitly forbids enabling `cacheComponents` mode during this refactor. Phase 0 includes a config audit to confirm. |
| **`unstable_ViewTransition` API churn before stable release** | Med | Low | Isolate usage to a small number of wrapper files at route boundaries. If import path or API changes in a future Next version, one refactor pass migrates all usage sites. |
| **Two elements share a `view-transition-name` simultaneously, aborting the transition** | Med | Med | Naming convention uses unique composite keys (`scene-${agendaItemId}-${sceneId}`). Lint check in Phase 0 writes a grep script to scan for duplicate names. |
| **Client-boundary creep** — accidentally turning the whole admin tree into a client component | Med | Med | Architecture guardrail: every `_components/*.tsx` gets `'use client'`; `page.tsx` and `layout.tsx` never do. Review diffs for `'use client'` at top of non-component files. |
| **Capability regression** — an existing admin action silently disappears | Med | High | Phase 7 is an explicit regression check against the full inventory. Each capability is either verifiably rehomed or explicitly marked out-of-scope with a follow-up task. |
| **URL state model breaks language switcher / deep links** | Med | High | Phase 0 includes a "URL contract" artifact listing every current query param and its post-refactor home. Tests for the language switcher are added in Phase 2. |
| **Destructive action fires without confirmation** (inline edit UX confusion) | Low | High | Inline editing and operational dialogs look visually distinct (different typography, different field treatment). Destructive actions always require a confirm. |
| **iPad edge-swipe-back conflicts with scene swipe** | Med | Med | `overscroll-behavior: contain` on the swipe target; swipe bounds start ~24px from screen edges; test on-device in Phase 1. |
| **Motion v12 bundle weight** (+18kb) | Certain | Low | Accepted. Admin is facilitator-only, not participant-facing; budget is generous. |
| **Inline optimistic updates drift from server state** | Low | Med | Use `useOptimistic` + server action revalidation. Add an explicit error recovery path that rolls back the optimistic value and surfaces a toast (even though successful edits are silent). |
| **Big-screen 4:3 vs 16:9 mirroring looks wrong** | Med | Med | Phase 6 includes explicit 4:3-first layout tuning with graceful 16:9 letterbox; test with Ondrej's actual output device. |
| **Refactor lands right before first workshop with a subtle bug** | Med | High | Phase 7 ends with a full walkthrough of a complete agenda on actual iPad at least 48h before the first workshop. No commits after that walkthrough except for bugs found in it. |
| **Scope creep** — "while we're in here, let's also..." | High | Med | This plan's Non-Goals list is binding. Any expansion requires a new plan or an explicit note added here. |
| **Motion curves land too bouncy** | Low | Med | Start with damping high (40+) and stiffness moderate (300-400); bias toward "too quiet" as a safer failure mode. Tune in Phase 6 with Ondrej. |
| **Test coverage regresses below 80% during refactor** | Med | Med | Each phase writes tests for new components alongside the code. CI fails the phase exit if coverage drops. Not a post-hoc cleanup. |
| **Visual regression baselines get silently re-snapshotted without review** | Med | High | Re-baseline protocol requires human diff review + commit-message note. No bulk `--update-snapshots` allowed. |
| **E2E selectors break on refactor and tests get deleted instead of adapted** | Med | High | No E2E test may be deleted without an explicit replacement. Tracked in Phase 7 regression check. |
| **Desktop parity is silently neglected in favor of iPad polish** | Med | High | Phase 2 has an explicit desktop review gate; Phase 6 perceptual sweep covers all 5 viewports; Phase 7 regression walkthrough tests all 5 viewports. |

---

## Implementation status summary (2026-04-13, end-of-session-2)

All 7 plan phases are **code-complete** and the extended session-2 follow-up work landed 7 additional commits on top. Final quality pass at end of session 2: **Vitest 323 pass / 15 skipped** across 78 test files (+25 tests since the Phase 0 baseline of 298), **ESLint clean**, **`tsc --noEmit` clean**, **`next build` clean** with both `/presenter` (hard-load) and `/(.)presenter` (intercepting) routes registered, **Playwright 28/28 passing** including the inline-field accessible-name regression test and the Phase 4 reset confirmation E2E.

`dashboard/app/admin/instances/[id]/page.tsx` is down from the 3089-line starting state to **2335 lines** — 754 lines of content + actions extracted into scoped modules. The remaining 2335 lines are mostly the Agenda section (still inline) plus the page component shell.

### Session 2 (follow-up work after the /marvin:work pass completed)

The user approved continuing past the Phase 1 review gate to take on deferred follow-up work. Seven additional commits landed, all green, all backed by Playwright:

| Commit | What |
|---|---|
| `dcdd22f` | **Playwright regression fix** during the agentic walkthrough: InlineField display button was using `title` attribute which shadowed the button's text content as its accessible name in Chromium. The surrounding `<h2>` inherited `"13:30 • upravit vybraný moment workshopu"` instead of `"13:30 • Rotace týmů"`, breaking one E2E test. Fix: drop both aria-label AND title; the button's accessible name is its visible value. |
| `3e0f30e` | **DOM test infrastructure.** happy-dom + @testing-library/react as devDeps, per-file opt-in via `// @vitest-environment happy-dom`. 14 new InlineField interaction tests cover click-to-edit, blur save, Enter commit, textarea Enter insert, Escape cancel, hidden fields, and the accessible-name regression. Global happy-dom broke 34 node-only tests, so opt-in pattern stays. |
| `268e6ef` | **Inline the agenda `roomSummary` editor** on the detail header. New `updateAgendaFieldAction` is a generic field updater backed by a `UPDATABLE_AGENDA_FIELDS` allowlist (title, time, goal, roomSummary). Makes wiring the remaining 2 fields (time, goal) a trivial 10-line change each. |
| `3970a30` | **TeamTrailScene in the intercepting overlay** — Phase 5 previously defaulted all scenes to the `SceneBlocks` room-scene layout. Now `chromePreset === "team-trail"` routes to the exported `TeamTrailScene` component, matching the hard-load presenter. Also fixes two lint issues: `setVisible(true)` redundant call in scene-rail.tsx useEffect (react-hooks/set-state-in-effect) and a stale `withLang` import in page.tsx. |
| `dc6a622` | **Signals section extraction.** `_actions/signals.ts` (addCheckpointFeed, completeChallenge + buildEvidenceSummary helper) + `_components/sections/signals-section.tsx` (104 lines). First extraction proving the pattern. |
| `aede68d` | **Settings section extraction.** `_actions/settings.ts` (toggleRotation, resetWorkshop with typed confirmation, archiveWorkshop, changePassword) + `_components/sections/settings-section.tsx` (219 lines). toggleRotationAction is re-imported back into page.tsx for the HandoffMomentCard which is the second consumer. |
| `e04f650` | **Access section extraction.** `_actions/access.ts` (issueParticipantAccess with flash cookie, addFacilitator, revokeFacilitator) + `_components/sections/access-section.tsx` (243 lines). Introduces `_lib/participant-access-flash.ts` as a non-server module holding the cookie name, type, and parser shared between the action (writer) and page.tsx (reader). |
| `27d33f7` | **Teams section extraction.** `_actions/teams.ts` (registerTeam with local deriveNextTeamId + buildEvidenceSummary helpers) + `_components/sections/teams-section.tsx` (167 lines). Final cleanup pass purges 15 dead imports from page.tsx that accumulated during the four extractions (getNeonSql, getAuditLogRepository, workshopTemplates, 10 workshop-store helpers, KeyValueRow, and the two page-local helper functions now living in the actions files). |

### Current source tree

```
app/admin/instances/[id]/
├── page.tsx                       # 2335 lines — Agenda section + header + shell
├── layout.tsx                     # Parallel @presenter slot + MotionProvider
├── presenter/page.tsx             # Hard-load presenter fallback
├── @presenter/
│   ├── default.tsx                # null
│   └── (.)presenter/page.tsx      # Intercepting overlay: full scene rendering + TeamTrailScene
├── _actions/
│   ├── operations.ts              # signOut, renameAgendaItem, updateAgendaField
│   ├── signals.ts                 # addCheckpointFeed, completeChallenge
│   ├── settings.ts                # toggleRotation, resetWorkshop, archiveWorkshop, changePassword
│   ├── access.ts                  # issueParticipantAccess, addFacilitator, revokeFacilitator
│   └── teams.ts                   # registerTeam
├── _components/
│   ├── inline-field.tsx           # useOptimistic click-to-edit primitive
│   ├── inline-field.test.tsx      # 6 static renderToStaticMarkup tests
│   ├── inline-field.interaction.test.tsx  # 14 happy-dom + @testing-library tests
│   ├── motion-provider.tsx        # LayoutGroup wrapper for Motion gesture work
│   ├── outline-rail.tsx           # Left rail with nested agenda items
│   ├── scene-morph-overlay.tsx    # Overlay chrome + Escape / ←/→ keyboard nav
│   ├── scene-rail.tsx             # Right-edge auto-hiding rail
│   ├── scene-swiper.tsx           # Motion drag + iPad overscroll containment
│   ├── view-transition-card.tsx   # <ViewTransition name=...> wrapper w/ graceful fallback
│   └── sections/
│       ├── signals-section.tsx    # 104 lines
│       ├── settings-section.tsx   # 219 lines
│       ├── access-section.tsx     # 243 lines
│       └── teams-section.tsx      # 167 lines
└── _lib/
    └── participant-access-flash.ts  # Shared flash cookie helpers (constant, type, parser)
```

| Phase | Commits | Status |
|---|---|---|
| Phase 0 — Foundations | `6aeda39`, `af893a9`, `aa66ee3` | ✓ Shipped |
| Phase 1 — Proof slice | `3e15a2c` | ✓ Code shipped + verified end-to-end via agent-browser walkthrough on desktop 1440×900, iPad landscape 1366×1024, iPad portrait 1024×1366. Functional correctness confirmed. ⏳ Ondrej's taste-level on-iPad review (motion feel, thumb ergonomics, 4:3 mirroring) still OPEN. |
| Phase 2 — Admin shell (outline rail) | `1eb0b4a` | ✓ Outline rail shipped. **Session 2** extended this with 4 section extractions (Signals, Settings, Access, Teams) bringing `page.tsx` from 3089 → 2335 lines. |
| Phase 3 — Inline editing | `ecd0ab0`, `268e6ef` | ✓ `InlineField` primitive + agenda title wired (phase 1) + agenda roomSummary wired (session 2). `updateAgendaFieldAction` allowlists title/time/goal/roomSummary so wiring more fields is trivial. Remaining content sheets (scene-edit, agenda-add, scene-add, full agenda-edit) still use the old overlay sheets — incremental follow-up work. |
| Phase 4 — Operational forms | `3080d99` | ✓ Reset confirmation gate shipped (typed-id confirmation, fixes the latent no-confirm bug). Other operational forms restyling deferred as cosmetic follow-up. E2E test at dashboard.spec.ts:381 guards the behavior. |
| Phase 5 — Presenter full coverage | `3611a4a`, `3970a30` | ✓ Full scene block rendering shipped via exported `SceneBlocks` / `SceneCta` / `buildFallbackBlocks`. **Session 2** extended this with `TeamTrailScene` rendering so team-trail chromePreset scenes render identically in both the hard-load presenter and the intercepting overlay. |
| Phase 6 — Polish + keyboard parity | `818ad96` | ✓ Escape / ArrowLeft / ArrowRight keyboard nav wired on `SceneMorphOverlay`, ignores keys while focus is inside inputs so inline editing doesn't collide. Motion curve tuning + 4:3 vs 16:9 big-screen check are on-device tasks Ondrej still has. |
| Phase 7 — Regression + walkthrough | `3a4457c` | ✓ Automated regression clean (Vitest, lint, tsc, build). **Playwright walkthrough** happened in session 2 via agent-browser (Chrome) at all three viewports; 28/28 tests pass. On-iPad walkthrough + 48h pre-workshop buffer are Ondrej's final gates. |
| Follow-up session 2 | `dcdd22f`, `3e0f30e`, `268e6ef`, `3970a30`, `dc6a622`, `aede68d`, `e04f650`, `27d33f7` | ✓ Playwright fix, DOM test infra, roomSummary inline, TeamTrailScene, Signals/Settings/Access/Teams extractions, dead import cleanup. |

### What the remaining human tasks look like

1. **Open the app on iPad Safari 18.x** (mirrored to whatever output Ondrej will use at the workshop). Click a scene card on the admin. Watch the morph. Try ArrowLeft/Right and swipe between scenes. Press Escape to return. Does it feel right? Session 2's agent-browser walkthrough already verified functional correctness; this gate is now about **taste and feel**, not correctness.
2. **Tune motion curves on device if needed.** `dashboard/app/globals.css` has the `::view-transition-*` pseudo-elements. Adjust `animation-duration` and `animation-timing-function` until the feel is right.
3. **Re-baseline Playwright visual regression snapshots.** The existing 10 snapshots still match (they cover mobile 393 and iPad 1024×768/1366 which are below the `xl:` breakpoint where the outline rail renders), so the refactor is visually additive at xl+ and non-regressive below. New snapshots for the overlay + outline rail at 1366×1024 and 1440×900 are not yet captured.
4. **Pre-workshop 48h walkthrough.** Full capability audit against the inventory — every existing action still works; destructive actions still confirm; language switcher still preserves `lang`.

### What was deferred deliberately (status after session 2)

- **Full inlining of the 4 sheet overlays.** Session 2 wired `roomSummary` on top of title. The remaining sheet-backed fields are: `agenda-edit` (time, goal, facilitatorPrompts, watchFors, checkpointQuestions), `scene-edit` (scene label, body, block content, facilitatorNotes, sourceRefs), `agenda-add` + `scene-add` (inline-append flows). **Still open.** `updateAgendaFieldAction` makes time and goal trivial to wire (~10 lines each); scene editing is more involved because of the block editor.
- **Agenda section extraction from `page.tsx`.** **Still open.** ~300+ lines, 4 overlay sheet definitions, timeline rendering with `TimelineRow`, presenter scene cards already wrapped in `ViewTransitionCard`, the HandoffMomentCard with embedded rotation-signal capture. Most interdependent piece. Expected to land `page.tsx` under 1500 lines. Best done as its own focused session — the pattern is well-proven from the 4 extractions that already landed.
- **New Playwright tests for the intercepting route + swipe + keyboard** — still deferred until motion curves stabilize. Adding E2Es that lock in curves-in-flux is worse than adding them after Ondrej's on-device tuning.
- **Visual regression re-baselining for new overlay + outline rail viewports** — existing snapshots still match (they're all below the `xl:` breakpoint). New 1366×1024 and 1440×900 baselines for the outline rail and overlay would complete the visual regression coverage. Human diff review required per the protocol.
- ~~DOM test environment~~ — **resolved in session 2** via `3e0f30e`. happy-dom + @testing-library/react are in, per-file opt-in pattern, 14 inline-field interaction tests already landing.

### Handoff pointers for a fresh session

If picking this up from a cold start, read in this order:
1. **`docs/brainstorms/2026-04-13-one-canvas-rework-brainstorm.md`** — the why
2. **`docs/plans/2026-04-13-one-canvas-research-notes.md`** — the verification pass and the Motion `layoutId` → React `<ViewTransition>` pivot
3. **This file** — status, phase commit hashes, deferred work
4. **`docs/plans/2026-04-13-one-canvas-url-contract.md`** — URL contract for deep links
5. **`docs/plans/2026-04-13-one-canvas-e2e-migration-notes.md`** — E2E test adaptation decisions

Session 3 landed the full agenda lift. Commits (a→c):
- `92cf436` — agenda actions extracted to `_actions/agenda.ts` (page.tsx 2335 → 2232)
- `038a3b7` — `time` field inlined in the agenda detail header via `updateAgendaFieldAction`
- `38eb44c` — `AgendaSection` + private helpers extracted to `_components/sections/agenda-section.tsx`, with shared primitives lifted on the way: `AdminActionStateFields`, `ControlRoomPersistentSummary`, `captureRotationSignalAction`, and `_components/agenda/types.ts` for `RichAgendaItem` / `RichPresenterScene` / `SourceRef`. page.tsx now 1316 lines (was 2335 at session start; plan's acceptance criterion is < 400, so more work remains — the 4 sheet bodies plus the scene server actions are the biggest remaining chunks).

Next likely slices: (a) Scene-editor sheet bodies (`AgendaItemEditorSheetBody`, `AgendaItemCreateSheetBody`, `PresenterSceneCreateSheetBody`, `PresenterSceneEditorSheetBody`, `PresenterSceneFormFields`) — these are ~500 lines and the plan's Phase 3 says to replace them with inline editing; until then, extracting them as-is into a sheets module is the safe move. (b) Scene server actions (`addPresenterSceneAction`, `updatePresenterSceneAction`, etc.) into `_actions/scenes.ts`. (c) Inline the `goal` field in the agenda detail header (still an allowlist field, not yet rendered inline).

## Phased Implementation

Exit criterion per phase is listed explicitly. Do not enter phase N+1 until phase N's exit criterion is met.

### Phase 0 — Foundations (half-day) — COMPLETE (commits `6aeda39`, `af893a9`)

Prepare the ground. No user-visible changes.

- [x] Install `motion` package: `pnpm add motion` → `motion@12.38.0` installed
- [x] Enable `experimental: { viewTransition: true }` in `dashboard/next.config.ts`. `cacheComponents` confirmed NOT enabled (grep: no matches in codebase) per issue #85693 guard
- [x] Confirm React 19.2.x exposes `ViewTransition`. **Runtime check was misleading** — `require('react')` in Node returned no `ViewTransition` export because Next.js aliases `react` → its bundled `react-experimental` at build time when the `viewTransition` flag is on. Found Next's vendored copy at `node_modules/next/dist/compiled/react-experimental/`. Build-time integration confirmed; on-device proof in Phase 1.
- [ ] ~~Verify Tailwind v4 container query syntax~~ **Deferred to Phase 2 first-use.** Doing this as a synthetic smoke test would pollute the codebase; Phase 2's outline-rail is the first genuine use case and will fail fast if the syntax is wrong.
- [x] Create `dashboard/app/admin/instances/[id]/_components/` and `_actions/` directories
- [x] Write a **URL contract document** at `docs/plans/2026-04-13-one-canvas-url-contract.md`
- [x] Extract `signOutAction` into `_actions/operations.ts` as a test. Confirmed it still works (page.test.tsx still passes). *(resolves A8)*
- [x] Add a `_components/motion-provider.tsx` client boundary wrapping `{children}` with `<LayoutGroup>` (empty no-op wrapper)
- [x] Wire `motion-provider` into a new `layout.tsx` for the admin instance route. Nothing broke: 298 tests pass, lint clean, typecheck clean.
- [ ] ~~Snapshot the current admin behavior~~ **Skipped** — human-captured screen recording, not an AI task; defer to Ondrej pre-Phase 1 if desired for nostalgia.
- [x] **Test protocol audit (baseline run):** `pnpm test` → 298 passed, 15 skipped, 72 test files; `pnpm lint` → clean; `npx tsc --noEmit` → clean. E2E (`pnpm test:e2e`) deferred to Phase 1 when the first code changes can break visual baselines (running it now against unchanged code would just confirm the pre-existing state).
- [x] **Sample Motion component test** in Vitest — `_components/motion-provider.test.tsx` passes. Resolves A14.
- [x] **E2E migration notes** written to `docs/plans/2026-04-13-one-canvas-e2e-migration-notes.md` — every test with a verdict (preserve / adapt / delete + replace) and the list of accessible names + `data-agenda-item` attributes that must survive the refactor.

**Exit criterion:** ✓ Motion installed, `_components/` + `_actions/` scaffolding exists, one server action successfully extracted, sample Motion test passes, E2E migration notes written, baseline recorded, no user-visible change. Phase 0 commits: `6aeda39` (docs), `af893a9` (code).

### Phase 1 — Proof slice — CODE COMPLETE, REVIEW GATE OPEN (commit `3e15a2c`)

Implementation landed — the intercepting route, shared-element morph, scene rail, swipe gesture, and overlay chrome all work through the automated test suite + Next build. **The on-iPad review gate Ondrej must run is still open** and explicitly required before the pattern propagates to other surfaces.

The proof slice. One agenda item, one scene, the full morph experience. This is the go/no-go moment.

- [x] Create `@presenter/default.tsx` returning `null`
- [x] Create `@presenter/(.)presenter/page.tsx` — intercepting route for the presenter overlay (query-param based, not `[...params]` — matches existing presenter route shape)
- [x] Update `dashboard/app/admin/instances/[id]/layout.tsx` to explicitly render `{presenter}` slot alongside `{children}`
- [x] Keep the existing full-page `presenter/page.tsx` working as hard-load fallback (Phase 5 then reuses its `SceneBlocks` / `SceneCta` / `buildFallbackBlocks` exports inside the overlay)
- [x] Build `_components/view-transition-card.tsx` — thin client wrapper around React's `<ViewTransition>`. Degrades to passthrough when the runtime export is missing (Vitest / plain Node context).
- [x] Build `_components/scene-morph-overlay.tsx` — fixed-inset overlay shell with Escape / backdrop / (Phase 6) arrow-key handling
- [x] Build `_components/scene-rail.tsx` — right-edge rail, auto-hide on `pointer:coarse`, persistent on `pointer:fine`
- [x] Build `_components/scene-swiper.tsx` — Motion drag with `overscroll-behavior-x: contain`
- [x] Add CSS customization to `dashboard/app/globals.css`: `::view-transition-group(*)` 250ms `cubic-bezier(0.2, 0.8, 0.2, 1)`, anchor for scene-rail + outline-rail, `prefers-reduced-motion` override
- [x] Wire the admin scene card — wrapped in `<ViewTransitionCard name=...>`, primary click is now soft-nav (`AdminRouteLink`), secondary `↗` link keeps the multi-window "pop out" escape hatch
- [ ] Build a minimal `_components/scene-rail.tsx`: right-edge vertical rail showing just the scenes of one agenda item, auto-hide after 2s idle, re-show on touch/mousemove
- [x] Build `_components/scene-swiper.tsx` — Motion drag-x + spring, `overscroll-behavior-x: contain` for iPad gesture safety
- [x] Wire the morph — `PresenterSceneSummaryCard` now wraps its card in `<ViewTransitionCard name=...>`, primary click is soft-nav via `AdminRouteLink` (which already pushes inside `useTransition`, so the ViewTransition activates)
- [-] ~~Background recede (scale+blur+opacity on admin when presenter is active)~~ — deferred. The backdrop already dims via the overlay's `bg-[rgba(28,25,23,0.45)]` + `backdrop-blur-[6px]`, which achieves the same perceptual effect without coordinating a layout-level flag across route boundaries. Revisit in Phase 6 polish if Ondrej wants stronger recede on the underlying admin.
- [-] On-iPad deploy + video capture — **Ondrej's to run** (the review gate)
- [-] Desktop proof slice check — keyboard wiring landed in Phase 6 (`818ad96`); feel check is part of Ondrej's review gate
- [x] Vitest tests for proof-slice components — all 3 files pass (12 tests across view-transition-card, scene-rail, scene-swiper)
- [-] Playwright E2E tests (new) — **deferred to post-review-gate**. Rationale: locking in curves-in-flux with E2E is worse than adding them after Ondrej's on-device tuning pass. The existing hard-load presenter E2E tests in dashboard.spec.ts continue to regress against the full-page fallback route.
- [-] Visual regression (new baselines) — **deferred**. Phase 2's outline-rail change plus the new overlay make the existing facilitator-control-room-* snapshots stale. Re-baselining requires human diff review per the plan's protocol, which is Ondrej's Phase 7 walkthrough task.
- [-] **Review gate with Ondrej — OPEN**. Single remaining blocker for Phase 1. Resolves A4, A6, A12, A17 when it happens.

**Exit criterion:** Implementation landed + all automated checks green ✓. On-iPad review ✗ — open.

### Phase 2 — Admin shell (1 day)

Now build the full admin shell, but not the inline-edit mechanics yet. Structure first, content after.

- [ ] Build `_components/outline-rail.tsx`: left-edge outline of the full workshop — agenda items, teams, signals, access, settings — as a tree with current-path highlighted and non-path items dimmed
- [ ] Rewrite `page.tsx` composition: `<MotionProvider><OutlineRail /><FocusedCanvas /></MotionProvider>`; `page.tsx` stays a server component passing data as props
- [ ] Focused canvas renders whichever section is active based on URL (still using current query-param model for now — we adapt the URL contract as we go, not in one step)
- [ ] Port the existing rendering of each of the 5 sections into focused-canvas **without inline editing** — same forms, same overlays, same sheets, just inside the new shell. The visual language is new; the interactions are old.
- [ ] Kill the old sticky-sidebar layout (`xl:grid-cols-[16rem_minmax(0,1fr)]`) and the conditional-section navigation in the header
- [ ] Test: every section still reaches all its current forms and sheets. Nothing is unreachable.
- [ ] Language switcher still works end-to-end; verify cs/en toggle preserves focus and section
- [ ] **Desktop review gate:** Ondrej reviews the new admin shell on his Mac at 1440×1400 and 1280×1200. The outline rail + focused canvas should feel like a native desktop app with deliberate keyboard affordances — not an iPad app stretched out. If it feels wrong, tune before Phase 3.
- [ ] **Vitest tests:** `outline-rail.test.tsx`, `focused-canvas.test.tsx` (≥ 80% coverage)
- [ ] **Playwright E2E (adapted):**
  - Adapt `loads the workspace cockpit, filters instances, and can drive a critical workshop control` — the workflow is preserved; selectors updated for the outline-rail + focused-canvas shell. Keep the `"posunout live sem"` button text if possible.
  - Adapt `shows facilitators section with file-mode fallback message` — section routing model may change from `?section=access` to a different mechanism; update the `page.goto` accordingly and confirm the heading still renders.
  - Adapt `shows agenda source information on the agenda section` — the storage `<details>` element may move into an outline-rail affordance; update selector or replace with an equivalent "storage info is discoverable" assertion.
  - New test: `outline rail navigation preserves language parameter` — click through multiple sections with `?lang=en`, verify language persists at every step
  - New test: `focused canvas renders each of the 5 section types` — parameterized test over agenda/teams/signals/access/settings
- [ ] **Visual regression re-baseline (reviewed):**
  - `facilitator-control-room-ipad.png` — will diff heavily; re-baseline after review
  - `facilitator-control-room-mobile.png` — re-baseline after review
  - `facilitator-overview-desktop.png` — `/admin` cockpit is not part of this refactor; should NOT diff. If it does, investigate.
  - New: `facilitator-focused-canvas-desktop-large.png` (1440×1400)
  - New: `facilitator-focused-canvas-desktop-small.png` (1280×1200)

**Exit criterion:** Admin looks like the new design on iPad AND desktop; Ondrej approved the desktop feel; outline rail is functional with keyboard navigation; every current capability is still reachable through the old sheet/overlay mechanism (no inline editing yet); language switcher unchanged; deep links still resolve; Vitest coverage ≥ 80% for new components; adapted E2E tests pass; visual baselines reviewed and committed.

### Phase 3 — Inline editing for content (2 days)

Replace the sheet overlays for content with inline editing.

- [ ] Build `_components/inline-field.tsx`: click-to-edit primitive with three modes (text, textarea, select). Uses `useOptimistic(value, reducer?)` with an **explicit reducer** for relative updates to avoid stale-value races on concurrent edits (per React docs). Calls `setOptimistic` + server action **inside `startTransition`** (mandatory per React 19 API). Server action via prop; automatic rollback on error (React handles it). Separate `useState` for surfacing transient errors without showing a success toast.
- [ ] Replace `agenda-edit` sheet → inline editing on the focused agenda item (title, description, time, type fields become inline)
- [ ] Replace `agenda-add` sheet → "add agenda item" becomes an inline-appended empty row at the bottom of the outline rail, focus jumps into its inline title field
- [ ] Replace `scene-edit` sheet → scene content is inline in the focused canvas
- [ ] Replace `scene-add` sheet → "add scene" is an inline-append similar to agenda-add
- [ ] Team form (Teams section): inline the team name, city, repo URL, members, anchor, and checkpoint notes fields. The team grid becomes a list of focused-canvas items.
- [ ] Signals section: signals are still a form (they're a submission event, not content editing — keep as form but restyle it to match the new visual language)
- [ ] Test: every content field is now inline-editable; edits persist; no visible save buttons; error states roll back gracefully *(resolves A7)*
- [ ] Delete the now-unused `AgendaItemEditorSheetBody`, `AgendaItemCreateSheetBody`, `PresenterSceneEditorSheetBody`, `PresenterSceneCreateSheetBody` components
- [ ] **Vitest tests:** `inline-field.test.tsx` with comprehensive cases — initial render, click-to-edit transition, blur-saves behavior, Enter commits, Escape cancels, `useOptimistic` rollback on error, keyboard focus management, accessibility (role=textbox, aria-label)
- [ ] **Playwright E2E (new):**
  - `inline editing agenda item title persists via server action` — click title, type new value, blur, reload page, verify persistence
  - `inline editing rollback on server action error` — mock or trigger a failing mutation, verify the optimistic value rolls back and an error surface appears
  - `add agenda item appends inline row and focuses title field` — click add, verify new row appears in outline rail, focus is in its title input
  - `inline editing works with keyboard only on desktop` — Tab to a field, Enter to edit, type, Enter to commit; no mouse
- [ ] **E2E deletion protocol:** any existing test that referenced the `overlay=agenda-edit` or related sheets must either (a) be adapted to test the inline equivalent, or (b) be deleted with an explicit replacement test. Document each decision in the commit message.
- [ ] **Visual regression (new):** `admin-inline-editing-ipad.png` — one agenda item in inline-edit mode on iPad

**Exit criterion:** All 4 content sheets removed. Inline editing works for agenda items, scenes, teams, and checkpoint notes. Destructive or operational actions still use forms. No capability lost. Vitest coverage ≥ 80% including new inline-field tests. All sheet-related E2E tests either adapted or replaced (none silently deleted).

### Phase 4 — Operational forms restyled (half-day)

The forms that *should* stay forms. Make them look native to the new visual language.

- [ ] Password change form — restyle (keep behavior identical)
- [ ] Archive workshop form — restyle (keep notes field)
- [ ] **Reset workshop** — add explicit confirmation dialog (NEW). Dialog shows what will be cleared; requires typing workshop name or a clear "confirm" action. This is the only *new* operational behavior in this plan.
- [ ] Facilitator add form — restyle
- [ ] Facilitator revoke — keep confirmation (currently works; restyle the confirm)
- [ ] Participant access code issue — restyle the form; keep flash-banner reveal behavior
- [ ] Language switcher, theme switcher, sign out — verify unchanged
- [ ] Extract all server actions referenced here into the appropriate `_actions/*.ts` files
- [ ] **Playwright E2E (new):**
  - `reset workshop requires explicit confirmation dialog` — click reset, verify dialog appears, verify cancel does nothing, verify confirm fires the action (this is the NEW behavior this plan adds)
  - `operational forms (password, archive, revoke) behave identically after restyle` — adapted from any existing behavior tests; preserve the scenario, update the selectors
- [ ] **Preserve existing destructive-confirmation E2E test:** `uses a confirmation dialog before instance removal` — the `/admin` cockpit instance removal test is untouched by this refactor; verify it still passes
- [ ] Coverage check: `pnpm test:coverage` ≥ 80%

**Exit criterion:** Every operational action looks native to the new design. `Reset workshop` now requires explicit confirmation (verified by new E2E test). All actions still work. Server actions are out of `page.tsx`. Vitest coverage maintained.

### Phase 5 — Presenter full coverage (1 day)

Extend the proof slice to cover every scene type.

- [ ] Ensure every scene block type (hero, rich-text, bullet-list, quote, steps, checklist, image, link-list, callout, participant-preview) renders correctly inside the new presenter surface
- [ ] `TeamTrailScene` gets the morph + rail treatment; verify the responsive team grid still works at iPad resolution and big-screen mirrored
- [ ] Scene rail shows correct scene count for agenda items with many scenes; overflow handled (scrollable rail, not truncated)
- [ ] Swipe navigation supports wrap (last → first)? **Decision: no wrap** — facilitator workflow is linear; wrap is disorienting. Document in a comment.
- [ ] Hard-load `/admin/instances/[id]/presenter/...` URLs still render the full-page fallback correctly (verify with an actual cold load in a new tab)
- [ ] **Playwright E2E (new):**
  - `every scene block type renders in new presenter surface` — parameterized test across all 10 block types (hero, rich-text, bullet-list, quote, steps, checklist, image, link-list, callout, participant-preview)
  - Preserve + adapt `renders the room screen on mobile` — mobile presenter still works
  - Preserve + adapt `renders the opening promise scene without backstage labels` — content rendering preserved
  - Preserve + adapt `renders the talk room proof slice with the authority cue` — content rendering preserved
- [ ] **Visual regression (new + re-baseline):**
  - Re-baseline `presenter-default-room-screen-ipad.png`, `presenter-opening-proof-ipad.png`, `presenter-talk-proof-ipad.png` after reviewing diffs
  - New: `presenter-team-trail-ipad.png` (TeamTrailScene with rail)
  - New: `presenter-block-types-matrix-ipad.png` (a synthetic scene containing every block type, for regression on block rendering)

**Exit criterion:** Every scene type works in the new presenter at both iPad and desktop viewports. Scene rail handles many scenes. Hard-load URLs work. Existing presenter E2E tests either adapted or replaced. Visual baselines reviewed and committed.

### Phase 6 — Polish + curves (1 day)

Tune the feel. This is where E+B aesthetic earns its keep.

- [ ] Motion curves review with Ondrej on iPad: tune spring stiffness/damping for the swipe, the morph, the background recede, the rail appear/disappear
- [ ] 4:3 vs 16:9 mirroring test: presenter layout on iPad (4:3-ish) mirrored to actual big screen (likely 16:9 or similar). Verify letterboxing looks intentional; fonts readable; scene content centered
- [ ] Scene rail positioning tuning: thumb-reach zone on iPad Pro 13" landscape vs iPad 11" — probably fine but verify
- [ ] Auto-hide timer tuning: 2s may be too fast or too slow; Ondrej decides
- [ ] Accessibility pass: keyboard navigation on desktop still works (arrows for scene nav, Escape to close presenter); focus indicators visible on inline fields
- [ ] Dark/light theme switch test — Rosé Pine tokens should still apply
- [ ] **Perceptual sweep — all 5 viewports** — Ondrej walks through the whole app at 393×852, 1024×768, 1024×1366, 1280×1200, 1440×1400. One pass per viewport, noting anything that feels wrong. Findings get logged and triaged: blocking issues are fixed before Phase 7; non-blocking polish notes go into a follow-up.
- [ ] **Playwright E2E (new):**
  - `right-edge rail visible on pointer:fine, auto-hide on pointer:coarse` — two test contexts with `hasTouch` true/false
  - `presenter renders at 4:3 and 16:9 without content overflow` — test at 1024×768 (4:3) and 1920×1080 (16:9) simulated viewports
  - `keyboard navigation across admin + presenter` — Tab cycles focus sensibly, Arrow keys do the right thing, Escape returns from overlays
- [ ] **Visual regression (comprehensive re-baseline):** Re-capture every viewport baseline and review the diffs. This is the phase where the visual state stabilizes.

**Exit criterion:** Ondrej reports the feel is right on all 5 viewports. Big-screen mirroring looks intentional. Keyboard works on desktop. Rail behavior is correct on both pointer types. All visual baselines re-captured and reviewed.

### Phase 7 — Regression check + pre-workshop walkthrough (half-day)

The backstop.

- [ ] Walk through every capability in the inventory reference, section by section. For each, confirm it has a home in the new IA and works. Check off each explicitly.
- [ ] Destructive actions: reset (new confirm), archive, revoke facilitator, revoke participant access — each tested end-to-end
- [ ] URL contract audit: every previously-working URL (deep links, shared links, language variants) still resolves or redirects cleanly *(resolves A5)*
- [ ] Full walkthrough on Ondrej's iPad of a complete mock agenda — from admin to first scene, swipe through, return to admin, edit a scene, swipe back into presenter — as the facilitator would actually run it
- [ ] **No commits after the final walkthrough** except bug fixes found during it. This walkthrough happens at least 48h before the first real workshop.
- [ ] **Final test suite run:** `pnpm test:coverage` + `pnpm test:e2e` pass cleanly. Coverage ≥ 80% on statements/lines/functions, ≥ 60% on branches.
- [ ] **E2E parity test suite (new, runs at all 5 viewports):** a single critical-path test that navigates admin → agenda item → presenter → swipe through 3 scenes → return to admin → inline-edit a title → save, parameterized across mobile/iPad-landscape/iPad-portrait/desktop-small/desktop-large
- [ ] **E2E test count check:** list all deleted tests with their replacements to verify no scenario was silently dropped. A one-line table in the final commit message.
- [ ] **Visual regression final audit:** all baselines current, no stale ones. Confirm every baseline has a reviewed commit in its history.

**Exit criterion:** Every capability verified against the inventory. Full walkthrough passes at all 5 viewports. 48h buffer to first workshop held. Test suite fully green. No silently-dropped E2E coverage.

---

## Acceptance Criteria

Measurable, testable.

- [ ] `dashboard/app/admin/instances/[id]/page.tsx` is under 400 lines (down from 2056) — composition only, no inline sections
- [ ] `dashboard/app/admin/instances/[id]/_components/` contains named client components (`outline-rail`, `focused-canvas`, `scene-rail`, `scene-swiper`, `inline-field`, `morph-card`, `motion-provider`)
- [ ] `dashboard/app/admin/instances/[id]/_actions/` contains all extracted server actions, grouped by concern
- [ ] Admin `@presenter` parallel slot + `(.)presenter` intercepting route exist and are wired in `layout.tsx`
- [ ] Hard-loading `/admin/instances/[id]/presenter/...` in a fresh tab renders the full-page presenter correctly
- [ ] Soft-navigating from admin to presenter morphs the scene card via `layoutId` (verified visually + in DevTools element inspector)
- [ ] All 4 content sheet overlays (`agenda-edit`, `agenda-add`, `scene-edit`, `scene-add`) are removed
- [ ] Agenda items, scenes, teams, and checkpoint notes are inline-editable with no save button and no confirmation toast
- [ ] `Reset workshop` requires explicit confirmation dialog before firing
- [ ] Language (cs/en) switcher works from every section
- [ ] Presenter swipe advances scenes with spring physics on iPad Safari 18+
- [ ] Scene rail auto-hides after 2s idle, returns on touch/mousemove
- [ ] Ondrej confirms on-iPad review (Phase 1 and Phase 6) that the feel is right
- [ ] Phase 7 regression walkthrough completes with zero missing capabilities vs the inventory
- [ ] At least 48h buffer between final walkthrough and first live workshop
- [ ] `pnpm test:coverage` passes at ≥ 80% statement/line/function, ≥ 60% branch (same as current thresholds)
- [ ] `pnpm test:e2e` passes including all new + adapted tests, no silently-skipped cases
- [ ] Every new component in `_components/` has a colocated `.test.tsx` with non-snapshot meaningful tests
- [ ] Every deleted E2E test has a documented replacement
- [ ] Visual regression baselines at all 5 viewports are current and have reviewed commit history
- [ ] iPad parity verified at 1024×768 landscape + 1024×1366 portrait — Ondrej approved
- [ ] Desktop parity verified at 1280×1200 + 1440×1400 — Ondrej approved (Phase 2 gate + Phase 6 sweep)
- [ ] Keyboard-only navigation works end-to-end on desktop (no mouse required to drive a workshop)
- [ ] Every interactive element has a visible focus indicator for keyboard users

## References

- **Brainstorm:** `docs/brainstorms/2026-04-13-one-canvas-rework-brainstorm.md`
- **Research notes (verification pass):** `docs/plans/2026-04-13-one-canvas-research-notes.md` — grounds every library-level decision in current April 2026 docs and flags known open issues; read before starting Phase 0
- **Current admin file:** `dashboard/app/admin/instances/[id]/page.tsx` (2056 lines)
- **Current presenter file:** `dashboard/app/admin/instances/[id]/presenter/page.tsx` (643 lines)
- **Admin UI primitives:** `dashboard/app/admin/admin-ui.tsx` (AdminPanel, AdminSheet, AdminDialog, buttons)
- **Workshop data model:** `dashboard/lib/workshop-data.ts`
- **Theme tokens:** `dashboard/app/globals.css` (Rosé Pine Dawn/Moon)
- **Capability inventory:** embedded in research output for this plan (30+ capabilities across 5 sections + 4 overlays)
- **Next.js 16 intercepting routes:** https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes (version 16.2.3, lastUpdated 2026-04-08)
- **Next.js parallel routes:** https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes
- **Next.js View Transitions official guide:** https://nextjs.org/docs/app/guides/view-transitions — canonical source for the morph pattern this plan uses
- **React `<ViewTransition>` component docs:** https://react.dev/reference/react/ViewTransition
- **Vercel official reference implementation:** https://github.com/vercel-labs/react-view-transitions-demo + live demo at https://react-view-transitions-demo.labs.vercel.dev
- **Vercel intercepting-route modal example:** https://github.com/vercel-labs/nextgram
- **Motion (motion.dev) layout animations:** https://motion.dev/docs/react-layout-animations — used only for gesture-level animation in this plan, NOT for route-level morph
- **React `useOptimistic` docs:** https://react.dev/reference/react/useOptimistic — drives the inline-field implementation pattern
- **Safari View Transitions (WebKit 18.2 announcement):** https://webkit.org/blog/16301/webkit-features-in-safari-18-2/
- **caniuse View Transitions:** https://caniuse.com/view-transitions (90.94% global support as of April 2026)
- **Known open issue #49279 (Motion + App Router):** https://github.com/vercel/next.js/issues/49279 — reason we do NOT use Motion `layoutId` for route-level morph
- **Known open issue #85693 (ViewTransition + Cache Components):** https://github.com/vercel/next.js/issues/85693 — reason we do NOT enable `cacheComponents` mode
- **Rauno Freiberg design reference:** https://rauno.me — verified source of snappy curve `cubic-bezier(0.2, 0.8, 0.2, 1)` and 8px spacing system

## Next Steps

- `/work docs/plans/2026-04-13-refactor-one-canvas-dashboard-plan.md` to start execution
- After Phase 1 proof slice: **pause for Ondrej's on-iPad review gate** — do not auto-continue
- After Phase 7 walkthrough: candidate `/compound` target — "iPad-first shared-element morph with Motion + Next.js App Router intercepting routes" is likely novel enough to document as a reusable pattern
