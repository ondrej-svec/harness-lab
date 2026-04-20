---
title: "Opening review — agenda timeline and team-formation simplification"
type: review
date: 2026-04-20
status: approved
scope: "Opening-phase content adjustment in workshop-content/agenda.json"
---

# Opening review — agenda timeline and team-formation simplification

This note records the content slice that updates the opening-phase agenda scene, simplifies the team-formation wall scene, and replaces the old board-based transition into the talk.

## Files under review

- `workshop-content/agenda.json`
- `dashboard/lib/generated/agenda-cs.json`
- `dashboard/lib/generated/agenda-en.json`
- `dashboard/app/admin/instances/[id]/presenter/page.test.tsx`
- `dashboard/e2e/dashboard.spec.ts`
- `dashboard/lib/admin-auth.ts`
- `dashboard/lib/facilitator-access.ts`
- `dashboard/lib/facilitator-auth-service.ts`
- `dashboard/proxy.ts`
- `dashboard/app/admin/sign-in/page.tsx`
- `dashboard/app/admin/sign-in/page.test.tsx`
- `dashboard/proxy.test.ts`
- `dashboard/playwright.config.ts`
- `dashboard/lib/auth/neon-auth-proxy.ts`

## Locale coverage

- English canonical changed
- Czech visible-surface delivery changed

## What changed

- `opening-day-arc` was rewritten from an abstract four-move promise into a concrete opening agenda with times and room-level milestones.
- `opening-team-formation-room` was simplified to the live steps the room actually needs now:
  - line up by experience
  - count off
  - sit down and do short introductions
- Anchor selection, team naming, live board recording, and the `Řiďte se děním v sále.` callout were removed from the room scene.
- `opening-handoff` and the matching `opening-look-up` participant moment were rewritten to remove the old `Na boardu máte svůj tým` / `Your team is on the board` phrasing.

## Layer 2 findings considered

- The opening needed a real `what / when` agenda beat, not only a narrative day arc.
  Rationale: the room needs immediate schedule orientation in the first minutes, and the user explicitly flagged this gap.
- The team-formation scene had stale choreography.
  Rationale: anchor selection, team naming, and live board recording no longer match the desired live flow.
- The old transition over-explained board state instead of moving the room forward.
  Rationale: once team formation is done, the useful next instruction is simply to look up and move into the talk.
- The revised Czech strings were checked against the repo voice rules:
  - no board-centric or internal shorthand remained on the visible surface
  - no reject-list calques such as `oblouk dne` were kept in the rewritten agenda scene
  - instruction lines use direct verbs and shorter sentences
- Follow-up editorial pass on 2026-04-20 found no blocking Layer 2 issues in the edited Czech opening strings.
  Rationale:
  - `opening-day-arc` now gives concrete times, actions, and outcomes without drifting into abstract workshop shorthand.
  - `opening-team-formation-room` uses short imperative sequencing that reads naturally out loud and no longer carries stale anchor / naming / board language.
  - `opening-handoff` is direct and room-usable; it moves the group into the talk without over-explaining the board state.

## What passed

- Source-of-truth edit stayed in `workshop-content/agenda.json`
- Generated agenda views were regenerated successfully
- `dashboard` content verification passed
- Tier 2 locale sync passed
- `verify-copy-editor` passed clean during `npm run verify:content`
- Targeted presenter-page regression tests passed in `dashboard/app/admin/instances/[id]/presenter/page.test.tsx`
- File-mode facilitator auth now supports a cookie-backed local sign-in/session for browser verification while keeping the existing header fallback for API and local tooling paths.
- File-mode presenter/browser verification passed through targeted Playwright coverage for:
  - default presenter room route
  - opening team-formation proof slice
  - updated opening agenda, team-formation, and handoff scenes
- Follow-up Layer 2 Czech editorial pass found no blocking issues on the edited opening scenes.

## What did not close automatically

- Direct `copy-audit --paths workshop-content/agenda.json` still reports false positives on mixed-language JSON, which matches the known limitation documented in `docs/workshop-content-qa.md`.

## Required artifact lines

- typography audit: clean via `npm run verify:content` → `verify-copy-editor`
- layer-2 suggestions considered: yes
- human Czech signoff: approved by repo user on 2026-04-20
- editorial recommendation: ready for human signoff

## Next safe move

1. If broader file-mode facilitator flows need full-browser coverage, migrate the remaining old header-only Playwright assumptions onto the cookie-backed local sign-in/session path now used by the presenter proof tests.
2. Keep the other still-unreviewed Czech scenes in `workshop-content/agenda.json` on their own review track instead of treating this opening signoff as global coverage.
