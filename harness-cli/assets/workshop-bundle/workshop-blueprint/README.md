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
5. [`agenda.json`](agenda.json)

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

### Structured data

- [`agenda.json`](agenda.json)
  Public-readable 10-phase mirror of the workshop day and workshop metadata.

## Related Runtime Documents

- [`harness-cli-foundation.md`](../docs/harness-cli-foundation.md)

The deeper runtime and maintainer docs such as blueprint import, publish-back flow, workshop-instance runbooks, and the governance rules in `edit-boundaries.md` remain part of the source repository and maintainer path. They are intentionally not part of the portable participant bundle. Read them directly from the [Harness Lab source repository](https://github.com/ondrej-svec/harness-lab/tree/main/workshop-blueprint) when you need them as a maintainer.

For maintainers working in the source repository, the canonical bilingual content source is:

- `workshop-content/agenda.json` — single bilingual source (en/cs per node)
- `docs/workshop-content-language-architecture.md` — architecture doc

The public `agenda.json` in this directory and the dashboard runtime views (`dashboard/lib/generated/agenda-cs.json`, `agenda-en.json`) are generated from the bilingual source. Do not edit them by hand — run `npm run generate:content` instead.
