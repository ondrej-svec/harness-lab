# GitHub Actions Maintenance

This note records the current workflow action posture for Harness Lab and the reasons behind a few non-obvious choices.

## Current pinned action majors

Primary workflow files:

- [dashboard-ci.yml](../.github/workflows/dashboard-ci.yml)
- [harness-cli-publish.yml](../.github/workflows/harness-cli-publish.yml)

Current action majors:

| Action | Version | Why |
|--------|---------|-----|
| `actions/checkout` | `v6` | current major used across CI and publish workflows |
| `actions/setup-node` | `v6` | current major used with the Node 24 baseline |
| `actions/upload-artifact` | `v7` | current major used by the CLI publish dry-run |
| `actions/github-script` | `v8` | current major used for the Vercel promotion status |
| `actions/dependency-review-action` | `v4` | still the current major as of this update |

## Node runtime posture

The repository runtime baseline is Node 24:

- [dashboard/package.json](../dashboard/package.json)
- [harness-cli/package.json](../harness-cli/package.json)

The workflows should request `node-version: 24` and should prefer current action majors instead of relying on temporary compatibility flags.

## Why `gitleaks` is CLI-based instead of `gitleaks-action`

`gitleaks/gitleaks-action@v2` is still implemented on the deprecated `node20` action runtime. Because there is no newer major that moves that action onto the newer GitHub Actions runtime, Harness Lab uses the maintained `gitleaks` CLI release directly in [`dashboard-ci.yml`](../.github/workflows/dashboard-ci.yml).

That choice is intentional:

- it removes the deprecated Node 20 action runtime warning from CI
- it keeps the secret scan on the maintained upstream `gitleaks` binary
- it avoids depending on a stale wrapper action when the underlying scanner is current

## Why the secret scan is commit-scoped

The `secret-scan` job uses `gitleaks git --log-opts=...` scoped to the pushed or pull-request commit range instead of scanning the entire repository history on every run.

That is also intentional:

- full-history scans on every CI run would repeatedly fail on older committed test fixtures
- commit-scoped scanning matches the expected gate behavior for push and PR verification
- the workflow still checks newly introduced secrets before merge or release

If the repository ever needs a one-off historical audit, run a dedicated full-history `gitleaks` scan outside the normal merge gate rather than changing the default CI behavior.

## Maintenance rule

When GitHub Actions emits a runtime deprecation warning:

1. check whether a newer upstream action major exists
2. prefer upgrading to the newer maintained action
3. if no safe maintained action exists, prefer a direct CLI or script invocation over a stale wrapper action
4. document the reason here if the choice is non-obvious
