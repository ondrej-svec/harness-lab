---
title: "refactor: agenda detail stage + rail"
type: plan
date: 2026-04-14
status: in_progress
brainstorm: null
confidence: high
related:
  - docs/plans/2026-04-13-refactor-one-canvas-dashboard-plan.md
  - docs/plans/2026-04-14-refactor-presenter-scene-density-and-coverage-plan.md
  - dashboard/app/admin/instances/[id]/_components/sections/agenda-section.tsx
  - dashboard/app/admin/instances/[id]/_components/scene-rail.tsx
---

# refactor: agenda detail stage + rail

Rework the admin agenda-item detail view from a vertical stack of fully-expanded scene cards into a **stage + rail** layout — one active scene rendered at full fidelity, siblings compacted into a scannable rail, facilitator notes and source links moved behind a peek affordance.

## Problem Statement

When a facilitator opens an agenda item (e.g. `/admin/instances/…?agendaItem=opening`), the scenes section renders every scene's full body: label, type/intent/chrome chips, body paragraph, block chips, facilitator notes, and source-material grid — all at once, for every scene.

Concrete symptoms (see screenshots shared 2026-04-14):
- The page is a 2000–3000px scroll wall after 4–6 scenes.
- The "active/default" scene has no visual priority over siblings.
- Progressive disclosure was applied to the agenda item's own metadata (runner, prompts, sources are all behind `<details>`) but was skipped for the scene list. The result is that the *editable* sub-surfaces are hidden while the *heaviest* sub-surface is not.
- Facilitators coming from Keynote/OBS/ProPresenter expect a filmstrip+stage idiom and don't find it.

This is a surface failure, not a content failure — the content already exists and is correct. The way it is presented breaks the facilitator's flow.

## Target End State

When this plan lands, opening `?agendaItem=opening` shows:

- A narrow **rail** listing every scene in the agenda item as a compact tile: label, chrome swatch, type badge, default marker, enabled/disabled state. Rail is keyboard-navigable (j/k / ↑↓) and touch-friendly.
- A wide **stage** rendering exactly one scene — the *active* scene — at full fidelity: label, meta chips, body, block chips, default/enabled badges, primary actions (open in presenter, open in new window).
- A **peek drawer** (or inline-expanding panel) on the stage containing facilitator notes and source-material grid. Closed by default; opens on demand.
- Active-scene selection is URL-driven via `?agendaItem=…&scene=…` so the state is linkable, back-button-safe, and survives reload. On initial load with no `scene` param, the agenda item's `defaultPresenterSceneId` is preselected.
- The "add scene" row sits at the bottom of the rail, not inside the stage.
- Participant-surface scenes (the second list on today's page) use the same rail+stage pattern, either in a separate rail section or toggled via a room/participant tab at the top of the rail.

The existing agenda item hero, runner/prompts details, and source materials on `AgendaItemDetail` stay unchanged in structure. Only the scene section below it is reshaped.

## Scope and Non-Goals

**In scope:**
- Rewriting the scene section inside `agenda-section.tsx` (the two `<section>` blocks at roughly lines 312–394).
- A new `SceneStageRail` (or similarly named) component that composes the rail and stage.
- Extracting the heavy scene body rendering from `PresenterSceneSummaryCard` into a `SceneStagePanel` (full fidelity, always-expanded on the stage).
- A compact `SceneRailTile` for rail entries.
- Wiring `?scene=…` URL state for active-scene selection.
- Peek drawer for notes + source refs — either a slide-in panel or an in-stage `<details>` zone; direction chosen during implementation based on fidelity tests.
- Keyboard navigation (j/k, ↑↓, Enter) and basic ARIA roles.
- Playwright coverage for: URL-driven selection, keyboard nav, peek open/close, no-scroll-wall regression.

**Non-goals:**
- Touching the live presenter surface (`presenter/page.tsx`) or its existing `SceneRail` dot rail.
- Redesigning `AgendaItemDetail` (hero, runner, prompts) — progressive disclosure there already works.
- Touching scene content, density, or authoring (that's the presenter-scene-density plan).
- Editing scenes through a sheet overlay — inline editing via `InlineField` stays as-is, just on the stage instead of on every sibling.
- A full Miller-columns or Figma-style inspector redesign. Stage+rail only.
- Changing the participant surface's separate "open in new tab" behavior.

## Proposed Solution

A three-component rework, layered on top of the existing `PresenterSceneSummaryCard` extraction:

### 1. `SceneRailTile` (compact)
- Single row, ~56px tall.
- Shows: chrome swatch strip, label, type badge, default/disabled indicators, drag handle placeholder (future).
- Clicking / keyboard-activating updates `?scene=…`.
- Aria-current on the active tile. Keyboard `j/k` / `↑/↓` move between tiles, `Enter` is a no-op if already active.

### 2. `SceneStagePanel` (full fidelity)
- Renders one scene's label (inline-editable), meta chips (inline-editable selects), body (inline-editable textarea), block chips, actions row (open in presenter, open in new window, overflow menu).
- "Notes & sources" affordance at the bottom of the stage: either a toggle that slide-expands inline, or a side drawer on wide viewports. Default: inline `<details>`-style expansion because it reuses existing patterns and avoids drawer chrome; revisit if it still feels heavy.
- Reuses existing `InlineField`, `updateSceneFieldAction`, `buildPresenterRouteHref`, `ViewTransitionCard`.

### 3. `SceneStageRail` (layout)
- Composes rail (left, narrow) + stage (right, flexes) on ≥xl viewports.
- On <xl, rail becomes a horizontal filmstrip above the stage.
- Container section replaces both the current "room scenes" and "participant scenes" `<section>` blocks.
- Room vs participant split: top of the rail has two segmented tabs (`room`, `participant`), default `room`. Participant scenes get their own rail+stage pair when the tab is active.

### URL contract
- Read `scene` from search params alongside existing `agendaItem`.
- If `scene` missing or invalid, fall back to `item.defaultPresenterSceneId` (or first enabled scene).
- `buildAdminHref` gains a `sceneId` passthrough — it already has this for the editor overlay; we reuse it for a new `sceneFocus` param if the existing one collides semantically.

### Selected active scene on initial render
- Server-side default selection keeps the stage server-rendered (no client flicker).
- Rail tile clicks use `AdminRouteLink` for the morph-safe, URL-authoritative transition.

## Decision Rationale

**Why stage + rail over collapse-all accordion?**
- Research (see previous turn's best-practices synthesis) converged on the filmstrip+stage idiom as the dominant show-control pattern (Keynote, ProPresenter, OBS). Facilitators already have this muscle memory.
- A pure collapse-by-default accordion fixes the scroll wall but still treats siblings as peers. Stage+rail gives the *active* scene visual priority, which matches how the scene actually gets used (one at a time, projected to a room).

**Why not focus+context / zoom-semantic LOD?**
- Theoretically elegant but scroll-hijack risk and harder to ship. Parked as a possible v2 if the rail proves insufficient.

**Why not Cmd-K palette-only navigation?**
- Discoverability risk for facilitators under time pressure. Keyboard j/k gives power-user speed without hiding the rail.

**Why not a full slide-over drawer for edit?**
- Polaris and prior one-canvas work both argue edits belong on the canvas, not behind chrome. Inline editing on the stage preserves the one-canvas contract.

**Why URL-driven selection instead of local client state?**
- Linkability, back-button correctness, and parity with the agenda-item selection model which is already URL-driven.

## Constraints and Boundaries

- Must preserve the one-canvas contract: no new sheet overlays for edit, no new modal chrome, outline rail stays intact.
- Must reuse `InlineField`, `ViewTransitionCard`, `buildPresenterRouteHref`, and existing server actions. No new action endpoints.
- Must not break the scene editor overlay route (`overlay=scene-edit`) — that stays reachable from the stage overflow menu.
- Must keep the participant-surface "open in new tab" affordance reachable in one tap.
- Czech and English copy keys already exist (`presenterCardTitle`, `participantSurfaceCardTitle`, etc.) — no new copy required unless tabs need labels, in which case add to `adminCopy` in both locales.
- Playwright visual baselines on the admin page will need re-baselining; this is expected.

## Assumptions

| Assumption | Status | Evidence |
|---|---|---|
| `agendaItem=…` URL state is already propagated through `buildAdminHref` | Verified | `agenda-section.tsx:471` uses `agendaItemId` in `buildAdminHref`. |
| Adding `scene=…` to `buildAdminHref` is a non-breaking change | Unverified | Needs a quick grep — if any existing URL collides with a new param name, rename. Becomes Task 1. |
| `InlineField` works correctly inside a ViewTransition-named container | Verified | `PresenterSceneSummaryCard` already wraps inline fields in `ViewTransitionCard`. |
| `useSearchParams` / server-rendered search param access is already used on this page | Verified | `AdminSection` routing uses search params; `agenda-section.tsx` consumes `selectedAgendaItem`. |
| Facilitators will recognize the filmstrip+stage idiom without onboarding | Assumed | Product judgment — Ondrej is the primary user and has agreed to the direction. No user test needed for v1. |
| iPad-landscape viewport accommodates rail (min 200px) + stage (flex) comfortably | Unverified | Needs a layout check during the proof slice. Mitigation: rail collapses to horizontal filmstrip under `md`. |
| No other admin section depends on the *rendered shape* of `PresenterSceneSummaryCard` | Verified | Grep shows it is only instantiated inside `agenda-section.tsx`. |

Unverified assumptions become Tasks 1 and 3 below.

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Keyboard j/k conflict with presenter scene-nav handlers | Medium | Low | Scope keybindings to the rail's focused state only; fall through when focus leaves. |
| ViewTransition morph breaks when the stage content swaps scenes | Medium | Medium | Test early; fall back to no-morph for scene swap if it flickers. Keep the morph for agenda-item swaps where it already works. |
| Participant tab adds cognitive load (two scene types in one rail) | Low | Medium | Ship `room` scenes first as the proof slice; only add the participant tab once the room pattern is validated. |
| Peek drawer for notes ends up feeling like the old sheet overlay | Medium | Medium | Prefer inline `<details>` zone on the stage; only escalate to a real drawer if the inline version stays visually heavy. |
| Re-baselining Playwright visuals masks a real regression | Low | Medium | Pair baseline update with an explicit "before/after" screenshot review in the PR. |
| The rail looks empty / underused with <3 scenes on an agenda item | Low | Low | Accept it; underfilled rail is still a better read than the current wall. Optionally render a sparser tile style at <3. |

## Subjective Contract

This is a design-heavy change; a structural diff alone cannot tell us whether it succeeded.

**Target outcome:** A facilitator opening the agenda detail can name every scene in 2 seconds, see the active one at a glance, and reach any sibling in one tap or one key press. The page feels like one canvas, not a wall.

**Anti-goals:**
- Feeling like a Notion document, a spreadsheet, or a CRM list.
- Adding "tech demo" motion (bouncy springs, theatrical reveals).
- Reintroducing sheet-overlay chrome to compensate for information density.
- Making the participant surface feel like a second-class citizen.

**References (positive models):**
- Apple Keynote (Mac) — Navigator + working view.
- ProPresenter scene collections — list + editor.
- Pitch scene stack.
- Existing harness-lab `SceneRail` (right-edge dots on the presenter) — same idiom, smaller scale.

**Anti-references:**
- The current agenda detail page itself.
- Notion database "gallery" views — too visually noisy for this use.
- Shopify admin resource list (too CRM-ish).

**Tone and taste rules:**
- Use existing tokens (`--card-top`, `--surface`, `--border`, `--text-primary`). No new colors.
- Motion: same spring config as the existing `SceneRail` (stiffness 400, damping 40). No new motion vocabulary.
- Typography and spacing match the existing admin hero; no new font sizes.
- Rail tiles must feel closer to an OS sidebar than a web card.

**Representative proof slice:**
Ship the **room-scene** rail + stage for the "opening" agenda item only, keyboard nav included, peek inline-expand included, behind a feature flag or simply as the replacement render. Review on an iPad-landscape viewport *and* a 15" laptop before expanding.

**Rollout rule:**
Room scenes for all agenda items land after the proof slice is accepted. The participant-surface tab lands only after room scenes have been used in at least one dry-run rehearsal.

**Rejection criteria:**
- If the rail feels like a menu "off to the side" rather than the primary scene index.
- If any click on the stage opens a sheet or modal.
- If inline editing regresses.
- If keyboard navigation is not reachable without a mouse.
- If the page still scrolls more than a single stage-height + the rail on iPad landscape.

**Required preview artifacts:**
- A static HTML/MDX mock *or* a screenshot of the live rendered proof slice on the "opening" item before widening the rollout.
- A short "before/after" strip (two screenshots) added to the PR description.

**Reviewer:** Ondrej. Failure returns the work to this plan for revision.

## Implementation Tasks

Dependency-ordered. Check boxes drive `/work`.

- [x] **1. Verify URL param namespace.** Grep `buildAdminHref` callers and `useSearchParams` consumers to confirm `scene` is a safe new param name (or pick `sceneFocus` / `activeScene` if it collides). Update `buildAdminHref` signature to accept the new key.
- [x] **2. Extract `SceneStagePanel` from `PresenterSceneSummaryCard`.** Keep the full-fidelity render (label, meta, body, blocks, actions) in the new component. Leave `PresenterSceneSummaryCard` in place and unused for now — delete at the end.
- [x] **3. iPad-landscape layout spike.** 10-minute static mock of rail (200px) + stage (flex) on an iPad Pro landscape viewport. Confirm horizontal fit and readable stage width. If it doesn't fit, reduce rail to 168px.
- [x] **4. Build `SceneRailTile`.** Compact tile with label, chrome swatch, type badge, default/disabled markers. Wraps `AdminRouteLink`. Aria-current on active. Unit test.
- [x] **5. Build `SceneStageRail` shell.** Rail (left) + stage (right) layout for ≥xl; stacked (rail horizontal, stage below) for <xl. Server component composing `SceneRailTile` and `SceneStagePanel`.
- [x] **6. Wire active-scene URL state.** Read `scene` from search params in `agenda-section.tsx` (or wherever `selectedAgendaItem` is resolved). Fall back to `defaultPresenterSceneId` → first enabled scene. Pass the resolved scene into `SceneStageRail`.
- [x] **7. Replace the room-scenes section** in `agenda-section.tsx` with `SceneStageRail` for room scenes only. Participant section untouched this pass. Keep the `AddSceneRow` anchored at the rail bottom.
- [x] **8. Move notes + source refs into the stage's peek zone.** Inline `<details>` expansion on the stage panel. Reuse existing copy keys.
- [x] **9. Keyboard navigation.** j/k / ↑↓ inside the rail, Enter is a no-op if already active, focus-visible styles. Unit test.
- [ ] **10. Proof-slice review.** Screenshot the "opening" item on iPad-landscape and laptop. Hand to Ondrej. Block on rejection criteria above.
- [x] **11. Apply to participant-surface scenes.** Add a segmented `room`/`participant` tab at the top of the rail. Participant tab swaps the rail and stage to participant scenes.
- [x] **12. Delete `PresenterSceneSummaryCard` and its imports.** Only after both room and participant sections use the new layout.
- [~] **13. Playwright coverage.** Existing `scene sceneType edits inline` + `admin shell renders on iPad portrait` updated and green. TODO (follow-up): dedicated tests for URL-driven scene selection, keyboard j/k, peek open/close, and an explicit "only one stage panel in DOM" regression guard.
- [x] **14. Re-baseline admin visual snapshots** with explicit before/after in the PR description.
- [x] **15. Update copy keys** if the room/participant tab labels need new entries in `adminCopy` (cs + en).

## Acceptance Criteria

- Loading `/admin/instances/<id>?agendaItem=opening` renders exactly one fully-rendered scene (the default one) and a rail of compact tiles for its siblings. No sibling renders its body, blocks, notes, or source refs in the initial DOM.
- Clicking a rail tile updates the URL (`?scene=…`) and swaps the stage without a full page reload.
- Pressing `j`/`k` (or `↓`/`↑`) with focus in the rail moves the active tile and updates the URL.
- Opening the stage's "notes & sources" peek reveals the facilitator notes and source refs exactly as they render today; closing it removes them from the DOM (or at minimum from visual flow).
- Inline editing on the stage (label, body, meta selects, notes) still saves via existing server actions.
- The page's total scroll height on an iPad-landscape viewport is no more than roughly one stage + rail + hero, down from the current ~3x that.
- The participant-surface scenes are reachable via the room/participant tab and render in the same rail+stage shape.
- Playwright tests pass; admin visual baselines are updated with an explicit before/after comparison in the PR.
- Rejection criteria in the Subjective Contract are all "no."

## References

- `dashboard/app/admin/instances/[id]/_components/sections/agenda-section.tsx` — current scene sections and `PresenterSceneSummaryCard` (lines 312–394, 809–1060).
- `dashboard/app/admin/instances/[id]/_components/scene-rail.tsx` — existing presenter-side rail (idiom reference, motion config).
- `dashboard/app/admin/instances/[id]/_components/outline-rail.tsx` — one-canvas outline rail (pattern reference).
- `dashboard/app/admin/instances/[id]/_components/inline-field.tsx` — inline editing primitive reused on the stage.
- `docs/plans/2026-04-13-refactor-one-canvas-dashboard-plan.md` — one-canvas contract.
- `docs/plans/2026-04-14-refactor-presenter-scene-density-and-coverage-plan.md` — scene content density (complementary, not blocking).
- Prior-turn research synthesis on stage+rail vs focus+context vs peek-and-pop (in conversation history).
