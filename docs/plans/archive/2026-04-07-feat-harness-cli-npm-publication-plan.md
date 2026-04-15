---
title: "feat: harness cli npm publication and release automation"
type: plan
date: 2026-04-07
status: complete
confidence: medium
---

# Harness CLI npm Publication Plan

Publish `@harness-lab/cli` to npm under the `harness-lab` organization as a real participant-facing install surface, with versioned release automation, explicit rollback posture, and documentation that makes npm the default install path without losing repo-local development workflows.

## Problem Statement

The repository already treats `harness-cli/` as a real CLI boundary, but its distribution model is still in an internal-preview posture.

Today:

- [`harness-cli/package.json`](../../harness-cli/package.json) is still `"private": true`
- [`docs/harness-cli-publication-gate.md`](../harness-cli-publication-gate.md) explicitly defers public npm publication
- CI proves `npm pack` and install smoke behavior, but there is no release pipeline that turns a verified package into an actual installable public version
- the current repo has already shown why local `.tgz` artifacts should not be the distribution mechanism
- participant-facing use is now expected soon, and the npm organization `harness-lab` already exists

This matters because the install experience becomes part of the workshop product. If the CLI is participant-facing, `npm install -g @harness-lab/cli` is materially simpler than asking people to install from a local path or a GitHub release tarball. At the same time, public npm publication raises the bar on version discipline, rollback posture, and release gating because published package versions are effectively permanent.

## Proposed Solution

Move `harness-cli` from “internal preview package” to “public npm package” in five coordinated slices:

1. define the publication posture, ownership model, and release trigger rules
2. prepare package metadata and versioning discipline for public publication
3. add a dedicated npm publish workflow gated by the existing CLI verification checks
4. update docs so npm becomes the default participant-facing install path while repo-local install remains the development path
5. define rollback, deprecation, and first-release validation so the first public publish is controlled rather than accidental

The product rule becomes:

- source stays in the repo
- CI verifies the package on every change
- npm publication happens only from an explicit release trigger
- participants install from npm, not from committed tarballs or ad hoc local packs

## Detailed Plan Level

This is a **detailed** plan because it changes public distribution, package metadata, release automation, operational ownership, and the published support surface of the CLI.

## Decision Rationale

### Why npm publication now makes sense

- The user explicitly expects real participant-facing use soon.
- The `harness-lab` npm organization already exists, so the namespace decision is effectively made.
- The repo already has cross-platform CLI verification and packaging smoke tests, which means the technical gap to publication is no longer large.
- For participants, `npm install -g @harness-lab/cli` is a meaningfully better onboarding path than release-asset installs.

### Why this should not stay “GitHub Releases only”

GitHub release artifacts are a useful fallback, but they are still more friction than npm for the workshop audience. They solve artifact hygiene, not install simplicity. If the CLI is part of the participant-facing experience, npm is the better default distribution surface.

### Why publication should be explicit-release only, not automatic on every merge

Publishing on every merge would make the public registry track ordinary repo churn. npm versions are immutable, so accidental or low-signal publishes create permanent noise. The first public release needs tighter intent than a regular `main` push.

Recommended posture:

- CI on every change keeps verifying the package
- npm publication happens only on a tagged release or a manually approved workflow dispatch

### Why repo-local install should remain documented

Even after npm publication, local repo install remains valuable for:

- active development against unreleased changes
- workshop dry runs before a public release
- emergency fallback if npm distribution is paused

npm should become the default participant-facing path, not the only path.

### Alternatives considered

#### Alternative 1: Keep GitHub Releases as the only distribution mechanism

Rejected because it keeps too much install friction for the expected participant-facing workflow.

#### Alternative 2: Publish automatically from every `main` merge

Rejected because npm versions are permanent and that posture would make the registry noisier and risk accidental publication of changes that passed CI but were not intentionally release-worthy.

#### Alternative 3: Keep npm publication deferred until after the workshop

Rejected because the user now expects real participant-facing use soon, and the repo already has most of the technical prerequisites in place.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| The CLI will be participant-facing soon enough that install friction matters materially | Verified | User requirement in this thread |
| The `harness-lab` npm organization already exists | Verified | User requirement in this thread |
| `@harness-lab/cli` is the right public package name | Likely | Current package name already uses that scope, but public registry availability still needs verification before the first publish |
| The current auth and secure storage posture is strong enough for a first public npm release | Likely | Existing CLI plan completed device auth, secure storage defaults, and cross-platform packaging smoke checks, but broader live-runtime validation is still prudent |
| A release-triggered publish flow is preferable to auto-publish from `main` | Verified | npm version immutability and the current repo release posture make explicit intent the safer model |
| The repository can store and use an npm publish token or trusted publishing configuration safely in GitHub Actions | Unverified | Depends on the chosen npm auth model and repo/org configuration |
| Participants will generally have Node/npm available in the workshop environment | Likely | CLI distribution assumes npm installability, but workshop setup docs should verify the minimum supported Node posture explicitly |
| Repo-local install must remain available even after npm publication | Verified | Development and rollback use cases still require a non-registry path |

Unverified assumptions should become explicit setup or tracer-bullet tasks before the first public publish.

## Risk Analysis

### Risk: the package is published publicly before release controls are fully intentional

If `"private": true` is removed and the workflow is too broad, a routine merge could push an unintended public version.

Mitigation:

- keep publication behind explicit tags or manual dispatch
- require one dedicated publish workflow rather than piggybacking on general CI
- document the human release steps and ownership

### Risk: npm publication outpaces support readiness

Once participants can install the CLI publicly, they will treat it as a supported product surface.

Mitigation:

- update docs to state supported commands and current scope clearly
- keep the CLI surface deliberately small
- define rollback and deprecation posture before the first publish

### Risk: versioning becomes sloppy and the registry fills with low-signal releases

Because npm versions are immutable, a noisy release process is hard to clean up.

Mitigation:

- define a release trigger rule tied to semver intent
- use tags or GitHub Releases as the only publish initiators
- require changelog or release notes for published versions

### Risk: npm auth/publishing setup is fragile or over-privileged

If the workflow uses a broad, long-lived token carelessly, publication becomes a supply-chain liability.

Mitigation:

- prefer the narrowest supported npm publishing auth model
- keep the publish workflow isolated from normal CI
- document secret ownership, rotation, and recovery

### Risk: install docs drift between npm, repo-local, and facilitator-skill paths

If docs disagree, participants and facilitators will choose the wrong installation path under time pressure.

Mitigation:

- make npm the default participant-facing install path
- retain repo-local install only in development or fallback sections
- update all CLI and skill docs in the same release slice

## Phased Implementation

### Phase 1: Define publication posture and release trigger

Goal: decide exactly when and how public npm publication happens.

Tasks:

- [x] Decide the release trigger:
  - git tag
  - GitHub Release
  - manual workflow dispatch
- [x] Choose the first-release ownership model:
  - who can publish
  - who approves version bumps
  - who owns rollback if a bad version ships
- [x] Decide whether trusted publishing is available or whether an npm token secret is required.
- [x] Define the semver policy for the first participant-facing releases.

Exit criteria:

- publication is explicit, not accidental
- the repo has one clear release trigger model
- semver and ownership rules are written down

### Phase 2: Prepare the package for public release

Goal: make `harness-cli` public-package ready at the metadata layer.

Tasks:

- [x] Remove `"private": true` from [`harness-cli/package.json`](../../harness-cli/package.json).
- [x] Verify the package name, scope, and public visibility posture for `@harness-lab/cli`.
- [x] Add any missing public package metadata that improves registry quality, at minimum:
  - description
  - repository
  - license
  - bugs/homepage if appropriate
- [x] Decide whether the package should expose a minimum Node engine requirement explicitly.
- [x] Verify that `npm pack` output contains only the intended files.

Exit criteria:

- the package can be published publicly without private-package blockers
- registry metadata is intentional rather than incidental

### Phase 3: Add npm publication workflow automation

Goal: publish through a dedicated workflow instead of local terminal action.

Tasks:

- [x] Add a new GitHub Actions workflow dedicated to CLI publication.
- [x] Make the workflow depend on the same verification posture already proven in CI:
  - CLI tests
  - `npm pack`
  - install smoke
  - command smoke
- [x] Gate the actual `npm publish` step behind the chosen trigger from Phase 1.
- [x] Ensure the workflow publishes from `harness-cli/` only, not from the repo root.
- [x] Add release output that records:
  - published version
  - package name
  - release tag or release URL

Exit criteria:

- npm publication does not rely on local manual packing
- the publish workflow is isolated, auditable, and repeatable

### Phase 4: Update docs and participant install guidance

Goal: make npm the default install story everywhere it should be.

Tasks:

- [x] Update [`harness-cli/README.md`](../../harness-cli/README.md) so npm install becomes the primary participant-facing path.
- [x] Update [`docs/harness-cli-publication-gate.md`](../harness-cli-publication-gate.md) from “deferred” to the new release posture.
- [x] Update any repo docs or skill docs that currently imply local-only installation.
- [x] Keep repo-local install documented as a development/fallback path, not as the main install path.
- [x] Add first-release notes that explain what commands are supported and what is still intentionally out of scope.

Exit criteria:

- participants see one obvious default install path
- development and fallback paths remain available but clearly secondary

### Phase 5: First-release validation and rollback posture

Goal: make the first public publish controlled and reversible at the operational level.

Tasks:

- [x] Define a dry-run checklist before the first public publish:
  - version bump verified
  - workflow trigger verified
  - install smoke verified from registry or dry-run equivalent
  - docs updated
- [x] Define rollback posture for a bad public release:
  - deprecate package version
  - publish a corrective patch if needed
  - switch docs temporarily if npm install must be paused
- [x] Decide whether GitHub Releases should also be produced alongside npm publication for traceability.
- [x] Add one post-publish verification checklist:
  - `npm view @harness-lab/cli version`
  - fresh global install
  - `harness --help`
  - one real auth/status smoke check against the intended environment

Exit criteria:

- the first public publish has a defined validation sequence
- there is a documented recovery path if the published version is bad

## Implementation Tasks

- [x] Confirm public npm publication as the active distribution decision for `@harness-lab/cli`.
- [x] Define release trigger, ownership, and semver rules.
- [x] Prepare `harness-cli/package.json` for public publication.
- [x] Add a dedicated npm publish workflow gated by CLI verification.
- [x] Update CLI and repo docs so npm is the default participant-facing install path.
- [x] Define rollback/deprecation steps for a bad release.
- [x] Dry-run the first release process before public publication.

## Acceptance Criteria

- The repository has a documented, explicit publication path for `@harness-lab/cli`.
- `harness-cli/package.json` is publishable publicly and no longer blocked by `"private": true`.
- npm publication is triggered only by an intentional release action, not by ordinary pushes to `main`.
- CLI verification gates run before any publish step.
- Participant-facing docs use npm install as the default CLI installation path.
- Repo-local installation remains documented as a development or fallback path.
- Rollback and deprecation posture for a bad npm release is documented.
- A new maintainer could follow the plan to perform the first public release without clarifying questions.

## References

- [`harness-cli/package.json`](../../harness-cli/package.json)
- [`harness-cli/README.md`](../../harness-cli/README.md)
- [`docs/harness-cli-foundation.md`](../harness-cli-foundation.md)
- [`docs/harness-cli-publication-gate.md`](../harness-cli-publication-gate.md)
- [`docs/plans/2026-04-07-feat-harness-cli-device-auth-and-secure-storage-plan.md`](2026-04-07-feat-harness-cli-device-auth-and-secure-storage-plan.md)
- [`.github/workflows/dashboard-ci.yml`](../../.github/workflows/dashboard-ci.yml)
