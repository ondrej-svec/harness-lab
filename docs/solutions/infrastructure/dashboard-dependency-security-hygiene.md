---
title: "Dashboard dependency security hygiene and Next 16 lint migration"
type: solution
date: 2026-04-08
domain: infrastructure
component: dashboard dependency stack
symptoms:
  - "Vercel ignored the project Node setting because package.json used engines.node >=24"
  - "npm audit reported a critical vulnerability through @neondatabase/auth -> better-auth"
  - "eslint crashed with a circular structure error after upgrading eslint-config-next to 16.2.2"
  - "next build surfaced implicit-any type errors after the lint and TypeScript stack was aligned"
root_cause: "The dashboard dependency stack had drifted: Node major selection was floating, @neondatabase/auth still published a vulnerable better-auth subtree, and the repo was using an old FlatCompat ESLint pattern that is incompatible with eslint-config-next 16 flat-config exports."
severity: high
related:
  - "../../dependency-maintenance.md"
  - "../../plans/2026-04-08-fix-repo-dependency-security-hygiene-plan.md"
---

# Dashboard dependency security hygiene and Next 16 lint migration

## Problem

The dashboard package looked mostly current, but the actual runtime and supply-chain posture had three separate failures:

1. Vercel warned that the project-level Node setting was being ignored because `dashboard/package.json` used `engines.node: ">=24"`.
2. `npm audit` reported a critical advisory on the live facilitator auth path through `@neondatabase/auth@0.2.0-beta.1`, which published `better-auth@1.4.6` even though the patched floor for `GHSA-xg6x-h9c9-2m83` was `1.4.9`.
3. After aligning `eslint-config-next` to the installed `next@16.2.2`, linting failed with a circular JSON/config error and the stricter toolchain exposed previously hidden TypeScript issues in admin pages.

The repo also had no installed-dependency audit in CI, so even after a manual local cleanup the same drift could have returned unnoticed.

## Root Cause

This was not one bug. It was dependency-policy drift:

- the package manifests used floating Node engine ranges, so runtime selection was not intentional
- the dashboard lint stack lagged behind the framework version
- the repo still used `FlatCompat` to load Next lint rules, but `eslint-config-next@16` ships native flat-config arrays and should be imported directly
- the Neon Auth package had no newer published safe release, so the vulnerable transitive dependency had to be addressed at resolution time rather than by a normal direct upgrade
- CI only had pull-request dependency review, which checks the diff, not the fully resolved installed tree

## Fix

Apply the remediation in four slices:

1. Pin Node majors explicitly:
   - set `dashboard` and `harness-cli` to `engines.node: "22.x"`
   - update GitHub Actions jobs that install Node so CI and package policy agree

2. Align low-risk package versions:
   - upgrade `eslint-config-next` to `16.2.2` to match `next@16.2.2`
   - refresh low-risk dev tooling versions already compatible with the existing stack
   - regenerate both lockfiles from a clean install

3. Replace the old ESLint adapter pattern:
   - remove `FlatCompat` usage from `dashboard/eslint.config.mjs`
   - import `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript` directly
   - keep local ignores as a small wrapper config

4. Patch the vulnerable auth subtree narrowly:
   - add an `overrides` entry in `dashboard/package.json` forcing `@neondatabase/auth` to resolve `better-auth@1.4.9`
   - verify with `npm explain better-auth` that the vulnerable subtree is patched
   - verify with `npm audit` that the committed tree is clean

After the dependency alignment, fix any newly surfaced lint/type issues rather than suppressing the upgraded rules. In this case:

- the theme switcher moved from `useEffect(() => setMounted(true), [])` to `useSyncExternalStore(...)` to satisfy the React lint rule surfaced by the newer config
- two admin pages needed explicit typing on `Promise.all` results so `next build` stopped inferring `any` in callbacks

## Prevention

- Keep package roots on explicit supported Node majors, never floating `>=` majors for deployed apps.
- When upgrading `eslint-config-next` to a new major line, check whether it exports native flat config before reaching for `FlatCompat`.
- Treat auth, session, database, and deployment packages as security-sensitive dependencies. If upstream publishes a vulnerable transitive subtree and no safe release exists yet, use a narrow override only as a temporary bridge.
- Run both:
  - pull-request dependency review
  - installed dependency audit (`npm audit --audit-level=high`)

- Capture the package policy in repo-native docs so the next maintainer knows which upgrades are intentionally deferred and why.

## Related

- [dependency-maintenance.md](../../dependency-maintenance.md)
- [2026-04-08-fix-repo-dependency-security-hygiene-plan.md](../../plans/2026-04-08-fix-repo-dependency-security-hygiene-plan.md)
- GitHub advisory: `GHSA-xg6x-h9c9-2m83`
