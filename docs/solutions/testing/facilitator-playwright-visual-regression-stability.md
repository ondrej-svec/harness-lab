---
title: "Stabilize facilitator Playwright visual regression across macOS and Ubuntu"
type: solution
date: 2026-04-07
domain: testing
component: "dashboard/e2e facilitator visual snapshots"
symptoms:
  - "GitHub Actions `e2e-dashboard` fails while local Playwright visual tests pass"
  - "Facilitator snapshot assertions fail with image height mismatches like 1440x2200 vs 1440x2204"
  - "Refreshing local baselines does not reliably fix Ubuntu CI failures"
root_cause: "Facilitator snapshots were taken as full-page images, so small cross-platform font and wrapping differences changed total document height before pixel diff tolerance could help; snapshot refreshes could also be misleading if Playwright was still serving an older `.next` build."
severity: medium
related:
  - "/Users/ondrejsvec/projects/Bobo/harness-lab/docs/dashboard-testing-strategy.md"
  - "/Users/ondrejsvec/projects/Bobo/harness-lab/docs/facilitator-dashboard-design-rules.md"
  - "/Users/ondrejsvec/projects/Bobo/harness-lab/docs/github-actions-maintenance.md"
---

# Stabilize facilitator Playwright visual regression across macOS and Ubuntu

## Problem

After the facilitator cockpit redesign, local Playwright checks passed, but GitHub Actions kept failing the `Dashboard CI` workflow in `e2e-dashboard`.

The failures looked like normal snapshot drift at first, but the important detail was that the assertions were failing on image dimensions, not just diff ratio:

- facilitator overview expected `1440x2200` but Ubuntu CI rendered `1440x2204`
- facilitator mobile control room expected `393x4974` but Ubuntu CI rendered `393x4994`

That meant CI was not disagreeing about the basic layout or UI state. It was disagreeing about total full-page document height.

This produced a bad loop:

- local snapshots were refreshed on macOS
- CI still failed on Ubuntu
- `maxDiffPixelRatio` alone did not help because the assertion never got past the size mismatch

## Root Cause

There were two contributing causes.

### 1. Full-page facilitator screenshots were too brittle

The facilitator overview and control room were asserted with `fullPage: true`.

These pages are long, copy-heavy, and responsive. Small differences in font metrics, line wrapping, or vertical spacing between macOS-authored baselines and Ubuntu CI changed the overall document height by a few pixels. Once that happened, Playwright failed on image size mismatch before a relaxed diff ratio could absorb the visual drift.

The core mistake was asserting the total scroll length of a long admin surface instead of the designed viewport shell.

### 2. Snapshot refreshes can lie if the production bundle is stale

Playwright in this repo serves the dashboard from the production build output in `.next` using the configured `webServer`.

If facilitator UI code changes are made after the last `npm run build`, then `npm run test:e2e -- --update-snapshots` can regenerate snapshots against an older production bundle. That makes visual inspection confusing because the snapshot file may update while still reflecting stale markup.

## Fix

The stable fix had three parts.

### 1. Stop asserting long facilitator pages as full-page screenshots

In [`dashboard/e2e/dashboard.spec.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/e2e/dashboard.spec.ts), the two facilitator visual tests were changed to viewport screenshots instead of `fullPage: true`.

This keeps the regression focused on:

- header hierarchy
- card density
- shell layout
- primary actions
- mobile control-room composition

and avoids coupling the test to total document height.

### 2. Keep facilitator-specific tolerance scoped and explicit

The facilitator screenshot assertions keep a limited `maxDiffPixelRatio` override because these surfaces still pick up small cross-platform font/layout differences.

The important constraint is scope: only facilitator visuals use the relaxed tolerance, not the whole Playwright suite.

### 3. Rebuild before regenerating baselines after UI changes

Before trusting refreshed snapshots, run:

```bash
cd dashboard
npm run build
npm run test:e2e -- e2e/dashboard.spec.ts -g "facilitator overview visually stable|facilitator control room visually stable on mobile" --update-snapshots=all
```

This ensures Playwright is rendering the latest production bundle rather than a stale `.next` output.

## Prevention

Use these rules for future facilitator visual coverage:

1. Do not use `fullPage: true` for long admin/control-plane surfaces unless total page height is itself the behavior under test.
2. Prefer viewport screenshots or targeted element screenshots for cockpit-like UIs with long content below the fold.
3. If local snapshot refreshes behave strangely, suspect a stale `.next` build before assuming the UI is unchanged.
4. Keep relaxed diff tolerances local to the unstable surface instead of widening the global Playwright defaults.
5. When a UI redesign changes page density or copy length substantially, refresh snapshots only after a fresh production build and rerun the full `npm run test:e2e` suite.

## Related

- [`dashboard/e2e/dashboard.spec.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/e2e/dashboard.spec.ts)
- [`docs/dashboard-testing-strategy.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/dashboard-testing-strategy.md)
- [`docs/facilitator-dashboard-design-rules.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/facilitator-dashboard-design-rules.md)
- [`docs/github-actions-maintenance.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/github-actions-maintenance.md)
