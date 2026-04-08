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
| `actions/setup-node` | `v6` | current major used with the Node 22 dashboard baseline and newer CLI smoke coverage |
| `actions/upload-artifact` | `v7` | current major used by the CLI publish dry-run |
| `actions/github-script` | `v8` | current major used for the Vercel promotion status |
| `actions/dependency-review-action` | `v4` | still the current major as of this update |

## Node runtime posture

The repository now has split Node posture by surface:

- [dashboard/package.json](../dashboard/package.json) is pinned to Node `22.x`
- [harness-cli/package.json](../harness-cli/package.json) declares a minimum floor of Node `>=22`

The workflows should keep the deployed dashboard surface on Node `22`, and should verify the participant CLI on both the baseline major and at least one newer major before treating the compatibility claim as trustworthy.

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

## Why `sast-semgrep` covers both dashboard and CLI

The repository now ships two executable public-facing surfaces:

- the hosted dashboard runtime
- the installable `@harness-lab/cli` participant package

That is intentional:

- the CLI is not just packaging glue; it is executable code that participants install locally
- dependency audit alone is not enough, because it says nothing about insecure code patterns in the repo-owned CLI sources
- Semgrep should therefore cover `harness-cli/bin`, `harness-cli/src`, and `harness-cli/scripts` in the default CI gate alongside the dashboard runtime paths

## Maintenance rule

When GitHub Actions emits a runtime deprecation warning:

1. check whether a newer upstream action major exists
2. prefer upgrading to the newer maintained action
3. if no safe maintained action exists, prefer a direct CLI or script invocation over a stale wrapper action
4. document the reason here if the choice is non-obvious

## Why `e2e-dashboard` is conditional

The `Dashboard CI` workflow scopes Playwright E2E to changes that touch:

- `dashboard/**`

That is intentional:

- Playwright is the highest-cost default job in this repository
- CLI-only, docs-only, and bundle-only changes should not spend the same hosted-runner budget as dashboard UI changes
- `deploy-ready` should still require E2E when dashboard behavior changed, but should accept a skipped E2E job when no dashboard surface changed

If a future change outside `dashboard/` genuinely needs the E2E suite, expand the scope rule deliberately instead of putting Playwright back on every workflow run by default.

## Why the macOS CLI leg uses a self-hosted runner

The macOS CLI jobs use the repository's self-hosted runner labels:

- `self-hosted`
- `macOS`
- `ARM64`

That is intentional:

- macOS hosted minutes are relatively expensive compared with the rest of this workflow
- the CLI matrix still needs one real macOS verification leg for packaging and install behavior
- the dedicated `Harness CLI Publish` workflow should use the same runner so release verification and npm publication do not move back onto hosted minutes
- the self-hosted leg now also verifies the CLI on a newer Node major so the published `engines` floor does not drift into wishful thinking
- using explicit labels is safer than bare `self-hosted`, because it avoids accidentally routing the job onto the wrong runner if more self-hosted capacity is added later

If the runner labels change, update [`dashboard-ci.yml`](../.github/workflows/dashboard-ci.yml), [`harness-cli-publish.yml`](../.github/workflows/harness-cli-publish.yml), and this note together.

## Why the publish workflow audits the CLI again

The normal `Dashboard CI` workflow already audits `harness-cli`, but the publish workflow now repeats `npm audit --audit-level=high` inside [`harness-cli-publish.yml`](../.github/workflows/harness-cli-publish.yml) before packaging or publication.

That is intentional:

- the CLI is a public install surface, so release-time dependency hygiene should not rely only on a previous branch CI run
- the extra audit is cheap because the CLI dependency tree is small
- a release job should fail closed if the resolved CLI dependency graph has high-severity findings at publish time
