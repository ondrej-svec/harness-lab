---
title: "refactor: dashboard coverage path to 80 percent"
type: plan
date: 2026-04-07
status: complete
brainstorm:
confidence: medium
---

# Dashboard Coverage Path To 80 Percent

Restructure the dashboard so most page behavior lives in testable view-model and rendering helpers, then add focused unit/component coverage on top of the existing Playwright regression layer until the dashboard can credibly reach about `80%` line coverage without brittle tests.

## Problem Statement

The dashboard now has materially better verification than before: critical participant and facilitator flows are covered by Playwright, route handlers and auth boundaries have strong unit coverage, and overall dashboard coverage is above `54%`.

That is a healthy baseline, but it is not enough to reach a higher-trust target like `80%` under the current architecture. The remaining low-coverage surface is concentrated in large App Router page files such as:

- [`dashboard/app/page.tsx`](../../dashboard/app/page.tsx)
- [`dashboard/app/admin/page.tsx`](../../dashboard/app/admin/page.tsx)
- [`dashboard/app/admin/sign-in/page.tsx`](../../dashboard/app/admin/sign-in/page.tsx)
- [`dashboard/app/admin/reset-password/page.tsx`](../../dashboard/app/admin/reset-password/page.tsx)

These files mix data loading, decision logic, formatting, section selection, and rendering in ways that are awkward to unit test directly. If we try to brute-force higher coverage with the current shape, we will mostly create brittle render tests that are expensive to maintain and weak at explaining failures.

## Proposed Solution

Refactor the page layer into explicit testing seams:

1. extract page-level decision logic into pure view-model modules
2. extract repeatable presentational subtrees into small render helpers or component files
3. add targeted unit tests for view-model derivation and state mapping
4. add thin component tests only for real interactive client pieces
5. keep Playwright focused on critical-path flows and visual stability, not percentage chasing

The goal is not just a larger number. The goal is to move logic into forms that are cheaper to verify and easier for future agents and contributors to change safely.

## Detail Level

This is a **detailed** plan because the work changes the effective testing architecture of the dashboard. The target is not a small test addition. It is a structural refactor that affects page composition, coverage strategy, and the trust boundary between unit tests and Playwright.

## Decision Rationale

### Why not chase 80 percent with more tests on the current files

- The current large server component pages contain too much logic and too much markup at once.
- Testing them directly encourages snapshot-heavy or tree-fragile tests that fail for low-value reasons.
- That would increase maintenance cost without improving diagnosis quality.

### Why extract view models first

- The dashboard already follows a useful testing pyramid in [`docs/dashboard-testing-strategy.md`](../dashboard-testing-strategy.md): pure logic first, tracer bullets second, browser coverage for critical flows.
- View-model extraction lets page logic move into the “pure logic” layer where unit tests are cheap and stable.
- It also aligns with the repo doctrine in [`docs/harness-doctrine.md`](../harness-doctrine.md): improve the harness when the same issue repeats.

### Why keep Playwright narrow

- Playwright already does the right job here: proving the room-day paths and visual stability of the dashboard.
- Expanding Playwright to reach a coverage number would blur the role of the browser suite and make failures harder to interpret.
- The correct split is: unit tests for decision logic, Playwright for user-visible trust boundaries.

### Why 80 percent is possible only after refactoring

- The current `app/` coverage is capped by large page files and thin client components.
- Once logic is extracted from those files into testable modules, the same product behavior can produce substantially more coverage with less fragility.
- Reaching about `80%` on the dashboard is therefore a design-for-testability problem first, a test-writing problem second.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| The main barrier to higher dashboard coverage is page architecture rather than missing test effort alone | Verified | Current coverage report shows large low-coverage App Router page files while routes and helper libs are already much stronger |
| Existing Playwright coverage should remain focused on critical flows instead of becoming the main mechanism for coverage growth | Verified | Repo testing guidance explicitly positions browser coverage as thin and critical-path oriented |
| Extracting pure view-model logic from server pages can materially improve coverage without changing runtime behavior | Verified | We already improved coverage this way in smaller helpers such as page-state derivation functions |
| The team will accept modest refactors that improve testability even when UI behavior does not visibly change | Unverified | Reasonable given current direction, but it still depends on appetite for internal restructuring |
| We can get near 80 percent without introducing a heavy new frontend testing stack for every page | Unverified | Likely if extraction is disciplined, but it depends on how much logic remains trapped in render-only code after refactor |

Unverified assumptions become explicit plan items below.

## Risk Analysis

### Risk: coverage work turns into brittle React tree testing

If the execution path skips the refactor and mounts large page files directly, the repo will gain noisy tests with weak signal.

Mitigation:
- require extraction of view models and helper components before broadening page tests
- keep browser snapshots limited to the already-proven critical paths

### Risk: internal refactors accidentally change visible behavior

If view-model extraction is done carelessly, labels, query behavior, or conditional rendering could drift.

Mitigation:
- preserve current Playwright coverage as the safety net
- add pure helper tests before moving logic when feasible
- refactor in small slices with route/page-level parity checks

### Risk: 80 percent becomes an arbitrary target that distorts the suite

If the number becomes the only goal, low-value files may get over-tested while meaningful gaps remain.

Mitigation:
- treat `80%` as a directional target for the dashboard package, not a reason to add shallow tests
- prioritize auth, state derivation, rendering branches, and interactive controls before cosmetics

### Risk: hidden client-component testing cost

The smallest remaining files, such as theme controls, may require a test environment decision that the repo has not standardized yet.

Mitigation:
- defer client-component tests until after view-model extraction
- if needed, add a minimal React DOM/component-test pattern only for true client interactions

## Phased Implementation

### Phase 1: Define the testability seams

Goal: identify which logic should move out of page files and where it should live.

Tasks:
- [ ] Map [`dashboard/app/page.tsx`](../../dashboard/app/page.tsx) into data loading, decision logic, formatting helpers, and render-only sections.
- [ ] Map [`dashboard/app/admin/page.tsx`](../../dashboard/app/admin/page.tsx) into routing/query parsing, section derivation, action-state helpers, overview/agenda/team/access render branches, and pure state formatting.
- [ ] Define a naming/location convention for extracted modules, for example `view-model.ts`, `selectors.ts`, or section-specific helper files next to the page.
- [ ] Decide which client pieces deserve direct component tests and which should remain covered only through Playwright.

Exit criteria:
- every large low-coverage page has an explicit extraction map
- the repo has one consistent pattern for page-level testability seams

### Phase 2: Extract public page logic into pure modules

Goal: make the public/participant page materially unit-testable.

Tasks:
- [x] Move public-page state derivation, error mapping, section-state selection, and participant room shaping into explicit helper/view-model modules.
- [x] Extract repeated render inputs for public signals, participant metrics, and footer/navigation state into pure return shapes.
- [x] Add unit coverage for all public-page branch logic, including language-sensitive formatting and participant/public mode switching.
- [ ] Keep [`dashboard/e2e/dashboard.spec.ts`](../../dashboard/e2e/dashboard.spec.ts) as the browser trust boundary for the mobile participant/public flows.

Exit criteria:
- public page logic coverage rises materially without adding broad DOM snapshots
- the page file itself becomes mostly composition and data wiring

### Phase 3: Extract admin page section logic into pure modules

Goal: make the facilitator dashboard testable by section rather than as one giant page.

Tasks:
- [x] Split admin query parsing, section resolution, instance selection, section-specific derived state, and action redirect construction into dedicated helper modules.
- [x] Extract section view models for `overview`, `agenda`, `teams`, `signals`, `access`, and `account`.
- [x] Add tests that assert branch behavior for each section independent of the full page tree.
- [ ] Keep server actions thin and keep route/action side effects covered by existing route and auth tests.

Exit criteria:
- admin page coverage rises because most logic is exercised outside the giant page shell
- section-specific regressions fail in focused tests rather than only in Playwright

### Phase 4: Standardize light component testing for interactive client pieces

Goal: cover the few remaining client-only components with the smallest viable setup.

Tasks:
- [x] Introduce a minimal component-test pattern for client components if the extracted logic still leaves meaningful uncovered interaction code.
- [x] Add tests for [`dashboard/app/components/theme-switcher.tsx`](../../dashboard/app/components/theme-switcher.tsx) and [`dashboard/app/components/theme-provider.tsx`](../../dashboard/app/components/theme-provider.tsx) only if those files remain meaningful contributors to the gap.
- [ ] Document the repo-standard approach for client component tests so future contributors do not invent their own.

Exit criteria:
- client interaction coverage exists where it matters
- the repo still uses one coherent testing model instead of mixed ad hoc patterns

### Phase 5: Recalibrate inclusion and lock the new baseline

Goal: make the coverage number honest, stable, and enforceable.

Tasks:
- [x] Review [`dashboard/vitest.config.ts`](../../dashboard/vitest.config.ts) coverage include/exclude rules and confirm they match the intended dashboard trust boundary.
- [x] Exclude only files that are clearly generated, purely contractual, or not worth line-based enforcement.
- [x] Add a dashboard coverage threshold once the refactor stabilizes near the target.
- [x] Update [`docs/dashboard-testing-strategy.md`](../dashboard-testing-strategy.md) to reflect the new split between view-model tests, route tests, component tests, and Playwright.

Exit criteria:
- coverage targets reflect real product trust, not reporting tricks
- the repo has a documented and enforceable dashboard testing shape

## Implementation Tasks

1. **Coverage seam mapping**
- [x] Inventory all low-coverage `app/` files and mark which logic is extractable without behavior change.
- [x] Write down the target extraction pattern for public and admin pages before moving code.

2. **Public page refactor**
- [x] Extract public/participant view-model logic from [`dashboard/app/page.tsx`](../../dashboard/app/page.tsx).
- [x] Add focused unit tests for public/participant decision branches.

3. **Admin page refactor**
- [x] Extract section-specific state derivation and redirect/query helpers from [`dashboard/app/admin/page.tsx`](../../dashboard/app/admin/page.tsx).
- [x] Add unit tests for admin section view models and branch selection.

4. **Client interaction coverage**
- [x] Decide whether a minimal client-component test stack is necessary.
- [x] If yes, cover theme controls and any other remaining interactive leaf components.

5. **Threshold and docs**
- [x] Review coverage include/exclude boundaries.
- [x] Introduce thresholds only after the refactor produces a stable new baseline.
- [x] Update dashboard testing documentation.

## Acceptance Criteria

- The dashboard package has a documented testing architecture that explains what belongs in unit tests, route tests, component tests, and Playwright.
- [`dashboard/app/page.tsx`](../../dashboard/app/page.tsx) and [`dashboard/app/admin/page.tsx`](../../dashboard/app/admin/page.tsx) are substantially thinner because branch logic moved into testable helpers.
- Coverage rises materially beyond the current mid-50s baseline without relying on brittle page snapshots.
- The dashboard can plausibly reach about `80%` with honest include/exclude rules and stable tests.
- Playwright remains focused on critical rendered flows rather than being abused as a percentage tool.
- A new contributor can continue the coverage push from this plan without guessing where the next useful work is.

## References

### Local references

- [`docs/dashboard-testing-strategy.md`](../dashboard-testing-strategy.md)
- [`docs/harness-doctrine.md`](../harness-doctrine.md)
- [`docs/plans/2026-04-06-feat-agentic-ui-inspection-dashboard-ux-plan.md`](2026-04-06-feat-agentic-ui-inspection-dashboard-ux-plan.md)
- [`dashboard/vitest.config.ts`](../../dashboard/vitest.config.ts)
- [`dashboard/app/page.tsx`](../../dashboard/app/page.tsx)
- [`dashboard/app/admin/page.tsx`](../../dashboard/app/admin/page.tsx)
- [`dashboard/e2e/dashboard.spec.ts`](../../dashboard/e2e/dashboard.spec.ts)

### Prior plan signal

- [`docs/plans/2026-04-06-feat-agentic-ui-inspection-dashboard-ux-plan.md`](2026-04-06-feat-agentic-ui-inspection-dashboard-ux-plan.md) already established the repo’s intended split between exploratory/browser regression coverage and lower-level executable verification. This plan extends that same logic into the page layer rather than replacing it.
