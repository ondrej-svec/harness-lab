---
title: "feat: internal harness and learner resource kit"
type: plan
date: 2026-04-06
status: complete
brainstorm:
confidence: high
---

# Internal Harness and Learner Resource Kit Plan

Separate Harness Lab into two explicit deliverables:

1. an internal operating harness that helps maintainers run and evolve the workshop system
2. a participant-facing resource kit that teaches transferable context-engineering practice without exposing backstage complexity

## Problem Statement

Harness Lab already contains material for two different audiences:

- maintainers and facilitators who need strong repo-native operating guidance
- participants who need clear, copyable examples and a compact learning kit

Right now those two audiences are present in the same repo, but the packaging is still implicit.

That creates four problems:

- internal operating doctrine and participant teaching assets can get mixed together
- participants may be given the full backstage harness instead of the smallest teachable subset
- maintainers do not yet have an explicit checklist for what belongs to the repo's internal harness versus the public learner surface
- the workshop misses an opportunity to model one of its core lessons: not every useful artifact should be shown to every audience in the same form

The user clarified the right framing in this thread: the work is two-fold. Harness Lab needs resources that help this repo operate well, and a separate set of resources that can be handed to learners in the lab.

## Proposed Solution

Adopt a deliberate two-track packaging model:

1. **Internal harness**
   Repo-native guidance used to operate, extend, and verify Harness Lab itself.

2. **Learner resource kit**
   A curated participant-facing package built from selected repo artifacts and examples.

3. **External reference gallery**
   A short, maintained list of official docs and public repositories that learners can explore after the workshop.

The key rule is:

- the internal harness optimizes for continuity, safety, and operational clarity
- the learner kit optimizes for comprehension, transfer, and low-friction adoption

This means the participant-facing package should not be a raw dump of internal doctrine. It should be a distilled and annotated subset.

## Detailed Plan Level

This is a **detailed** plan because it affects repository structure, documentation boundaries, participant packaging, workshop facilitation assets, and the operating model for future updates.

## Decision Rationale

### Why split the resources explicitly

- The repo already contains both operator-facing and participant-facing material.
- Keeping the split implicit increases drift and duplication.
- An explicit model makes it easier to decide where new docs, skills, and examples belong.

### Why the learner kit should be smaller than the internal harness

- Participants need exemplars they can understand and reuse quickly.
- The full backstage harness includes operating detail that is useful for maintainers but distracting for first exposure.
- Good teaching material is curated, not exhaustive.

### Why keep both products in the same public-safe repo

- It matches the current product shape of Harness Lab as a public template repo.
- It preserves a low-friction installation and learning path.
- It lets the repo demonstrate the same context-engineering discipline it teaches.

### Why the learner kit should be built from repo-native artifacts

- The strongest workshop lesson is that durable AI collaboration lives in the repository.
- If the participant kit is assembled from the same kinds of artifacts teams are asked to create, the teaching stays concrete.
- This also keeps the workshop honest: the examples shown to learners are traceable to real repo patterns rather than slideware abstractions.

### Why include an external reference gallery

- Learners will want credible next steps after the workshop.
- Official docs and high-quality public repositories help participants continue without depending on private workshop memory.
- A curated list is more useful than telling people to "go search GitHub."

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| Harness Lab should serve both maintainers and participants from one public-safe template repo | Verified | Current repo already contains both internal docs and participant-facing content |
| Participants benefit more from curated exemplars than from the full internal harness | Verified | User direction in this thread; aligns with workshop goal of transfer rather than backstage exposure |
| `workshop-skill/` is already the strongest base for the learner-facing package | Verified | `README.md` and `workshop-skill/SKILL.md` position it as the main participant interface |
| Existing content under `content/` and `workshop-skill/` can support a participant resource kit without inventing a second system | Verified | Current repo already includes setup, reference, recap, follow-up, briefs, and challenge cards |
| Internal harness improvements should remain repo-native rather than moving to a separate private ops repo | Verified | Repo doctrine emphasizes what survives in the repository itself |
| The current repo cleanly marks which artifacts are internal versus participant-facing | Unverified | Some boundaries are visible, but there is no explicit operator-vs-learner packaging map yet |
| Participants will benefit from installable project skills or example skills beyond `workshop-skill/` | Unverified | Strong hypothesis from workshop goals, but the exact participant bundle is not yet defined |
| A small external reference gallery can be maintained without becoming stale or bloated | Unverified | Needs explicit curation rules and ownership |

## Risk Analysis

### Risk: The split becomes naming-only, not operational

If the repo declares an internal harness and learner kit but new artifacts are still added ad hoc, the distinction will decay quickly.

Mitigation:
- create a simple classification table for new artifacts
- require new resource additions to declare their audience
- link the model from `README.md` and contributor guidance

### Risk: The learner kit becomes a shallow marketing layer

If the participant package is too polished and too thin, it will stop teaching real harness-engineering practice.

Mitigation:
- build the learner kit from real repo artifacts
- keep examples inspectable and copyable
- include at least one full example each of `AGENTS.md`, a skill, and a review/checklist flow

### Risk: Internal guidance leaks unnecessary backstage complexity into participant materials

If facilitator-facing or maintenance-heavy content is copied directly into the learner surface, the workshop will feel more complicated than necessary.

Mitigation:
- define a participant-safe subset explicitly
- keep backstage operating rules in internal docs
- review participant materials for "teaches transfer" versus "explains backstage"

### Risk: Resource ownership stays ambiguous

If nobody owns the internal harness versus participant kit separately, one side will drift.

Mitigation:
- define update responsibilities in contributor guidance
- include both tracks in future planning and review routines

### Risk: External references go stale

If the reference gallery is not curated intentionally, it will either become outdated or expand into an unreadable list.

Mitigation:
- prefer official docs and a short list of proven repositories
- document inclusion rules
- review the list before each workshop cycle

## Phased Implementation

### Phase 1: Define the two-track model

Goal: make the internal-harness versus learner-kit split explicit in repo guidance.

Tasks:
- [x] Create a short source-of-truth document describing the three outputs: internal harness, learner resource kit, external reference gallery.
- [x] Add classification rules for audience, purpose, and public-safety to new resource decisions.
- [x] Update top-level repo guidance so contributors can tell whether a new artifact is for maintainers, participants, or both.
- [x] Identify the minimum set of internal-harness artifacts that should remain backstage-facing even in a public repo.

Exit criteria:
- a contributor can classify a new document, skill, or checklist without guesswork
- the split is visible from the repo root

### Phase 2: Package the internal harness

Goal: turn current doctrine into an explicit maintainer operating kit for Harness Lab itself.

Tasks:
- [x] Audit current internal harness artifacts across `AGENTS.md`, `docs/`, testing strategy docs, runbooks, and monitoring notes.
- [x] Define the minimum operator bundle for this repo: doctrine, architecture boundaries, testing rules, content rules, public/private rules, and handoff routines.
- [x] Identify missing repo-native skills or checklists that would reduce repeated operator friction.
- [x] Add a maintainer-facing index page that points to the key operating artifacts in dependency order.

Exit criteria:
- a maintainer can orient themselves quickly without reading the entire repo
- the repo has a visible operator bundle rather than scattered doctrine

### Phase 3: Package the learner resource kit

Goal: create a participant-facing bundle that is curated, legible, and transferable.

Tasks:
- [x] Define the learner kit contents and exclude backstage-only material.
- [x] Build the core learner bundle from existing repo artifacts:
  - `workshop-skill/`
  - one strong `AGENTS.md` scaffold
  - a small set of challenge cards
  - one planning/review example
  - one short follow-up package
- [x] Add short framing notes that explain when to use each artifact and what to copy into a real project.
- [x] Ensure all participant-facing copy stays in Czech and follows the style guide.
- [x] Decide which artifacts are handed out during the workshop versus after the workshop.

Exit criteria:
- a participant can understand the learner kit without maintainer intervention
- the kit contains concrete, reusable examples instead of abstract advice

### Phase 4: Curate the external reference gallery

Goal: give learners credible post-workshop next steps without overwhelming them.

Tasks:
- [x] Create a short curated resource list with three sections:
  - official Codex/OpenAI documentation
  - high-quality public skill/agent repositories
  - selected practice patterns relevant to Harness Lab
- [x] Annotate each item with one sentence explaining why it is useful.
- [x] Keep the list intentionally short and exclude weak or redundant repositories.
- [x] Add a review rule for freshness before each workshop run.

Exit criteria:
- learners get a trustworthy next-step reading list
- the list is concise enough to be actually used

### Phase 5: Connect the two tracks to workshop delivery

Goal: make the packaging useful in the room, not only in the repo.

Tasks:
- [x] Map which learner-kit artifacts are introduced in setup, build phase 1, continuation shift, and follow-up.
- [x] Map which internal-harness artifacts facilitators rely on before, during, and after the workshop.
- [x] Ensure the dashboard, `workshop-skill/`, and facilitation guides point to the same participant-facing resources.
- [x] Add one explicit handoff routine for maintainers to update both tracks when workshop friction repeats.

Exit criteria:
- the workshop uses the same packaging model it documents
- repeated issues lead to harness improvements rather than one-off fixes

## Implementation Tasks

- [x] Define the internal harness, learner resource kit, and external reference gallery as three explicit outputs in repo guidance.
- [x] Audit current repo artifacts and classify them by audience and purpose.
- [x] Create a maintainer-facing index for the internal operating harness.
- [x] Create a participant-facing learner kit outline from existing `workshop-skill/` and `content/` artifacts.
- [x] Select or author one canonical example each of `AGENTS.md`, a reusable skill, and a review/checklist artifact for participants.
- [x] Curate a short external reference list with official docs and a few strong public repositories.
- [x] Align the dashboard, `workshop-skill/`, facilitation guides, and follow-up materials to the same participant resource kit.
- [x] Add ownership and refresh rules so both tracks stay current.

## Acceptance Criteria

- The repo explicitly distinguishes internal operating resources from participant learning resources.
- A new maintainer can find the core operator guidance without scanning unrelated participant content.
- A participant can receive a compact learner kit that is understandable, Czech where appropriate, and directly reusable in a real project.
- The learner kit includes at least one inspectable example each of `AGENTS.md`, a skill, and a verification/review artifact.
- The external reference gallery is short, annotated, and grounded in official or high-quality public sources.
- Future contributors have a clear rule for where new resources belong.

## References

- [`README.md`](../../README.md)
- [`AGENTS.md`](../../AGENTS.md)
- [`workshop-skill/SKILL.md`](../../workshop-skill/SKILL.md)
- [`workshop-skill/follow-up-package.md`](../../workshop-skill/follow-up-package.md)
- [`docs/public-private-taxonomy.md`](../public-private-taxonomy.md)
- [`docs/plans/2026-04-06-docs-harness-lab-public-private-repositioning-plan.md`](2026-04-06-docs-harness-lab-public-private-repositioning-plan.md)
- [`docs/plans/2026-04-06-feat-workshop-skill-event-access-model-plan.md`](2026-04-06-feat-workshop-skill-event-access-model-plan.md)
