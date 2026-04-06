# Contributing

Harness Lab is a workshop about disciplined work with AI agents. Contributions should reinforce that lesson.

## Working Rule

Do not ship new agent-facing behavior without executable verification.

That especially applies to:
- dashboard state transitions
- participant-surface behavior
- facilitator controls
- auth boundaries
- workshop-skill behavior that changes participant guidance

## Expected Workflow

1. define the intended behavior
2. write the smallest useful failing test, tracer bullet, or other executable check
3. implement the change
4. run tests, lint, and build before considering the work done
5. when the change alters architecture or trust boundaries, write or update the relevant ADR/note before broad implementation

## Dashboard Checks

From `dashboard/`:

```bash
npm run test
npm run test:e2e
npm run lint
npm run build
```

## What Not To Do

- do not rely only on “I reviewed the diff”
- do not treat tests as optional cleanup after agent output
- do not add private workshop operations or live event metadata to the public template repo
- do not skip the exploratory browser pass when UI work is central to the change
- do not change auth or trust boundaries without writing the decision down

## Related Docs

- [public-private-taxonomy.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/public-private-taxonomy.md)
- [dashboard-surface-model.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/dashboard-surface-model.md)
- [dashboard-testing-strategy.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/dashboard-testing-strategy.md)
- [harness-doctrine.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/harness-doctrine.md)
