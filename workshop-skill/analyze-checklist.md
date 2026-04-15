# Workshop Analyze Checklist

When an agent runs `/workshop analyze`, it walks the repo and emits a machine-readable PASS/FAIL report plus narrative notes. The PASS/FAIL block is primary; the narrative is commentary.

The checks themselves are defined in [`../docs/agents-md-standard.md`](../docs/agents-md-standard.md#scoring-appendix). This file tells the agent how to walk the repo and what to surface.

## What to check

- whether `AGENTS.md` exists and how good it is
- whether `AGENTS.md` reads as a map or as an overgrown dump
- whether `AGENTS.md` says what to read first
- whether `AGENTS.md` points at real source-of-truth docs
- whether build and test commands are present
- whether the repo distinguishes finished parts from in-progress parts
- whether a plan or runbook for the next team lives in the repo
- whether it is possible to find what was actually verified
- whether there is a record of the session state — what is verified, what is in progress, what is the next safe move
- how many rules live only in the prompt instead of in the repo
- how easy it would be to continue after rotation without a verbal handoff
- whether the next safe move is obvious

## Pre-rotation handoff gate

Before Phase 9 rotation, each team's repo must meet the three minimums defined in [`../workshop-blueprint/day-structure.md`](../workshop-blueprint/day-structure.md) `pre-rotation handoff gate` section. Analyze surfaces these as a dedicated block in the output, clearly labeled **"Pre-rotation gate"**:

- **`agents_md_readable_with_goal_and_commands_and_constraint`** — AGENTS.md contains a stated goal, build and test commands, and at least one explicit constraint.
- **`one_executable_verification_step_passing`** — there is at least one executable verification step (test, tracer, or equivalent) that currently passes.
- **`next_safe_step_written_in_repo`** — the next safe step lives in the repo (in a plan, AGENTS.md, or session notes), not only in chat memory.

Analyze is advisory. The facilitator reads the block and owns the call — the gate does not hard-block phase transitions. If any of the three checks FAIL, the report recommends fixing them before rotation rather than silently advancing.

## Output

Emit the report in three layers:

1. **Machine-readable PASS/FAIL block.** One line per check in the format `<check_name>: PASS` or `<check_name>: FAIL — <one-line reason>`. Ordered by: pre-rotation gate checks first (since they are the rotation-critical items), then AGENTS.md checks, then plans directory checks. See [`../docs/agents-md-standard.md#scoring-appendix`](../docs/agents-md-standard.md#scoring-appendix) for all check names.

2. **Cluster notes.** If more than half of the FAILs point at the same check across multiple files, call it out as a cluster in one paragraph rather than listing every instance.

3. **Narrative notes** (commentary on the PASS/FAIL block, not a replacement for it):
   - What helped continuation
   - What was missing
   - What to add before the next handoff
