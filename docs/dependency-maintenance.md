# Dependency Maintenance

This document defines the package maintenance routine for the repository package roots:

- [`dashboard/package.json`](../dashboard/package.json)
- [`harness-cli/package.json`](../harness-cli/package.json)

## Supported Node Policy

- `dashboard` supports Node `22.x`
- `harness-cli` supports Node `22.x`
- do not use floating engine ranges such as `>=24` in package manifests

Reason:

- Vercel and local installs should stay on an intentional major
- the workshop should stay low-friction for participants and facilitators
- framework and type packages in this repo do not currently require Node 24

## Required Automated Checks

CI must keep both package roots under supply-chain checks:

- GitHub dependency review on pull requests
- installed dependency audit via `npm audit --audit-level=high`
- clean-install verification through the existing test/lint/build jobs

Dependency review and installed audit cover different risks:

- dependency review catches risky diff changes in pull requests
- installed audit catches known vulnerabilities in the resolved tree

## Manual Review Cadence

Run a version review when any of these are true:

- before a workshop or release window
- after a security advisory involving a shipped dependency
- when a framework major upgrade is being considered
- at least once per month during active development

Recommended commands:

```bash
cd dashboard
npm outdated
npm audit

cd ../harness-cli
npm outdated
npm audit
```

## Upgrade Policy

Prefer this order:

1. security fixes for shipped dependencies
2. framework-alignment fixes where companion packages should match
3. patch and minor updates that stay inside the existing compatibility strategy
4. elective major upgrades as separate work, not mixed into security remediation

Do not treat all latest versions as automatically desirable. The repo should intentionally defer upgrades that add migration cost without reducing immediate risk.

## Security-Sensitive Packages

Authentication, session, database, and deployment dependencies require stricter handling.

Current special case:

- `dashboard` still depends on `@neondatabase/auth@0.2.0-beta.1`
- the published package currently pins a vulnerable `better-auth` version in its direct subtree
- the repo applies an `overrides` entry to force `better-auth@1.4.9` until upstream Neon Auth publishes a safe release

This is a temporary compatibility measure, not a permanent end state.

When touching that dependency:

- re-check the latest published `@neondatabase/auth` version
- remove the override if upstream ships a safe dependency graph
- if upstream remains pinned to a vulnerable auth subtree, prefer replacing the SDK over carrying an indefinite exception

## Expected Review Output

Each review should record:

- current direct dependency versions
- intentionally deferred upgrades
- any active exceptions or overrides
- whether `npm audit` is clean for both package roots

If a critical audit finding exists in a shipped dependency path, the repo is not release-ready until the finding is removed or a short-lived, evidence-backed exception is documented.
