---
title: "URL contract — One Canvas dashboard rework"
type: research
date: 2026-04-13
for-plan: docs/plans/2026-04-13-refactor-one-canvas-dashboard-plan.md
---

# URL contract — One Canvas dashboard rework

Snapshot of every URL parameter the current admin surface uses, and the post-refactor home for each. Written in Phase 0 before any markup changes so nothing drops silently.

## Query parameters in use today

| Param | Where | Purpose | Post-refactor home |
|---|---|---|---|
| `lang` | every admin URL + `/` + participant | `cs` / `en` language toggle; preserved by `AdminLanguageSwitcher` and every internal link | **Unchanged.** Language switcher behavior is load-bearing per E2E test `supports an explicit english public surface and preserves the language in navigation`. Phase 2 task explicitly verifies it still works. |
| `section` | `/admin/instances/[id]` | selects 1 of 5 admin sections (`agenda`, `teams`, `signals`, `access`, `settings`) | **Deprecated but accepted.** The new focused-canvas admin picks section from URL when provided, maps it to the outline-rail focus. Old URLs continue to resolve. |
| `agendaItem` | `/admin/instances/[id]` + `/presenter` | selects an agenda item by id | **Unchanged.** Still present on both admin (for "jump to this item") and presenter (for "which scene list am I showing"). |
| `scene` | `/presenter` (and any `scene-*` overlays) | selects a scene within an agenda item | **Unchanged.** Hard-load `/admin/instances/[id]/presenter?agendaItem=X&scene=Y` continues to resolve directly to the full-page presenter (non-intercepted). |
| `teamId` | `/admin/instances/[id]?section=teams` | selects a team for edit in the Teams section | **Unchanged.** Maps to the team row that the outline rail focuses. |
| `overlay` | `/admin/instances/[id]` | selects one of 4 sheet overlays: `agenda-add`, `agenda-edit`, `scene-add`, `scene-edit` | **Removed.** These 4 overlays are replaced by inline editing in Phase 3. Legacy URLs with `overlay=...` will render the focused canvas in a focused-on-the-target state; the overlay param itself becomes a no-op. |
| `error` | `/admin/instances/[id]?section=access` + `/admin/sign-in` | surfaces error banners (invalid password, etc.) | **Unchanged.** Operational forms still use this pattern per Phase 4. |
| `password` | `/admin/instances/[id]?section=settings` | success flag for password change (`password=changed`) | **Unchanged.** |
| `returnTo` | `setAgendaAction` form field | where to redirect after a server action | **Unchanged.** Internal form state, not a URL parameter users navigate with. |

## New URL structure (Phase 1+)

Nothing moves in this refactor. The route tree stays at:

- `/admin/instances/[id]` — focused canvas admin (was: sticky-sidebar 5-section admin)
- `/admin/instances/[id]/presenter` — full-page presenter (hard-load fallback)
- `/admin/instances/[id]/participant` — participant mirror (unchanged)

What changes is the **addition** of a parallel slot:

- `/admin/instances/[id]/@presenter/default.tsx` — renders `null` when nothing is intercepted
- `/admin/instances/[id]/@presenter/(.)presenter/[[...params]]/page.tsx` — intercepting route that captures `/presenter/...` soft navigations and renders them as an overlay alongside the still-mounted admin

Soft-navigation (click a scene card in admin) enters the intercepting overlay; URL still shows `/presenter/...`. Hard-load, refresh, or direct link bypass the intercept and hit the real `/presenter` page.

## E2E impact

The existing Playwright tests lock in these URL patterns:

- `/admin/instances/sample-studio-a/presenter?agendaItem=rotation` — used by `renders the room screen on mobile` and `keeps the default room screen visually stable on ipad`. Still valid; hard-load path.
- `/admin/instances/sample-studio-a/presenter?agendaItem=opening&scene=opening-framing&lang=en` — used by `renders the opening promise scene`. Still valid.
- `/admin/instances/sample-studio-a?lang=en&section=agenda&agendaItem=talk` — used by `shows the facilitator runner on a phone-sized agenda detail`. `section=agenda` becomes a no-op hint to the outline rail; `agendaItem=talk` focuses the canvas on that item.
- `/admin/instances/sample-studio-a?section=settings` — used by `toggleRotationAction` test. Stays resolvable.
- `/admin/instances/sample-studio-a?section=access` — used by `shows facilitators section with file-mode fallback message` test. Stays resolvable.

## Rule for the refactor

1. Any URL that works today must still resolve to a reasonable state in the new IA.
2. New navigation should NOT require legacy query params — the outline rail + card clicks drive state.
3. `lang` is sacred. Don't accidentally drop it on any internal navigation.
4. Deep-linking to a specific scene in the presenter must still work for shared links.
