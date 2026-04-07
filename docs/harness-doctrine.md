# Harness Doctrine

Harness Lab should be developed with the same harness-engineering discipline it teaches.

## Feedforward First

Before high-autonomy implementation starts, the repo should already contain:

- clear context in `AGENTS.md`
- architecture decisions written down when boundaries change
- explicit security rules
- explicit testing and deployment rules
- how-to guidance where contributors would otherwise guess

These are guides. They increase the chance the agent gets it right the first time.

## Sensors Second

After the agent acts, use sensors that help it self-correct and help humans trust the result:

- unit tests
- tracer bullets
- browser inspection
- Playwright regression
- linting and static checks
- human review

Computational sensors should be cheap and run often. Inferential sensors and human judgment should be used where semantic understanding still matters.

## Human Steering

When the same issue happens repeatedly, do not only fix the output. Improve the harness:

- strengthen the context
- add or refine a rule
- add a missing test
- add a stronger browser check
- write the decision down if it changes architecture

That is the loop Harness Lab is trying to teach.

For the current private workshop-instance architecture, the required sensors and release gates are defined in:

- [`private-workshop-instance-security-gates.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-security-gates.md)
- [`private-workshop-instance-deployment-spec.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-deployment-spec.md)

For the reusable workshop method itself, the canonical public operating surface now starts in:

- [`workshop-blueprint/README.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/workshop-blueprint/README.md)
- [`blueprint-import-model.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/blueprint-import-model.md)
- [`runtime-learning-publish-back.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/runtime-learning-publish-back.md)
