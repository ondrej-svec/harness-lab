# Contributing

Harness Lab is a workshop about disciplined work with AI agents. Contributions should reinforce that lesson.

This guide is for both upstream contributors and maintainers of downstream forks.

## Start Here

Before making meaningful changes, read:

1. [`../AGENTS.md`](../AGENTS.md)
2. [`internal-harness.md`](internal-harness.md)
3. [`public-private-taxonomy.md`](public-private-taxonomy.md)
4. the task-specific docs named in `AGENTS.md`

## What Good Contributions Look Like

Good contributions make the repo easier to continue:

- clearer repo-native context
- stronger verification
- better participant or facilitator guidance
- sharper boundaries between public template content and private runtime state
- cleaner operator and maintainer workflows

## Resource Audience Rule

Every new artifact should declare, at least mentally, which layer it belongs to:

- `internal harness` - maintainer or facilitator operating guidance
- `learner resource kit` - participant-facing, copyable teaching artifacts
- `external reference gallery` - curated links to official docs or strong public examples

If an artifact mixes backstage operations with participant teaching:

- keep the backstage part in the internal harness
- create a smaller participant-safe subset for the learner kit

See:

- [resource-packaging-model.md](resource-packaging-model.md)
- [internal-harness.md](internal-harness.md)
- [learner-resource-kit.md](learner-resource-kit.md)

## Public-Safe Rule

Do not add:

- real workshop dates, venues, or room logistics
- participant-private data
- facilitator credentials, event codes, or deployment secrets
- private runtime observations that belong in the workshop-instance layer

When in doubt, keep event-specific state in the private runtime layer, not in tracked repo files.

## Expected Workflow

1. define the intended behavior
2. write the smallest useful failing test, tracer bullet, or other executable check
3. implement the change
4. run the relevant tests, lint, and build before considering the work done
5. update the relevant ADR, runbook, or boundary doc when behavior or trust boundaries change

## Verification Standard

Do not ship new agent-facing or operator-facing behavior without executable verification.

That especially applies to:

- dashboard state transitions
- participant-surface behavior
- facilitator controls
- auth boundaries
- workshop-skill behavior that changes participant guidance

From `dashboard/`:

```bash
npm run test
npm run test:e2e
npm run lint
npm run build
```

If you change the portable workshop bundle, sync it before considering the work complete:

```bash
node harness-cli/scripts/sync-workshop-bundle.mjs
```

## Collaboration Rules

- prefer repository knowledge over chat memory
- prefer small, reviewable diffs over broad speculative rewrites
- do not change auth, storage, or deployment behavior without updating the matching docs
- do not edit generated bundle output as if it were the canonical authored source unless the task is specifically about the packaged artifact
- when repeated friction appears, improve the harness rather than only patching the symptom

## Link Hygiene

Use repository-relative markdown links, not local filesystem-absolute paths.

Good:

- `[workshop-blueprint/README.md](../workshop-blueprint/README.md)`
- `[dashboard-surface-model.md](dashboard-surface-model.md)`

Do not write markdown links like:

- ``(/absolute/path/to/harness-lab/...)``

## What Not To Do

- do not rely only on “I reviewed the diff”
- do not treat tests as optional cleanup after agent output
- do not add private workshop operations or live event metadata to the public template repo
- do not skip the exploratory browser pass when UI work is central to the change
- do not change auth or trust boundaries without writing the decision down

## Related Docs

- [internal-harness.md](internal-harness.md)
- [public-private-taxonomy.md](public-private-taxonomy.md)
- [dashboard-surface-model.md](dashboard-surface-model.md)
- [dashboard-testing-strategy.md](dashboard-testing-strategy.md)
- [harness-doctrine.md](harness-doctrine.md)
- [resource-packaging-model.md](resource-packaging-model.md)
