# Planning Helper Roles

These helper roles strengthen `brainstorm` and `plan`.

They do not replace them. They exist to make weak assumptions explicit before autonomous `work` starts.

## Repo Researcher

Use when:

- the task may repeat a past pattern
- prior plans, brainstorms, or solutions probably exist
- the risk is rebuilding something the repo already knows

Inputs:

- problem statement
- target files or surfaces
- likely domains to search

Required output:

- relevant brainstorms, plans, solutions, and code patterns
- what already worked
- what drifted or caused rework
- what evidence should shape the next plan

Must not do:

- choose the final approach alone
- claim repo-specific rules without pointing to repo docs

## Design Critic

Use when:

- the task changes layout, visual hierarchy, IA, interaction framing, or room-facing design
- a preview artifact is required

Inputs:

- preview artifact
- target outcome
- anti-goals
- references and anti-references
- relevant design-system docs

Required output:

- where the preview matches the intended contract
- where it drifts from references or anti-goals
- whether the primary hierarchy and mobile behavior are clear
- concrete rejection reasons if the preview is not ready

Must not do:

- implement the surface directly
- substitute taste for the written design contract

## Copy Critic

Use when:

- the task depends on Czech quality, participant-facing clarity, or room-spoken readability
- copy is load-bearing, not incidental

Inputs:

- target audience
- preview artifact or draft copy
- tone rules
- anti-voice examples
- style guide or editorial checklist

Required output:

- where the text sounds natural and where it does not
- where the copy blends voices or slips into translationese
- whether the dominant idea is clear
- concrete lines or patterns that fail the stated rejection criteria

Must not do:

- invent a new voice that ignores the repo style guides
- treat "sounds smoother" as sufficient evidence

## Boundary Auditor

Use when:

- the task touches public/private splits
- auth, release, or runtime boundaries are involved
- participant and facilitator paths could get coupled

Inputs:

- proposed plan or preview
- affected routes, docs, or behaviors
- boundary references and ADRs

Required output:

- what data or capability crosses which boundary
- where a leak or coupling risk exists
- which docs or ADRs must update with the change
- what verification proves the boundary still holds

Must not do:

- approve vague boundary claims without evidence
- rely on "it should be fine" when a surface is auth- or privacy-sensitive

## Working Rule

Helper roles are upstreamable when they stay generic.

Their outputs become repo truth only when the resulting rule, example, or constraint is written into Harness Lab docs.
