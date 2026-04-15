---
title: "fix: portable workshop bundle remediation"
type: plan
date: 2026-04-08
status: complete
confidence: high
---

# Portable Workshop Bundle Remediation Plan

Fix the first portable participant-skill release so the installed workshop bundle actually behaves as a portable, updateable product surface rather than a one-time copy of repo docs.

## Problem Statement

The portable participant-skill direction is correct, but the first implementation still breaks the product promise in three important ways:

- rerunning `harness skill install` does not update an existing install unless the user already knows to pass `--force`
- the packaged workshop bundle still contains author-machine absolute paths and references to docs that are not shipped in the portable bundle
- the repo-local `.agents/skills/harness-lab-workshop` copy can drift from the authored skill, which means local skill validation in this repo can disagree with the published bundle

These are not cosmetic issues.

They undermine the primary goals of the portable install slice:

- participants should be able to install and refresh the skill from any repo
- workshop docs surfaced through the skill should remain usable after install outside this source checkout
- local validation of the workshop skill should match what is actually packaged and published

If left as-is, the CLI will report successful installs while silently preserving stale content, and the skill will still push users into broken paths or missing docs in the very scenarios it was meant to fix.

## Proposed Solution

Treat the portable workshop bundle as a versioned product artifact with one canonical authored source and three enforced properties:

1. **Upgrade-safe installation by default**
   `harness skill install` should refresh an existing install when the packaged bundle has changed, without requiring users to discover `--force` as a hidden maintenance flag.

2. **Actually portable bundle content**
   Every participant-facing artifact shipped in the bundle must avoid author-machine absolute paths, avoid references to missing bundled docs, and prefer in-skill commands or bundle-local relative references.

3. **Single-source bundle generation**
   The authored workshop files remain canonical in the repo, and both the packaged CLI bundle and repo-local `.agents` development bundle are generated from that source through one explicit sync path with verification.

The remediation should keep the architectural boundary from the prior plan:

- baseline participant help remains local and public-safe
- participant login remains only for live event context
- the CLI remains the distribution/install surface, not the teaching surface
- the `workshop` skill remains the participant interface

## Decision Rationale

### Why install refresh should become the default

The workshop skill is a distributed content bundle. Treating “already installed” as success without comparing versions or content turns updates into a trap: users think they refreshed, but they did not.

The safer default is:

- install when missing
- refresh when stale
- report when already current
- reserve `--force` for destructive reinstall or corruption recovery

That matches participant expectations and reduces support burden in the room.

### Why portability has to be enforced at content level, not only at installer level

A portable installer is not enough if the installed content still links back to one maintainer’s machine or to docs that were never shipped.

The bundle must be portable in two senses:

- installable from any repo
- readable and navigable after install inside that repo

That requires a link and inventory audit, not just a copy step.

### Why repo-local `.agents` drift must be treated as a release risk

This repo uses the installed workshop skill during development and validation. If the repo-local `.agents` copy diverges from the authored source, maintainers can validate the wrong skill contract and miss regressions before publish.

The generated bundle should therefore be treated like any other derived artifact:

- synchronized intentionally
- easy to verify
- not a parallel authoring surface

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| Participants will rerun `harness skill install` expecting it to refresh their installed bundle | Verified | Review finding against [`harness-cli/src/skill-install.js`](../../harness-cli/src/skill-install.js) and normal CLI user expectations |
| The bundled workshop docs are supposed to be usable outside this source checkout | Verified | Core requirement of the completed portable install slice and current workshop install guidance |
| Author-machine absolute paths are incompatible with the portable bundle goal | Verified | Review finding against [`README.md`](../../README.md), [`workshop-skill/follow-up-package.md`](../../workshop-skill/follow-up-package.md), and bundled artifacts |
| The repo-local `.agents` bundle is still used as a meaningful local validation surface | Verified | Current repo workflow and the presence of `.agents/skills/harness-lab-workshop` in the worktree |
| A small manifest or bundle-version marker is sufficient to detect stale installs reliably | Likely | Standard packaging pattern, but the exact marker format still needs design |
| The current portable inventory can either be made self-contained or narrowed without breaking the participant experience | Likely | Current bundle already contains most needed workshop files; the missing work is consistency and inventory discipline |
| CI can enforce “no absolute repo paths” and “no missing bundled references” with deterministic checks | Likely | Repo-local scans are straightforward, but the exact allowlist and false-positive handling need one implementation pass |

Unverified or likely assumptions should become explicit implementation tasks before release.

## Risk Analysis

### Risk: Auto-refresh overwrites participant-local customizations

If some teams edit files inside `.agents/skills/harness-lab-workshop`, a default refresh could replace those edits.

Mitigation:

- define the installed workshop bundle as generated/vendor content, not a user-editable workspace
- print clear CLI messaging when a refresh occurs
- reserve `--force` for full destructive reinstall if needed
- consider a future warning if local modifications are detected, but do not block this remediation on that feature

### Risk: The content audit expands into a repo-wide documentation rewrite

Absolute path cleanup exists beyond the participant bundle scope, and trying to fix every doc in the repo would dilute the remediation.

Mitigation:

- scope the portability cleanup to authored participant-facing sources and packaged outputs used by the portable skill
- allow maintainer-only docs to remain out of scope unless they are explicitly shipped in the bundle or surfaced to participants

### Risk: Bundle inventory grows in an ad hoc way

Shipping every linked doc to avoid broken references would make the bundle larger and muddier without improving participant UX.

Mitigation:

- prefer replacing maintainer-facing links with in-skill commands or participant-safe summaries
- only add files to the bundle when they are truly part of the participant product surface
- document the portable bundle allowlist explicitly

### Risk: Repo-local bundle sync remains optional and drifts again

If maintainers can update source docs without updating the generated local bundle, local workshop-skill validation will become unreliable again.

Mitigation:

- define one supported sync command
- wire it into the existing bundle maintenance workflow
- add a verification step that fails when generated bundle outputs are stale

## Implementation Tasks

- [x] Define the install-refresh contract for `harness skill install`.
  Decide the default behavior for missing install, current install, stale install, and explicit `--force`.
  Add a lightweight bundle identity marker such as a manifest or bundle version so the CLI can distinguish “already current” from “installed but stale.”

- [x] Update the CLI installer and its tests to implement upgrade-safe refresh behavior.
  Cover these cases explicitly:
  - first install into an arbitrary repo
  - rerun with unchanged packaged bundle returns “already current”
  - rerun after packaged bundle changes refreshes the install without `--force`
  - `--force` still performs a full reinstall path

- [x] Audit the participant-facing authored sources that feed the portable bundle and remove non-portable references.
  Replace author-machine absolute paths with portable references.
  Replace maintainer-only or missing-doc links with either:
  - shipped bundle-local relative references
  - first-class skill commands such as `workshop resources`, `workshop gallery`, and `workshop follow-up`
  - short participant-safe summaries where linking is the wrong UX

- [x] Tighten the portable bundle inventory instead of letting references pull in arbitrary repo docs.
  For each currently shipped participant-facing file, decide:
  - keep and sanitize
  - keep and expand the shipped dependency set
  - rewrite to avoid the dependency entirely
  Document the final inventory in the packaging model or ADR so the boundary stays deliberate.

- [x] Make repo-local `.agents` bundle generation part of the supported workflow and align it with the packaged bundle.
  Ensure the same authored source feeds:
  - `harness-cli/assets/workshop-bundle`
  - `.agents/skills/harness-lab-workshop`
  Remove or fix any remaining drift, especially facilitator guidance, so local `workshop` skill validation in this repo matches the packaged contract.

- [x] Add verification gates for portability and bundle consistency.
  Add deterministic checks for:
  - no `/Users/.../harness-lab/` style absolute paths in participant-facing bundled content
  - no references from bundled participant docs to missing bundled files
  - repo-local `.agents` bundle sync matches authored source when the sync path is expected to be current
  Keep these checks in CI and local release verification, not only as one-time manual review.

- [x] Update release and maintainer guidance so the remediated behavior is teachable.
  Clarify:
  - what `harness skill install` does on rerun
  - that the installed workshop bundle is generated content
  - which files are canonical authored source versus derived output
  - how maintainers should validate the participant experience before publish

## Acceptance Criteria

- Running `harness skill install` in a repo with an existing workshop install refreshes stale installs automatically and reports clearly whether the bundle was installed, refreshed, or already current.
- The portable workshop bundle no longer contains participant-facing links to `/Users/ondrejsvec/...` or other author-machine absolute repo paths.
- Every participant-facing doc shipped in the portable bundle either points to another shipped bundle artifact or to a stable external URL, or it directs the user to an in-skill command instead of a missing local file.
- The repo-local `.agents/skills/harness-lab-workshop` copy matches the authored workshop skill contract closely enough that local skill validation exercises the same participant and facilitator guidance as the packaged bundle.
- CI or release verification fails if bundled participant-facing content regresses back to absolute-path references or missing bundled-doc references.
- A maintainer new to this slice can identify:
  - the canonical authored workshop content
  - the packaged portable bundle output
  - the repo-local generated bundle output
  - the intended rerun behavior of `harness skill install`

## References

- Prior portability plan: [2026-04-08-feat-portable-participant-skill-distribution-and-workshop-ux-plan.md](2026-04-08-feat-portable-participant-skill-distribution-and-workshop-ux-plan.md)
- Packaging boundary: [resource-packaging-model.md](../resource-packaging-model.md)
- CLI release gate: [harness-cli-publication-gate.md](../harness-cli-publication-gate.md)
- Review findings source files:
  - [skill-install.js](../../harness-cli/src/skill-install.js)
  - [README.md](../../README.md)
  - [follow-up-package.md](../../workshop-skill/follow-up-package.md)
  - [learner-resource-kit.md](../learner-resource-kit.md)
  - [facilitator.md](../../workshop-skill/facilitator.md)
  - [repo-local facilitator.md](../../.agents/skills/harness-lab-workshop/workshop-skill/facilitator.md)
