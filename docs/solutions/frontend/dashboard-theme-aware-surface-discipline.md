---
title: "Keep dashboard surfaces theme-aware by routing all admin chrome through semantic tokens"
type: solution
date: 2026-04-07
domain: frontend
component: "dashboard app theme system and admin surfaces"
symptoms:
  - "Light mode still shows dark admin slabs or muddy contrast even after theme support exists"
  - "Facilitator workspace and control room look like separate visual systems in light vs dark mode"
  - "Components use hardcoded gradients, `dark:` overrides, or raw RGBA values instead of theme tokens"
root_cause: "The app had theme tokens, but key dashboard surfaces bypassed them with page-specific hardcoded dark gradients and one-off light/dark overrides, so the UI was not actually consuming a single theme system."
severity: medium
related:
  - "/Users/ondrejsvec/projects/Bobo/harness-lab/docs/plans/2026-04-06-feat-dashboard-polish-dark-light-plan.md"
  - "/Users/ondrejsvec/projects/Bobo/harness-lab/docs/facilitator-dashboard-design-rules.md"
  - "/Users/ondrejsvec/projects/Bobo/harness-lab/docs/solutions/testing/facilitator-playwright-visual-regression-stability.md"
---

# Keep dashboard surfaces theme-aware by routing all admin chrome through semantic tokens

## Problem

The dashboard already had a theme system, but the facilitator/admin routes did not behave like they were using one.

In practice this showed up as:

- light mode still rendering heavy black or charcoal cockpit panels
- dark mode relying on component-local `dark:` overrides instead of a coherent system
- facilitator workspace, control room, and shared admin UI primitives drifting apart visually
- fixes to one surface not propagating cleanly to the rest of the dashboard

This is the failure mode where a project technically “supports themes,” but individual surfaces still behave like custom art direction islands.

## Root Cause

The theme problem was architectural, not just cosmetic.

### 1. Tokens existed, but important surfaces bypassed them

The dashboard had semantic variables in [`dashboard/app/globals.css`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/globals.css), but several key facilitator surfaces still used:

- hardcoded dark gradients
- raw RGBA values embedded directly in JSX class strings
- `dark:` overrides layered onto components that should have been token-driven

That meant the visual identity of the admin app depended on per-page implementation details rather than shared tokens.

### 2. Shared admin primitives were not fully authoritative

Even though [`dashboard/app/admin/admin-ui.tsx`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/admin/admin-ui.tsx) already contained shared panel and button primitives, the strongest chrome still lived outside those abstractions:

- workspace summary hero
- control-room hero
- dark rail/navigation states
- metric tiles and hero tiles

As long as those surfaces stayed page-local and hardcoded, “theme support” remained partial.

## Fix

The durable fix was to make the theme system authoritative for dashboard chrome.

### 1. Expand the semantic token set

In [`dashboard/app/globals.css`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/globals.css), add surface-level tokens that reflect actual dashboard building blocks, not just generic colors:

- `--card-top`, `--card-bottom`
- `--card-strong-top`, `--card-strong-bottom`
- `--hero-top`, `--hero-bottom`
- `--hero-text`, `--hero-secondary`, `--hero-muted`
- `--hero-border`, `--hero-tile-bg`, `--hero-tile-hover`
- `--ambient-left`, `--ambient-right`

The key lesson is that if the UI repeatedly invents a visual pattern, it needs a semantic token, not another inline gradient.

### 2. Push shared admin chrome into reusable primitives

In [`dashboard/app/admin/admin-ui.tsx`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/admin/admin-ui.tsx):

- shared panels and cards were converted to token-based gradients
- secondary buttons stopped carrying raw light/dark background values
- shared hero surface classes were introduced for dark/light-aware operational chrome

This makes the primitives the source of truth instead of a convenience layer.

### 3. Replace page-local dark slabs with semantic hero surfaces

In:

- [`dashboard/app/admin/page.tsx`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/admin/page.tsx)
- [`dashboard/app/admin/instances/[id]/page.tsx`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/admin/instances/[id]/page.tsx)

the facilitator hero panels, hero tiles, side rail, live-state blocks, and summary surfaces were changed from hardcoded dark gradients to token-driven hero surfaces.

That is what finally made light mode feel intentionally light rather than “dark mode components shown on a pale page.”

### 4. Reduce stray one-off theme overrides

Remaining `dark:` overrides were narrowed to true behavior differences instead of being used as the main mechanism for component coloring.

The pattern is:

- tokens define the theme
- components consume tokens
- `dark:` is only for limited structural adjustments when a token alone is insufficient

## Prevention

Use these rules for future dashboard work:

1. If a component uses raw RGBA or a hardcoded gradient in JSX, treat that as a code smell unless it is backed by semantic CSS variables.
2. If the same visual pattern appears in more than one admin surface, promote it to shared tokens and shared admin UI primitives.
3. Do not let facilitator pages invent their own “hero” styling outside shared admin abstractions.
4. Theme support is not complete until light mode and dark mode both look intentional on the real route, not just in component isolation.
5. When reviewing dashboard UI changes, search for `rgba(`, `dark:bg`, `dark:text`, and inline gradient classes to catch theme bypasses early.
6. Refresh visual baselines after token-system changes so Playwright reflects the real current theme state.

## Related

- [`dashboard/app/globals.css`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/globals.css)
- [`dashboard/app/admin/admin-ui.tsx`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/admin/admin-ui.tsx)
- [`dashboard/app/admin/page.tsx`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/admin/page.tsx)
- [`dashboard/app/admin/instances/[id]/page.tsx`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/app/admin/instances/[id]/page.tsx)
- [`docs/plans/2026-04-06-feat-dashboard-polish-dark-light-plan.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/plans/2026-04-06-feat-dashboard-polish-dark-light-plan.md)
