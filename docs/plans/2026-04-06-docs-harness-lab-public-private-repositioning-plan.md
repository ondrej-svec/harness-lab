---
title: "docs: Harness Lab public/private repositioning"
type: plan
date: 2026-04-06
status: complete
brainstorm:
confidence: high
---

# Harness Lab Public/Private Repositioning Plan

Turn the current repo into a public-safe workshop template and evolve the dashboard into the private operational control plane for real workshop instances.

## Problem Statement

The current repository mixes three different concerns:

1. the public workshop identity (`Harness Lab`)
2. the participant toolkit (`workshop-skill`, briefs, reference materials)
3. private event operations (real dates, venues, team state, monitoring, admin assumptions)

That coupling creates three problems:

- a public repo would leak event-specific information and operational details
- a private repo would create unnecessary participant friction and collaborator management
- the workshop narrative currently over-explains the handoff mechanic instead of presenting a coherent learning environment
- the repo does not yet fully embody a key workshop lesson: agentic work needs explicit verification through tests, tracer bullets, and constrained feedback loops

## External Grounding

Current public examples show a consistent pattern: strong operators package workshops as a system, not just a pile of content.

- Anthropic uses practitioner-led recorded events and webinars centered on concrete builds, domain-specific examples, and Q&A around real tooling such as Claude Code rather than abstract theory.
- DeepLearning.AI combines large flagship events with hands-on workshops, explicit topic tracks, community programs, volunteers, and student passes. Their public positioning emphasizes practical skills, builders, and connection.
- Every appears to package AI work less as a single event product and more as training, adoption, and innovation support attached to a community and studio model. The pattern is ongoing accompaniment, not one-off content dumps.
- OpenAI Academy event pages position workshops around live examples, engineering workflows, best practices, and hands-on exposure to current tools.
- Vercel and similar ecosystem programs consistently support builders with deployment tooling, templates, credits, and fast paths from prototype to shipping.

Inference from these sources: the strongest fit for Harness Lab is not "content repo + dashboard", but a workshop operating system with:

- a clean public learning surface
- a secure operational surface
- a repeatable event-instance model
- clear transitions from learning to building to sharing

## Proposed Solution

Adopt a three-layer model:

1. **Public template repo**
   Holds the reusable workshop method, public-safe content, dashboard code, and participant skill.

2. **Private workshop instance layer**
   Holds event-specific data, facilitator-only notes, team assignments, repo registry, checkpoint state, and operational controls.

3. **Team project repos**
   Separate repos created during the workshop for the exercise itself.

This shifts the secure join from GitHub permissions to the application layer:

- participants consume a public repo and participant dashboard surface
- facilitators operate through a protected dashboard/admin surface
- per-workshop data is stored privately and loaded at runtime

## Detailed Plan Level

This is a **detailed** plan because it spans product framing, repo restructuring, dashboard architecture, deployment policy, and workshop operations across multiple future events.

## Decision Rationale

### Why a public repo plus private instance data

- It removes the need to make participants collaborators on a private repo.
- It preserves a low-friction install and onboarding path.
- It lets the workshop become shareable after the event without publishing sensitive event data.
- It matches the current repo shape better than a full split into many workshop-specific repos.

### Why not one private repo per event

- It creates unnecessary repo sprawl and inconsistent updates.
- It makes improvement of the workshop system harder because changes diverge across copies.
- It pushes operational access control into GitHub instead of the dashboard where it belongs.

### Why hide the handoff mechanic in public framing

- The handoff/rotation is a teaching device, not the product promise.
- Public copy should sell the capability being learned: context engineering for AI agents.
- The workshop is stronger if the lesson emerges through experience rather than being spoiled upfront.

### Why testing must become a first-class part of the workshop product

- When humans write all the code themselves, some confidence comes from direct authorship and close reading.
- With coding agents, especially once autonomy increases, that confidence has to be replaced by executable checks.
- Test-first work is no longer expensive enough to postpone by default; agents make RED, GREEN, and refactor loops dramatically cheaper.
- If Harness Lab teaches disciplined work with agents, the repo itself must demonstrate that discipline rather than merely recommending it in talks.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| Participants can work successfully from a public repo plus dashboard access | Verified | Current repo already separates content, dashboard, and skill enough to support this direction |
| Exact workshop dates, venues, and operational details should not live in the canonical public repo | Verified | User requirement in this thread; current seed data contains those details directly |
| A single dashboard codebase can support multiple workshop instances | Verified | Existing templates and reset flow already point in this direction |
| Vercel is an acceptable deployment target for the dashboard | Verified | Repository docs already assume Vercel deployment |
| A lightweight protected participant surface or open participant surface with protected admin is operationally sufficient | Unverified | Needs explicit decision after reviewing facilitation and room logistics |
| The private data layer can start simple before needing a full backend | Verified | Current local JSON store can evolve incrementally into a hosted private store |
| The workshop should explicitly teach test-first verification as a non-negotiable practice for agentic coding | Verified | User requirement in this thread; aligns with current repo direction and external agent-workshop patterns emphasizing practical engineering workflows |

## Risk Analysis

### Risk: Public/private split remains conceptually muddy

If content and state are only partially separated, the repo will keep leaking event assumptions into public files.

Mitigation:
- define a strict taxonomy for public-safe, participant-private, and facilitator-private assets
- audit current files against that taxonomy before implementation

### Risk: Dashboard becomes two products accidentally

If participant and facilitator surfaces are not deliberately designed, the app can become an awkward hybrid admin tool.

Mitigation:
- define explicit participant and facilitator jobs-to-be-done
- keep participant surface minimal and phase-aware
- keep facilitator surface operational and protected

### Risk: Installation story stays ambiguous

If `workshop-skill` distribution is not decided, participants may face friction or inconsistent setup.

Mitigation:
- standardize on repo-based installation first
- defer npm packaging unless repeated operational pain justifies it

### Risk: Public framing still leaks the exercise reveal

If README, dashboard copy, and skill text keep emphasizing the handoff trick, the workshop loses coherence and surprise.

Mitigation:
- rewrite public language around Harness Lab as a practical system for working with AI agents
- move rotation/handoff framing into facilitator materials where needed

### Risk: The repo teaches verification but does not practice it

If the dashboard and workshop assets remain lightly tested, the workshop sends the opposite signal from what it claims to teach.

Mitigation:
- make tests a required part of dashboard evolution
- add tracer-bullet coverage around critical participant and facilitator flows
- treat new agent-facing changes as incomplete until they have executable verification

## Phased Implementation

### Phase 1: Define the boundary model

Goal: establish the public/private taxonomy before moving files or changing code.

Tasks:
- [x] Create a source-of-truth document defining three layers: public template repo, private workshop instance layer, team project repos.
- [x] Classify every top-level repo area as `public-safe`, `private-data-backed`, or `facilitator-only`.
- [x] Define naming rules for workshop instances, templates, and hidden pedagogy terms.
- [x] Decide whether participant pages are fully public or protected by a shared workshop password.

Exit criteria:
- a new contributor can tell where any new artifact should live
- the team can explain the system without discussing GitHub collaborator access

### Phase 2: Reposition the public product

Goal: make the public repo feel like a coherent workshop kit instead of a partially exposed internal event repo.

Tasks:
- [x] Rewrite [`README.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/README.md) around Harness Lab as the public identity.
- [x] Remove public-facing mentions that spoil the handoff mechanic, including "Silent Post" and "signature exercise" framing.
- [x] Replace exact dates, venues, and event counts with generic or sample wording.
- [x] Review participant-facing markdown for vocabulary consistency across repo, dashboard, and skill.
- [x] Add a short public architecture section explaining: template repo, dashboard, and team repos.

Exit criteria:
- the repo is safe to open publicly without event leakage
- the public narrative emphasizes context engineering and agent workflow discipline

### Phase 3: Separate workshop templates from workshop instances

Goal: stop hardcoding real workshop metadata into dashboard seed data and content.

Tasks:
- [x] Split the current dashboard model into reusable templates versus private runtime instances.
- [x] Remove real dates, rooms, and city-specific event details from public seed content.
- [x] Introduce instance records that hold real workshop metadata outside the public code path.
- [x] Keep sample/demo instance data in the repo for local development only, clearly marked as fictional.
- [x] Review existing reset/template flows so they operate on template IDs and private instance data rather than real baked-in events.

Exit criteria:
- public code can run locally with fictional sample data
- real event data exists only in the private instance layer

### Phase 4: Evolve the dashboard into the workshop control plane

Goal: make the dashboard the operational center of the workshop rather than a thin page over seed JSON.

Tasks:
- [x] Define the participant surface: current phase, agenda, assigned brief, challenges, team checkpoint, reference links.
- [x] Define the facilitator surface: workshop setup, team assignments, checkpoint capture, rotation controls, monitoring, closing synthesis inputs.
- [x] Protect facilitator routes and private APIs.
- [x] Decide whether participant-facing routes stay public or use a shared event password.
- [x] Replace the current "local JSON store" assumption with an interface that supports local demo data and hosted private data.

Exit criteria:
- participant and facilitator surfaces have distinct jobs and access boundaries
- private operational data never leaks through public endpoints

### Phase 5: Make the skill and dashboard feel like one system

Goal: ensure the participant’s AI interface and the room interface reinforce the same workshop method.

Tasks:
- [x] Align workshop vocabulary across `workshop-skill`, dashboard UI, and public repo copy.
- [x] Ensure slash commands map cleanly to dashboard concepts such as phase, brief, challenges, team, and recap.
- [x] Review whether any skill commands or copy leak facilitator-only mechanics that should stay hidden.
- [x] Add explicit fallback behavior for when the dashboard is unavailable.
- [x] Define the recommended participant install path from the public repo.

Exit criteria:
- participants encounter one consistent mental model across repo, dashboard, and skill
- the skill remains useful even if the dashboard is temporarily unavailable

### Phase 6: Make the repo embody the verification lesson

Goal: ensure Harness Lab practices the same verification discipline it teaches for agentic work.

Tasks:
- [x] Define the minimum testing strategy for the dashboard: unit, tracer-bullet integration, and critical e2e paths.
- [x] Add tests around participant-surface state shaping, facilitator write flows, and access-control behavior.
- [x] Identify which workshop lessons should explicitly recommend RED → GREEN → refactor, tracer bullets, and e2e checks.
- [x] Update participant and facilitator content so testing is framed as the trust boundary for autonomous agent work.
- [x] Add contribution guidance that new dashboard behavior should ship with executable verification, not just copy review.

Exit criteria:
- the dashboard has meaningful automated verification for its critical flows
- workshop content and repo behavior say the same thing about trust, autonomy, and testing
- future contributors can see where tests are expected before changing agent-facing behavior

### Phase 7: Operationalize deployment and data ownership

Goal: establish a simple but durable runtime model for repeated workshops.

Tasks:
- [x] Create one canonical Vercel project for the dashboard codebase.
- [x] Choose the initial private storage model for workshop instances and operational state.
- [x] Define how admins create, reset, archive, and duplicate workshop instances.
- [x] Write runbooks for pre-workshop setup, in-room operation, and post-workshop archive/export.
- [x] Decide which materials remain in the public repo and which move to private ops storage.

Exit criteria:
- facilitators can run multiple workshops from one system without forking repos
- deployment and reset flows are documented and repeatable

## Implementation Tasks

1. **Boundary definition**
- [x] Write a public/private taxonomy document for repo content, dashboard data, and facilitator operations.
- [x] Audit existing files against that taxonomy and produce a move/keep list.

2. **Public framing**
- [x] Rewrite the public README and core narrative around Harness Lab.
- [x] Remove or reframe public copy that reveals the hidden workshop mechanic.

3. **Data model split**
- [x] Refactor dashboard concepts into `template data`, `sample demo data`, and `private instance data`.
- [x] Identify all code paths that currently assume real event data is public.

4. **Dashboard productization**
- [x] Define participant and facilitator surfaces and their route boundaries.
- [x] Specify access control for admin and any protected participant pages.

5. **Skill alignment**
- [x] Align the skill command model with the participant dashboard model.
- [x] Standardize the install/distribution path around public repo installation.

6. **Verification discipline**
- [x] Define the dashboard testing pyramid and critical-path tracer bullets.
- [x] Expand automated coverage for participant, admin, and auth-sensitive flows.
- [x] Update workshop content so test-first work is taught as a practical agent-control technique, not optional craft advice.

7. **Operations**
- [x] Define Vercel deployment strategy and private data storage strategy.
- [x] Write workshop lifecycle runbooks: create, run, reset, archive.

## Acceptance Criteria

- The canonical repo can be made public without exposing real workshop dates, venues, team state, or monitoring data.
- A new participant can access the workshop through a public repo and dashboard without GitHub collaborator access.
- A facilitator can create and run multiple workshop instances from one dashboard codebase.
- Public workshop copy presents Harness Lab as a coherent training system for working with AI agents, not as a spoiler-heavy exercise gimmick.
- The dashboard has explicit participant and facilitator surfaces with clear access boundaries.
- The `workshop-skill` and dashboard share the same vocabulary and phase model.
- Real workshop metadata and operational state live outside public repository content.
- The repo visibly practices the same verification discipline it teaches, with automated tests around critical dashboard behavior.

## References

### Local references

- [`README.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/README.md)
- [`dashboard/lib/workshop-data.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-data.ts)
- [`dashboard/lib/admin-auth.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/admin-auth.ts)
- [`dashboard/lib/admin-auth.test.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/admin-auth.test.ts)
- [`dashboard/lib/workshop-data.test.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-data.test.ts)
- [`dashboard/lib/workshop-state-repository.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-state-repository.ts)
- [`dashboard/lib/workshop-store.test.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-store.test.ts)
- [`dashboard/lib/workshop-store.ts`](/Users/ondrejsvec/projects/Bobo/harness-lab/dashboard/lib/workshop-store.ts)
- [`docs/dashboard-testing-strategy.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/dashboard-testing-strategy.md)
- [`docs/contributing.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/contributing.md)
- [`docs/deployment-strategy.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/deployment-strategy.md)
- [`docs/workshop-instance-runbook.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/workshop-instance-runbook.md)
- [`workshop-skill/SKILL.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/workshop-skill/SKILL.md)
- [`workshop-skill/install.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/workshop-skill/install.md)
- [`workshop-skill/reference.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/workshop-skill/reference.md)
- [`content/talks/context-is-king.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/content/talks/context-is-king.md)
- [`content/facilitation/master-guide.md`](/Users/ondrejsvec/projects/Bobo/harness-lab/content/facilitation/master-guide.md)

### External references

- OpenAI Academy, "Georgia Tech: Building and Working with AI"  
  https://academy.openai.com/public/events/georgia-tech-building-and-working-with-ai-wfw49fsyp0
- DeepLearning.AI, "Events"  
  https://www.deeplearning.ai/events/
- DeepLearning.AI, "AI Developer Conference"  
  https://ai-dev.deeplearning.ai/
- Anthropic, "Claude Code for Healthcare: How Physicians Build with Claude"  
  https://www.anthropic.com/webinars/claude-code-in-healthcare-how-physicians-are-building-with-claude
- Every, "On Every"  
  https://every.to/on-every
- Vercel, "AI SDK"  
  https://vercel.com/kb/ai-sdk
