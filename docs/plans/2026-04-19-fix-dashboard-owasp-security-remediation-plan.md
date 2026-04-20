---
title: "fix: dashboard OWASP security remediation"
type: plan
date: 2026-04-19
status: complete
brainstorm: null
confidence: medium
---

# Dashboard OWASP security remediation

Close the exploitable dashboard security gaps surfaced by the OWASP-focused review, starting with participant authorization failures and unsafe participant-controlled link handling, then harden facilitator auth semantics and the verification boundary that should prevent these regressions from shipping again.

## Problem statement

The current dashboard implementation diverges from the repo's documented auth boundary in several security-critical ways:

1. Participant-authenticated mutation routes allow a participant to edit or post updates for any team in the same workshop instance, not just the participant's assigned team.
2. Some participant-authenticated read routes validate the session cookie but then read state from the deployment default instance instead of the session-scoped `instanceId`.
3. Participant-controlled `repoUrl` values are accepted as any syntactically valid URL and are later rendered into clickable anchors on participant and facilitator-visible surfaces.
4. Facilitator workspace-level access in Neon mode currently treats any authenticated Neon user as platform-authorized for instance enumeration and creation, while per-instance access can still be auto-bootstrapped on first access.
5. Session-cookie hardening and security-focused regression coverage are incomplete, and the current Vitest baseline is already red due to an unrelated regression. That means the repo's executable trust boundary is weaker than the docs claim.

This matters because the top two issues are direct OWASP A01 Broken Access Control failures, the `repoUrl` issue is an active-content / injection risk, and the facilitator-access semantics create ambiguity around who is allowed to create or claim workshop instances. Even if only some of these are currently reachable in production, the code path is permissive enough that the boundary is being enforced by convention rather than by the application.

## Target end state

When this lands:

- participant sessions are strictly scoped to one `instanceId` for both reads and writes
- participant writes are additionally scoped to the caller's assigned team when the action is team-specific
- participant-controlled URLs are constrained to safe schemes before they can be persisted or rendered
- facilitator workspace operations have an explicit authorization rule that matches the documented boundary instead of "authenticated user implies platform access"
- participant and facilitator session cookies use production-safe attributes in hosted environments
- the security-sensitive routes named in this plan are covered by focused tests that would fail if these access-control or validation regressions return
- the repo's security docs and ADRs still describe reality after the implementation choices settle

## Scope and non-goals

### In scope

- participant team-mutation authorization
- participant check-in authorization
- participant read-route instance scoping for the reviewed endpoints
- shared validation for participant-controlled repository URLs
- facilitator platform/workspace authorization semantics for instance list/create and first-instance bootstrap behavior
- participant session-cookie hardening for hosted deployments
- security-focused tests and release-gate expectations for the touched routes
- docs and ADR updates required by any boundary change

### Non-goals

- replacing Neon Auth with a different identity provider
- redesigning the dashboard routing model or workshop-instance topology
- broad refactors of unrelated workshop-state normalization
- fixing every pre-existing red test in the dashboard package unless one directly blocks security verification for this plan
- implementing a general-purpose URL sanitization system for arbitrary rich text
- reworking all participant routes that were not implicated by the review

## Proposed solution

Implement the fix in five phases:

1. **Lock the security contract and verification slice.**
   Capture the exact routes and behaviors being fixed, decide how to handle the already-red test baseline, and add focused coverage that proves the intended boundary.
2. **Close participant broken-access-control gaps.**
   Force participant reads to use `access.session.instanceId`, and require participant write routes to derive the caller's effective team membership server-side before mutating state.
3. **Harden participant-controlled input and cookies.**
   Centralize safe repository-URL validation, reject unsafe schemes, and set production-safe cookie attributes for participant session issuance and revocation.
4. **Tighten facilitator workspace/platform authorization.**
   Replace the current "authenticated Neon user can operate platform-level workspace actions" behavior with an explicit platform-role or bootstrap-only flow that matches the ADR.
5. **Align docs and shipping gates.**
   Update the boundary docs/ADR if behavior changed, run the relevant focused checks, and record any broader baseline-test debt that still blocks a full green suite.

## Detailed plan level

This is a **detailed** plan because it touches access control, authentication, session handling, participant-private data boundaries, release verification, and a live discrepancy between code and the accepted auth ADR.

## Decision rationale

### Why participant authorization fixes go first

They are the clearest exploitable gaps, they affect normal participant traffic, and they violate the repo's stated rule that participant sessions may read only participant-safe context for one workshop instance and may never unlock broader operations.

### Why reads and writes are split into separate subproblems

The read bug is instance scoping. The write bug is team ownership. They are related but not the same failure class:

- read endpoints must always select the correct workshop instance
- write endpoints must additionally confirm the caller is allowed to mutate the targeted team

Treating them separately keeps the acceptance criteria sharp and avoids hiding one regression behind the other.

### Why `repoUrl` needs an allowlist, not "better parsing"

The existing code already parses URLs. The bug is that parsing alone accepts dangerous schemes such as `javascript:`. The correct fix is a shared allowlist of explicitly safe schemes and, if needed, a separate local-development exception for `http://localhost`.

### Why facilitator platform authorization needs an explicit rule

The ADR says facilitator actions require an `instance_grant` or an explicit global operator role. The code currently has neither for platform-level workspace routes:

- workspace endpoints pass `instanceId: null`
- the auth service treats that as success for any authenticated Neon user
- per-instance access can then auto-bootstrap ownership when no grant exists

That combination creates ambiguity about who is allowed to enumerate, create, and claim instances. A security fix should remove ambiguity, not document it more clearly.

### Why the plan does not automatically absorb the unrelated red Vitest baseline

The current test failures are broader than this security slice and are centered on an unrelated `normalizeParticipantPollDefinition` regression. Pulling the whole baseline repair into this plan would turn a bounded security remediation into a mixed security-plus-content/runtime repair. This plan instead requires:

- focused security-route tests to pass
- an explicit coordination note if a full green dashboard suite is still blocked by unrelated pre-existing failures

If the baseline regression must be fixed to run the touched security tests reliably, that fix becomes a prerequisite task, not silent scope creep.

## Constraints and boundaries

- Honor the accepted auth boundary in [`docs/adr/2026-04-06-private-workshop-instance-auth-boundary.md`](../adr/2026-04-06-private-workshop-instance-auth-boundary.md).
- Preserve the current public/private taxonomy in [`docs/public-private-taxonomy.md`](../public-private-taxonomy.md) and [`docs/private-workshop-instance-data-classification.md`](../private-workshop-instance-data-classification.md).
- Do not introduce facilitator-only controls or data onto participant routes.
- Do not weaken the current file-mode local-development fallback unless the replacement remains documented and locally operable.
- Prefer server-side authorization derived from repositories and grants over client-submitted identifiers.
- Use focused, executable checks as the trust boundary for the touched routes.

## Propagation rule

Use one representative proof slice first, then propagate mechanically:

- **Proof slice 1:** one participant read route plus one participant write route
- **Proof slice 2:** one facilitator platform/workspace route
- **Proof slice 3:** one session-cookie issuance path

Only after the proof slices are covered by tests and pass should the same pattern be applied across the rest of the routes in scope.

## Session-state artifact

This plan document is the authorization artifact for the work. During implementation, the handoff artifact must also include:

- the exact route list fixed in each phase
- the tests added or updated for those routes
- any remaining routes intentionally deferred, with reason
- whether the unrelated red Vitest baseline was repaired, worked around for focused verification, or left as an explicit blocker

If work stops mid-stream, update this plan with checkbox state and a short note under the active phase before handing off.

## Assumptions

| Assumption | Status | Evidence |
| --- | --- | --- |
| Participant team membership is already persisted in a form the API can query server-side | Verified | `dashboard/lib/team-member-repository.ts` and `findMemberByParticipant` are already used by the participant page |
| The reviewed participant write routes are intended to be limited to the caller's own team, not all teams in the instance | Verified | This follows the participant-private model and the current participant UI, which derives one active team from membership |
| `repoUrl` is intended to point to an actual repository location, not an arbitrary URI scheme | Verified | The field is rendered as "Open repo" / clone commands on participant-facing surfaces |
| Hosted deployments can safely distinguish secure-cookie behavior from local file-mode development | Verified | The repo already distinguishes Neon hosted mode vs local file mode in auth/runtime config |
| Platform-level facilitator actions truly need either an explicit operator role or a narrower bootstrap rule | Verified | The accepted ADR states this directly |
| A focused security test slice can be run even if the broader dashboard test suite remains red | Likely but unverified | Existing route tests are already file-scoped; verify during implementation |
| The current auto-bootstrap behavior for first-instance ownership is not required for every authenticated Neon user in production | Unverified | Confirm intended facilitator-ops workflow before finalizing the implementation choice |
| No other participant routes outside this reviewed set rely intentionally on default-instance fallback semantics | Unverified | Requires a quick audit during Phase 1 to avoid fixing only half the pattern |

Unverified assumptions become explicit investigation tasks below.

## Risk analysis

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Participant write authorization is tightened incorrectly and blocks legitimate same-team collaboration | Medium | Medium | Derive authorization from team-membership records and preserve team-shared writes while rejecting cross-team writes |
| Instance scoping is fixed for one route family but left inconsistent elsewhere | Medium | High | Run a route inventory during Phase 1 and apply the pattern deliberately rather than ad hoc |
| URL allowlisting breaks legitimate local-development repository links | Low | Medium | Allow `https:` by default and explicitly decide whether `http:` is allowed only for localhost/dev |
| Facilitator platform-role changes lock out legitimate operators on existing deployments | Medium | High | Choose a backwards-compatible bootstrap path, document it, and test the first-facilitator / first-instance path explicitly |
| The current red test baseline obscures whether the security slice is actually verified | High | Medium | Add focused tests for the touched routes and record whether broader failures are pre-existing and unrelated |
| Docs are left stale after auth/authorization semantics change | Medium | Medium | Make doc updates a completion gate, not a follow-up suggestion |
| Cookie hardening is applied in a way that breaks local development or preview flows | Low | Medium | Make `secure` conditional on hosted HTTPS/runtime configuration and verify both hosted and local expectations |

## Phased implementation

### Phase 0: Security contract and verification gate

Goal: lock the exact remediation surface and make sure the team has a trustworthy way to verify it.

Tasks:

- [x] Inventory the reviewed routes and helpers that need changes:
  - `dashboard/app/api/teams/route.ts`
  - `dashboard/app/api/checkpoints/route.ts`
  - `dashboard/app/api/event-context/core/route.ts`
  - `dashboard/app/api/event-context/teams/route.ts`
  - `dashboard/app/api/event-context/teams/[teamId]/route.ts`
  - `dashboard/app/api/participant/teams/[teamId]/check-in/route.ts`
  - `dashboard/lib/event-access.ts`
  - `dashboard/lib/workshop-store.ts`
  - facilitator workspace routes and auth helpers implicated by platform access
- [x] Decide whether the unrelated `normalizeParticipantPollDefinition` regression must be repaired before focused security verification can run. If yes, either fix it as a prerequisite or explicitly block the security implementation until that prerequisite lands.
- [x] Add or update focused tests that express the intended security contract before implementation where practical:
  - participant cannot mutate another team's state
  - participant reads resolve state from `access.session.instanceId`
  - unsafe `repoUrl` schemes are rejected
  - unauthorized authenticated facilitator cannot perform platform-level workspace actions without explicit authorization

Exit criteria:

- the remediation route list is explicit
- the team knows which test command(s) will serve as the trust boundary for this plan
- any prerequisite caused by the unrelated red baseline is explicitly resolved or documented

### Phase 1: Close participant instance-scoping and team-ownership gaps

Goal: make participant session scope real on both reads and writes.

Tasks:

- [x] Update participant-authenticated read routes that currently call `getWorkshopState()` without the session instance so they always use `access.session.instanceId`.
- [x] Audit adjacent participant-authenticated routes for the same default-instance pattern and fix any matching case in scope.
- [x] Refactor participant write routes to derive the caller's team membership server-side from `participantId` plus team-membership data.
- [x] Reject cross-team writes with a clear authorization failure instead of allowing any `teamId` in the instance.
- [x] Preserve the intended same-team collaboration model if multiple participants share one team.
- [x] Add route-level tests for both allowed same-team writes and denied cross-team writes.

Exit criteria:

- participant reads no longer fall back to the default instance
- participant writes are limited to the caller's assigned team
- the new tests fail without the fix and pass with it

### Phase 2: Harden participant-controlled URL input and rendering

Goal: prevent unsafe participant-controlled repository links from being stored or rendered.

Tasks:

- [x] Introduce a shared repository-URL validator in the dashboard domain layer instead of route-local `new URL(...)` checks.
- [x] Restrict allowed schemes to explicit safe values and document any local-development exception.
- [x] Apply the validator to all code paths that persist or update team `repoUrl`.
- [x] Review participant and facilitator-rendered surfaces that link to `repoUrl` and confirm they only receive validated values from persistence.
- [x] Add focused tests for unsafe schemes such as `javascript:` and other non-http(s) inputs.

Exit criteria:

- unsafe URI schemes are rejected before persistence
- participant-visible "Open repo" links can only target approved schemes
- validation behavior is centralized rather than duplicated

### Phase 3: Tighten facilitator workspace/platform authorization

Goal: bring workspace-level facilitator access into line with the accepted ADR.

Tasks:

- [x] Decide the intended rule for platform-level workspace actions:
  - explicit global operator role
  - tightly-scoped bootstrap flow for first setup only
  - or another rule that still matches the ADR
- [x] Remove the current implicit "authenticated Neon user is platform-authorized" behavior for `instanceId: null` routes.
- [x] Revisit auto-bootstrap behavior for per-instance owner grants so it cannot be used as an unintended privilege-escalation path.
- [x] Add focused tests for:
  - unauthorized authenticated user denied workspace list/create
  - explicitly authorized operator allowed
  - intended first-time bootstrap path still works
- [x] Update self-hosting or facilitator-ops docs if the bootstrap flow changes.

Exit criteria:

- workspace-level authorization is explicit
- first-instance bootstrap behavior is intentional and tested
- the code no longer relies on ambiguous platform success for any authenticated user

### Phase 4: Harden participant session cookie posture

Goal: ensure participant session cookies match hosted-production expectations without breaking local development.

Tasks:

- [x] Audit all participant session set/clear paths:
  - homepage server action
  - event-access redeem API
  - participant logout action
  - event-access logout API
- [x] Introduce shared cookie-option helpers if needed so the same security attributes are used consistently.
- [x] Set production-safe attributes, especially `secure` in hosted HTTPS environments.
- [x] Verify logout/revocation still clears the cookie correctly in both local and hosted modes.
- [x] Add tests for cookie attributes where the current test harness supports them.

Exit criteria:

- participant session cookies use consistent security attributes
- hosted environments get secure cookies
- local development remains functional and documented

### Phase 5: Docs, release gate, and handoff

Goal: leave the boundary clearer and the next safe move obvious.

Tasks:

- [x] Update any docs or ADR text that changed in substance during implementation:
  - auth-boundary ADR
  - security gates doc
  - self-hosting guidance if bootstrap behavior changed
- [x] Record the exact focused verification commands used for this plan in the final handoff note or plan update.
- [x] If the broader dashboard suite is still red due to unrelated issues, document that explicitly as a residual risk or prerequisite for merge/release.
- [x] Add a short note under this plan's completion state naming any routes intentionally deferred.

Exit criteria:

- docs match implemented behavior
- verification steps are durable, not chat-only
- any remaining non-security blocker is explicit

## Implementation tasks

Dependency-ordered tracker for `$work`:

- [x] Confirm the focused verification strategy and whether the unrelated red Vitest baseline is a prerequisite.
- [x] Add security-contract tests for participant instance scoping, participant team ownership, unsafe `repoUrl`, and facilitator workspace authorization.
- [x] Fix participant read-route instance scoping.
- [x] Fix participant team-write authorization for team edits and check-ins.
- [x] Centralize safe repository-URL validation and apply it to all persistence paths in scope.
- [x] Implement explicit facilitator workspace/platform authorization and tighten bootstrap semantics.
- [x] Harden participant session cookie attributes across issue/revoke paths.
- [x] Update docs/ADR text and record residual verification or rollout risks.

## Acceptance criteria

- [x] A participant session for instance B cannot read teams or checkpoints from instance A through the reviewed routes.
- [x] A participant cannot update another team's name, members, repo URL, or check-ins by guessing another `teamId`.
- [x] Unsafe `repoUrl` inputs such as `javascript:alert(1)` are rejected server-side.
- [x] The participant and facilitator-visible surfaces render only validated repository URLs for team links.
- [x] An authenticated Neon user without explicit platform authorization cannot enumerate or create workshop instances through workspace-level routes.
- [x] The intended bootstrap path for the first legitimate facilitator/operator is still functional and documented.
- [x] Participant session cookies are issued with hosted-production-safe attributes and still clear correctly on logout.
- [x] Focused security-route tests pass for the touched behavior.
- [x] Any remaining red dashboard tests outside this slice are explicitly documented as pre-existing and unrelated, or are repaired if they block trustworthy verification.

## Completion note

Focused verification command used for this slice:

```bash
cd dashboard
npm test -- --run '__tests__/api/teams/route.test.ts' '__tests__/api/checkpoints/route.test.ts' '__tests__/api/event-context/teams/[teamId]/route.test.ts' '__tests__/api/participant/teams/check-in-route.test.ts' '__tests__/api/workshop/instances/route.test.ts' 'lib/facilitator-auth-service.neon.test.ts' 'lib/facilitator-access.test.ts' 'lib/event-access.test.ts' 'lib/facilitator-session.test.ts'
npm run lint
```

Residual repo-wide blockers outside this remediation slice:

- `cd dashboard && npm test` still fails in unrelated presenter/public/admin tests that reflect active agenda-surface work already present in the dirty worktree, for example `app/admin/instances/[id]/page.test.tsx`, `app/page.test.tsx`, and `app/participant/page.test.tsx`.
- `cd dashboard && npm run build` now gets past compilation and fails during type-check on an unrelated pre-existing admin surface error in `app/admin/instances/[id]/_components/sections/run-section.tsx` (`state.liveMoment` missing from the narrowed state type).

Routes intentionally deferred:

- no additional participant-authenticated default-instance leaks were found in the adjacent reviewed `event-context` routes; public facilitator and public participant routes outside this review were left unchanged

## References

- Security review findings from 2026-04-19 session
- Auth boundary ADR: [`docs/adr/2026-04-06-private-workshop-instance-auth-boundary.md`](../adr/2026-04-06-private-workshop-instance-auth-boundary.md)
- Public/private taxonomy: [`docs/public-private-taxonomy.md`](../public-private-taxonomy.md)
- Data classification: [`docs/private-workshop-instance-data-classification.md`](../private-workshop-instance-data-classification.md)
- Security gates: [`docs/private-workshop-instance-security-gates.md`](../private-workshop-instance-security-gates.md)
- Related prior plan: [`docs/plans/archive/2026-04-06-feat-private-workshop-instance-hardening-plan.md`](archive/2026-04-06-feat-private-workshop-instance-hardening-plan.md)
- Official OWASP Top 10 reference used for categorization:
  - A01 Broken Access Control: https://owasp.org/Top10/2021/
  - A03 Injection: https://owasp.org/Top10/2021/
  - A05 Security Misconfiguration: https://owasp.org/Top10/2021/A05_2021-Security_Misconfiguration/
  - A07 Identification and Authentication Failures: https://owasp.org/Top10/2021/A07_2021-Identification_and_Authentication_Failures/
