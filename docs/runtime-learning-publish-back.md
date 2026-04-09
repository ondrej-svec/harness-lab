# Runtime Learning Publish-Back Workflow

Harness Lab should improve from live workshop learnings without pretending that runtime changes are the same thing as reusable design changes.

## Rule

Runtime state never auto-promotes back into the public blueprint.

Reusable improvements are published through deliberate repo edits.

For richer presenter scene work, use [`presenter-rich-scene-authoring.md`](presenter-rich-scene-authoring.md) for the proof gate, asset model, and promotion checklist.

## Workflow

1. Observe a runtime issue or improvement during a live workshop.
2. Record the observation in the private runtime layer or private ops workspace if it contains event-specific detail.
3. Decide whether the learning is:
   - runtime-only
   - a reusable blueprint improvement
4. For reusable improvements, open a normal GitHub edit or pull request against the public repo.
5. Update the relevant blueprint, docs, dashboard copy, or skill guidance intentionally.

## Examples

Belongs only in runtime:

- current room ran 20 minutes late
- one team needed a private intervention
- the event code had to be rotated

Belongs back in the blueprint:

- the continuation handoff instructions were too vague
- the agenda wording caused repeated facilitator confusion
- a safer default dashboard message is needed to explain runtime-local edits

## Surface Consistency Rule

Repo docs, dashboard copy, skill docs, and CLI help should all repeat the same publishing rule:

- operate the live event in runtime
- improve the reusable method in the blueprint through deliberate GitHub edits
