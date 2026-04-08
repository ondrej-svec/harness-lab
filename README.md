# Harness Lab

Public template repo for a full-day workshop on how teams work with AI coding agents on real software.

Harness Lab is not about prompt theatre or one-off hacks. It is about context, decisions, verification, and a way of working that another person or another agent can continue.

## Start Here

Pick the shortest path for your role:

- participant: install `@harness-lab/cli` in your own project, run `harness skill install`, open your agent in that repo, then start with `Codex: $workshop commands` or `pi: /skill:workshop` so the participant guidance follows the live workshop context or best reviewed bundled locale
- facilitator: start with [harness-cli/README.md](harness-cli/README.md), then [workshop-skill/facilitator.md](workshop-skill/facilitator.md)
- maintainer or workshop designer: start with [workshop-blueprint/README.md](workshop-blueprint/README.md) and [public-private-taxonomy.md](docs/public-private-taxonomy.md)
- quick internal demo: show this README, then [harness-cli/README.md](harness-cli/README.md), then the participant command flow in [workshop-skill/commands.md](workshop-skill/commands.md)

## What Harness Lab Is

Harness Lab teaches **harness engineering**: the discipline of engineering context, instructions, verification, and workflows around AI coding agents so the work survives handoffs instead of collapsing into disposable output.

During the workshop, teams practice:

- writing clearer repo-native context such as `AGENTS.md`, skills, and runbooks
- working through a structured flow: `brainstorm` -> `plan` -> `work` -> `review` -> `compound`
- delegating, checking, and redirecting agent work like a real technical team
- turning decisions, constraints, and operating knowledge into artifacts another person or agent can continue
- doing periodic cleanup so temporary chat knowledge becomes durable repo guidance instead of entropy

The goal is not to produce the most code. The goal is to build software work that stays legible, verifiable, and maintainable through continuation.

## Working Principles

Harness Lab uses three core rules:

1. **Clarify first, then generate.** An agent without intent and constraints does not create; it improvises.
2. **Verify before you move on.** Once an agent is doing meaningful work, verification becomes the trust boundary.
3. **Work so others can continue.** The next person or the next agent should not have to guess what happened.

Default expectations in this repo:

- tests before implementation when the change is important enough to automate
- tracer bullets and end-to-end checks where reading files is not enough
- repeatable browser checks plus agent-driven UI inspection for important UI flows
- review and explicit done criteria instead of blind trust in generated output

The default UI workflow in this repo is:

1. agent exploration in an isolated local environment
2. Playwright regression for the critical flow
3. human review before the change is considered complete

Harness Lab does not teach unrestricted browser autonomy in a normal authenticated browser as the default mode of work.

## Participant Default Loop

For participants, the intended default is:

1. use `workshop` to orient yourself in the repo and the day
2. create or tighten `AGENTS.md`
3. run `brainstorm` or go straight to `plan` when the task is already clear
4. do `work` against one executable check
5. run `review` before treating the change as done
6. use `compound` or another repo-native note to capture what should survive the session
7. do small cleanup passes so rules, commands, and handoff notes live in the repo instead of chat scrollback

The workshop-guaranteed interface is the bundled `workshop` skill. Many workflow packs and plugins are Codex-first today, but they are not the hard dependency for getting started.

The broader method is not Codex-only. The same harness-engineering discipline should transfer across Codex, pi, Claude Code, and similar coding agents:
- repo-native context over chat-only memory
- verification as the trust boundary
- handoff-ready artifacts instead of one-session output

## How the Workshop Works

The workshop is built as a practical build environment:

- teams receive a brief and start building with AI coding agents
- they work through the day using the dashboard, the workshop skill, and their own repo
- the quality of context, workflow, and repo-native guidance directly determines whether another team can continue smoothly

The point is not to produce the most code. The point is to create a repo and operating model that can survive a handoff.

## Workshop Blueprint

The canonical public definition of the workshop lives in [`workshop-blueprint/`](workshop-blueprint/).

Start there if you want the fastest overview of:

- how the workshop day is structured
- what the facilitator controls in a live instance
- what participants use during the workshop
- what should be edited in the public repo versus the private runtime layer

Recommended entry points:

- [workshop-blueprint/README.md](workshop-blueprint/README.md)
- [workshop-blueprint/day-structure.md](workshop-blueprint/day-structure.md)
- [workshop-blueprint/control-surfaces.md](workshop-blueprint/control-surfaces.md)
- [workshop-blueprint/edit-boundaries.md](workshop-blueprint/edit-boundaries.md)

## Repository Structure

Start here:

- `workshop-skill/` - participant-facing skill, setup help, reference card, and fallback workshop guidance
- `harness-cli/` - install surface for participant skill distribution and facilitator CLI operations
- `materials/` - printable participant takeaways and workshop handouts
- `README.md` - public repo orientation

Workshop content:

- `content/` - project briefs, challenge cards, talks, and facilitation content
- `workshop-blueprint/` - canonical public definition of the reusable workshop method

Runtime and operations:

- `dashboard/` - live workshop dashboard and the base of the participant and facilitator surfaces
- `harness-cli/` - facilitator CLI over the protected dashboard APIs, plus portable participant skill installation
- `monitoring/` - facilitator monitoring MVP and helper scripts
- `capture/` - templates and support material for quick observation capture

System and doctrine:

- `docs/` - architecture notes, ADRs, plans, internal operating docs, and learner reference curation

## Install Harness CLI

The CLI is published on npm as `@harness-lab/cli`. It now serves two jobs:

- portable participant skill installation
- facilitator auth and workshop operations

```bash
npm install -g @harness-lab/cli
harness --help
```

For command usage and local development install paths, see
[harness-cli/README.md](harness-cli/README.md).

## Language

The language split in this repo is intentional, but it has two different layers:

- dev-facing repo surfaces such as `README.md`, `AGENTS.md`, architecture notes, and technical docs are in English
- dashboard/product chrome may be shown in Czech or English
- shared structured workshop content is moving toward canonical English authoring with reviewed localized delivery, especially Czech for real workshop runs
- code and configuration stay in English
- technical terms such as skills, commands, and harness vocabulary remain in English where that improves clarity

Current language architecture and terminology are documented in:

- [docs/workshop-content-language-architecture.md](docs/workshop-content-language-architecture.md)

Style guidance for Czech participant-facing copy lives in:

- [content/style-guide.md](content/style-guide.md)
- [content/style-examples.md](content/style-examples.md)

## Public vs Private

This repository is a **public template repo**:

- it contains the reusable public workshop framework
- it runs with sample or demo data only
- it does not contain real workshop dates, rooms, live operational state, or participant-private context

The actual workshop run belongs in the **private workshop-instance layer**:

- workshop instance metadata
- facilitator operations
- checkpoints, monitoring, and team repo registry
- any sensitive or event-specific data

The boundary model is documented in [public-private-taxonomy.md](docs/public-private-taxonomy.md).

Working rule:

- update reusable workshop method in the blueprint and supporting public docs
- operate live workshop state through the dashboard or facilitator skill/CLI path
- do not let runtime changes silently become the new canonical blueprint

## Resource Layers

The repo packages three different resource layers:

- **internal harness** - backstage material for maintainers and facilitators operating Harness Lab
- **learner resource kit** - participant-facing examples and artifacts people can take into their own projects
- **external reference gallery** - curated documentation and public repos for continued learning after the workshop

Entry points:

- [internal-harness.md](docs/internal-harness.md)
- [learner-resource-kit.md](docs/learner-resource-kit.md)
- [learner-reference-gallery.md](docs/learner-reference-gallery.md)
- [resource-packaging-model.md](docs/resource-packaging-model.md)

## Dashboard Model

The dashboard has two roles:

- **participant surface** - orientation during the day, briefs, challenge flow, and references
- **facilitator surface** - protected admin and operational control of the workshop instance

The import model and boundary model are described in:

- [blueprint-import-model.md](docs/blueprint-import-model.md)
- [dashboard-surface-model.md](docs/dashboard-surface-model.md)
- [runtime-learning-publish-back.md](docs/runtime-learning-publish-back.md)

The local stack currently runs on a file-based store. The production direction is Vercel plus private storage.

Deployment-grade environment scoping and promotion rules are documented in:

- [private-workshop-instance-env-matrix.md](docs/private-workshop-instance-env-matrix.md)
- [private-workshop-instance-deployment-spec.md](docs/private-workshop-instance-deployment-spec.md)
- [deployment-strategy.md](docs/deployment-strategy.md)

Deploy flow:

- pull request -> preview deploy
- push to `main` -> production deploy

GitHub Actions CI is consolidated into the `Dashboard CI` workflow, and Vercel should wait for the `Vercel - harness-lab-dashboard: deploy-ready` check.

Workflow maintenance notes, current pinned action majors, and the `gitleaks` CLI rationale are documented in [github-actions-maintenance.md](docs/github-actions-maintenance.md).

## Workshop Skill

`workshop-skill/` is the primary participant interface:

- it helps with setup
- returns briefs and references
- generates a baseline `AGENTS.md`
- reminds participants of the current phase and the next safe move
- provides the guaranteed workshop path even when a participant does not have extra workflow skill packs installed

The default recommendation is to install the skill into the participant's working repo through the CLI:

```bash
npm install -g @harness-lab/cli
harness skill install
```

This no longer depends on cloning the Harness Lab source repo first. The portable public-safe skill bundle ships with the CLI package and installs into the current repo by default.
Rerunning `harness skill install` refreshes stale installs automatically and reports when the target repo is already current. The installed `.agents/skills/harness-lab-workshop` directory is generated bundle output, not the canonical authoring source.

The facilitator privileged path now routes through the small `harness` CLI broker rather than storing raw auth or session state directly in the skill. The current model is described in:

- [harness-cli-foundation.md](docs/harness-cli-foundation.md)
- [harness-cli/README.md](harness-cli/README.md)

Optional external workflow packs and further reading live in [learner-reference-gallery.md](docs/learner-reference-gallery.md). They are recommended accelerators for some environments, not the default bootstrap requirement.

## Local Development

```bash
cd dashboard
npm install
npm run dev
npm run test
npm run test:e2e
```

Optional:

- set `HARNESS_ADMIN_PASSWORD` if you want `/admin` protected in local mode
