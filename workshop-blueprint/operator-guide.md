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

1. Start from the public blueprint in [`README.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/workshop-blueprint/README.md).
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

Typical runtime-only actions:

- move the current phase
- reveal or hide the continuation shift
- register teams and repo URLs
- update checkpoints and sprint notes
- archive or reset the instance

These actions affect only the active workshop instance unless a facilitator deliberately makes a repo edit afterward.

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
