# Facilitator Agenda Source Of Truth

Harness Lab now treats the workshop day as one shared backbone across:

- the canonical blueprint in `dashboard/lib/workshop-blueprint-agenda.json`
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
- `roomSummary`
- `facilitatorPrompts`
- `watchFors`
- `checkpointQuestions`
- `sourceRefs`
- `presenterScenes`

Agenda-owned presenter content is split across three outputs:

- room projection
  - scene sequence for what the room should see
  - only room-safe structured `blocks`
- participant mirror
  - participant-oriented scene content for the participant surface
  - still agenda-owned, but not part of the room projection sequence
- facilitator support
  - `facilitatorNotes`
  - `sourceRefs` back to the originating workshop materials
  - visible in the control room, not on the room projection

## Runtime Shape

The runtime model keeps one `presenterScenes` array for backward compatibility, but every scene now carries an explicit `surface` contract:

- `surface: "room"`
  - eligible for `/admin/instances/[id]/presenter`
  - counted in room-scene paging and default scene selection
- `surface: "participant"`
  - eligible for the participant mirror
  - not part of the room-projection sequence

Legacy `sceneType: "participant-view"` content should normalize to `surface: "participant"` on read so existing instance data keeps working without silently changing ids.

## Ownership Boundary

What belongs in the structured blueprint:

- workshop moments that matter operationally
- room-safe presenter content
- participant mirror content that teams genuinely need
- short facilitator guidance needed in the normal path
- explicit source references back to long-form materials

What stays in long-form docs:

- broader explanation
- full talk scripts
- deeper facilitation rationale
- brainstorm or design context

## Editing Rule

- Blueprint content is canonical for new imports and resets.
- Runtime instances may override the copied agenda and scenes locally.
- The dashboard and facilitator skill must use the same agenda ids and the same scene semantics.
- Intermezzos stay first-class agenda items, not implicit notes hidden only in docs.

If future work adds richer workshop content, extend this shared agenda model instead of creating a second facilitator-only content system.
