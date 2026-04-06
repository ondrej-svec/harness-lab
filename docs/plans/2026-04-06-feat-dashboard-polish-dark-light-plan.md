---
title: "feat: dashboard polish — system dark/light + review fixes"
type: plan
date: 2026-04-06
status: complete
brainstorm:
confidence: high
---

# Dashboard Polish — System Dark/Light + Review Fixes

Make the Harness Lab dashboard feel intentionally excellent: minimal, high-taste, system-aware dark/light across all three surfaces, with concrete UX fixes from the initial code + visual review.

## Problem Statement

The dashboard already has a strong visual identity — bold lowercase type, tight tracking, sharp corners, clean public/participant/facilitator separation. But a visual + code review uncovered:

1. **Styling contradictions:** CSS root declares dark background (`#0c0a09`) while pages use `bg-white`. Causes flash on load.
2. **Font not loaded:** `Space Grotesk` declared in CSS but never imported. Typography falls through to OS-dependent fallbacks.
3. **Context-blind navigation:** participant view still shows public-page anchor links that scroll nowhere after login.
4. **Meta-commentary in hero:** second paragraph reads like an internal design brief, not participant-facing copy.
5. **Admin readability issues:** rotation cards use dark-theme colors on a light background (invisible text). Mixed border-radius breaks visual consistency.
6. **No dark mode:** the design has a natural dark personality (see the black access card, the dark CSS vars) but no system-aware theming.
7. **Selection color broken:** gold selection with white text is unreadable on white backgrounds.

## Proposed Solution

System-aware `prefers-color-scheme` dark/light mode across all three surfaces (public, participant, admin), combined with targeted UX fixes from the review. No manual toggle — respect the OS setting.

## Decision Rationale

### Why system-aware, no manual toggle

- Workshop participants scan a QR code on their phone. The phone already has a color scheme preference.
- Adding a toggle adds UI surface, client-side state, and cookie management for zero practical benefit in a one-day workshop.
- System preference is the correct default for a tool that should just work.

### Why theme all three surfaces (including admin)

- Facilitators also have system preferences. A light-only admin surface feels inconsistent if the rest respects the OS.
- The warm parchment admin identity can translate to a warm dark tone without losing its distinctiveness.
- Full consistency costs ~25 minutes more than skipping admin — worth it for a workshop that teaches design discipline.

### Why fix UX issues in the same pass

- The token system refactor touches every file anyway. Combining theme work with review fixes avoids two separate passes through the same components.
- Several review issues (background flash, selection color, admin card contrast) are directly solved by proper theming.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| Tailwind v4 supports `dark:` via `prefers-color-scheme` out of the box | Verified | Tailwind 4.2.2 installed; no config needed for media-based dark mode |
| `next/font/google` is available and self-hosts fonts | Verified | Next.js 15.5.14 installed; `next/font` is the standard approach |
| The black access card on the public page can invert cleanly for dark mode | High confidence | The card is already a color-inverted element; swapping black↔white preserves the visual weight |
| Admin warm parchment has a natural dark equivalent | High confidence | `#f5f1e8` → warm dark like `#1a1814` preserves the tone without fighting the dark palette |
| No client JS is needed for system dark mode | Verified | CSS `prefers-color-scheme` + Tailwind `dark:` utilities are fully server-renderable |

## Risk Analysis

### Risk: Dark mode feels like an inverted afterthought

If tokens are not defined first and components are themed ad-hoc, dark mode will have inconsistent contrast and feel bolted on.

Mitigation: Phase 1 establishes all semantic tokens before any component work begins. Components consume tokens, never raw colors.

### Risk: Over-designing the admin surface

Admin should stay operational and fast. If dark mode polish turns admin into a design showcase, it loses its purpose.

Mitigation: Admin theming focuses on readability and consistency, not ornament. No new visual elements.

### Risk: Hero copy changes lose workshop identity

Removing the meta paragraph could make the hero too generic.

Mitigation: Replace with a single line that speaks to the practitioner identity without explaining the page's own architecture.

### Risk: Breaking existing e2e tests

Theme changes touch every visual element. Existing Playwright selectors target text content and roles, not colors, so they should survive — but any layout shift could break visibility assertions.

Mitigation: Run existing e2e suite after each phase. Add dark-mode-specific screenshot checks in Phase 5.

## Scope

### In scope

- System dark/light mode via `prefers-color-scheme` across public, participant, and admin surfaces
- Font loading via `next/font/google` (Space Grotesk)
- Semantic CSS token system (light + dark)
- Fix background flash (CRIT-1)
- Fix context-blind participant nav (CRIT-3)
- Fix admin rotation card contrast (SUG-4)
- Normalize admin border-radius (SUG-5)
- Fix selection color for both themes (SUG-7)
- Remove hero meta-commentary (SUG-1)
- Rewrite participant view copy to be action-oriented (SUG-2)
- Fix Czech diacritics in error messages (OBS-4)
- Verification: lint, build, existing e2e, visual spot-check in both themes

### Out of scope

- Manual dark/light toggle
- Per-team personalized participant access (requires data model change)
- New product features or pages
- Redesigning auth or data models
- Admin ornamental polish beyond readability and consistency

## Color Token System

### Semantic tokens

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--surface` | `#ffffff` | `#0c0a09` | Page background |
| `--surface-elevated` | `#fafaf9` | `#1c1917` | Cards, panels |
| `--surface-admin` | `#f5f1e8` | `#1a1814` | Admin page background |
| `--text-primary` | `#0c0a09` | `#fafaf9` | Headlines, body |
| `--text-secondary` | `rgba(0,0,0,0.65)` | `rgba(250,250,249,0.65)` | Supporting text |
| `--text-muted` | `rgba(0,0,0,0.45)` | `rgba(250,250,249,0.45)` | Labels, captions |
| `--border` | `rgba(0,0,0,0.10)` | `rgba(250,250,249,0.10)` | Dividers, card borders |
| `--accent-surface` | `#000000` | `#fafaf9` | Inverted accent card |
| `--accent-text` | `#ffffff` | `#0c0a09` | Text on accent surface |
| `--danger` | `#dc2626` | `#ef4444` | Destructive actions |
| `--danger-surface` | `#fef2f2` | `#1a0505` | Danger card background |
| `--input-bg` | `#fbf8f1` | `#1c1917` | Form inputs (admin) |
| `--selection-bg` | `rgba(251,191,36,0.25)` | `rgba(251,191,36,0.35)` | Text selection |
| `--selection-text` | `#000000` | `#ffffff` | Text selection foreground |

## Phased Implementation

### Phase 1: Design system foundation

**Goal:** Remove styling contradictions, establish theme primitives.

**Files:** `app/layout.tsx`, `app/globals.css`

Tasks:
- [ ] Load Space Grotesk via `next/font/google` in `layout.tsx` with proper fallback metrics
- [ ] Define all semantic tokens in `globals.css` using `:root` (light) and `@media (prefers-color-scheme: dark)` blocks
- [ ] Remove conflicting `html { background; color }` — use tokens
- [ ] Fix `::selection` for both themes
- [ ] Remove `--background` / `--foreground` legacy vars
- [ ] Verify: no flash, no FOUT, both themes render a clean blank page

Exit criteria:
- `npm run build` passes
- No background flash in either theme
- Font loads deterministically

### Phase 2: Public homepage polish

**Goal:** Homepage looks intentionally designed in both modes.

**Files:** `app/page.tsx` (PublicView, SiteHeader, SectionLabel, SimpleRule, footer)

Tasks:
- [ ] Convert all hardcoded colors (`bg-white`, `text-black`, `text-black/45`, etc.) to `dark:` pairs using semantic tokens
- [ ] Invert the black "enter room context" card for dark mode (black card → light card; light card → dark card)
- [ ] Remove or rewrite the meta-commentary hero paragraph ("Ne dashboard. Ne demo místnost...")
- [ ] Fix Czech diacritics in `formatEventAccessError` ("Pouzijte" → "Použijte")
- [ ] Theme the footer for both modes
- [ ] Test error state display in both themes

Exit criteria:
- Homepage is polished in both light and dark
- No raw `text-black` or `bg-white` without `dark:` counterpart
- Hero copy speaks to practitioners, not to the developer

### Phase 3: Participant view clarity

**Goal:** Participant state is actionable, context-aware, themed.

**Files:** `app/page.tsx` (ParticipantView, MetricCard, SiteHeader)

Tasks:
- [ ] Make `SiteHeader` nav context-aware: hide `#overview`/`#principles`/`#details` anchors when participant session is active; show room-relevant links instead
- [ ] Rewrite "Room context unlocked" copy to focus on what participants should do now, not what the architecture is
- [ ] Remove supporting text that explains layers/boundaries to participants
- [ ] Apply `dark:` pairs to all participant components (metric cards, team cards, shared notes, session panel)
- [ ] Check mobile scanning cost — reduce noise where possible

Exit criteria:
- No dead nav links in participant mode
- Copy answers "what do I do now?" not "what layer am I on?"
- Both themes render cleanly on mobile and desktop

### Phase 4: Admin surface refinement

**Goal:** Facilitator desk is readable, consistent, and themed.

**Files:** `app/admin/page.tsx`

Tasks:
- [ ] Replace `bg-[#f5f1e8]` with token-based admin background that responds to dark mode
- [ ] Fix rotation slot cards: replace `bg-black/20 text-white text-stone-400` with proper themed styles
- [ ] Normalize border-radius: remove `rounded-xl` from buttons, go sharp everywhere to match the design system
- [ ] Apply `dark:` pairs to all admin components (AdminGroup, AdminCard, StatusPill, forms, buttons)
- [ ] Ensure danger actions remain visually distinct in both themes
- [ ] Check mobile admin readability

Exit criteria:
- Admin is readable and calm in both themes
- Rotation cards have proper contrast
- Controls feel consistent (no mixed radius, no stray colors)

### Phase 5: Verification and regression

**Goal:** Ship with confidence.

**Files:** `e2e/dashboard.spec.ts`, build/lint checks

Tasks:
- [ ] Run `npm run lint` — clean
- [ ] Run `npm run build` — clean
- [ ] Run existing Playwright e2e tests — all pass
- [ ] Take Playwright screenshots in both color schemes (force via `page.emulateMedia({ colorScheme })`) for:
  - public homepage (light + dark, mobile + desktop)
  - participant view (light + dark, mobile + desktop)
  - admin (light + dark, mobile + desktop)
- [ ] Visual check: selection color, focus states, error states, empty states
- [ ] Verify no dead nav targets in any state

Exit criteria:
- All automated checks pass
- Both themes are visually trustworthy across all surfaces
- No regressions in critical flows

## Implementation Tasks Summary

| # | Task | Phase | File(s) |
|---|------|-------|---------|
| 1 | Load Space Grotesk via `next/font` | 1 | `layout.tsx` |
| 2 | Define semantic color tokens (light + dark) | 1 | `globals.css` |
| 3 | Remove conflicting CSS root styles | 1 | `globals.css` |
| 4 | Fix `::selection` for both themes | 1 | `globals.css` |
| 5 | Theme public homepage components | 2 | `page.tsx` |
| 6 | Invert accent card for dark mode | 2 | `page.tsx` |
| 7 | Remove hero meta-commentary | 2 | `page.tsx` |
| 8 | Fix Czech diacritics in error messages | 2 | `page.tsx` |
| 9 | Make nav context-aware | 3 | `page.tsx` |
| 10 | Rewrite participant copy | 3 | `page.tsx` |
| 11 | Theme participant components | 3 | `page.tsx` |
| 12 | Theme admin with token-based background | 4 | `admin/page.tsx` |
| 13 | Fix rotation card contrast | 4 | `admin/page.tsx` |
| 14 | Normalize admin border-radius | 4 | `admin/page.tsx` |
| 15 | Theme all admin components | 4 | `admin/page.tsx` |
| 16 | Run lint + build + e2e | 5 | — |
| 17 | Capture verification screenshots | 5 | `e2e/dashboard.spec.ts` |

## Acceptance Criteria

- All three dashboard surfaces (public, participant, admin) respond to `prefers-color-scheme` correctly
- No background flash, no unstyled font flash, no broken selection color in either theme
- Participant nav shows only relevant links after event code redemption
- Participant copy is action-oriented, not architecture-oriented
- Admin rotation cards are readable in both themes
- Admin visual language is internally consistent (border-radius, button styles, card tones)
- Hero copy speaks to workshop practitioners without leaking design rationale
- Czech copy has correct diacritics
- `npm run lint`, `npm run build`, and existing e2e tests all pass
- Visual verification screenshots captured for both themes across all surfaces

## Estimated Effort

| Phase | Estimate |
|-------|----------|
| 1. Foundation | ~20 min |
| 2. Public surface | ~25 min |
| 3. Participant surface | ~20 min |
| 4. Admin surface | ~25 min |
| 5. Verification | ~15 min |
| **Total** | **~1h 45min** |

## References

### Review findings (source)

- Initial dashboard UX review conducted 2026-04-06 via Playwright screenshot inspection + code review
- Findings: CRIT-1 (background flash), CRIT-2 (font not loaded), CRIT-3 (broken nav), SUG-1 (hero copy), SUG-2 (participant copy), SUG-3 (team filtering — deferred), SUG-4 (admin rotation cards), SUG-5 (mixed radius), SUG-7 (selection color), OBS-4 (Czech diacritics)

### Local references

- [`docs/dashboard-surface-model.md`](../dashboard-surface-model.md) — surface responsibilities and design rules
- [`docs/plans/2026-04-06-feat-agentic-ui-inspection-dashboard-ux-plan.md`](2026-04-06-feat-agentic-ui-inspection-dashboard-ux-plan.md) — prior UX refactor plan (completed)
- [`dashboard/app/page.tsx`](../../dashboard/app/page.tsx) — public + participant surface
- [`dashboard/app/admin/page.tsx`](../../dashboard/app/admin/page.tsx) — facilitator surface
- [`dashboard/app/globals.css`](../../dashboard/app/globals.css) — current global styles
- [`dashboard/app/layout.tsx`](../../dashboard/app/layout.tsx) — root layout
- [`dashboard/e2e/dashboard.spec.ts`](../../dashboard/e2e/dashboard.spec.ts) — existing browser regression tests
