---
title: "E2E migration notes — One Canvas dashboard rework"
type: research
date: 2026-04-13
for-plan: docs/plans/2026-04-13-refactor-one-canvas-dashboard-plan.md
---

# E2E migration notes — One Canvas dashboard rework

Audit of every selector and URL pattern in `dashboard/e2e/dashboard.spec.ts` that the refactor may touch, with a verdict per test. Source-of-truth list so no E2E coverage gets silently dropped during Phase 2–7.

## Preserved tests (verdict: adapt selectors, keep scenario)

### Public / participant (out of refactor scope — should NOT break)

- `shows the dominant workshop flow on mobile without browser errors` — untouched
- `supports an explicit english public surface and preserves the language in navigation` — untouched
- `keeps the public mobile hero visually stable` — untouched visual regression
- `unlocks private participant context only after redeeming the event code` — untouched
- `keeps the participant mobile room view visually stable` — untouched visual regression
- `renders the opening participant proof slice on mobile without drifting into backstage copy` — participant-facing, out of scope

### Facilitator sign-in (out of refactor scope)

- `redirects unauthenticated /admin to /admin/sign-in in neon mode` — untouched
- `sign-in page renders correctly in english` — untouched
- `sign-in page shows error state` — untouched
- `sign-in page shows unavailable state when Neon Auth is not configured` — untouched

### Workspace cockpit `/admin` (mostly out of scope, except visual regression)

- `loads the workspace cockpit, filters instances, and can drive a critical workshop control` — **needs adaptation**: uses `getByRole("link", { name: "otevřít řízení" })` to navigate to the focused canvas, then `[data-agenda-item="rotation"].getByRole("button", { name: "posunout live sem" })`. After refactor: outline rail + focused canvas must still expose the `[data-agenda-item="rotation"]` attribute and the "posunout live sem" button text. **Verdict: preserve accessible names and `data-agenda-item` attributes in new markup.**
- `keeps the facilitator overview visually stable` — `/admin` cockpit is not part of this refactor; **should NOT diff**. Flag if it does.
- `uses a confirmation dialog before instance removal` — `/admin` cockpit, untouched
- `reflows the expanded instance-creation sheet below workspace filters on desktop` — `/admin` cockpit, untouched

### Facilitator admin `/admin/instances/[id]` (core refactor target)

- `keeps the facilitator control room visually stable on mobile` — **re-baseline expected**: the mobile control room is the new focused canvas. Human diff review before re-snapshot per plan's visual regression protocol.
- `keeps the facilitator control room visually stable on ipad` — **re-baseline expected**: iPad 1024×1366 control room. Same protocol.
- `shows facilitators section with file-mode fallback message` — uses `page.goto("/admin/instances/sample-studio-a?section=access")`. **Verdict: keep `section=access` resolvable** (URL contract doc locks this in). The heading "správa facilitátorů" must still render when the outline rail focuses on Access.
- `shows agenda source information on the agenda section` — uses `page.locator('[data-agenda-item="talk"]').getByRole("link", { name: "detail momentu" }).click()` then `page.getByText("zdroj a ukládání").click()` to expand a `<details>`. **Verdict: the storage info `<details>` collapsible may move** to an outline-rail affordance or an inline panel. Update selector or replace with equivalent "storage info is discoverable when focused on an agenda item" assertion.
- `keeps room screen and participant mirror as separate launch targets in the control room` — uses `projectionLink` with `href` matching `/presenter\?agendaItem=rotation&scene=rotation-not-yours-anymore/` and `participantLinks` matching `/participant/`. **Verdict: hard-load presenter URL must still match this shape**. Intercepting route doesn't change the URL shape, it changes the navigation behavior. Test should continue to pass if the links keep their `href` attributes.
- `shows the facilitator runner on a phone-sized agenda detail` — uses `page.goto("/admin/instances/sample-studio-a?lang=en&section=agenda&agendaItem=talk")` then `getByText("facilitator runner")` and friends. **Verdict: preserve the "facilitator runner" text + its surrounding copy** in the new focused canvas. This is a content test, not a structural one, so mostly immune to refactor.

### Presenter surface (refactor target, Phase 5)

- `renders the room screen on mobile` — uses `page.goto(".../presenter?agendaItem=rotation")` and `getByRole("heading", { name: "Vaše repo už není vaše" })`. **Verdict: hard-load path, preserved.** New presenter Visual language may shift the markup but the heading text stays.
- `keeps the default room screen visually stable on ipad` — **re-baseline expected** in Phase 5.
- `keeps the participant mirror visually stable on ipad` — participant surface, out of scope
- `renders the opening promise scene without backstage labels and keeps a stable ipad layout` — content assertions preserved; **visual baseline re-baselined** in Phase 5.
- `renders the talk room proof slice with the authority cue and keeps a stable ipad layout` — content preserved; visual baseline re-baselined in Phase 5.

### API tests (out of scope)

- `facilitators API returns list with auth` — API-only, unaffected
- `facilitators API returns 401 without auth` — API-only, unaffected

## New tests to add (see plan phases)

| Phase | Test | Purpose |
|---|---|---|
| 1 | `admin to presenter soft navigation surfaces the intercepting overlay` | verify intercepting route fires on soft nav |
| 1 | `hard-load presenter URL renders full-page fallback` | verify deep-link fallback |
| 1 | `keyboard arrow advances scene on desktop` | desktop parity |
| 1 | `swipe gesture advances scene on iPad` | touch parity |
| 1 | `scene rail visible on pointer:fine, auto-hides on pointer:coarse` | responsive behavior |
| 2 | `outline rail navigation preserves language parameter` | lang stays |
| 2 | `focused canvas renders each of the 5 section types` | capability parity |
| 3 | `inline editing agenda item title persists via server action` | inline-field happy path |
| 3 | `inline editing rollback on server action error` | useOptimistic rollback |
| 3 | `add agenda item appends inline row and focuses title field` | inline-append |
| 3 | `inline editing works with keyboard only on desktop` | desktop parity |
| 4 | `reset workshop requires explicit confirmation dialog` | new behavior per plan |
| 4 | `operational forms (password, archive, revoke) behave identically after restyle` | preserved forms |
| 5 | `every scene block type renders in new presenter surface` | block-type matrix |
| 6 | `presenter renders at 4:3 and 16:9 without content overflow` | mirroring check |
| 6 | `keyboard navigation across admin + presenter` | keyboard-only parity |
| 7 | `parameterized parity smoke across all 5 viewports` | final regression |

## Accessible names and attributes to preserve in new markup

These exact strings appear in E2E tests as `getByRole(..., { name })` or `getByText(...)`. The refactor must preserve them as accessible names on semantically equivalent elements:

- "otevřít řízení" (link to instance page from workspace)
- "zpět na workspace" (back link)
- "agenda" (section nav)
- "control room" (heading)
- "participant plocha" (heading + toggle target)
- "posunout live sem" (button — advance agenda)
- "detail momentu" (link — agenda item detail)
- "Odemknout" / "znovu skrýt" (rotation reveal toggles)
- "otevřít projekci" (presenter launch link)
- "participant plocha 1:1" (participant mirror launch)
- "facilitator runner" + "runner goal" (facilitator runner copy)
- "zdroj a ukládání" (storage info collapsible trigger — may move)
- "hledat workshop" (workspace filter)
- "použít filtry" (workspace filter apply)
- Headings: "workshopy a jejich instance", "vstup do kontextu místnosti", "enter room context"

## Data attributes to preserve

- `[data-agenda-item="<id>"]` — used as a locator scope for agenda-item-specific actions in multiple tests. **Must remain on the outline rail row and/or the focused canvas header.**

## Deletion protocol

No E2E test may be deleted without an explicit replacement. If a test can't survive the refactor, it moves to a line in the commit message as "`<test name>` → replaced by `<new test name>` covering `<same scenario>`".
