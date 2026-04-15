---
title: "feat: workshop skill event access model"
type: plan
date: 2026-04-06
status: complete
brainstorm: docs/brainstorms/2026-04-06-brainstorm-workshop-skill-event-access-model.md
confidence: high
---

# Workshop Skill Event Access Model Plan

Implement a simple event-scoped access model that lets the public `workshop-skill/` and the participant dashboard read private workshop-instance context without turning the repo private or introducing MCP.

This plan also treats the repo itself as part of the workshop product: the implementation must embody the same harness-engineering discipline that Harness Lab teaches.

## Problem Statement

Harness Lab now has the right product shape:

- one public template repo
- one participant dashboard surface
- one protected facilitator surface
- one participant-facing workshop skill
- a private workshop-instance layer behind the public repo

But the live access model is still missing.

Right now the skill concept assumes it can answer live questions such as current phase, team details, repo URLs, and checkpoint state. The dashboard direction assumes the same runtime data exists for real workshops. Without an explicit event access model:

- the skill cannot become a true workshop companion
- participants fall back to the facilitator or dashboard for private context
- the dashboard and skill risk evolving separate mental models
- the public/private split remains conceptually right but operationally incomplete

The brainstorm already decided the broad direction: a shared event code that unlocks workshop-private participant data. The remaining job is to turn that into an implementation plan that preserves low-friction workshop ops and clear trust boundaries.

## Proposed Solution

Adopt a shared event-scoped participant access model with four layers:

1. **Public template behavior**
   The repo, dashboard code, and `workshop-skill/` remain public-safe and runnable with demo/sample data.

2. **Private workshop-instance API**
   One shared API layer exposes participant-safe workshop-instance data and facilitator-only operations from the same backend, with different auth boundaries.

3. **Event code redemption**
   Participants enter one memorable generated event code. The backend redeems it into a short-lived participant session.

4. **Independent dashboard and skill sessions**
   The participant dashboard and `workshop-skill/` both redeem the same event code independently against the shared API. They do not attempt to share browser cookies, local storage, or cross-client session state directly.

Operational defaults for day one:

- the participant dashboard remains public by default and unlocks private event context on demand
- `/workshop login` is the explicit primary login path, with implicit prompting as a fallback for private lookups
- the authenticated core bundle stays intentionally small; richer team/runtime details are fetched on demand

This keeps the model simple:

- one event code per workshop instance
- short-lived participant sessions
- shared source of truth for dashboard and skill
- separate facilitator auth path
- fallback mode still works when no valid participant session exists

## External Grounding

This plan is grounded in current guidance from the systems most relevant to the implementation:

- OpenAI computer-use guidance recommends sandboxed environments, explicit human oversight, and extra caution in authenticated or high-stakes environments. Inference: Harness Lab should keep browser-capable agent workflows constrained and explicitly reviewed, not treat autonomy as the default.
- Playwright best practices emphasize testing user-visible behavior and keeping tests isolated. Inference: participant and facilitator regression coverage should remain focused on rendered outcomes and reproducible state isolation.
- OWASP session guidance recommends server-side session expiration, idle/absolute timeouts, rotation/renewal patterns, and lifecycle logging. Inference: event-code redemption should lead to short-lived participant sessions with server-enforced expiry and auditable lifecycle events.
- OWASP authentication guidance emphasizes minimizing user friction while handling reauthentication deliberately. Inference: a shared event code can fit the low-stakes workshop context if facilitator privileges remain separate and recovery/rotation are explicit.
- Martin Fowler / Thoughtworks harness-engineering guidance frames agent quality as a combination of feedforward guides and feedback sensors, with humans steering the loop. Inference: this feature should ship not just with auth/runtime mechanics, but with repo-native guides such as AGENTS/ADRs and sensors such as tests and browser inspection.
- Martin Fowler’s ADR guidance reinforces that important architecture decisions should be captured in short linked records. Inference: the event access model should be fixed in ADR form before or alongside implementation.

## Embodiment Principle

Harness Lab cannot merely teach harness engineering in content while implementing its own product ad hoc.

This feature should explicitly embody:

- context before generation
- architecture decisions written down before broad implementation
- test-first or tracer-bullet thinking for important behavior changes
- exploratory browser inspection plus repeatable browser regression for UI-affecting work
- human review as the final trust boundary
- explicit rules for security, testing, and deployment living in repo-native guidance before high-autonomy implementation starts

Concretely, this means the implementation plan must include updates to repo guidance such as `AGENTS.md`, ADRs, and contribution rules where the current repo doctrine is stale or incomplete.

## Detailed Plan Level

This is a **detailed** plan because it defines runtime auth, API contracts, participant/facilitator boundaries, storage responsibilities, and the operational join between the dashboard and the workshop skill.

## Decision Rationale

### Why event-wide participant access instead of per-user auth

- The workshop threat model is low stakes.
- Participants need low-friction entry from a slide, QR card, or spoken instruction.
- Per-user onboarding would add operational burden without improving the workshop materially.
- Event-wide participant access is sufficient as long as facilitator capabilities remain fully separate.

### Why keep the participant surface public by default

- It preserves the low-friction QR-code entry path for the workshop.
- It aligns with the current public-template model and public/private taxonomy.
- It keeps the dashboard useful before authentication instead of turning the entire participant surface into a login wall.
- It makes the boundary teachable: public orientation first, private runtime context second.

### Why independent redemption for dashboard and skill

- The dashboard and the skill run in different client contexts and should not depend on fragile shared client state.
- Independent redemption keeps the system conceptually clean: same event code, same backend, separate session artifacts per surface.
- It avoids inventing a synchronization layer just to make two clients feel magically linked.
- It keeps the skill portable across Codex and pi without browser-specific assumptions.

### Why use a core bundle plus on-demand lookups

- Participants need some context immediately after login, especially current phase, brief choices, challenges, and key links.
- More dynamic or more sensitive data such as repo URLs, team lists, and checkpoint state should be fetched on demand.
- This avoids over-fetching and makes the trust boundary easier to reason about.

### Why explicit login should exist even if implicit prompting exists

- It gives facilitators one clean instruction to teach in the room.
- It keeps the mental model explicit instead of making authentication feel magical or accidental.
- It still allows natural-language or command-driven private lookup flows to recover gracefully when no session exists.

### Why not keep private context only in the dashboard

- The workshop skill is meant to be a real participant interface, not a static repo helper.
- If the dashboard is the only live source of private context, the skill becomes second-class.
- The workshop teaches that structured AI interfaces can sit on top of the same runtime system as the room UI.

### Why not use MCP

- The brainstorm explicitly rejects that path.
- A plain shared API keeps the model simpler to teach, operate, and deploy.
- It also makes the boundary clearer: the skill is a client of the workshop system, not a privileged connector.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| Participants need access to some workshop-private context through the skill, not only through the dashboard | Verified | Brainstorm decision; current `workshop-skill/SKILL.md` already assumes live data when available |
| Event-wide participant access is acceptable for the workshop threat model | Verified | Brainstorm decision and repo docs already lean toward lightweight participant protection |
| Facilitator-only controls must remain on a separate auth path | Verified | `docs/dashboard-surface-model.md` and `docs/public-private-taxonomy.md` define a hard boundary |
| One shared API can serve both dashboard participant reads and skill reads | Verified | Existing dashboard/store/repository seam already centralizes workshop state behind one model |
| Dashboard and skill can redeem the same event code independently without harming UX | Verified | Brainstorm identified shared event code as core model; independent redemption reduces coupling and fits separate client contexts |
| Short-lived participant sessions plus a longer-lived event code are sufficient | Verified | Brainstorm decision and stated threat model |
| Keeping the participant dashboard public until private context is requested is the best day-one UX tradeoff | Verified | Matches public-template strategy, low-friction entry, and user-approved recommendation in this planning thread |
| `/workshop login` should be the primary explicit auth path, with implicit prompting as fallback | Verified | User-approved recommendation in this planning thread; aligns with teachable in-room workflow |
| A small authenticated core bundle with on-demand team/runtime lookups is preferable to a large eager bundle | Verified | User-approved recommendation in this planning thread; aligns with least-exposure and smaller schema reasoning |
| The workshop instance layer can support participant session records in addition to workshop state | Unverified | Current docs define workshop data storage, but not a participant-session schema yet |
| Codex/pi skill runtime can persist a redeemed participant session token or equivalent local state cleanly enough for workshop use | Unverified | Needs explicit design for the skill-side login/session persistence flow |
| `AGENTS.md` is currently sufficient as the repo’s working doctrine for this feature | Unverified | Current `AGENTS.md` is stale: it still says “No tests yet” and does not encode current harness/testing/browser-use doctrine |

Unverified assumptions must be resolved before full production rollout.

## Risk Analysis

### Risk: The access model becomes conceptually muddy

If fallback mode, participant-private mode, and facilitator-only mode are not expressed clearly, users will not know which answers are live, stale, or unavailable.

Mitigation:
- define three explicit states: fallback, authenticated participant, facilitator
- require the skill to announce fallback mode clearly
- document which commands need authentication and which still work publicly

### Risk: The event code leaks too easily during or after the workshop

If the code becomes the only live bearer credential or cannot be rotated, the low-friction model becomes sloppy instead of pragmatic.

Mitigation:
- redeem the code into a short-lived session
- rate-limit redemption attempts
- support one active event code per instance with emergency rotation
- keep facilitator auth fully separate

### Risk: Dashboard and skill diverge in vocabulary or data shape

If they consume different concepts for phase, team, brief, or challenge state, users will experience two workshop systems instead of one.

Mitigation:
- define one participant context schema
- map `/workshop` commands directly to that schema
- treat the dashboard participant surface and skill as parallel views over the same source of truth

### Risk: Skill-side auth flow is clumsy in real workshop conditions

If the participant has to re-enter codes too often or the login command is awkward, the workshop companion loses credibility.

Mitigation:
- keep event codes valid for 1-2 weeks
- keep participant sessions short-lived but renewable by re-entering the same code
- optimize for one simple login path and one clear failure path

### Risk: The repo does not embody the method it teaches

If the access model is implemented without updated repo-native guidance, ADRs, testing rules, and browser-inspection discipline, the workshop will again drift into “say one thing, do another.”

Mitigation:
- treat AGENTS/ADR/contribution guidance as part of the feature
- update stale repo doctrine before or alongside implementation
- require executable verification and explicit architecture decisions for the new auth layer

### Risk: Facilitator-only data bleeds into participant lookups

If API schemas are not explicitly split, convenience can erode the boundary.

Mitigation:
- define a participant-safe core bundle schema
- classify all fields before exposing them
- require facilitator-only endpoints to stay on separate auth and route paths

## Phased Implementation

### Phase 1: Define the event-context contract

Goal: turn the brainstorm into one explicit data and access model for the shared backend.

Tasks:
- [x] Write a compact ADR or architecture note that fixes the key decisions:
  event-wide participant access, public-by-default participant surface, shared event code, short-lived sessions, independent dashboard/skill redemption, explicit `/workshop login`, no MCP.
- [x] Define the participant-safe core bundle schema.
- [x] Define the on-demand private lookup schema for team list, repo URLs, checkpoint state, and participant-safe announcements.
- [x] Classify all workshop-instance fields as `public`, `participant-authenticated`, or `facilitator-only`.
- [x] Update repo guidance inventory and identify which doctrine artifacts must change before implementation (`AGENTS.md`, ADRs, contribution rules, workshop guidance).

Exit criteria:
- the team can explain exactly what the dashboard and skill may read in each auth state
- no field needed by implementation is left unclassified

### Phase 2: Design the auth and session model

Goal: specify the runtime behavior for redeeming event codes and validating participant sessions.

Tasks:
- [x] Define the event code lifecycle: generation, storage, validity window, rotation, and emergency reset.
- [x] Define the participant session lifecycle: redeem, validate, expire, and re-authenticate.
- [x] Define the exact skill login flow, centered on `/workshop login` with implicit fallback prompting for private lookups.
- [x] Define facilitator auth as a separate runtime path with no shared privilege escalation from the participant code.
- [x] Define secure session transport/storage expectations using server-enforced expiry and minimal client persistence.

Exit criteria:
- the session flow can be drawn end to end for both dashboard and skill
- the skill-side auth UX is simple enough to use live in a room

### Phase 3: Define the shared API surface

Goal: make the dashboard and skill consume one coherent event-context API.

Tasks:
- [x] Specify the event-code redemption endpoint and response shape.
- [x] Specify the participant core-bundle endpoint.
- [x] Specify on-demand participant endpoints for team lookup, repo URLs, checkpoint state, and participant-safe announcements.
- [x] Specify facilitator-only endpoints separately and document their non-overlap with participant endpoints.
- [x] Define error states: invalid code, expired session, unavailable instance, fallback mode.
- [x] Define session lifecycle logging and recovery signals for redemption, renewal, expiry, and rotation events.

Exit criteria:
- a contributor can implement the API without guessing response shapes
- participant and facilitator boundaries are visible in the contract itself

### Phase 4: Map the skill and dashboard to the contract

Goal: align product behavior to the new access model before implementation.

Tasks:
- [x] Map each `/workshop` command to one of: public content, authenticated core bundle, on-demand participant lookup, facilitator-only.
- [x] Define dashboard participant behaviors when the user is unauthenticated, authenticated, or in demo mode, with the participant surface remaining public until private context is requested.
- [x] Define how the skill communicates fallback mode versus authenticated live mode.
- [x] Define the minimum participant login experience for both dashboard and skill, including one memorable “enter the event code” path and an explicit `/workshop login` command.

Exit criteria:
- the dashboard and skill share one visible mental model
- fallback behavior is clear and does not fake live state

### Phase 5: Make the model operable across multiple hackathons

Goal: ensure the access model supports repeatable event operations, not just a one-off prototype.

Tasks:
- [x] Extend the workshop-instance runbook to cover event-code issuance, participant join flow, code rotation, and archive/reset behavior.
- [x] Define instance-level configuration for four hackathons under one company without branching the repo or dashboard codebase.
- [x] Decide the minimum private storage additions needed beyond the current workshop-state model.
- [x] Define observability requirements: redemption attempts, active sessions, failed lookups, and admin recovery actions.
- [x] Define the minimum deployment and secret-management rules for this auth layer so workshop-instance operations are baked before implementation autonomy increases.

Exit criteria:
- a facilitator can prepare and run multiple events from one codebase and one operational model
- private event lifecycle tasks are documented well enough to rehearse

### Phase 6: Make the repo embody the harness doctrine

Goal: ensure the feature implementation is guided by the same repo-native discipline that the workshop teaches.

Tasks:
- [x] Update `AGENTS.md` so it reflects current build/test reality and encodes the repo’s doctrine around context, TDD/tracer bullets, browser inspection, human review, and architecture boundaries.
- [x] Add or update contribution guidance so auth/runtime changes are incomplete without executable verification and explicit decision records where architecture changes.
- [x] Add one short developer-facing note connecting this feature to Harness Lab’s feedforward/feedback model: guides first, sensors second, human steering throughout.
- [x] Ensure the implementation path calls out where ADRs, security rules, testing rules, and deployment rules must exist before higher-autonomy implementation work begins.

Exit criteria:
- a contributor can see the workshop’s own harness doctrine in repo-native guidance before writing code
- the repo no longer teaches stricter practice than it requires from contributors

## Implementation Tasks

1. **Architecture contract**
- [x] Write the event-access ADR and field-classification table.
- [x] Define the participant core bundle and on-demand lookup schemas.

2. **Auth/session design**
- [x] Specify event-code generation, redemption, expiry, and rotation.
- [x] Specify explicit `/workshop login` plus fallback prompt behavior, skill-side session persistence, and re-auth flow.

3. **Shared API plan**
- [x] Define participant redemption and context endpoints.
- [x] Define facilitator-only endpoints and boundary rules.
- [x] Define error and fallback states.
- [x] Define session lifecycle logging and recovery signals.

4. **Product mapping**
- [x] Map `/workshop` commands to auth scopes.
- [x] Define public-by-default dashboard participant login/join behavior.
- [x] Define fallback-mode copy and authenticated-mode copy.

5. **Operations readiness**
- [x] Update the runbook for event access operations.
- [x] Define the minimum storage/session additions for production.
- [x] Define observability and recovery expectations.

6. **Embodiment layer**
- [x] Update `AGENTS.md` and adjacent contributor guidance to encode the repo’s harness doctrine.
- [x] Add ADR/developer-note expectations for the access model before implementation begins.
- [x] Define the required verification stack for this feature: tracer bullets/tests, UI inspection where applicable, and human review.

## Acceptance Criteria

- Harness Lab has one explicit event access model for the participant dashboard and `workshop-skill/`.
- Participants can unlock workshop-private participant data with one shared event code without gaining facilitator privileges.
- The dashboard participant surface and the skill are documented as separate clients of one shared event-context API.
- Fallback mode remains usable and does not invent live state when no valid participant session exists.
- The API contract clearly separates public, participant-authenticated, and facilitator-only data.
- The plan defines how event codes and participant sessions expire, renew, and rotate.
- A facilitator can operate the access model across multiple workshop instances without creating separate repos or deployments.
- A contributor can start implementation without clarifying whether dashboard and skill share client-side session state.
- The repo-native guidance for this feature reflects Harness Lab’s own doctrine around context, testing, browser inspection, review, and architecture decisions before implementation begins.

## References

### Brainstorm

- [`docs/brainstorms/2026-04-06-brainstorm-workshop-skill-event-access-model.md`](../brainstorms/2026-04-06-brainstorm-workshop-skill-event-access-model.md)

### Related repo docs

- [`docs/dashboard-surface-model.md`](../dashboard-surface-model.md)
- [`docs/public-private-taxonomy.md`](../public-private-taxonomy.md)
- [`docs/deployment-strategy.md`](../deployment-strategy.md)
- [`docs/workshop-instance-runbook.md`](../workshop-instance-runbook.md)
- [`workshop-skill/SKILL.md`](../../workshop-skill/SKILL.md)
- [`docs/plans/2026-04-06-docs-harness-lab-public-private-repositioning-plan.md`](2026-04-06-docs-harness-lab-public-private-repositioning-plan.md)
- [`docs/contributing.md`](../contributing.md)
- [`AGENTS.md`](../../AGENTS.md)

### Relevant local implementation seams

- [`dashboard/lib/workshop-state-repository.ts`](../../dashboard/lib/workshop-state-repository.ts)
- [`dashboard/lib/workshop-store.ts`](../../dashboard/lib/workshop-store.ts)
- [`dashboard/lib/admin-auth.ts`](../../dashboard/lib/admin-auth.ts)

### External references

- OpenAI, “Computer use”  
  https://platform.openai.com/docs/guides/tools-computer-use
- Playwright, “Best Practices”  
  https://playwright.dev/docs/best-practices
- OWASP, “Session Management Cheat Sheet”  
  https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- OWASP, “Authentication Cheat Sheet”  
  https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- Birgitta Böckeler, Martin Fowler, “Harness engineering for coding agent users”  
  https://martinfowler.com/articles/harness-engineering.html
- Martin Fowler, “Architecture Decision Record”  
  https://martinfowler.com/bliki/ArchitectureDecisionRecord.html
- Ham Vocke, Martin Fowler, “The Practical Test Pyramid”  
  https://martinfowler.com/articles/practical-test-pyramid.html
