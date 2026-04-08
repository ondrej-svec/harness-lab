# Harness CLI Publication Gate

The `@harness-lab/cli` package is participant-facing and publishable publicly, but only through an explicit release workflow.

## Current Decision

Public npm publication is **enabled behind an explicit release gate**.

Default posture:

- participants install with `npm install -g @harness-lab/cli`
- development still happens from this repository
- public publish happens only from the dedicated GitHub Actions workflow
- routine pushes to `main` must never publish to npm automatically

Release trigger:

- actual npm publication happens on a published GitHub Release whose tag matches `harness-cli-v<package-version>`
- dry-run verification can be executed through `workflow_dispatch` on the `Harness CLI Publish` workflow

Current workflow auth model:

- GitHub Actions uses the `NPM_TOKEN` repository secret for `npm publish`
- trusted publishing can replace this later, but it is not required for the first release path

Release ownership:

- a release is initiated by a maintainer with GitHub Release permissions on this repository
- the same maintainer, or another designated maintainer with npm org publish rights, owns rollback if a bad version ships
- version bumps should be reviewed like any other user-facing surface change, not treated as mechanical noise

Semver posture:

- patch releases for fixes, doc-safe packaging changes, and low-risk CLI behavior corrections
- minor releases for new participant-facing commands or meaningful UX expansion within the current CLI model
- major releases only when breaking install, auth, command, or storage expectations intentionally

## Required Gate

All of the following must be true before public npm publication:

- device/browser auth is the default documented login path
- file-based local session storage is the documented default CLI posture
- optional OS-native storage overrides remain documented for facilitators who want them
- dashboard-side device auth routes, approval flow, audit logging, and bearer-session validation are covered by tests
- CLI integration tests cover login, status, logout, and at least one facilitator workshop command
- cross-platform CI runs the CLI auth/storage test matrix on macOS, Windows, and Linux
- CLI source paths are included in repository Semgrep scanning
- release verification runs `npm audit --audit-level=high` for `harness-cli`
- cross-platform CI proves the packed CLI can install the portable workshop skill bundle into an arbitrary repo path
- release verification proves `harness skill install` reports the correct state on rerun: installed, refreshed, or already current
- `npm pack` succeeds in CI
- an install smoke test proves the packed tarball can be installed and the `harness` binary starts
- the packed tarball contains the intended portable workshop bundle assets
- the generated packaged bundle and repo-local bundle pass portability verification:
  - no author-machine absolute repo paths in participant-facing bundled content
  - no bundled markdown links to local files that are not actually shipped
  - generated bundle outputs are in sync with the authored source
- rollback posture is documented for disabling device auth or npm distribution if regressions are found
- the release tag matches the version in `harness-cli/package.json`
- the publish workflow is initiated intentionally rather than by ordinary branch merges

Note:

- the default `Dashboard CI` workflow may skip `e2e-dashboard` when a change does not touch `dashboard/**`
- that skip is acceptable for CLI-only publication readiness; the CLI release gate still relies on the dedicated CLI smoke checks and the `Harness CLI Publish` workflow verification

## Release Smoke Checks

The CLI release smoke checks are:

- `cd harness-cli && npm audit --audit-level=high`
- `cd harness-cli && npm test`
- `cd harness-cli && npm run verify:workshop-bundle`
- `cd harness-cli && npm pack`
- install the packed tarball in a temporary Node project
- run `./node_modules/.bin/harness --help`
- run `./node_modules/.bin/harness skill install --target ./sample-repo`
- rerun `./node_modules/.bin/harness skill install --target ./sample-repo` and confirm it reports the target as already current

## First Release Checklist

Before the first public release:

- confirm `@harness-lab/cli` is still the intended package name and scope
- confirm `NPM_TOKEN` exists in GitHub Actions with publish rights for the `harness-lab` organization
- confirm the version in `harness-cli/package.json` is the intended public version
- create a GitHub Release tagged `harness-cli-v<package-version>`
- let the `Harness CLI Publish` workflow complete successfully
- verify the published version with `npm view @harness-lab/cli version`
- perform a fresh install with `npm install -g @harness-lab/cli`
- run `harness --help`
- run one real facilitator auth/status smoke check against the intended environment

## Rollback Posture

If the brokered device flow or local session storage behavior regress:

- stop new npm publication immediately
- deprecate the bad version with `npm deprecate @harness-lab/cli@<version> "<message>"`
- publish a corrective patch release if needed
- keep local-repo installation as the fallback path
- instruct facilitators to use explicit bootstrap modes only for controlled recovery
- ship the fix before reopening the release gate
