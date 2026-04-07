# Harness CLI Publication Gate

The `@harness-lab/cli` package is not ready for public npm publication just because `npm pack` succeeds.

## Current Decision

The first npm release is **deferred until post-workshop hardening**.

Until this document is updated deliberately, the CLI is limited to:

- local package install from this repository
- internal preview use inside workshop operations

## Required Gate

All of the following must be true before public npm publication:

- device/browser auth is the default documented login path
- native secure storage is the default on macOS, Windows, and Linux
- `HARNESS_SESSION_STORAGE=file` is only an explicit fallback, not an implicit default
- dashboard-side device auth routes, approval flow, audit logging, and bearer-session validation are covered by tests
- CLI integration tests cover login, status, logout, and at least one facilitator workshop command
- cross-platform CI runs the CLI auth/storage test matrix on macOS, Windows, and Linux
- `npm pack` succeeds in CI
- an install smoke test proves the packed tarball can be installed and the `harness` binary starts
- rollback posture is documented for disabling device auth or npm distribution if regressions are found

## Release Smoke Checks

The CI release smoke checks for the CLI are:

- `cd harness-cli && npm test`
- `cd harness-cli && npm pack`
- install the packed tarball in a temporary Node project
- run `./node_modules/.bin/harness --help`

## Rollback Posture

If the brokered device flow or secure storage backends regress:

- stop npm publication immediately
- keep local-repo installation as the fallback path
- instruct facilitators to use explicit bootstrap modes only for controlled recovery
- ship the fix before reopening the release gate
