# Resource Packaging Model

Harness Lab ships three distinct resource layers from the same public-safe repository.

These layers are authored once in the repo, but they may be distributed through more than one surface:

- source docs in the public repo
- the portable participant skill bundle shipped inside `@harness-lab/cli`
- the dashboard participant surface for live room use

## The Three Outputs

### 1. Internal Harness

Audience:
- maintainers
- facilitators
- future contributors evolving Harness Lab itself

Purpose:
- operate the workshop system safely
- extend the dashboard and `workshop-skill/` coherently
- preserve architecture, verification rules, and handoff quality

This layer optimizes for:
- continuity
- operational clarity
- trust boundaries
- repeatable verification

Examples:
- [`AGENTS.md`](../AGENTS.md)
- [`docs/harness-doctrine.md`](harness-doctrine.md)
- [`docs/public-private-taxonomy.md`](public-private-taxonomy.md)
- [`docs/dashboard-testing-strategy.md`](dashboard-testing-strategy.md)
- [`docs/workshop-instance-runbook.md`](workshop-instance-runbook.md)

### 2. Learner Resource Kit

Audience:
- workshop participants
- teams adopting similar practices in their own repos

Purpose:
- teach transferable context-engineering practice
- provide inspectable, copyable examples
- give participants a small set of artifacts they can reuse immediately

This layer optimizes for:
- clarity
- transfer
- low-friction adoption
- concrete examples over theory

Examples:
- [`workshop-skill/`](../workshop-skill/)
- [`content/challenge-cards/deck.md`](../content/challenge-cards/deck.md)
- [`workshop-skill/template-agents.md`](../workshop-skill/template-agents.md)
- [`workshop-skill/analyze-checklist.md`](../workshop-skill/analyze-checklist.md)
- [`workshop-skill/follow-up-package.md`](../workshop-skill/follow-up-package.md)

### 3. External Reference Gallery

Audience:
- participants after the workshop
- maintainers curating recommended next steps

Purpose:
- point learners to official docs and strong public examples
- provide a short "what next" path without sending people into random GitHub searches

This layer optimizes for:
- credibility
- freshness
- brevity

## Classification Rules

When adding a new artifact, classify it against three questions:

1. **Who is it for?**
   - maintainer/facilitator
   - participant/learner
   - both

2. **What is it for?**
   - operating Harness Lab
   - teaching a transferable practice
   - pointing to external references

3. **Is it safe to expose before an event?**
   - public-safe
   - participant-private at runtime
   - facilitator-private at runtime

If an artifact teaches the method but also contains backstage operating detail, split it:
- keep the backstage detail in the internal harness
- expose only the participant-safe teaching subset in the learner kit

## Inclusion Heuristics

Add to the **Internal Harness** when the artifact helps answer:
- how should this repo be changed?
- what is safe to publish?
- how do we verify or operate the system?
- how does another maintainer continue without oral context?

Add to the **Learner Resource Kit** when the artifact helps answer:
- what can I copy into my own repo today?
- how do I set up useful context for an agent?
- how do I hand work off cleanly?
- what should I verify before trusting agent output?

Add to the **External Reference Gallery** when the artifact is:
- official documentation
- a high-quality public repo with clear reuse value
- still current enough to recommend without caveats

## Minimum Backstage Set

These should remain maintainer-first even in a public repo:
- architecture and auth boundary docs
- runbooks for workshop-instance operations
- testing strategy and verification doctrine for the workshop system
- public/private classification rules
- contributor guidance for changing the dashboard, skill, or runtime model

These can be surfaced to participants only in distilled form:
- `AGENTS.md` patterns
- handoff checklists
- skill examples
- verification examples

## Refresh Rule

Review all three layers:
- before each workshop cycle
- when a repeated facilitation or contributor pain appears
- when the dashboard or `workshop-skill/` changes meaningfully

The default response to repeated friction is:
- strengthen the internal harness
- update the learner kit subset
- refresh the external reference gallery only if the current list is no longer the best next step

## Distribution Rule

For participant-facing workshop guidance:

- the authored source of truth stays in this repository
- canonical shared workshop copy may be authored in English while reviewed localized delivery is shipped per locale, especially Czech for real workshop runs
- portable bundle outputs may be generated from that source for installable skill distribution
- generated bundle outputs must not become a second authored content system
- portable bundle outputs should preserve the same locale contract as the dashboard and `workshop` skill rather than assuming Czech-only delivery
- generated bundle outputs must stay portable: no author-machine absolute paths and no links to bundle-local files that are not actually shipped
- the repo-local `.agents/skills/harness-lab-workshop` copy is also generated output and should be kept in sync with the authored source rather than edited independently
- live participant runtime context still belongs behind the dashboard/event-access APIs rather than inside the portable bundle
