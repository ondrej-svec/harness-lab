# Workshop Operator Guide

This guide explains how a facilitator runs a workshop instance without confusing reusable blueprint design with live runtime control.

## Facilitator Job

The facilitator owns:

- preparing a private workshop instance
- verifying participant access and facilitator auth
- steering the agenda through the day
- capturing team progress and live signals
- protecting the boundary between public blueprint and private event state

The facilitator does not use the live dashboard to silently rewrite the reusable workshop method.

## Before The Day

1. Start from the public blueprint in [`README.md`](README.md).
2. Create or prepare a private workshop instance by importing the blueprint.
3. Attach instance-local metadata outside the public repo:
   - real date
   - venue and room
   - participant event code configuration
   - facilitator grants
   - facilitator-only notes
4. Verify participant and facilitator access paths.
5. Verify the active instance begins from the expected blueprint version/reference.

## During The Day

Operate the live instance through the shared runtime control surfaces:

- dashboard facilitator surface for fast visual control
- facilitator skill for AI-assisted operations
- `harness` CLI for privileged auth bootstrap and local secure credential/session handling

Facilitation priority order:

1. keep the next safe move obvious
2. push teams to encode context in the repo instead of explaining it orally
3. ask for executable verification before encouraging more autonomy
4. treat continuation friction as a signal to improve the harness, not as a participant failure

Typical runtime-only actions:

- move the current phase
- reveal or hide the continuation shift
- register teams and repo URLs
- update checkpoints and sprint notes
- archive or reset the instance

These actions affect only the active workshop instance unless a facilitator deliberately makes a repo edit afterward.

## During Rotation

The continuation shift is the pedagogical centerpiece of the day. Its learning value depends on what was handed off.

**Before rotation begins:**
- Check the pre-rotation handoff gate (see `day-structure.md`): each team needs a readable AGENTS.md, one executable verification step, and a written next safe step.
- If a team does not meet the gate, intervene to help them write the minimum. This is not punishment — it ensures the receiving team gets a signal worth diagnosing.

**During rotation:**
- Watch for teams that jump to editing before reading. Redirect them to the "required first move" (write what helped, what's missing, what's risky, next safe step).
- Let productive friction stand. The receiving team's frustration at missing context is the lesson — do not resolve it for them.
- Intervene when frustration becomes unproductive — when teams are stuck on setup, permissions, or broken tooling rather than on repo quality. That friction does not teach anything.

**Capturing signals:**
- Use the `HandoffMomentCard` capture panel on the facilitator dashboard during or immediately after the rotation phase.
- Use the suggested seed tags (`missing_runbook`, `no_test_evidence`, `next_step_not_obvious`, `constraint_only_in_chat`, `drift_not_caught`) or add your own.
- These signals feed the cross-cohort learnings log. Even one captured signal per team is valuable.

## After The Day

1. Archive the workshop instance.
2. Capture runtime learnings that may improve the reusable workshop method.
3. Decide which learnings are:
   - runtime-only notes that stay private
   - reusable improvements that belong back in the public blueprint
4. Publish reusable improvements through a normal GitHub edit or pull request.

## Golden Rule

If a change should help the next workshop by default, it belongs in the blueprint and must be committed deliberately.

If a change only helps the current live event, it belongs in the runtime instance and must not auto-promote back into the repo.

## What To Keep Reinforcing

- `AGENTS.md` should stay short and point outward to deeper sources of truth.
- The repo should contain plan, commands, verification evidence, and the next safe step.
- When a repeated issue appears across tables, turn it into a stronger template, challenge, reference card, or check.
