# Workshop Blueprint

This folder is the canonical public definition of how Harness Lab works.

Use it for the reusable workshop method:

- what the workshop is trying to teach
- how the day is structured
- what facilitators operate
- what participants use
- what is editable in the public repo versus only in the private runtime layer

Do not use this folder for live event state. Real dates, rooms, rosters, checkpoint data, monitoring output, and facilitator-only operations belong in the private workshop-instance layer.

## Recommended Reading Order

1. [`day-structure.md`](day-structure.md)
2. [`teaching-spine.md`](teaching-spine.md)
3. [`operator-guide.md`](operator-guide.md)
4. [`control-surfaces.md`](control-surfaces.md)
5. [`edit-boundaries.md`](edit-boundaries.md)
6. [`agenda.json`](agenda.json)

## Blueprint Contents

### Human-readable guidance

- [`day-structure.md`](day-structure.md)
  Explains the workshop arc, phase goals, and what should survive handoff.
- [`teaching-spine.md`](teaching-spine.md)
  Defines the habits, facilitator messages, and participant defaults the workshop should install.
- [`operator-guide.md`](operator-guide.md)
  Explains how a facilitator prepares, runs, and closes a workshop.
- [`control-surfaces.md`](control-surfaces.md)
  Defines participant surface, facilitator dashboard, facilitator skill, and the `harness` CLI as equal clients of one runtime model.
- [`edit-boundaries.md`](edit-boundaries.md)
  Explains what changes in the public repo, what changes only in runtime, and how learnings are published back deliberately.

### Structured data

- [`agenda.json`](agenda.json)
  Public-readable 10-phase mirror of the workshop day and workshop metadata.

## Related Runtime Documents

- [`harness-cli-foundation.md`](../docs/harness-cli-foundation.md)

The deeper runtime and maintainer docs such as blueprint import, publish-back flow, and workshop-instance runbooks remain part of the source repository and maintainer path. They are intentionally not part of the portable participant bundle.

For maintainers working in the source repository, the runtime-facing structured agenda sources are:

- `docs/workshop-content-language-architecture.md`
- `dashboard/lib/workshop-blueprint-agenda.json`
- `dashboard/lib/workshop-blueprint-localized-content.ts`

Treat those as maintainer/source-repo references, not as portable participant-bundle docs. The public `agenda.json` file should stay aligned with the same phase structure, but it is not the runtime import source.
