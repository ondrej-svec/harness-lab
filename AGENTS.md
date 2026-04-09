# Harness Lab

## Mission

Harness Lab is a full-day experiential developer workshop ("Developer Hackathon") teaching **harness engineering** — the discipline of engineering context, instructions, and workflows for AI coding agents.

The workshop is designed around build phases, a mid-day continuation shift, and strong emphasis on what survives in the repository itself. The quality of context engineering (`AGENTS.md`, skills, runbooks) determines whether another team can continue without friction.

This repository is the public-safe template version of the workshop. Real workshop dates, venues, and live operational state should live in the private workshop-instance layer, not here.

Root rule:
- `AGENTS.md` is the map, not the manual.
- Deeper docs in [`docs/`](docs/), [`workshop-blueprint/`](workshop-blueprint/), and surface-specific runbooks are the system of record.
- If this file starts turning into an encyclopedia, move detail outward and link to it.

For the maintenance standard behind this file, see [`docs/agents-md-standard.md`](docs/agents-md-standard.md).

## Read First

Before making meaningful changes:

1. Read [`README.md`](README.md) for repo orientation.
2. Read [`docs/internal-harness.md`](docs/internal-harness.md) for the maintainer-facing map.
3. Read the current plan in [`docs/plans/`](docs/plans/) if the task is non-trivial or already in flight.
4. For non-trivial work that should authorize autonomous execution, read [`docs/autonomous-planning-standard.md`](docs/autonomous-planning-standard.md) and [`docs/planning-rubrics.md`](docs/planning-rubrics.md).
5. Read the task-specific sources of truth below before editing code or workshop behavior.

## Task Routing

If you touch these areas, read these files first:

- `dashboard/` UI, routes, or workshop state:
  - [`docs/dashboard-design-system.md`](docs/dashboard-design-system.md)
  - [`docs/dashboard-surface-model.md`](docs/dashboard-surface-model.md)
  - [`docs/dashboard-testing-strategy.md`](docs/dashboard-testing-strategy.md)
  - [`docs/agent-ui-testing.md`](docs/agent-ui-testing.md)
- facilitator auth, participant event access, or private runtime boundaries:
  - [`docs/public-private-taxonomy.md`](docs/public-private-taxonomy.md)
  - [`docs/private-workshop-instance-data-classification.md`](docs/private-workshop-instance-data-classification.md)
  - [`docs/adr/2026-04-06-private-workshop-instance-runtime-topology.md`](docs/adr/2026-04-06-private-workshop-instance-runtime-topology.md)
  - [`docs/adr/2026-04-06-private-workshop-instance-auth-boundary.md`](docs/adr/2026-04-06-private-workshop-instance-auth-boundary.md)
- workshop method, agenda shape, or canonical public workshop content:
  - [`workshop-blueprint/README.md`](workshop-blueprint/README.md)
  - [`workshop-blueprint/day-structure.md`](workshop-blueprint/day-structure.md)
  - [`workshop-blueprint/control-surfaces.md`](workshop-blueprint/control-surfaces.md)
  - [`workshop-blueprint/edit-boundaries.md`](workshop-blueprint/edit-boundaries.md)
- participant skill, install flow, or portable bundle behavior:
  - [`workshop-skill/SKILL.md`](workshop-skill/SKILL.md)
  - [`docs/resource-packaging-model.md`](docs/resource-packaging-model.md)
  - [`docs/harness-cli-foundation.md`](docs/harness-cli-foundation.md)
- participant-facing workshop copy:
  - [`content/style-guide.md`](content/style-guide.md)
  - [`content/style-examples.md`](content/style-examples.md)

## Repo Map

```
/
├── AGENTS.md              # Short operating map for agents and maintainers
├── README.md              # Public repo orientation
├── dashboard/             # Next.js App Router workshop application
├── workshop-blueprint/    # Canonical public definition of the workshop method
├── workshop-skill/        # Authored participant-facing skill and AGENTS starter
├── harness-cli/           # CLI for participant bundle install and facilitator ops
├── content/               # Participant-facing briefs, cards, talks, facilitation
├── docs/                  # System of record for doctrine, plans, ADRs, boundaries
├── materials/             # Participant-facing print and takeaway assets
├── monitoring/            # Repo scanning and workshop monitoring helpers
└── capture/               # Quick capture pipeline and related support material
```

## Language

- Dev-facing docs and architecture notes: **English**
- Shared structured workshop content: canonical English authoring with reviewed localized delivery
- Participant-facing workshop delivery: per-workshop `contentLang` such as Czech or English
- Czech remains a first-class reviewed locale for real workshop runs
- Technical terms (AGENTS.md, skills, slash commands): English
- Code and configuration: English
- Participant-facing Czech copy should follow `content/style-guide.md` and `content/style-examples.md`
- Language architecture details live in [`docs/workshop-content-language-architecture.md`](docs/workshop-content-language-architecture.md)

## Working Rules

- Prefer repository knowledge over chat memory. If a rule or decision should survive the session, write it down in the repo.
- Prefer progressive disclosure. Keep this file short and route to deeper docs instead of pasting long policy blocks here.
- When the same issue repeats, improve the harness: add or sharpen instructions, tests, runbooks, or review routines.
- For dashboard UI work, treat [`docs/dashboard-design-system.md`](docs/dashboard-design-system.md) as the shared visual and interaction baseline. Update it or the relevant surface-specific design doc when you introduce a new recurring UI pattern.
- Do not introduce live workshop data, real logistics, or participant-private context into tracked public files.
- Keep the workshop method transferable across coding agents. Codex-specific helpers are useful accelerators, not the whole method.

## Framework Guidance

- `dashboard/` uses Next.js App Router with strict TypeScript and Tailwind CSS.
- Before changing framework-sensitive code in `dashboard/`, prefer the version-matched docs shipped in `dashboard/node_modules/next/dist/docs/` and the current Next.js AI agents guide.
- Treat framework docs as a source of truth when an implementation detail may have changed recently.

## Build And Test

```bash
cd dashboard && npm install && npm run dev
npm run test
npm run test:e2e
npm run lint
npm run build
```

Additional repo-specific checks:

- if you change the portable workshop bundle, sync the packaged artifact with `node harness-cli/scripts/sync-workshop-bundle.mjs`
- if you need a disposable repo-local discovery copy under `.agents/skills/`, generate it explicitly with `node harness-cli/scripts/sync-workshop-bundle.mjs --with-repo-bundle`
- if you change architecture or trust boundaries, update the relevant ADR or boundary doc in the same slice of work

## Verification Boundary

- Treat tests and executable checks as the default trust boundary once an agent is doing meaningful implementation work.
- Prefer the smallest useful failing test, tracer bullet, or executable check before implementation when behavior or trust boundaries change.
- For UI work, use the layered workflow:
  1. exploratory browser inspection in an isolated local environment
  2. repeatable Playwright regression for critical flows
  3. human review before considering the change complete
- Do not treat unrestricted browser autonomy in a normal authenticated browser as the default workflow.
- A change is not done when the diff looks plausible. It is done when the relevant checks ran, the docs still match reality, and the next team can continue without guessing.

## Key Constraints

- Dashboard must work on mobile (participants scan QR code)
- Workshop skill must be installable in both Codex and pi
- The system must support reviewed Czech workshop delivery without tying all authored source content to Czech-only storage
- No pre-work required from participants — everything works from zero on the day

## Trust Boundaries

- Public template repo stays public-safe and runnable with sample/demo data only.
- Participant-private workshop context belongs in the private workshop-instance layer and must not leak through public routes or files.
- Facilitator routes and mutations must stay on a separate auth path from participant event access.
- Any new artifact that is not safe to reveal before the event belongs in the private runtime layer or a separate private ops workspace, not in tracked repo files.

## Done Criteria

Before claiming work complete:

1. Run the relevant tests, lint, build, or tracer checks for the touched surface.
2. State clearly what you verified and what you did not verify.
3. Update plans, ADRs, runbooks, or harness docs when the change alters behavior, boundaries, or repeated workflow rules.
4. Leave the next safe move obvious for the next human or agent if the task is only partially complete.
