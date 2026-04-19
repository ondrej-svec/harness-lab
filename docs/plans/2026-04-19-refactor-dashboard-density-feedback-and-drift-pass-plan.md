---
title: "refactor: dashboard post-cockpit density, submit feedback, and drift sweep"
type: plan
date: 2026-04-19
status: complete
brainstorm: null
confidence: medium
---

# Dashboard post-cockpit density, submit feedback, and drift sweep

**One-line summary:** close the submit-feedback gap that makes async actions feel broken, apply the cockpit compaction pattern to the three remaining hero+summary surfaces, and absorb the cross-surface design-system drift (radii, eyebrow tracking, breakpoints) so the product reads as one coherent density.

## Problem Statement

Today's facilitator cockpit landed, compacting the control-room header from ~600px to ~180px on iPad landscape. A sweep of the rest of the dashboard — participant flow, facilitator workspace, run/agenda sections, presenter, sign-in — surfaced three kinds of issue that the cockpit work did not touch:

1. **Submit feedback is missing on participant-facing async actions.** The specific bug the user reported: after entering the event code, the "What's your name?" prompt renders a raw `<button type="submit">` inside a server-action form with no spinner, no `aria-busy`, no disabled state. Click → silence for 200–1500ms → page changes. On slow networks users re-click or assume it's broken. An audit of the codebase found the same class of issue across `participant-check-in-form.tsx`, `inline-field.tsx` (used everywhere in run/agenda/scene-stage), `add-agenda-item-row.tsx`, `add-scene-row.tsx`, `people-section-client.tsx` row buttons, and `people-randomize.tsx`. Each either uses a raw button with no indicator, or shows only `disabled + opacity-60` with no spinner. The good pattern exists — `SubmitButton` and `AdminRouteLink` both show proper pending state — but it's applied unevenly.

2. **Three more surfaces still run the pre-cockpit hero+summary pattern.** The same wasteful "giant hero + separate persistent-summary card" layout the cockpit killed still lives on the admin workspace landing (`app/admin/page.tsx`), the run-section hero (`run-section.tsx`), and the agenda-section hero in both index and detail modes (`agenda-section.tsx`). The cockpit already carries a context strip with the same data, so the in-section summary cards are literally duplicating what the page chrome now shows.

3. **Design-system drift across sections.** Radii sprinkled as `rounded-[18px]` / `rounded-[24px]` / `rounded-[34px]` exist outside the system's four-tier palette (16 input / 20 tile / 22 card / 28 panel). Eyebrow `tracking` oscillates between `0.18em` and `0.28em`. Headings drift between `-0.04em` and `-0.05em`. `2xl:grid-cols-*` on access/teams/signals locks layouts behind 1536px so iPad never sees the intended side-by-side. `people-section-client.tsx` copies `adminPanelSurfaceClassName` locally instead of importing it. Outer-grid `gap-6` conflicts with the cockpit's newer `gap-4 sm:gap-5` rhythm.

Separately, the sign-in page strips `?lang=en` on redirect, so English users land on Czech auth screens — a small but visible inconsistency.

This matters because:

- **Feedback**: facilitators and participants both report that the UI "feels broken." Missing submit feedback is a credibility bug under real workshop conditions.
- **Density**: the cockpit work demonstrated that denser is more usable for iPad-driven facilitation. Leaving three more surfaces in the old pattern undoes half the gain.
- **Drift**: once the design system reads as "almost consistent," every future contributor will echo the nearest neighbor instead of the system spec. The drift compounds.

## Target End State

When this lands:

1. **Every form submit or async action on the dashboard** shows a pending indicator (spinner or equivalent visible state, plus `aria-busy`, plus disabled-while-pending) within 100ms of click. No more raw buttons inside server-action forms. No more silent `opacity-60` as the sole feedback.
2. **Four facilitator surfaces share the cockpit compaction pattern**: control room (already done), admin workspace, run-section, agenda-section. None of them carries a `text-5xl` title with a body paragraph plus a separate summary card at the top.
3. **The design system is internally consistent**: radii conform to {16, 20, 22, 28} with no strays; eyebrow `tracking-[0.28em]`, headings `tracking-[-0.04em]`; `2xl:grid-cols-*` demoted to `xl:` or accepted as single-column; `panel`/`card` class constants imported from `admin-ui`, not duplicated.
4. **Sign-in preserves the `?lang=en` query across the auth redirect**, so EN users stay EN.
5. **Existing Playwright, Vitest, and page tests are green.** A new e2e test confirms the participant name-prompt shows a pending indicator within 100ms of click.
6. `docs/dashboard-design-system.md` gets a short "Radii tiers" and "Breakpoint doctrine" pair of sections so reviewers have something to cite.

## Scope and Non-Goals

**In scope:**
- All six submit-feedback fixes from Tier 1.
- Cockpit-pattern compaction on `app/admin/page.tsx`, `run-section.tsx`, `agenda-section.tsx`.
- Design-system drift sweep: radii, tracking, breakpoint demotion, duplicated classes, outer gap.
- Sign-in `?lang=en` preservation + rounded radii on sign-in cards/inputs/buttons.
- A new `InlineSpinner` component for fetch-based forms that can't use `useFormStatus`.
- Minimal additions to `docs/dashboard-design-system.md` covering the radii and breakpoint rules.

**Not in scope:**
- Redesigning presenter, scene-stage-rail, or agenda sheets (flagged in review Tier 4 — deferred).
- Changing the Rosé Pine palette, Space Grotesk/Manrope typography, or motion curves.
- Restructuring the 4-section facilitator IA (already done in Apr 19 revamp plan).
- Migrating the participant surface away from its current 2-column rich-content layout.
- Copy changes except for the sign-in `?lang` fix; all other localization stays.
- Changes to any page already covered and still open in `2026-04-14-feat-dashboard-motion-loaders-and-design-system-plan.md` — that plan handles navigation-button loaders separately; this plan handles form submits, which is disjoint.

## Proposed Solution

Three phases, dependency-ordered.

### Phase 1 — Submit feedback

Two patterns, applied consistently:

- **Server-action forms** (`<form action={serverAction}>`): replace raw `<button type="submit">` with the existing `<SubmitButton>` component. Uses `useFormStatus` — spinner, `aria-busy`, `cursor-wait opacity-75`, disabled-while-pending. Already production-proven in admin signIn, createInstance, removeInstance, reset-password, device approve/deny, signals, rotation, agenda, teams, access, settings. One file change per surface.

- **`useTransition` + fetch forms** (`<form onSubmit={fn}>` or client handlers): create a small `<InlineSpinner active />` client component that renders the same spinner as `SubmitButton` (border + animate-spin + rounded-full) controlled by a prop. Callers keep their existing disabled/opacity pattern and add `<InlineSpinner active={isPending} />` inside the button. Applied to `participant-check-in-form.tsx`, `people-section-client.tsx` row buttons, `people-randomize.tsx`. For `inline-field.tsx` / `add-agenda-item-row.tsx` / `add-scene-row.tsx` — these already render a `…` ellipsis during pending; swap that ellipsis for `<InlineSpinner active />`.

Add one Playwright test: submit the name prompt, assert `button[aria-busy="true"]` before navigation completes.

### Phase 2 — Cockpit-pattern compactions

Reuse the pattern from `control-room-cockpit.tsx`:

- **`app/admin/page.tsx`**: collapse the `rounded-[34px]` workspace hero (title + body + controls) plus the `WorkspacePulseStat` 4-tile summary into a single `rounded-[28px]` panel with three internal compartments — toolbar row (title + eyebrow + controls), meta row (instance count + filters entry), context strip (pulse stats). Same layout doctrine: wraps on sm, inline on lg+.
- **`run-section.tsx`**: delete the 3-card `ControlRoomPersistentSummary` column at lines 91–167. The cockpit's context strip already carries active instance / current phase / participant surface / teams. Keep the hero block but demote to a single compact card with `text-[1.4rem]` title and the four action buttons — no body paragraph, no separate persistent-summary column.
- **`agenda-section.tsx`**: detail-mode hero drops from `text-[2.4rem]` to `text-2xl/3xl` across breakpoints, `InlineField` rows move from a 3-tile block to an inline dot-separated strip matching the cockpit meta row. Index-mode hero collapses its summary column the same way `run-section` does.

### Phase 3 — Design-system drift sweep

Mechanical, grep-driven:

- **Radii normalization**: any `rounded-[18px]` → `rounded-[20px]` (tile) or `rounded-[22px]` (card) depending on role. Any `rounded-[24px]` / `rounded-[34px]` → `rounded-[28px]` (panel). Keep inputs at 16, pills at full. Verify each change doesn't break visually.
- **Eyebrow tracking**: every `text-[10–11px] uppercase tracking-[0.18em]` → `tracking-[0.28em]`. (Some intentional `tracking-[0.18em]` exist on utility rows like the control cluster — audit each.)
- **Heading tracking**: `tracking-[-0.05em]` → `tracking-[-0.04em]` on headings (keep hero variants untouched if intentional).
- **Breakpoint demotion**: `2xl:grid-cols-*` on `access-section.tsx`, `teams-section.tsx`, `signals-section.tsx` → `xl:grid-cols-*` (so iPad landscape benefits), OR accept single-column and remove the dead breakpoint.
- **Centralize panel class**: delete local `panelSurface` / `cardSurface` constants in `people-section-client.tsx:12-17`, import `adminPanelSurfaceClassName` and a new `adminCardSurfaceClassName` (extract from existing usage) from `admin-ui.tsx`.
- **Outer grid gap**: sections using `gap-6` on the top-level page grid align with the cockpit's `gap-4 sm:gap-5`.
- **Sign-in fixes**: thread `?lang` through the sign-in redirect (the `redirect(withLang(...))` calls already exist in the action, but the initial GET doesn't preserve it). Add `rounded-[28px]` to the two form cards, `rounded-[16px]` to inputs, `rounded-full` to submit buttons — all currently unrounded.
- **Docs**: add "Radii tiers" and "Breakpoint doctrine" subsections to `docs/dashboard-design-system.md`.

## Decision Rationale

### Why one plan covering three tiers

Considered splitting into three separate plans. Decided against because:

- Tier 1 and Tier 3 share the same principle ("apply the existing system consistently"). Splitting would duplicate the framing.
- Tier 2 compactions will *create* new drift if Tier 3 doesn't follow them in the same pass. Doing Tier 3 after Tier 2 in the same plan means consistency gets enforced on the newly-written code too.
- Phase boundaries keep scope controlled. Each phase ships as its own PR.

### Why the existing `SubmitButton` and a new `InlineSpinner`

Considered three alternatives:

1. **Only use `SubmitButton`** — can't, because `useFormStatus` only works inside `<form action>` server-action forms. Client-side `useTransition`-based forms need a different indicator.
2. **Refactor all `useTransition` forms to server actions** — scope creep. Some of these forms (check-in) genuinely need fetch for PATCH semantics.
3. **Inline the spinner JSX everywhere** — works but creates five copies of the same animate-spin markup. Easier to enforce the convention with a named component.

Chose option 3's spirit but with a named component: extract the spinner span into `<InlineSpinner active={isPending} />`. One component, two usage modes (`SubmitButton` internally, `InlineSpinner` externally), one visual result.

### Why demote `2xl:` instead of accepting it

`access-section`, `teams-section`, `signals-section` all gate their side-by-side layouts behind `2xl:` (1536px). Facilitators operate these from iPads (1024–1194px). The dashboard is explicitly iPad-first per the Apr 8 remediation plan's documented doctrine ("iPad first, phone acceptable, desktop expansive but secondary"). Leaving side-by-side at 1536px means the side-by-side never activates for the primary audience. Demoting to `xl:` (1280px) means most desktop monitors and nothing else — still defensive but actually useful.

### Why not sign-in redesign

Sign-in has several small issues (radii, `?lang`, two-equal-weight cards). Full redesign would be another cockpit-scale effort. Decided to fix the small issues (radii + query preservation) and defer the card reorganization — not worth the risk during this pass.

### Why the reported bug gets an e2e test, not just manual verification

The bug is that submit-feedback-missing surfaces look identical to a loading page until you wait on a slow network. Manual testing on fast localhost won't catch regressions. One Playwright test at `spinner appears within N ms of submit click` locks in the fix.

## Constraints and Boundaries

- **Design tokens unchanged.** Rosé Pine palette, Space Grotesk display, Manrope body, `cubic-bezier(0.2, 0.8, 0.2, 1)` easing, ambient gradient stays.
- **No new libraries.** React 19 / Next 16 / Tailwind 4 / existing motion primitives only.
- **No accessibility regressions.** Every new spinner carries `aria-busy` on its button and `aria-hidden` on the visual element.
- **Preserve localization coverage.** All copy changes route through `ui-language.ts`. No raw English leaking into Czech chrome; no raw Czech leaking into English chrome.
- **Preserve e2e / unit / page test suites.** Selectors that changed (e.g., radii markup) are updated in the same PR.
- **Trunk-based.** Each phase commits directly to `main` per the project's repo rule.

## Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| `useFormStatus` works with all existing server-action forms targeted for `SubmitButton` swap | Verified | Already used in ~25 server-action forms across admin (run, agenda, teams, access, settings, signals, sheets, device, sign-in, reset). |
| Inline spinner driven by external `isPending` prop is a valid React 19 pattern | Verified | Standard React usage; already implicit in `AdminRouteLink.tsx`'s overlay variant. |
| `control-room-cockpit.tsx` tokens (rounded-[28px], tracking-[0.28em], text-xl→28px scale) generalize to the three Phase-2 compaction targets | Assumed | Same design system, same viewports, same audience — but hero content differs per surface; verify each compaction individually. |
| Demoting `2xl:grid-cols-*` to `xl:` on access/teams/signals won't cramp content on 1280px screens | Unverified | Needs manual check at 1280 during implementation; each change has a visual smoke test task. |
| Sign-in redirect drops `?lang` because `auth.signIn.email` then `redirect(withLang(...))` already threads it, but the initial GET from `/admin` doesn't | Unverified | Needs investigation — the observed behavior is that navigating to `/admin?lang=en` redirects to `/admin/sign-in` without the `?lang=en`. Likely the proxy/middleware or `requireFacilitatorPageAccess` strips it. Investigation task in Phase 3. |
| Current Playwright tests don't depend on the specific `rounded-[18px]` / `rounded-[24px]` values | Assumed | Tests assert copy and roles, not Tailwind class names — but selectors could break. Verify in each PR. |
| Workshop facilitators genuinely use iPad as the primary device | Verified | Documented doctrine in `2026-04-08-fix-dashboard-design-system-audit-remediations-plan.md`: "iPad first, phone acceptable, desktop expansive but secondary." |
| Tier 2 compactions don't conflict with any content owned by tests in `page.test.tsx` | Verified by review | The cockpit PR passed all 9 tests; the same test assertions apply (copy strings like `controlRoomBack`, `navAgenda`, etc.). Phase 2 must preserve the same contract. |

Unverified assumptions become Phase-scoped investigation tasks below.

## Risk Analysis

| Risk | Likelihood | Severity | Mitigation |
|---|---|---|---|
| Visual regression on a Phase-2 compaction (something looks broken on iPad portrait) | Medium | Medium | Ship each Phase-2 surface as its own PR; manual verification at 834 / 1194 / 1440 per PR; keep screenshots in `docs/previews/`. |
| Phase-3 radii sweep touches many files and a test selector silently breaks | Medium | Low | Per-concern commits (one commit for radii, one for tracking, one for breakpoints, one for panel-class centralization). Run the full Vitest + Playwright suite between commits. |
| `InlineSpinner` needs different markup than the internal `SubmitButton` spinner, causing two visual styles of spinner in the same UI | Low | Low | Extract the current `SubmitButton` spinner span into the shared `InlineSpinner` and have `SubmitButton` use it internally. Single source of truth. |
| The sign-in `?lang` fix requires touching the proxy, which is shared with participant auth | Medium | Medium | Investigation task in Phase 3 determines scope before code change. If the fix requires proxy changes, split into its own PR with targeted regression tests on participant auth redirect. |
| A previously-green e2e test now fails because a hero got smaller and scroll position changed | Low | Low | Run full Playwright before each phase commit. Fix in-place. |
| Phase 3 demotes `2xl:` to `xl:` and a desktop-only layout now activates at 1280px where it looks bad | Low | Low | Per-file visual check at 1280 during the demotion commit. Roll back that specific demotion if content crowds. |
| Scope creep pulls Tier 4 items (presenter, sheets) into this plan mid-flight | Medium | Low | Acceptance criteria explicitly exclude Tier 4 surfaces. Any "while I'm here" temptation is a followup plan. |

## Phased Implementation

### Phase 1 — Submit feedback (one PR)

**Exit criteria:** every form in the `In scope` list shows a pending indicator within 100ms of click; Playwright test for name-prompt spinner passes; full test suite green.

Tasks below.

### Phase 2 — Cockpit-pattern compactions (three PRs, one per surface)

**Exit criteria:** each target surface's top chrome is ≤220px at iPad landscape (1194×834); no `text-5xl` hero survives in the three targets; test suite green.

Tasks below.

### Phase 3 — Design-system drift sweep (one PR with per-concern commits)

**Exit criteria:** grep for `rounded-\[18px\]`, `rounded-\[24px\]`, `rounded-\[34px\]` returns zero hits outside explicit design-system-docs; `tracking-\[0.18em\]` on eyebrow labels is removed or justified; sign-in preserves `?lang`; new design-system-docs subsections committed.

Tasks below.

## Implementation Tasks

Checkboxes are dependency-ordered within each phase. Commit boundaries marked `⎘`.

### Phase 1 — Submit feedback

- [x] Create `dashboard/app/components/inline-spinner.tsx`: client component. Props: `active: boolean`, optional `className`. Renders a single `<span>` — when `active`, a `h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent` with `aria-hidden="true"`; when inactive, returns `null`. Mirrors the exact markup currently inlined in `submit-button.tsx`.
- [x] Refactor `dashboard/app/components/submit-button.tsx` to use `<InlineSpinner active={pending} />` internally. No visual change.
- [x] Also refactor `dashboard/app/admin/admin-submit-button.tsx` to use the shared spinner (single source of truth).
- [x] Swap raw `<button type="submit">` at `dashboard/app/components/participant-identify-prompt.tsx:51-56` for `<SubmitButton>`. **This fixes the reported bug.**
- [x] Add `<InlineSpinner active={isPending} />` before label text in the submit button at `dashboard/app/components/participant-check-in-form.tsx:159-165`.
- [x] Replace the `…` ellipsis with `<InlineSpinner active />` in `dashboard/app/admin/instances/[id]/_components/inline-field.tsx:150-152`.
- [x] Replace the `…` ellipsis with `<InlineSpinner active />` in `dashboard/app/admin/instances/[id]/_components/agenda/add-agenda-item-row.tsx:121-124`.
- [x] Replace the `…` ellipsis with `<InlineSpinner active />` in `dashboard/app/admin/instances/[id]/_components/agenda/add-scene-row.tsx:123-126`.
- [x] Add `<InlineSpinner active={pending} />` inline in each client-action button in `dashboard/app/admin/instances/[id]/_components/sections/people-section-client.tsx` (consent toggle, remove, unassign).
- [x] Add `<InlineSpinner active={loading || pending} />` inline in the three async buttons (preview, re-roll, commit) in `dashboard/app/admin/instances/[id]/_components/sections/people-randomize.tsx:141, 200, 208`.
- [x] Write one Playwright test (`dashboard/e2e/participant-submit-feedback.spec.ts`): observes `aria-busy` and spinner visibility via in-page MutationObserver to avoid racing Playwright's polling loop.
- [x] Run `pnpm test` (356 passed) and `pnpm exec playwright test` (59 passed) — all green.
- [ ] ⎘ Commit to `main`: `fix: add pending-state feedback to form submits across dashboard`.

### Phase 2 — Cockpit compactions

Apply the same pattern as `control-room-cockpit.tsx` to three more surfaces.

#### 2a. Admin workspace landing

- [ ] Read `dashboard/app/admin/page.tsx` in full; identify the hero block (around L223) and the `WorkspacePulseStat` summary block (around L263–278).
- [ ] Design the collapsed panel structure: single `rounded-[28px]` with compartments for (title + eyebrow + controls row), (instance-count + filter-entry meta row), (pulse stats context strip 4-col/2-col/1-col). Mirror `control-room-cockpit.tsx` layout tokens.
- [ ] Create `dashboard/app/admin/_components/workspace-cockpit.tsx` (new client-less component). Accept the same inputs the current inline hero + summary consume.
- [ ] Update `dashboard/app/admin/page.tsx` to render `<WorkspaceCockpit />` instead of the current hero + summary stack. Remove the now-dead `WorkspacePulseStat` usage at the top level (keep the component — may be reused elsewhere).
- [ ] Manual check at 1440 / 1194 / 834 / 640 — panel height ≤220 on lg+; content doesn't break.
- [ ] Update `dashboard/app/admin/page.test.tsx` if any assertions break on the new structure.
- [ ] Full test suite green.
- [ ] ⎘ Commit: `refactor: compact admin workspace landing into cockpit panel`.

#### 2b. Run-section hero + persistent summary column

- [ ] Read `dashboard/app/admin/instances/[id]/_components/sections/run-section.tsx:91-167` and the 3-card `ControlRoomPersistentSummary` column.
- [ ] Decision: the cockpit already carries active-instance / current-phase / participant-surface / teams. The run-section summary column duplicates these. Remove the summary column entirely; hero becomes full-width with smaller title.
- [ ] Replace hero `adminHeroPanelClassName + text-[1.85rem] sm:text-3xl` with `rounded-[28px] + text-xl sm:text-2xl lg:text-[26px] xl:text-[28px]` to match the cockpit. Keep the four action buttons. Drop the hero's descriptive body paragraph.
- [ ] Verify `page.test.tsx` still asserts `liveNow`, `nextUp`, `presenterOpenParticipantSurfaceButton`, `agendaMoveLiveHereButton` — these must stay present.
- [ ] Manual check at iPad landscape (1194) / iPad portrait (834): hero + timeline + signals fit without duplicating info already in the cockpit above.
- [ ] Full test suite green.
- [ ] ⎘ Commit: `refactor: collapse run-section hero and remove duplicate persistent summary`.

#### 2c. Agenda-section hero (detail and index modes)

- [ ] Detail mode (`dashboard/app/admin/instances/[id]/_components/sections/agenda-section.tsx:125-247`): hero title drops to `text-2xl sm:text-3xl lg:text-[28px]`. The three-tile `InlineField` block for time / goal / roomSummary collapses to a single compact row of inline editable fields matching the cockpit meta row pattern. Keep "open in presenter" + "move live here" buttons visible.
- [ ] Index mode (`sections/agenda-section.tsx:326-353`): same treatment as run-section — remove the summary column duplicating cockpit info; hero shrinks to a compact single-panel header with the agenda list below.
- [ ] Verify `page.test.tsx` still asserts `agendaTimelineTitle`, `agendaRunnerTitle`, `agendaRunnerSayTitle`, `agendaRunnerShowTitle`, `presenterOpenParticipantSurfaceButton`, `agendaJumpToLiveButton`, the Czech `Úvod a\u00a0naladění`, and `13:30 • Rotace týmů`.
- [ ] Manual check at iPad landscape / portrait: detail mode fits without losing the stage-rail + workbench context.
- [ ] Full test suite green.
- [ ] ⎘ Commit: `refactor: compact agenda-section hero in detail and index modes`.

### Phase 3 — Design-system drift sweep

#### 3a. Investigation tasks (verify unverified assumptions)

- [ ] Navigate `http://localhost:3003/admin?lang=en` and capture the redirect chain (`curl -I` or Network panel). Confirm `?lang=en` gets stripped; identify whether proxy, middleware, or `requireFacilitatorPageAccess`'s `redirect("/admin/sign-in")` drops it.
- [ ] Take an iPad-landscape (1280) screenshot of each surface that currently uses `2xl:grid-cols-*`: `access-section`, `teams-section`, `signals-section`. Confirm the demotion to `xl:` will produce a reasonable layout at 1280.

#### 3b. Radii unification

- [ ] Grep for `rounded-\[18px\]` across `dashboard/app/**/*.tsx`. Audit each: assign to tile (20) or card (22) by role. Apply replacements file-by-file.
- [ ] Grep for `rounded-\[24px\]`. Assign to panel (28) or card (22). Apply.
- [ ] Grep for `rounded-\[34px\]`. Replace with `rounded-[28px]`.
- [ ] Grep for `rounded-\[10px\]`, `rounded-\[12px\]`, `rounded-\[14px\]` in `people-section-client.tsx` and `scene-stage-rail.tsx`. Audit; assign to correct tier.
- [ ] ⎘ Commit: `chore: unify design-system radii to 16/20/22/28 tiers`.

#### 3c. Typography tracking

- [ ] Grep for `tracking-\[0.18em\]` on eyebrow-style labels (`text-[10–11px] uppercase`). Change to `tracking-[0.28em]` unless the element is a utility row (language switcher, theme controls) where `0.18em` is intentional.
- [ ] Grep for `tracking-\[-0.05em\]` on headings. Change to `tracking-[-0.04em]` unless the element is the public-landing hero where stylistic tightness is intentional.
- [ ] ⎘ Commit: `chore: align eyebrow and heading tracking to design-system spec`.

#### 3d. Breakpoint demotion

- [ ] In `access-section.tsx:76, 149, 182`: change `2xl:grid-cols-*` → `xl:grid-cols-*`. Verify at 1280 and 1440.
- [ ] In `teams-section.tsx:66`: same change. Verify.
- [ ] In `signals-section.tsx:32`: same change. Verify.
- [ ] ⎘ Commit: `refactor: demote 2xl layouts to xl so iPad landscape benefits`.

#### 3e. Shared class centralization

- [ ] Extract a new `adminCardSurfaceClassName` constant in `dashboard/app/admin/admin-ui.tsx` matching the `ControlCard` surface style at `admin-ui.tsx:42`.
- [ ] Delete local `panelSurface` and `cardSurface` constants in `dashboard/app/admin/instances/[id]/_components/sections/people-section-client.tsx:12-17`. Import from `admin-ui` instead.
- [ ] ⎘ Commit: `refactor: centralize admin panel and card surface classes`.

#### 3f. Outer grid gap

- [ ] Audit `app/admin/page.tsx` and other top-level `gap-6` usages against the cockpit's `gap-4 sm:gap-5` rhythm. Align where the surrounding layout matches.
- [ ] ⎘ Commit: `chore: align outer grid gap with cockpit rhythm`.

#### 3g. Sign-in fixes

- [ ] Investigate the `?lang` drop root cause (from 3a). Apply the minimal targeted fix — likely `redirect(withLang("/admin/sign-in", lang))` at the source that strips it, or `withLang` in the proxy's sign-in redirect.
- [ ] Add `rounded-[28px]` to the two sign-in cards at `dashboard/app/admin/sign-in/page.tsx:119, 194`.
- [ ] Apply `adminInputClassName` (has `rounded-[16px]`) to the inputs at L152, L170, L218.
- [ ] Apply `adminPrimaryButtonClassName` to the primary submit button at L186; `adminSecondaryButtonClassName` or similar to L228.
- [ ] Apply `rounded-[18px]` → `rounded-[20px]` to any status/error banner tiles on the page.
- [ ] Full test suite green.
- [ ] ⎘ Commit: `fix: preserve ?lang on sign-in and round sign-in cards`.

#### 3h. Design-system docs

- [ ] Add a "Radii tiers" subsection to `dashboard/docs/dashboard-design-system.md` (or the actual design-system doc — check path). Specify: inputs 16, tiles 20, cards 22, panels 28, pills full. Reference `control-room-cockpit.tsx` as the canonical example.
- [ ] Add a "Breakpoint doctrine" subsection naming iPad portrait (834) as `sm→md`, iPad landscape (1194) as `lg`, desktop (1280+) as `xl`, large desktop (1536+) as `2xl`. Rule: any layout change gated on `2xl` must be justified because the primary audience is iPad.
- [ ] ⎘ Commit: `docs: add radii tiers and breakpoint doctrine to design system`.

### Phase 4 — Verification + wrap

- [ ] Full `pnpm test` green.
- [ ] Full `pnpm exec playwright test` green on desktop Chrome.
- [ ] Manual iPad landscape and portrait pass on each touched surface (landing, participant flow, workspace, control room, run, agenda detail + index, access, settings, sign-in).
- [ ] `/compound` each slice if any non-obvious learnings came out of it.

## Acceptance Criteria

- [ ] Clicking the Continue button on the participant name prompt shows a visible spinner within 100ms, with `aria-busy="true"` on the button. Playwright asserts this.
- [ ] Every form submit in the `dashboard/app/` tree either uses `SubmitButton` or renders `<InlineSpinner active={...} />` before the label. No raw `<button type="submit">` inside server-action forms outside `admin-submit-button.tsx` and the two spinner-bearing components themselves.
- [ ] `app/admin/page.tsx`, `run-section.tsx`, and `agenda-section.tsx` each have a top chrome of ≤220px at iPad landscape (1194×834). No `text-5xl` hero survives in these three.
- [ ] `rg "rounded-\[(18|24|34|10|12|14)px\]" dashboard/app` returns zero matches outside design-system documentation files.
- [ ] `rg "tracking-\[0\.18em\]" dashboard/app` returns zero matches on elements with an eyebrow role (`text-[10-11px] uppercase`).
- [ ] `rg "2xl:grid-cols" dashboard/app` returns zero matches except where explicitly justified in a comment.
- [ ] `people-section-client.tsx` imports `adminPanelSurfaceClassName` from `admin-ui` and defines no local surface constant.
- [ ] Navigating to `/admin?lang=en` → sign-in preserves the `?lang=en` query string; sign-in page renders in English.
- [ ] Sign-in cards, inputs, and primary button have rounded radii matching the design system.
- [ ] `dashboard/docs/dashboard-design-system.md` (or equivalent path) gains a "Radii tiers" and a "Breakpoint doctrine" subsection.
- [ ] All Vitest and Playwright tests pass.

## References

- **Today's cockpit work** (canonical pattern for Phase 2): `dashboard/app/admin/instances/[id]/_components/control-room-cockpit.tsx` (new), commit `f639ed9`.
- **Complementary plan on navigation loaders**: `docs/plans/2026-04-14-feat-dashboard-motion-loaders-and-design-system-plan.md` — handles `<Link>` / `<a target="_blank">` buttons, disjoint from this plan's form-submit scope.
- **Prior facilitator revamp** (context): `docs/plans/2026-04-19-refactor-facilitator-ui-revamp-plan.md` (complete). Cockpit redesign is the capstone of that plan.
- **iPad-first doctrine**: `docs/plans/2026-04-08-fix-dashboard-design-system-audit-remediations-plan.md` (in progress; tasks all done).
- **Existing submit patterns** to reuse:
  - `dashboard/app/components/submit-button.tsx` (useFormStatus-based)
  - `dashboard/app/admin/admin-submit-button.tsx` (same, admin variant)
  - `dashboard/app/admin/admin-route-link.tsx` (useTransition-based, proof that external-prop-driven spinner works)
- **Review raw findings** (Tier 1 / 2 / 3 detail):
  - Submit-feedback audit — run 2026-04-19 by codebase-analyzer; see conversation transcript.
  - Design/UX audit — run 2026-04-19 by codebase-analyzer; see conversation transcript.
