---
title: "fix: repo dependency security hygiene"
type: plan
date: 2026-04-08
status: complete
confidence: medium
---

# Fix Repo Dependency Security Hygiene

Bring the `dashboard` and `harness-cli` package surfaces back under intentional control: remove known critical dependency risk, align framework-adjacent tooling, pin supported Node majors, and add repeatable audit checks so version health stops depending on manual spot checks.

## Problem Statement

The current repo is mostly current on core framework packages, but the version posture is not actually safe or reproducible:

- `dashboard` carries a critical `npm audit` finding through `@neondatabase/auth@0.2.0-beta.1`, which publishes `better-auth@1.4.6` while the patched floor for `GHSA-xg6x-h9c9-2m83` is `1.4.9`.
- `dashboard` runs `next@16.2.2` while `eslint-config-next` is pinned to `15.5.14`, so framework lint rules lag the runtime.
- both `dashboard` and `harness-cli` declare `"engines": { "node": ">=24" }`, which makes Vercel and future installs float to new Node majors instead of using a deliberate supported major.
- current CI includes GitHub dependency review, but that gate is PR-diff oriented; it does not replace a repo-level installed dependency audit or an intentional upgrade cadence.

This matters because Harness Lab explicitly teaches repository-native trust boundaries and operational discipline. A workshop repo that carries a known critical auth dependency and floating runtime majors is not meeting its own doctrine.

## Proposed Solution

Handle the work in two parallel tracks with one decision gate:

1. **Low-risk dependency hygiene**: align manifest and lockfile state, pin supported Node majors explicitly, upgrade compatible tooling packages with low migration risk, and remove local install residue so the repo proves clean from lockfiles.
2. **Auth dependency remediation**: treat `@neondatabase/auth` as a security exception until disproven, confirm whether the vulnerable `better-auth` path is reachable in the deployed facilitator auth flow, and replace or isolate the SDK if upstream Neon Auth remains pinned to the vulnerable dependency.
3. **Repeatable governance**: add CI-visible package audit checks for both package roots, document the supported Node policy and dependency-review cadence, and make future version drift observable before it reaches Vercel or production auth.

## Decision Rationale

This plan does not treat all outdated packages equally. The current evidence shows three distinct classes of work:

- **Critical security issue:** `@neondatabase/auth` is not a routine “upgrade later” dependency. It sits on the facilitator auth path and currently has no published safe successor in the same package line.
- **Safe alignment work:** `eslint-config-next` should match `next`; this is a straightforward correctness and tooling consistency fix.
- **Policy gap:** floating `>=24` engines and PR-only dependency review create future drift even if today’s package set is repaired.

The plan therefore prioritizes risk removal before cosmetic freshness. It avoids unnecessary churn such as forcing `TypeScript 6` or `ESLint 10` during the same pass, because those are optional modernization steps, not the source of current exposure.

### Alternatives Considered

**Alternative: bump everything to latest in one sweep**

Rejected because it mixes critical security remediation with elective framework/tooling migrations. That would make failures harder to interpret and increase rollback cost.

**Alternative: wait for Neon to ship a patched `@neondatabase/auth`**

Rejected as the default stance because the repo already has a known critical advisory in an auth dependency. Waiting is only acceptable if a short-term upstream release is verified and the current exploit conditions are conclusively inapplicable.

**Alternative: ignore `npm audit` because the advisory depends on 2FA settings**

Rejected because the package is on the live facilitator auth path and the repo’s stated trust boundary is stricter than “probably not exploitable in our current config.” If the package is vulnerable and unpatched upstream, the burden is to prove safety or remove the dependency.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| `dashboard` is the Vercel-built package that needs the strongest dependency posture | Verified | Current build logs and [dashboard/package.json](../../dashboard/package.json) |
| `harness-cli` is low risk from a dependency perspective | Verified | Single direct dependency (`chalk`) and zero audit findings in the current audit pass |
| `@neondatabase/auth` latest published version is still `0.2.0-beta.1` and it still pins `better-auth@1.4.6` | Verified | `npm view @neondatabase/auth version dependencies` during the audit |
| A safe in-place upgrade of `@neondatabase/auth` is currently available | Unverified | Current evidence points the other way; verify again before implementation starts |
| The Better Auth advisory is exploitable in the exact deployed facilitator flow | Unverified | Current repo code does not explicitly show 2FA configuration; needs targeted confirmation |
| `dashboard` can run on pinned `22.x` without losing required platform features | Verified | `next@16.2.2` requires `>=20.9.0`; current direct dependencies do not require Node 24 specifically |
| `harness-cli` should stay on Node 24 | Unverified | May be unnecessary and conflicts with the “zero-friction day-of install” principle |
| GitHub dependency review alone is enough to detect known installed vulnerabilities | Unverified | Current workflow suggests “no”; add explicit audit checks unless disproven |

Unverified assumptions must be resolved during implementation, not deferred informally.

## Risk Analysis

### Risk: auth dependency remediation turns into an architectural detour

If `@neondatabase/auth` has to be replaced rather than bumped, the work may touch middleware, session handling, bootstrap flows, and facilitator identity linking.

Mitigation:

- treat auth remediation as a decision-gated phase
- reuse the completed Neon auth migration plan and ADR as the baseline architecture
- keep low-risk dependency hygiene in a separate, releasable slice

### Risk: pinning Node majors exposes hidden reliance on Node 24 behavior

The repo currently floats on `>=24`; pinning may surface local assumptions masked by newer local installs.

Mitigation:

- verify the chosen Node major against `dashboard` build, lint, unit tests, and CLI tests
- document the supported Node major in package manifests and repo guidance

### Risk: package refresh churn destabilizes CI without improving security

Upgrading ESLint or TypeScript to new majors in the same pass may create migration work unrelated to the actual security finding.

Mitigation:

- constrain this effort to safe alignment and security fixes first
- defer elective major-tooling upgrades to a later modernization plan if desired

### Risk: CI still misses dependency regressions after this work

If the repo only keeps PR dependency diff checks, pre-existing or lockfile-level vulnerabilities can slip through again.

Mitigation:

- add explicit installed dependency audit checks for `dashboard` and `harness-cli`
- add a scheduled audit/outdated review job or documented maintenance runbook

## Phased Implementation

### Phase 1: Establish the supported dependency baseline

Exit criteria: package roots, current versions, latest available versions, and current advisories are captured in code-adjacent documentation or issue context; the supported Node policy is chosen.

- [x] Record the audited direct dependency baseline for `dashboard` and `harness-cli`, separating current, latest, and intentionally deferred upgrades.
- [x] Choose and document the supported Node major for `dashboard`.
- [x] Choose and document the supported Node major for `harness-cli`, with explicit consideration for participant/facilitator install friction.
- [x] Confirm whether any repo guidance, docs, or release workflows still imply floating Node majors or unchecked package drift.

### Phase 2: Ship low-risk package hygiene fixes

Exit criteria: lockfiles and manifests are aligned, Vercel/runtime Node behavior is deliberate, and framework-adjacent tooling matches the app version.

- [x] Replace floating engine ranges with explicit majors (`22.x` or `24.x`) in both package roots, based on Phase 1 decisions.
- [x] Align `dashboard` lint stack to Next 16 by upgrading `eslint-config-next` to the matching line.
- [x] Refresh low-risk patch/minor dependencies already within the approved compatibility window.
- [x] Clean extraneous install residue and regenerate lockfiles from a clean install so the committed lockfile matches the intended manifest state.
- [x] Prove the refreshed dependency set with a clean `dashboard` install, lint run, unit test run, and build.
- [x] Prove the refreshed dependency set with a clean `harness-cli` install and test run.

### Phase 3: Resolve the Neon Auth security exception

Exit criteria: `dashboard` no longer ships a known critical auth advisory, or there is a documented, evidence-backed temporary exception with bounded expiry and compensating controls.

- [x] Verify the exact exploit preconditions of `GHSA-xg6x-h9c9-2m83` against the current facilitator auth flow and Neon SDK behavior.
- [x] Re-check upstream `@neondatabase/auth` availability immediately before implementation to confirm whether a patched release exists.
- [x] If no safe upstream release exists, choose and document one remediation path.
- [x] Apply a narrow dependency override so the `@neondatabase/auth` subtree resolves to patched `better-auth@1.4.9` while upstream remains pinned.
- [x] Update the relevant ADR/runbook if the auth boundary or SDK choice changes.
- [x] Add or update auth-focused tests to prove sign-in, session validation, protected facilitator access, and sign-out on the chosen auth path.

If upstream later ships a safe `@neondatabase/auth` release, replace the override with the published package upgrade and remove the temporary exception.

If the override stops being viable before upstream fixes the package, the fallback options are:

- replace `@neondatabase/auth` with a supported auth client/server path that does not pin the vulnerable Better Auth version
- temporarily fall back to a safer facilitator auth mode with explicit operational constraints while a proper replacement lands

### Phase 4: Add repeatable dependency governance

Exit criteria: the repo has an executable package hygiene routine beyond manual audits.

- [x] Extend CI so both package roots run an installed dependency audit in addition to PR dependency review.
- [x] Decide whether `npm outdated` runs in CI, on a schedule, or in a documented maintenance runbook; encode that choice in the repo.
- [x] Ensure dependency failures are surfaced in the same promotion gate that already aggregates tests and security checks.
- [x] Document the maintenance routine: when to review direct dependencies, how to treat beta/security-sensitive packages, and how to respond to critical audit findings.

### Phase 5: Close the loop with operational documentation

Exit criteria: future contributors can understand the policy without reconstructing this audit from logs.

- [x] Update the relevant docs to reflect the supported Node policy and dependency review posture.
- [x] Add a short repo-native note explaining why `@neondatabase/auth` was retained, replaced, or exceptioned.
- [x] Capture the version-audit outcome in a durable artifact so the next maintenance pass can compare against an explicit baseline.

## Implementation Tasks

- [x] Research and decide the supported Node major policy for `dashboard` and `harness-cli`.
- [x] Align low-risk `dashboard` dependencies and committed lockfile state.
- [x] Verify `dashboard` and `harness-cli` on clean installs with the pinned Node policy.
- [x] Investigate the Neon Auth advisory path and choose the remediation strategy.
- [x] Implement the selected Neon Auth remediation and prove facilitator auth behavior.
- [x] Add CI-level installed dependency audit checks for both package roots.
- [x] Update docs/runbooks/ADR references so dependency governance is repo-native.

## Acceptance Criteria

- [x] `dashboard` and `harness-cli` declare explicit supported Node majors rather than floating `>=24` ranges.
- [x] `dashboard` no longer has a known critical `npm audit` finding in the committed dependency graph.
- [x] `dashboard` framework-adjacent tooling is aligned with `next@16`.
- [x] Clean-install verification passes for both package roots under the chosen Node policy.
- [x] CI includes both PR dependency review and a repeatable installed dependency audit path.
- [x] The repo documents how to audit, upgrade, and exception security-sensitive dependencies.
- [x] Any auth boundary or SDK change is reflected in the relevant ADR/runbook material.

## References

- Existing migration baseline: [docs/plans/2026-04-06-feat-neon-auth-facilitator-migration-plan.md](2026-04-06-feat-neon-auth-facilitator-migration-plan.md)
- Existing auth decision: [docs/adr/2026-04-06-neon-auth-for-facilitator-identity.md](../adr/2026-04-06-neon-auth-for-facilitator-identity.md)
- Current security gate: [docs/private-workshop-instance-security-gates.md](../private-workshop-instance-security-gates.md)
- Current CI gate: [.github/workflows/dashboard-ci.yml](../../.github/workflows/dashboard-ci.yml)
- Current dashboard manifest: [dashboard/package.json](../../dashboard/package.json)
- Current CLI manifest: [harness-cli/package.json](../../harness-cli/package.json)
- Better Auth advisory: https://github.com/advisories/GHSA-xg6x-h9c9-2m83
- Vercel Node engine override behavior: https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
