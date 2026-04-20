# Facilitator Agenda Source Of Truth

Harness Lab now treats the workshop day as one shared backbone across:

- the maintained blueprint source pair in `dashboard/lib/workshop-blueprint-agenda.json` and `dashboard/lib/workshop-blueprint-localized-content.ts`
- the control-room agenda in `dashboard/app/admin/instances/[id]/page.tsx`
- the presenter surface in `dashboard/app/admin/instances/[id]/presenter/page.tsx`
- the facilitator skill in `workshop-skill/facilitator.md`

## Rule

The top-level unit is the agenda item. Each agenda item owns:

- `id`
- `time`
- `title`
- `intent`
- `goal`
- `facilitatorRunner`
- `roomSummary`
- `facilitatorPrompts`
- `watchFors`
- `checkpointQuestions`
- `sourceRefs`
- `presenterScenes`
- `participantMoments`

Ownership inside the maintained source pair is split deliberately:

- structure, stable ids, and Czech delivery currently live in `dashboard/lib/workshop-blueprint-agenda.json`
- reviewed English delivery currently lives in `dashboard/lib/workshop-blueprint-localized-content.ts`
- the public-readable mirror in `workshop-blueprint/agenda.json` must stay aligned with the same phase structure but is not the runtime import source

Agenda-owned presenter content is split across three outputs:

- room projection
  - scene sequence for what the room should see
  - only room-safe structured `blocks`
- participant mirror
  - participant-oriented `participantMoments` for the participant surface
  - still agenda-owned, but not part of the room projection sequence
  - may carry scene-bound poll definitions and a `feedbackEnabled` flag
- facilitator support
  - `facilitatorRunner.goal`
  - `facilitatorRunner.say`
  - `facilitatorRunner.show`
  - `facilitatorRunner.do`
  - `facilitatorRunner.watch`
  - `facilitatorRunner.fallback`
  - `facilitatorNotes`
  - `sourceRefs` back to the originating workshop materials
  - visible in the control room, not on the room projection

## Runtime Shape

The runtime model keeps one `presenterScenes` array for room-facing sequencing and one `participantMoments` array for participant-safe beats.

Presenter scenes carry an explicit `surface` contract:

- `surface: "room"`
  - eligible for `/admin/instances/[id]/presenter`
  - counted in room-scene paging and default scene selection
- `surface: "participant"`
  - eligible for the participant mirror
  - not part of the room-projection sequence

Legacy `sceneType: "participant-view"` content should normalize to `surface: "participant"` on read so existing instance data keeps working without silently changing ids.

Participant moments are the stronger participant contract:

- they are authored per agenda item, not as a second free-floating content system
- they may target one or more room scenes via `roomSceneIds`
- they may expose one lightweight poll definition with predefined options only
- they may enable the persistent facilitator-private feedback affordance
- they drive the participant surface before any room-summary fallback is considered

Runtime state also persists one `liveMoment` object so the system can explain what is live without reading URL state:

- `agendaItemId`
- `roomSceneId`
- `participantMomentId`
- `participantMode` (`auto` or `manual`)
- `activePollId`

Normal path:

- facilitator changes the room scene
- runtime updates `liveMoment.roomSceneId`
- participant moment resolves automatically from the authored room-scene mapping
- participant mode stays `auto`

Safety path:

- facilitator may pin a different participant moment temporarily
- runtime switches `participantMode` to `manual`
- clearing the override returns the participant surface to authored auto-follow behavior

## Ownership Boundary

What belongs in the structured blueprint:

- workshop moments that matter operationally
- room-safe presenter content
- participant mirror content that teams genuinely need
- explicit participant moments for beats where the participant surface matters inside one agenda item
- short facilitator guidance needed in the normal path
- concise runner guidance for what to say, show, do, watch, and how to recover if the beat slips
- explicit source references back to long-form materials

What stays in long-form docs:

- broader explanation
- full talk scripts
- deeper facilitation rationale
- brainstorm or design context

## Runner Publish Rule

- Git-authored agenda content remains canonical for facilitator runner guidance.
- The control room displays agenda-owned runner content for the current runtime item.
- Runtime item edits stay instance-local until a maintainer deliberately promotes them back into the repo.
- The control room must not become a silent second authoring system for reusable facilitation method.

## Editing Rule

- Blueprint content is canonical for new imports and resets.
- Runtime instances may override the copied agenda and scenes locally.
- The dashboard and facilitator skill must use the same agenda ids and the same scene semantics.
- Participant-moment ids are part of that shared contract; do not infer participant behavior from presenter copy when a moment should be authored explicitly.
- Intermezzos stay first-class agenda items, not implicit notes hidden only in docs.

If future work adds richer workshop content, extend this shared agenda model instead of creating a second facilitator-only content system.
