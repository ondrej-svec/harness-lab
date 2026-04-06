# Public Launch History Cleanup Plan

This document defines the minimum process for making the Harness Lab repository genuinely public-safe before any public launch.

## Goal

Remove or replace private workshop data not only from the current working tree but also from git history, release artifacts, and adjacent documentation habits.

## Why Forward-Safe Is Not Enough

Replacing sensitive files today does not protect old commits, tags, forks, CI artifacts, screenshots, or local clones that still contain real workshop data. Public launch is blocked until history safety is verified.

## Scope of Cleanup

The audit must cover:

- tracked files in the current branch
- full git history on all branches intended to remain
- tags and release artifacts
- documentation attachments, screenshots, and generated assets
- CI logs or exported artifacts that may contain sensitive values

## Working-Tree Audit Snapshot

Quick audit performed on 2026-04-06:

- no obvious live secrets or real client/event records were found in the tracked guidance docs reviewed for this architecture slice
- current matches for sensitive-looking terms were dominated by architecture docs, sample/test fixtures, and local-development auth examples
- demo/test values should remain clearly synthetic so future audits can distinguish them from live operational data quickly

## Sensitive Material to Remove or Replace

- real workshop dates, venues, rooms, and logistics
- participant rosters
- live team repo registries
- facilitator-only notes
- monitoring snapshots from real events
- secrets, passwords, access codes, tokens, and connection strings
- any ambiguous fixture that could plausibly be mistaken for live operational data

## Replacement Strategy

- replace real event records with clearly fictional demo fixtures
- replace facilitator notes with reusable public-safe templates or remove them entirely
- preserve architectural and procedural learning in generic form without carrying over private operational detail
- rename ambiguous sample files so `demo`, `sample`, or `fictional` is explicit

## Cleanup Procedure

1. Inventory the current working tree and mark anything that belongs in the private runtime layer or private ops workspace.
2. Inventory historical paths and commits that contain private artifacts.
3. Prepare sanitized replacements where public templates are still useful.
4. Rewrite history to remove or replace sensitive artifacts.
5. Force-push only after review and coordination with any collaborators.
6. Invalidate or rotate any credentials that ever appeared in repo history, even if later removed.
7. Re-run verification before considering the repo public-ready.

## Verification Checklist

- current `HEAD` contains only public-safe content
- full retained history has been scanned and no private workshop artifacts remain
- demo fixtures are clearly fictional
- docs point operators to the private runtime layer rather than encouraging repo storage of live state
- credentials that were ever tracked have been rotated

## Communication Rules

- do not open the repository publicly until the cleanup is complete and verified
- warn collaborators that old clones and forks may still contain private data
- document which branches and tags are canonical after the rewrite

## Ongoing Prevention Rules

- live workshop data never belongs in the public repo
- new docs must name private runtime or private ops workspace destinations explicitly
- release review must treat history cleanup status as a public-launch gate, not optional hygiene
