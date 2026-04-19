---
title: "review: participant surface build-phase-1 proof slice"
type: review
date: 2026-04-19
status: complete
for-plan: docs/plans/archive/2026-04-19-refactor-participant-surface-cli-independence-plan.md
---

# Participant Surface Proof-Slice Review

Artifacts reviewed:
- `docs/previews/2026-04-19-participant-surface-build-1-proof-slice.html`
- `docs/previews/2026-04-19-participant-surface-cli-independence-audit.md`
- `docs/previews/2026-04-19-repo-acquisition-matrix.md`

## Verdict

**Pass for planning / proof-slice authorization.**

The preview pack is strong enough to authorize Phase 1 doctrine and content edits and to guide a Build Phase 1 participant-surface implementation slice.

## Design-system pass

### What aligns
- The first screen answers the participant surface's dominant question quickly: what to do right now.
- Action hierarchy is explicit: current phase → dominant CTA → brief / repo access / fallback.
- The layout keeps calm hierarchy and avoids decorative overload.
- Mobile reading order is named explicitly and would stay legible if implemented faithfully.
- Repo acquisition actions are explicit links/buttons rather than raw metadata.

### Watch-for during implementation
- The CTA card must remain singularly dominant; avoid adding multiple competing primaries nearby.
- Repo acquisition actions should stay secondary to the current phase move.
- The right column should not turn into a generic resource pile; fallback should remain compact and tactical.

## Copy pass

### What aligns
- The copy normalizes fallback rather than framing it as failure.
- The brief / repo / challenge-card sections are directive rather than explanatory.
- The proof slice removes clone-first and skill-first assumptions.

### Watch-for during implementation
- Keep participant wording short enough to be read in-room on a phone.
- Avoid turning fallback copy into setup-support prose. It should stay workshop-support prose.
- In Czech visible surfaces, preserve spoken naturalness and avoid stiff translated constructions around "fallback", "setup", and "clone command".

## Boundary pass

### What aligns
- No facilitator-only controls are introduced.
- The repo acquisition matrix correctly refuses to promise ZIP download when it cannot be fulfilled reliably.
- The proposal stays participant-safe and respects the public/private taxonomy.

### Watch-for during implementation
- The data model for repo acquisition should expose only actions the participant can actually use.
- Do not synthesize host-specific ZIP links from arbitrary repo URLs.
- Private-repo download actions must be opt-in by explicit runtime support, not inferred from provider shape.

## Rejection criteria for implementation

Reject the implementation if any of these happen:
- the page answers "what is happening" but not "what do I do now"
- skill-install language returns as an early dependency in the proof slice
- repo acquisition falls back to a naked URL with no supporting actions where richer actions are available
- fallback guidance reads like an apology or escalation script rather than a supported workshop path
- the mobile layout buries the primary CTA below non-essential cards

## Decision

Phase `0.4` is satisfied. The plan can proceed to Phase 1 content and doctrine correction.
