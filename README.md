# Harness Lab

Public template repo for a full-day workshop on how teams work with AI coding agents on real software.

Harness Lab is not about prompt theatre or one-off hacks. It is about context, decisions, verification, and a way of working that another person or another agent can continue.

## What Harness Lab Is

Harness Lab teaches **harness engineering**: the discipline of engineering context, instructions, verification, and workflows around AI coding agents so the work survives handoffs instead of collapsing into disposable output.

During the workshop, teams practice:

- writing clearer repo-native context such as `AGENTS.md`, skills, and runbooks
- working through a structured flow: `brainstorm` -> `plan` -> implementation -> `review`
- delegating, checking, and redirecting agent work like a real technical team
- turning decisions, constraints, and operating knowledge into artifacts another person or agent can continue

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

## How the Workshop Works

The workshop is built as a practical build environment:

- teams receive a brief and start building with AI coding agents
- they work through the day using the dashboard, the workshop skill, and their own repo
- the quality of context, workflow, and repo-native guidance directly determines whether another team can continue smoothly

The point is not to produce the most code. The point is to create a repo and operating model that can survive a handoff.

## Workshop Blueprint

The canonical public definition of the workshop lives in [`workshop-blueprint/`](/Users/ondrejsvec/projects/Bobo/harness-lab/workshop-blueprint).

Start there if you want the fastest overview of:

- how the workshop day is structured
- what the facilitator controls in a live instance
- what participants use during the workshop
- what should be edited in the public repo versus the private runtime layer

Recommended entry points:

- [workshop-blueprint/README.md](/Users/ondrejsvec/projects/Bobo/harness-lab/workshop-blueprint/README.md)
- [workshop-blueprint/day-structure.md](/Users/ondrejsvec/projects/Bobo/harness-lab/workshop-blueprint/day-structure.md)
- [workshop-blueprint/control-surfaces.md](/Users/ondrejsvec/projects/Bobo/harness-lab/workshop-blueprint/control-surfaces.md)
- [workshop-blueprint/edit-boundaries.md](/Users/ondrejsvec/projects/Bobo/harness-lab/workshop-blueprint/edit-boundaries.md)

## Repository Structure

- `dashboard/` - live workshop dashboard and the foundation of the facilitator control plane
- `harness-cli/` - small facilitator CLI client over the shared runtime APIs for local and dev operation
- `content/` - project briefs, challenge cards, talks, and facilitation content
- `workshop-skill/` - participant-facing skill for Codex and pi
- `monitoring/` - facilitator monitoring MVP and helper scripts
- `capture/` - templates and support material for quick observation capture
- `materials/` - print and operational materials
- `docs/` - architecture notes, decisions, plans, and internal workshop system documentation

## Install Harness CLI

The facilitator CLI is published on npm as `@harness-lab/cli`.

```bash
npm install -g @harness-lab/cli
harness --help
```

For command usage and local development install paths, see
[harness-cli/README.md](/Users/ondrejsvec/projects/Bobo/harness-lab/harness-cli/README.md).

## Language

The language split in this repo is intentional:

- dev-facing repo surfaces such as `README.md`, `AGENTS.md`, architecture notes, and technical docs are in English
- participant-facing workshop content is in Czech
- code and configuration stay in English
- technical terms such as skills, commands, and harness vocabulary remain in English where that improves clarity

Style guidance for participant-facing copy lives in:

- [content/style-guide.md](/Users/ondrejsvec/projects/Bobo/harness-lab/content/style-guide.md)
- [content/style-examples.md](/Users/ondrejsvec/projects/Bobo/harness-lab/content/style-examples.md)

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

The boundary model is documented in [public-private-taxonomy.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/public-private-taxonomy.md).

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

- [internal-harness.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/internal-harness.md)
- [learner-resource-kit.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/learner-resource-kit.md)
- [learner-reference-gallery.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/learner-reference-gallery.md)
- [resource-packaging-model.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/resource-packaging-model.md)

## Dashboard Model

The dashboard has two roles:

- **participant surface** - orientation during the day, briefs, challenge flow, and references
- **facilitator surface** - protected admin and operational control of the workshop instance

The import model and boundary model are described in:

- [blueprint-import-model.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/blueprint-import-model.md)
- [dashboard-surface-model.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/dashboard-surface-model.md)
- [runtime-learning-publish-back.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/runtime-learning-publish-back.md)

The local stack currently runs on a file-based store. The production direction is Vercel plus private storage.

Deployment-grade environment scoping and promotion rules are documented in:

- [private-workshop-instance-env-matrix.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-env-matrix.md)
- [private-workshop-instance-deployment-spec.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/private-workshop-instance-deployment-spec.md)
- [deployment-strategy.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/deployment-strategy.md)

Deploy flow:

- pull request -> preview deploy
- push to `main` -> production deploy

GitHub Actions CI is consolidated into the `Dashboard CI` workflow, and Vercel should wait for the `Vercel - harness-lab-dashboard: deploy-ready` check.

Workflow maintenance notes, current pinned action majors, and the `gitleaks` CLI rationale are documented in [github-actions-maintenance.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/github-actions-maintenance.md).

## Workshop Skill

`workshop-skill/` is the primary participant interface:

- it helps with setup
- returns briefs and references
- generates a baseline `AGENTS.md`
- reminds participants of the current phase and the next safe move

The default recommendation is to distribute the skill directly from the repo, not via npm.

Recommended install path from this repo:

```bash
npm install -g @harness-lab/cli
harness skill install
```

The facilitator privileged path now routes through the small `harness` CLI broker rather than storing raw auth or session state directly in the skill. The current model is described in:

- [harness-cli-foundation.md](/Users/ondrejsvec/projects/Bobo/harness-lab/docs/harness-cli-foundation.md)
- [harness-cli/README.md](/Users/ondrejsvec/projects/Bobo/harness-lab/harness-cli/README.md)

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
