# Participant Surface Build Phase 1 Proof-Slice Spec

Supports:
- `docs/plans/archive/2026-04-19-refactor-participant-surface-cli-independence-plan.md`
- `docs/previews/2026-04-19-participant-surface-build-1-proof-slice.html`

Status:
- proof-slice specification
- implementation-facing, not runtime truth

## Surface job

For Build Phase 1, the participant surface must answer:

> **What should our team do next, and how do we keep moving even if local setup is not ready yet?**

This is a stricter job than "show the live phase". The page should still show the live phase, but its dominant value is helping the team start cleanly.

## Primary action hierarchy

### One primary action block

The default canvas must contain a single dominant block with:
- current phase label
- one-sentence phase objective
- one direct next move
- one fallback line

### Proposed primary CTA copy shape

- **Title:** action-first and phase-specific
- **Body:** short explanation of why this move matters now
- **Actions:** 2–3 direct actions maximum

### Build Phase 1 default CTA

**Primary title:**
- EN: `Agree on the brief. Open the repo. Draft the first map.`
- CS: `Srovnejte si zadání. Otevřete repo. Sepište první mapu.`

**Primary support line:**
- EN: `The participant surface is enough to start. If your local agent setup is ready, the workshop skill is the faster path — not the required one.`
- CS: `Participant plocha na start stačí. Když máte připravený lokální setup pro agenta, workshop skill je rychlejší cesta — ne povinná podmínka.`

**Primary actions:**
1. Open your brief
2. Get team materials
3. Blocked? Use fallback

## Default-canvas sections and order

## 1. Current phase + next action

Purpose:
- orient the team fast
- answer the dominant question before any scrolling detour

Content:
- current phase title and time
- one-sentence phase summary
- next block / milestone
- primary CTA block

Rule:
- this section must stay above any detail cards on both desktop and mobile

## 2. Your brief

Purpose:
- remove dependence on the skill for brief discovery

Content:
- brief title
- one-paragraph problem statement
- 2–3 short "start here" bullets
- open full brief action

Rule:
- keep it summary-first, not full-brief-by-default
- the participant should be able to confirm direction without leaving the page immediately

## 3. Repo / starter access

Purpose:
- make repo acquisition explicit and non-fragile

Content:
- one sentence explaining the available acquisition modes
- primary path action(s)
- optional local path action(s)

Default action priority:
1. Open repo / open source template
2. Download ZIP or starter bundle when available
3. Copy clone command
4. Copy repo URL

Rule:
- raw URLs should not be the only visible affordance when richer actions are possible
- clone actions must never visually imply that cloning is required

## 4. Challenge cards

Purpose:
- keep challenge prompts accessible without the skill

Content:
- 2–3 visible tags or short labels for the current phase
- one action to open the challenge-card surface

Rule:
- challenge cards remain a supporting section, not the top-level CTA

## 5. Setup-failure fallback

Purpose:
- normalize recovery
- prevent local setup friction from becoming workshop paralysis

Content:
- short title that de-pathologizes fallback
- 3 short states:
  - still blocked? keep moving here
  - blocked longer? ask for help
  - setup ready? use the faster path

Rule:
- fallback must read like a supported workshop move, not an exception handler

## 6. Team signals

Purpose:
- keep the repo / handoff discipline visible

Content:
- team name
- members / anchor if available
- latest check-in
- action to record another check-in

Rule:
- team signals are evidence of continuation work, not decorative social context

## 7. Shared room notes

Purpose:
- ambient room-level reinforcement

Content:
- short facilitator reminders
- checkpoint note(s)

Rule:
- keep notes lightweight; they should not outgrow the participant page into a feed

## Mobile behavior

On phone, the vertical order must remain:
1. current phase
2. primary CTA
3. brief
4. repo access
5. fallback
6. challenge cards
7. team signals
8. room notes

Reason:
- the first five items are the minimum operational path
- team and room context can come after the team already knows how to move

## Read vs edit mode

Build Phase 1 proof slice stays in **read-first mode** with lightweight actions.

Default canvas should show:
- summary
- actions
- current evidence

Avoid in the first proof slice:
- heavy editing panels
- too many inline forms
- a second layer of configuration UI

The only lightweight write interaction that remains important here is team check-in.

## Rejection criteria for implementation

Reject the proof slice if:
- the page still reads like a dashboard status board rather than a workshop operating surface
- the brief is buried below repo metadata
- fallback is hidden in small print
- repo acquisition visually privileges clone over simpler paths
- the page shows many actions but no single recommended next move

## Implementation note

The view model for the participant surface will likely need explicit section-level data rather than deriving everything from generic presenter guidance blocks. The proof slice is structured enough that a dedicated Build Phase 1 participant payload may be clearer than trying to overfit the existing generic scene blocks.
