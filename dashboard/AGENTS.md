# dashboard/

## Mission

Next.js App Router application that renders the live workshop — participant briefs, presenter room screen, facilitator control surfaces.

## Read First

Before editing code under `dashboard/`:

1. [`../docs/dashboard-design-system.md`](../docs/dashboard-design-system.md) — shared visual and interaction baseline.
2. [`../docs/dashboard-surface-model.md`](../docs/dashboard-surface-model.md) — routing, state, and surface boundaries.
3. [`../docs/dashboard-testing-strategy.md`](../docs/dashboard-testing-strategy.md) — Playwright, unit, and smoke test contracts.
4. [`../docs/agent-ui-testing.md`](../docs/agent-ui-testing.md) — how an agent should validate UI changes before claiming done.
5. The current plan in [`../docs/plans/`](../docs/plans/) if the task is already in flight.

## Task Routing

- New recurring visual pattern → update or extend `docs/dashboard-design-system.md` in the same slice as the code change.
- Routing, state, or surface boundary change → read `docs/dashboard-surface-model.md` first and update it if the boundary moves.
- Test additions → match the existing Playwright/unit split; smoke-test critical flows before done.
- Agent-driven UI work → follow the layered workflow in `docs/agent-ui-testing.md` (exploratory → Playwright → human review).

## Verification Boundary

- Critical flows require a Playwright regression before the change is considered done. Exploratory browser inspection is a diagnostic tool, not a verification.
- UI changes are not done when the diff compiles. They are done when a human (or a reliable automated check) has seen the new state match the design doc.
- `cd dashboard && npm run test && npm run test:e2e && npm run lint && npm run build` must pass before shipping.
- For framework-sensitive edits, prefer the version-matched docs in `dashboard/node_modules/next/dist/docs/` over memory.

## Done Criteria

1. Tests, lint, and build run clean for the touched surface.
2. Design system docs still describe reality if a recurring pattern landed.
3. The change was verified against the design doc baseline, not just "it compiles."
4. The next safe move is stated if the work is partial.

## Privilege Boundary

Any new `/admin` route, facilitator server action, or auth helper that
gates access on a Neon Auth session MUST go through one of the existing
guards: `requireFacilitatorRequest` (API routes), `requireFacilitatorPageAccess`
(Server Components), `requireFacilitatorActionAccess` (server actions),
or `getFacilitatorSession` / `resolveFacilitatorGrant` (programmatic).

All four enforce `role = "admin"` on the underlying Neon Auth user as a
defense-in-depth check — even when an `instance_grants` row exists.
The regression suite for this lives in `lib/privilege-boundary.test.ts`.
If you change any of the guards, the suite must stay green; if you add
a new guard, extend the suite with a participant-role-with-stale-grant
case proving the boundary holds.

Never gate on `getAuthenticatedFacilitator` alone — that only checks
that a Neon session exists, not that the user has admin role.
