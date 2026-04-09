# Autonomous Planning Standard

Harness Lab keeps autonomous `work` as the default for non-trivial tasks.

The gate is not more human supervision. The gate is stronger feedforward:

- a plan that makes the next correct move obvious
- explicit constraints and non-goals
- an actual trust boundary for verification
- a concrete subjective contract when the work depends on taste, voice, or human judgment

If those conditions are missing, the answer is not "work more carefully." The answer is "go back to `brainstorm` or `plan` and strengthen the input."

## Failure Taxonomy

The repeated failures in this repo have not come from autonomy alone. They have come from weak inputs to autonomy.

Name the failure before trying to fix it:

1. **Structural under-specification**
   The plan says roughly what to build, but not what success or drift actually looks like.
2. **Subjective drift**
   The engineering direction is present, but the design, copy, IA, or workshop-quality contract is not.
3. **Preview-free design**
   Work starts from prose alone even though the real judgment depends on visual or structural comparison.
4. **Boundary leakage**
   Public/private, auth, or release-sensitive constraints are implied instead of made explicit.
5. **Premature propagation**
   A pattern rolls broadly before one representative slice has proved it.
6. **Chat-only correction**
   The real rule gets corrected in conversation but never written into the repo or toolkit.

## Authorization Rule

Autonomous `work` on a non-trivial task is authorized only when the plan is already strong enough that another capable agent could:

- understand the real problem
- describe the intended end state
- see what is explicitly out of scope
- name the trust boundary
- tell whether the task should prove one slice first or propagate broadly

If the plan cannot do that, it is not ready to authorize autonomous execution.

## Minimum Plan Contract For All Non-Trivial Work

Every plan that authorizes autonomous `work` must include these sections or their clear equivalent.

| Section | Must answer | Why it matters |
| --- | --- | --- |
| Problem statement | What is actually wrong or missing? | Prevents solution-first thrash |
| Target end state | What should be true when this lands? | Makes drift detectable |
| Scope and non-goals | What is not part of this change? | Prevents silent expansion |
| Constraints and boundaries | Which architectural, release, language, or privacy rules are fixed? | Keeps autonomy inside the safe lane |
| Verification and acceptance | What evidence will count as done? | Defines the trust boundary |
| Propagation rule | Prove one slice first or roll broadly? | Prevents premature spread |
| Decision rationale | Why this approach, not the nearby alternatives? | Keeps future execution from re-litigating or silently reversing the plan |

## Additional Contract For Subjective Or Boundary-Sensitive Work

Use the stronger contract whenever the task materially changes:

- UI or visual hierarchy
- information architecture
- participant-facing or room-facing copy
- workshop framing or editorial tone
- public/private boundaries
- auth, release, or operational trust boundaries

These tasks still use the same `brainstorm -> plan -> work -> review -> compound` loop.

They do not get a separate primary workflow. They get a stronger planning contract.

Required additions:

| Requirement | What it must include |
| --- | --- |
| Target outcome | The felt or perceived result, not just the structural change |
| Anti-goals | What the result must not become |
| References | Positive models or repo examples to pull toward |
| Anti-references | Patterns, pages, or tones to stay away from |
| Tone or taste rules | Explicit editorial, design, or teaching constraints |
| Representative proof slice | One slice that will prove the pattern before propagation |
| Rejection criteria | Concrete reasons to say "this is wrong" even if it compiles |
| Required preview artifacts | The concrete representation that must exist before implementation |

## Preview-First Contract

Design-heavy work should not begin autonomous implementation from prose alone.

Preview artifacts are required when the real judgment depends on a human seeing the result rather than only reading the specification. That includes:

- dashboard layout or hierarchy changes
- homepage or presenter redesigns
- participant-facing flow changes
- room-facing scenes or workshop framing changes
- copy-heavy surfaces where wording and structure interact

Preview artifacts are optional only when the work is clearly bounded engineering with low subjective ambiguity.

### Minimum Preview Pack

At least one preview artifact must exist before autonomous `work` begins on design-heavy tasks. Harness Lab supports these preview forms:

1. HTML preview or static mockup
2. terminal-friendly ASCII or structural preview
3. short design rationale tied to references, anti-references, and rejection criteria

The preview does not need to be production-ready. It does need to make visual or editorial drift obvious before implementation starts.

### Preview Review Gate

Before `work` proceeds from a preview-heavy plan:

1. a design critic or equivalent reviewer checks the preview against the design system, references, anti-references, and anti-goals
2. a copy critic checks spoken naturalness, clarity, and tone when copy quality is part of the task
3. a boundary auditor checks public/private, auth, release, or operational constraints when relevant

If a preview fails the gate, the plan changes before implementation changes.

## Propagation Discipline

Use a proof slice first when:

- the task introduces a new recurring UI pattern
- the copy or editorial standard is still being calibrated
- the change touches multiple phases or surfaces
- the failure cost of broad rollout is meaningfully higher than the cost of one slice

Roll broadly only when:

- the pattern is already proven
- the work is mechanical propagation
- the plan names what is safe to apply everywhere

## Work Authorization Checklist

Before starting autonomous `work`, verify:

- [ ] the real problem is named
- [ ] the end state is concrete
- [ ] non-goals are explicit
- [ ] fixed constraints and trust boundaries are explicit
- [ ] acceptance criteria define the real evidence boundary
- [ ] the plan says whether to prove one slice first or propagate broadly
- [ ] subjective work includes references, anti-references, tone rules, and rejection criteria
- [ ] design-heavy work includes a preview artifact and preview review gate

If any box is unchecked, stay in planning mode.

## Related Docs

- [`planning-rubrics.md`](./planning-rubrics.md)
- [`planning-helper-roles.md`](./planning-helper-roles.md)
- [`hybrid-harness-split.md`](./hybrid-harness-split.md)
- [`autonomous-planning-examples.md`](./autonomous-planning-examples.md)
- [`autonomous-planning-proving-ground.md`](./autonomous-planning-proving-ground.md)
