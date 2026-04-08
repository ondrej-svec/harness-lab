---
title: "feat: portable participant skill distribution and workshop UX"
type: plan
date: 2026-04-08
status: complete
confidence: high
---

# Portable Participant Skill Distribution And Workshop UX Plan

Make the participant workshop experience work cleanly from any team repository without requiring a clone of the Harness Lab repo, while preserving the intended public-first workshop skill model, the participant event-login boundary, a low-friction install path on macOS, Windows, and Linux, and a public-facing repo surface that is easy to demo, explain, and adopt.

## Problem Statement

Harness Lab now has the right conceptual model for participant access, but the current participant install and packaging story still assumes local repo topology in ways that break the real workshop workflow.

Today:

- the participant skill is documented as a repo-native bundle installed from the public repository
- `harness skill install` only works when run inside a local Harness Lab checkout because it searches upward for `workshop-skill/SKILL.md` and copies files from that repo
- workshop participants will usually work inside their own team repository rather than this repository
- the skill content references local bundled docs and materials, but the current install mechanism only guarantees those files exist when the public repo has already been cloned
- some participant resources are now first-class skill concepts, but the packaging and discovery model is still only partially aligned with that product direction
- the repo also contains both source workshop files and a bundled `.agents/skills/harness-lab-workshop` copy, which introduces drift risk if the bundle is treated as another editable source of truth
- the public repo is also close to becoming an externally shareable surface, but the current top-level wayfinding still makes it harder than it should be to show a teammate where the participant path, facilitator path, and workshop method actually start
- even when the content is present, the current presentation still leaves room for “where do I point people first?” confusion during lightweight demos or early public sharing

This matters because the install and discovery experience is part of the workshop product:

- participants should not need repo archaeology to get setup, references, resources, or follow-up materials
- participants should not need to clone the Harness Lab repo just to use the workshop skill from their own team repo
- participant auth should unlock live event context, not the baseline existence of the skill
- facilitators need a coherent story that is teachable in the room and supportable across platforms
- teammates and early external viewers should be able to understand the product quickly from the public repo and top-level docs without a guided tour

If this remains unresolved, the workshop teaches “repo-native skill UX” while shipping a packaging model that depends on the wrong repo.

## Proposed Solution

Move the participant workshop experience to a portable distribution model with one canonical source of truth and two runtime layers:

1. **Canonical source in this repository**
   `workshop-skill/`, selected learner-kit docs, public-safe content, and the blueprint remain authored here.

2. **Packaged portable bundle inside `@harness-lab/cli`**
   The CLI ships a versioned workshop skill bundle that contains the participant-facing local files needed for fallback guidance, resources, and follow-up materials.

3. **Install into the participant's actual working repo**
   `harness skill install` installs the bundled workshop skill into the participant's current project or another explicit target path, rather than assuming the current directory is a Harness Lab checkout.

4. **Public-first skill behavior**
   The installed skill works without participant auth for setup, reference, resources, gallery, follow-up, template, and local guidance.

5. **Participant login only for live event context**
   `workshop login` redeems the shared event code into a short-lived participant session and unlocks runtime event context from the dashboard APIs without making the skill itself depend on a cloned repo or a live network call for baseline operation.

6. **Skill-native discoverability**
   Participants learn the skill surface from inside the skill through `workshop commands`, `workshop resources`, `workshop gallery`, and `workshop follow-up`, rather than through GitHub browsing.

7. **Public-facing wayfinding and lightweight restructuring**
   The repo and top-level participant/facilitator entry points are tightened so it is obvious what to show a teammate, what participants should install first, and what the public-safe workshop method is.

The product rule becomes:

- no Harness Lab repo clone required
- no GitHub browsing required for baseline participant help after install
- no participant auth required for baseline workshop help
- participant auth required only for live event-private context
- one source of truth for authored workshop content
- one portable packaged bundle for installation
- one cross-platform CLI install story
- one clear public “start here” path for participants, facilitators, and curious external viewers

## Decision Rationale

### Why the participant skill should be public-first instead of auth-gated from the start

The accepted event access model already says the participant surface is public by default and becomes richer after `workshop login`. That keeps room entry low-friction and matches the workshop’s public-safe template strategy.

Using participant auth to unlock the very existence of setup, reference, or resource guidance would be the wrong boundary. Auth should gate live event context, not workshop literacy.

### Why packaging should move into the CLI package instead of relying on a cloned repo

The current installer depends on the public repo being present locally. That is the wrong assumption because participants will usually be inside a separate team repo during the workshop.

Packaging the public-safe workshop bundle inside the CLI package fixes the real problem:

- install works from any repo
- relative paths inside the installed bundle work locally after install
- the skill can stay file-based for baseline behavior rather than becoming network-dependent for every command
- Windows, macOS, and Linux all get the same Node-based install story

### Why the solution should not require live web or API fetches for baseline participant help

Participants need setup help, workshop reference, and resource guidance even when:

- they are offline
- the dashboard is temporarily unavailable
- they have not logged in yet
- they are in a fresh team repo with no Harness Lab checkout

That makes a packaged local bundle the correct baseline.

Live APIs remain the right path for:

- current phase
- event-private announcements
- team lookup
- repo URLs
- checkpoints

### Why the install target should be the participant's actual repo by default

Skills are most useful when they are discoverable where the user is working. Requiring users to operate from the Harness Lab repo would push them out of their actual team context and make adoption feel artificial.

Defaulting to the current repo preserves the repo-native skill model while removing the wrong dependency on the workshop source repo.

### Why the repo should not keep two editable sources of truth for the workshop bundle

The repository currently has both authored workshop files and a bundled `.agents/skills/harness-lab-workshop` copy. That is useful for local discovery, but it is risky as a long-term authoring model because it can drift.

The canonical authored source should stay in the real repo folders. Bundled skill output should be generated or synchronized intentionally, not treated as a parallel source tree.

### Why this should be broader than “just put the files in npm”

The packaging problem touches:

- participant install UX
- public repo wayfinding and demoability
- repo-target semantics
- discoverability of skill commands
- what content belongs in the portable bundle
- what remains runtime-only behind participant auth
- release gates and Windows-safe verification

Treating this as only an npm packaging tweak would miss the actual product seam.

## Assumptions

| Assumption | Status | Evidence |
|------------|--------|----------|
| Participants will often use the workshop skill from a separate team repository, not from this repository | Verified | User requirement in this thread and the workshop’s team-repo operating model |
| The participant skill should remain useful before participant login | Verified | [`docs/workshop-event-context-contract.md`](../workshop-event-context-contract.md) and [`docs/adr/2026-04-06-workshop-event-access-model.md`](../adr/2026-04-06-workshop-event-access-model.md) explicitly define public mode |
| A Node-based CLI package can ship a portable workshop bundle and install it cross-platform | Verified | Current CLI already ships cross-platform via npm; the remaining gap is asset packaging and install logic, not platform viability |
| Participants should not need the public repo cloned locally for baseline workshop skill use | Verified | User requirement in this thread; current installer behavior is clearly misaligned |
| Participant auth should unlock live event context rather than baseline workshop docs/resources | Verified | Accepted participant event access model already separates public mode from participant-authenticated mode |
| The portable bundle can remain public-safe and should not contain live event-private data | Verified | Public/private taxonomy and event-access contract both require this separation |
| The packaged bundle should include participant resources, learner kit guidance, and follow-up materials in addition to setup/reference | Likely | Current skill direction and user request both point there, but the exact inclusion list needs a deliberate packaging inventory |
| Codex and pi/OpenCode can both discover the installed skill cleanly from a repo-local `.agents/skills` path in arbitrary participant repos | Likely | Current discovery works repo-locally, but cross-tool expectations should be revalidated once install no longer depends on the source repo |
| The CLI package size will remain acceptable even after bundling the participant skill assets | Unverified | Needs measurement and possibly a packaging allowlist |
| Keeping a repo-bundled `.agents/skills/...` copy is still worth it after portable packaging ships | Unverified | It may be useful for local development, or it may create too much drift pressure |
| A generated or synchronized bundle step can keep authored content and packaged content aligned without excessive maintenance burden | Unverified | Needs explicit build/verification design |
| Windows users in the workshop environment will have a viable Node/npm path for CLI installation | Likely | Existing CLI distribution assumes npm; workshop setup docs already position Codex App as an alternative for agent access, but the CLI install path still needs explicit Windows validation |
| A relatively light restructuring of the public repo surface is enough to make the project easy to present and adopt before public launch | Unverified | README improvements help, but the required degree of restructuring versus documentation still needs deliberate scoping |

Unverified assumptions should become explicit tracer-bullet or verification tasks before release.

## Risk Analysis

### Risk: Packaging creates a second stale copy of the participant content

If the bundled workshop skill is maintained manually or copied ad hoc, docs and skill behavior will drift again.

Mitigation:

- define one authored source of truth
- generate or synchronize the portable bundle from that source
- add verification that packaged assets match the authored inventory

### Risk: The CLI install story becomes more magical but less predictable

If `harness skill install` changes behavior without clear target semantics, participants and facilitators may not know where the skill landed.

Mitigation:

- make the default install target explicit
- print the final installed path
- support an explicit `--target` or equivalent install path override
- document current-repo versus explicit-path behavior clearly

### Risk: Participant auth and portable content boundaries blur

If the bundle starts carrying event-specific or participant-private data, the public-safe boundary collapses.

Mitigation:

- classify every portable asset as public-safe
- keep all live event metadata behind participant session APIs
- document which commands are local/public-first and which commands become richer after login

### Risk: Windows support is nominal rather than real

If the CLI publishes a portable participant path but verification remains macOS-biased, workshop reliability will be overstated.

Mitigation:

- add Windows install and smoke checks for the portable skill bundle
- verify path handling, file copying, and command output on Windows runners
- keep the install implementation strictly Node/path-based rather than shell-fragile

### Risk: Skill discoverability still depends on repo browsing

If participants still have to inspect GitHub to learn `resources`, `gallery`, or `follow-up`, the packaging fix will not solve the UX problem fully.

Mitigation:

- add a first-class `workshop commands` surface
- teach that surface in install output and setup guidance
- keep skill responses oriented around “best next command” rather than just file links

### Risk: The participant install path expands the CLI beyond its intended boundary

The CLI foundation currently treats participant onboarding as a non-goal for v1. If this work is not scoped carefully, the CLI could become a second dashboard or a second content management surface.

Mitigation:

- keep the CLI responsible for distribution and installation, not for participant teaching logic itself
- keep the skill as the participant interface
- keep live participant runtime reads in the shared dashboard APIs

### Risk: Existing repo-local development workflows regress

If the portable packaging work removes the current local development path abruptly, contributor workflows may become clumsier.

Mitigation:

- preserve a local-development story explicitly
- decide whether local bundle sync remains repo-local for contributors
- document the distinction between “authored source” and “packaged install artifact”

### Risk: The project becomes installable but still hard to present publicly

If packaging improves but the top-level repo surface remains confusing, teammates and early external viewers will still struggle to understand what the project is, what to install, and where participant versus facilitator flows begin.

Mitigation:

- define a small public-ready wayfinding pass as part of this work
- tighten the README and entry-point docs around audience-based start paths
- decide whether light top-level restructuring is needed beyond documentation alone
- ensure the participant skill, dashboard, and public docs tell the same story

## Phased Implementation

### Phase 1: Define the participant product model and packaging boundary

Goal: decide exactly what the participant skill must do locally, what requires login, and what the CLI owns in the install story.

Tasks:

- [x] Write or update one architecture note that fixes the portable participant model:
  - no source-repo clone required
  - public-first participant skill
  - participant login only for live event context
  - CLI-owned skill distribution
  - skill-owned participant UX
- [x] Define the portable participant bundle contents explicitly:
  - `workshop-skill/`
  - selected learner-kit docs
  - selected public-safe content and blueprint files
- [x] Define which content stays out of the portable bundle because it is maintainer-first or runtime-only.
- [x] Define whether `.agents/skills/harness-lab-workshop` remains a generated dev artifact, disappears from source control, or is otherwise re-scoped.
- [x] Update the resource-packaging model if the current three-layer description is insufficient for portable distribution.

Exit criteria:

- the team can explain what is authored, what is packaged, and what is fetched live
- there is no ambiguity about public-safe versus participant-authenticated content

### Phase 1B: Define the public-facing repo story and lightweight restructuring scope

Goal: make the project easy to show, explain, and adopt before public launch.

Tasks:

- [x] Define the audience-based public entry paths:
  - participant
  - facilitator
  - maintainer/contributor
  - curious external viewer
- [x] Decide what “no GitHub required” means operationally for participants:
  - no repo clone required
  - no repo browsing required after install
  - clear fallback when users still arrive through GitHub first
- [x] Audit whether README and top-level docs are sufficient, or whether light restructuring is needed:
  - clearer top-level entry-point docs
  - more opinionated directory labels
  - narrower public “start here” surfaces
- [x] Define the smallest restructuring that materially improves approachability without turning this into a docs rebrand project.
- [x] Align that scope with the near-term public launch and hackathon-readiness goal.

Exit criteria:

- there is one obvious answer to “what should I show a teammate first?”
- the plan explicitly covers public-facing approachability, not only installer mechanics

### Phase 2: Create one canonical portable bundle pipeline

Goal: remove manual or implicit bundle drift by making the packaged participant skill an intentional artifact.

Tasks:

- [x] Define the canonical source directories for participant-authored content.
- [x] Define a build/sync path that produces the portable workshop bundle from the canonical sources.
- [x] Decide whether this is:
  - a generated artifact committed in the repo
  - a package-included build output generated during release
  - or another controlled asset assembly step
- [x] Add verification that the bundle includes all required participant files and excludes maintainer-only files.
- [x] Add an inventory test or manifest that proves which files belong in the portable participant bundle.

Exit criteria:

- there is one trusted way to assemble the participant bundle
- contributors do not have to hand-maintain two content trees

### Phase 3: Redesign `harness skill install` for arbitrary participant repos

Goal: make installation work from the participant’s actual working repo, not from a Harness Lab checkout.

Tasks:

- [x] Change `harness skill install` so it installs from the packaged bundle rather than scanning for a local workshop source repo.
- [x] Define install-target semantics:
  - default current repo
  - optional explicit target path
  - optional force/replace behavior
- [x] Ensure the installed output includes the local files the skill references, so relative paths work after installation.
- [x] Print a clear post-install summary:
  - installed path
  - what commands to run first
  - how to get help from inside the skill
- [x] Preserve or redefine a contributor-only local-dev path if working directly on the workshop source still needs special handling.

Exit criteria:

- install works in a non-Harness-Lab repo
- install no longer fails because `workshop-skill/SKILL.md` is missing in the current tree
- participants can start from their team repo directly

### Phase 4: Strengthen participant discoverability and in-skill UX

Goal: ensure participants can learn and use the skill from inside the skill rather than via GitHub browsing.

Tasks:

- [x] Make `workshop commands` the canonical discoverability surface.
- [x] Ensure `workshop resources`, `workshop gallery`, and `workshop follow-up` are first-class documented commands in the authored skill and packaged bundle.
- [x] Update CLI install output so it teaches:
  - `workshop commands`
  - `workshop reference`
  - `workshop brief`
  - `workshop resources`
- [x] Update setup/reference/follow-up docs so they direct users back into the skill rather than primarily to repo paths.
- [x] Decide whether the participant dashboard should also mirror the same resource surfaces for QR-first users.

Exit criteria:

- a participant can discover the main skill surface without reading the GitHub repo
- the most useful participant resources are reachable through named skill commands

### Phase 4B: Improve public repo wayfinding and hackathon-readiness

Goal: make the public repo itself feel intentional and easy to navigate when shown to teammates, facilitators, or future workshop partners.

Tasks:

- [x] Tighten the README around role-based “start here” paths and the core product story.
- [x] Ensure the repository structure section reflects how people should actually navigate the project, not just where files happen to live.
- [x] Decide whether additional lightweight top-level docs or renames are needed for clarity.
- [x] Align participant docs, facilitator docs, and public references so they do not point users into contradictory entry paths.
- [x] Sanity-check the result against real presentation scenarios:
  - quick internal demo
  - participant onboarding
  - early public repo visitor
  - future hackathon organizer reviewing the project

Exit criteria:

- the public repo has a clear and teachable top-level story
- README and top-level structure support lightweight demos and near-term public sharing

### Phase 5: Reconcile participant auth with portable baseline behavior

Goal: make the runtime contract explicit so the portable skill stays useful before login and becomes live after login.

Tasks:

- [x] Reconfirm the participant command matrix:
  - always local/public-first
  - public-first with authenticated enrichment
  - participant-auth required
- [x] Define how the installed skill stores or renews participant session state after `workshop login`.
- [x] Verify the portable install model does not assume the dashboard is available for baseline commands.
- [x] Ensure `workshop login` is documented as an event-context unlock, not as a prerequisite for workshop help.
- [x] Align any dashboard, skill, and CLI docs that still imply the public repo is the main participant execution surface.

Exit criteria:

- participant auth is clearly a live-context boundary, not a packaging boundary
- the participant skill remains credible even before login

### Phase 6: Cross-platform verification and release posture

Goal: make the portable participant path trustworthy on the platforms the workshop claims to support.

Tasks:

- [x] Add CLI tests for installing the portable bundle into an arbitrary repo path.
- [x] Add packaging tests that prove the npm package contains the intended workshop assets.
- [x] Add cross-platform smoke checks on macOS, Windows, and Linux for:
  - npm install
  - `harness skill install`
  - installed path correctness
  - first-command guidance output
- [x] Update the CLI publication gate to include participant-bundle verification, not only facilitator auth and generic `npm pack` checks.
- [x] Add rollback posture for a bad participant-bundle release:
  - deprecate npm version
  - republish corrected bundle
  - document emergency fallback

Exit criteria:

- the published CLI can install the participant workshop skill reliably across supported platforms
- release gates cover the participant install path as a real product surface

## Implementation Tasks

- [x] Write the architecture note/ADR for portable participant skill distribution and auth boundaries.
- [x] Define the portable bundle inventory and what stays outside it.
- [x] Define the public-facing entry paths and whether light restructuring is needed.
- [x] Decide the long-term role of the tracked `.agents/skills/harness-lab-workshop` copy.
- [x] Implement one canonical bundle assembly/sync mechanism from authored sources.
- [x] Refactor `harness skill install` to install from packaged assets instead of scanning for a source repo.
- [x] Support install into the current repo and an explicit target path.
- [x] Ensure the installed bundle contains all files referenced by the participant skill.
- [x] Update skill discoverability around `workshop commands`, `resources`, `gallery`, and `follow-up`.
- [x] Improve README/top-level wayfinding for internal demos, public sharing, and hackathon readiness.
- [x] Align participant docs and CLI output with the new install model.
- [x] Reconcile participant login docs with the portable/public-first baseline.
- [x] Add package-content, install-path, and cross-platform smoke coverage.
- [x] Update release gates and rollback posture for participant bundle publication.

## Acceptance Criteria

- Participants can install the workshop skill from `@harness-lab/cli` without cloning the Harness Lab repo.
- `harness skill install` succeeds when run from an arbitrary team repo and installs a functioning workshop bundle there.
- The installed skill can answer setup, reference, resources, gallery, follow-up, and template/help flows without participant auth and without depending on a live dashboard fetch.
- `workshop login` is clearly positioned as the unlock for live event context rather than the prerequisite for baseline skill use.
- The packaged skill assets come from one canonical source pipeline with explicit inclusion/exclusion rules.
- The public repo has a clear audience-based “start here” story that is easy to show internally and credible for near-term public release.
- Cross-platform verification proves the portable install path on macOS, Windows, and Linux.
- Release gates cover participant bundle integrity and install smoke behavior in addition to existing CLI checks.

## References

- Current installer behavior: [harness-cli/src/skill-install.js](../../harness-cli/src/skill-install.js)
- Current participant install docs: [workshop-skill/install.md](../../workshop-skill/install.md)
- Event access contract: [docs/workshop-event-context-contract.md](../workshop-event-context-contract.md)
- Accepted event access ADR: [docs/adr/2026-04-06-workshop-event-access-model.md](../adr/2026-04-06-workshop-event-access-model.md)
- Resource packaging model: [docs/resource-packaging-model.md](../resource-packaging-model.md)
- CLI foundation: [docs/harness-cli-foundation.md](../harness-cli-foundation.md)
- Prior CLI publication plan: [docs/plans/2026-04-07-feat-harness-cli-npm-publication-plan.md](2026-04-07-feat-harness-cli-npm-publication-plan.md)
- Prior device-auth/storage plan: [docs/plans/2026-04-07-feat-harness-cli-device-auth-and-secure-storage-plan.md](2026-04-07-feat-harness-cli-device-auth-and-secure-storage-plan.md)
