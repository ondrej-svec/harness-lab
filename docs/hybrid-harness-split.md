# Hybrid Harness Split

Harness Lab uses a hybrid model:

- reusable workflow machinery belongs in the Heart of Gold toolkit
- durable repo truth belongs in this repository

If both layers try to own the same rule, they will drift.

## What Belongs Upstream In The Toolkit

These are generic workflow responsibilities that should work across repositories:

| Toolkit truth | Why it belongs upstream |
| --- | --- |
| The core `brainstorm -> plan -> work -> review -> compound` loop | It is reusable workflow machinery |
| Generic plan quality gates for non-trivial work | Other repos need the same feedforward discipline |
| Subjective-work questions such as references, anti-references, proof slice, and rejection criteria | These are reusable planning mechanics |
| Preview-first requirements for design-heavy tasks | The principle generalizes across products |
| Generic helper-role contracts such as repo researcher, design critic, copy critic, and boundary auditor | These roles are reusable scaffolding |
| Review behavior that checks plan adherence, not just implementation plausibility | That is workflow-level truth |
| Compound behavior that turns repeated friction into durable doctrine | That is workflow-level truth |

## What Belongs In Harness Lab

These are repo-native responsibilities and must stay here:

| Repo truth | Why it stays local |
| --- | --- |
| Public/private rules for workshop instances, participant access, and facilitator auth | They are product-specific trust boundaries |
| Dashboard design rules and presenter / control-room standards | They are surface-specific product doctrine |
| Czech style guidance and participant-facing tone rules | They are repo-specific editorial truth |
| Verification commands, Playwright expectations, and release discipline for this codebase | They depend on local tooling and risk |
| The current ADR set, plans, brainstorms, and solutions | They are the repo memory |
| What "good" means for this workshop method and this product | It must be inspectable in the repo itself |

## Interaction Rule

The toolkit should ask for repo truth.

The repo should not try to replace generic workflow skills with one-off local hacks.

In practice:

1. generic skills define the reusable questions and workflow gates
2. Harness Lab answers those questions with repo docs, plans, rubrics, and ADRs
3. repeated repo-local friction becomes repo doctrine
4. repeated cross-repo friction becomes a toolkit improvement

## Anti-Patterns

Do not:

- hardcode Harness Lab-specific rules into generic toolkit skills
- leave reusable workflow improvements only in repo docs
- keep correcting the same issue in chat when it should become repo or toolkit truth

## Related Docs

- [`autonomous-planning-standard.md`](./autonomous-planning-standard.md)
- [`planning-helper-roles.md`](./planning-helper-roles.md)
- [`autonomous-planning-proving-ground.md`](./autonomous-planning-proving-ground.md)
