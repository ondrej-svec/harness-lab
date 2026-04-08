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

Presenter scenes are room-facing packs linked to one agenda item. They keep:

- room-facing structured `blocks`
- facilitator-only `facilitatorNotes`
- `sourceRefs` back to the originating workshop materials

## Ownership Boundary

What belongs in the structured blueprint:

- workshop moments that matter operationally
- room-safe presenter content
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
