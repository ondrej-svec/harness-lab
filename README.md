# Harness Lab

Public-safe template repo for a full-day workshop on how teams work with AI coding agents on real software.

Harness Lab teaches **harness engineering**: the discipline of engineering context, instructions, verification, and workflows around AI coding agents so the work survives handoffs instead of collapsing into disposable output.

## What You Can Do Here

- install the portable `workshop` skill into your own repo without cloning this repo first
- run the workshop dashboard locally with demo data
- fork the repo and deploy your own workshop instance on Vercel plus Neon
- reuse the public workshop blueprint, content, and facilitator tooling
- contribute improvements back upstream without mixing in private workshop data

## Choose Your Path

- participant: install `@harness-lab/cli` in your own project, run `harness skill install`, then start with `Codex: $workshop commands` or `pi: /skill:workshop`
- facilitator: start with [harness-cli/README.md](harness-cli/README.md), then [workshop-skill/facilitator.md](workshop-skill/facilitator.md)
- self-hoster or workshop operator: start with [docs/self-hosting.md](docs/self-hosting.md)
- maintainer or contributor: start with [docs/internal-harness.md](docs/internal-harness.md), [docs/contributing.md](docs/contributing.md), and [docs/public-private-taxonomy.md](docs/public-private-taxonomy.md)

## Quick Start

### Use Harness Lab in your own repo

You do **not** need to fork or clone this repository just to participate in the workshop.

```bash
npm install -g @harness-lab/cli
harness skill install
```

Then open your coding agent in that repo and start with:

- Codex: `$workshop commands`
- pi: `/skill:workshop`

The installed `.agents/skills/harness-lab-workshop` directory is generated bundle output. Treat it as the participant-facing install target, not the canonical authoring source.

For the CLI surface and facilitator commands, see [harness-cli/README.md](harness-cli/README.md).

### Run the dashboard locally

Local development uses the file-backed demo runtime by default.

```bash
git clone https://github.com/<your-account>/harness-lab.git
cd harness-lab/dashboard
cp .env.example .env.local
npm install
npm run dev
```

Useful local checks:

```bash
npm run test
npm run test:e2e
npm run lint
npm run build
```

Local demo notes:

- default storage mode is `HARNESS_STORAGE_MODE=file`
- `/admin` uses the demo credentials from `dashboard/.env.example`
- local mode is for sample data and development only, not for real workshop operations

### Deploy your own instance

Fork the repo if you want your own hosted dashboard, your own runtime state, or your own workshop variant.

Recommended deployment model:

1. fork this repository
2. create one Vercel project rooted at `dashboard/`
3. create private Neon preview and production databases or branches
4. configure preview and production environment variables outside the repo
5. run `cd dashboard && npm run db:migrate`
6. create the first facilitator account and workshop instance through the documented operator flow

Start with [docs/self-hosting.md](docs/self-hosting.md). The deeper operator docs are:

- [docs/private-workshop-instance-env-matrix.md](docs/private-workshop-instance-env-matrix.md)
- [docs/private-workshop-instance-deployment-spec.md](docs/private-workshop-instance-deployment-spec.md)
- [docs/workshop-instance-runbook.md](docs/workshop-instance-runbook.md)

## What Harness Lab Is

Harness Lab is not about prompt theatre or one-off hacks. It is about context, decisions, verification, and a way of working that another person or another agent can continue.

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

## Workshop Blueprint

The canonical public definition of the workshop lives in [`workshop-blueprint/`](workshop-blueprint/).

Recommended entry points:

- [workshop-blueprint/README.md](workshop-blueprint/README.md)
- [workshop-blueprint/day-structure.md](workshop-blueprint/day-structure.md)
- [workshop-blueprint/control-surfaces.md](workshop-blueprint/control-surfaces.md)
- [workshop-blueprint/edit-boundaries.md](workshop-blueprint/edit-boundaries.md)

## Repository Guide

Public teaching surfaces:

- `workshop-skill/` - participant-facing skill, setup help, reference card, and fallback workshop guidance
- `harness-cli/` - CLI for participant skill installation and facilitator operations
- `materials/` - printable participant takeaways and handouts
- `content/` - project briefs, challenge cards, talks, and facilitation content
- `workshop-blueprint/` - canonical public definition of the workshop method

Runtime and operations:

- `dashboard/` - participant and facilitator dashboard surfaces
- `monitoring/` - facilitator monitoring helpers
- `capture/` - support material for quick observation capture

System and doctrine:

- `docs/` - architecture notes, ADRs, plans, trust boundaries, and maintainer guidance
- `AGENTS.md` - short operating map for agents and maintainers

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

The boundary model is documented in [docs/public-private-taxonomy.md](docs/public-private-taxonomy.md).

Working rule:

- update reusable workshop method in the blueprint and supporting public docs
- operate live workshop state through the dashboard or facilitator skill and CLI path
- do not let runtime changes silently become the new canonical blueprint

## Maintainer Collaboration

If you want to contribute upstream or maintain a fork:

- read [docs/internal-harness.md](docs/internal-harness.md) for the maintainer map
- follow [docs/contributing.md](docs/contributing.md) for workflow, verification, and link hygiene
- read [docs/public-private-taxonomy.md](docs/public-private-taxonomy.md) before adding data, routes, or new operational copy
- update the relevant ADR or operator doc when you change trust boundaries, deployment, or auth behavior
- if you change the portable workshop bundle, sync it with `node harness-cli/scripts/sync-workshop-bundle.mjs`

## Community Standards

- [LICENSE](LICENSE)
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- [SUPPORT.md](SUPPORT.md)
- [docs/contributing.md](docs/contributing.md)
- [docs/internal-harness.md](docs/internal-harness.md)

## Language

The language split in this repo is intentional:

- dev-facing repo surfaces such as `README.md`, `AGENTS.md`, architecture notes, and technical docs are in English
- dashboard and workshop delivery may be shown in Czech or English
- shared structured workshop content is moving toward canonical English authoring with reviewed localized delivery, especially Czech for real workshop runs
- code and configuration stay in English
- technical terms such as skills, commands, and harness vocabulary remain in English where that improves clarity

Current language architecture and terminology are documented in:

- [docs/workshop-content-language-architecture.md](docs/workshop-content-language-architecture.md)

Style guidance for Czech participant-facing copy lives in:

- [content/style-guide.md](content/style-guide.md)
- [content/style-examples.md](content/style-examples.md)
