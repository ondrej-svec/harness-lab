---
title: "review: participant surface build-phase-1 implementation"
type: review
date: 2026-04-19
status: complete
for-plan: docs/plans/archive/2026-04-19-refactor-participant-surface-cli-independence-plan.md
---

# Participant Surface Build Phase 1 Implementation Review

Reviewed implementation:
- `dashboard/app/participant/page.tsx`
- `dashboard/app/components/participant-room-surface.tsx`
- `dashboard/app/components/copy-action-button.tsx`
- `dashboard/lib/event-access.ts`

Related content / doctrine updates:
- `workshop-content/agenda.json`
- `content/facilitation/master-guide.md`
- `content/talks/context-is-king.md`
- `content/talks/codex-demo-script.md`
- `workshop-blueprint/control-surfaces.md`
- `docs/dashboard-surface-model.md`
- `workshop-skill/SKILL.md`

## Verdict

**Pass.** The Build Phase 1 participant-surface proof slice now satisfies the plan's acceptance criteria closely enough to treat the pattern as implemented and propagated for this slice.

## What now works

### 1. Build Phase 1 has one dominant next-step block
The participant page now answers the dominant question quickly when the current phase is `build-1`:
- agree on the brief
- open the repo
- draft the first map
- use fallback if setup blocks progress

### 2. Brief access is visible without the skill path
The participant surface now shows brief content directly in the Build Phase 1 proof slice:
- assigned brief when a bound participant team exists
- prepared room briefs when the session is not bound to a team yet

### 3. Repo acquisition is no longer a naked URL only
Team cards now expose:
- open repo
- copy repo URL
- copy clone command

This is materially better than the previous raw-link-only state and matches the repo acquisition matrix's safe-action rule.

### 4. Fallback is explicit and normalized
The proof slice now includes a dedicated setup-fallback block that treats recovery as a supported workshop path, not a failure case.

### 5. The room can keep moving even when participant identity is not yet team-bound
When a participant session has no team assignment, the proof slice still shows prepared briefs and directs the user to the team cards below. This keeps the page useful as a shared room surface, not only a per-user panel.

## Verification evidence

Executed checks:
- `cd dashboard && npm run test`
- `cd dashboard && npm run lint`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:e2e`
- `cd dashboard && npm run generate:content && npm run verify:content`
- `node harness-cli/scripts/sync-workshop-bundle.mjs`
- `cd harness-cli && npm run verify:workshop-bundle`

Key evidence from Playwright:
- participant unlock flow still works
- participant mobile room screenshot remains stable
- participant desktop interaction path remains stable
- no browser console/page errors in the touched participant flows

## Watch-for after landing

- if the participant surface grows another large action area, the Build Phase 1 CTA could lose dominance
- if ZIP / starter-bundle support is added later, keep the repo acquisition matrix rule: never show actions the runtime cannot actually fulfill
- if participant-to-team binding becomes stronger later, replace the room-brief fallback with a true per-team brief surface

## Final judgment

The proof slice is coherent, tested, and aligned with the plan's product rule:

> the participant surface is now sufficient to carry core Build Phase 1 workshop progression without requiring CLI or skill success first.
