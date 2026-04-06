# Harness Lab

## Project Overview

Harness Lab is a full-day experiential developer workshop ("Developer Hackathon") teaching **harness engineering** — the discipline of engineering context, instructions, and workflows for AI coding agents.

The workshop is designed around build phases, a mid-day continuation shift, and strong emphasis on what survives in the repository itself. The quality of context engineering (`AGENTS.md`, skills, runbooks) determines whether another team can continue without friction.

This repository is the public-safe template version of the workshop. Real workshop dates, venues, and live operational state should live in the private workshop-instance layer, not here.

## Repository Structure

```
/
├── AGENTS.md              # This file
├── README.md
├── dashboard/             # Next.js App Router — workshop web page (Vercel)
├── content/
│   ├── project-briefs/    # Product definitions for teams (Czech)
│   ├── challenge-cards/   # Suggestion cards for tables (Czech)
│   ├── talks/             # Talk outlines and speaker notes
│   └── facilitation/      # Facilitation guides per segment
├── workshop-skill/        # Participant-facing skill (Codex/OpenCode installable)
├── monitoring/            # Agent monitoring scripts for repo scanning
├── capture/               # Quick capture pipeline (voice → structured notes)
└── materials/             # Print-ready cards, reference sheets, QR codes
```

## Language

- All participant-facing content: **Czech**
- Technical terms (AGENTS.md, skills, slash commands): English
- Code and configuration: English
- This file and dev-facing docs: English
- Participant-facing copy should follow `content/style-guide.md` and `content/style-examples.md`

## Build & Test

```bash
# Dashboard
cd dashboard && npm install && npm run dev
npm run test
npm run test:e2e
npm run lint
npm run build
```

## Code Conventions

- Next.js App Router (no Pages Router)
- TypeScript strict mode
- Tailwind CSS for styling
- Content files in Markdown
- Keep it simple — this is a workshop support tool, not a product

## Working Doctrine

- Harness Lab must embody the same harness-engineering discipline it teaches.
- Put context before generation: important constraints, architecture boundaries, and operating rules should exist in repo-native guidance before high-autonomy implementation.
- Treat tests and executable checks as the default trust boundary once an agent is doing meaningful implementation work.
- Prefer the smallest useful failing test, tracer bullet, or executable check before implementation when behavior or trust boundaries change.
- For UI work, use the layered workflow:
  1. exploratory browser inspection in an isolated local environment
  2. repeatable Playwright regression for critical flows
  3. human review before considering the change complete
- Do not treat unrestricted browser autonomy in a normal authenticated browser as the default workflow.
- When architecture or trust boundaries change, write or update the relevant ADR/note alongside the implementation.
- Improve the harness when issues repeat: strengthen context, rules, tests, or review routines instead of only fixing the immediate output.

Authoritative architecture references for the private workshop-instance model:

- `docs/adr/2026-04-06-private-workshop-instance-runtime-topology.md`
- `docs/adr/2026-04-06-private-workshop-instance-auth-boundary.md`
- `docs/private-workshop-instance-data-classification.md`
- `docs/private-workshop-instance-schema.md`
- `docs/private-workshop-instance-auth-model.md`
- `docs/private-workshop-instance-deployment-spec.md`
- `docs/private-workshop-instance-security-gates.md`
- `docs/public-launch-history-cleanup-plan.md`

## Key Constraints

- Dashboard must work on mobile (participants scan QR code)
- Workshop skill must be installable in both Codex and OpenCode
- All facilitation content must be in Czech
- No pre-work required from participants — everything works from zero on the day

## Trust Boundaries

- Public template repo stays public-safe and runnable with sample/demo data only.
- Participant-private workshop context belongs in the private workshop-instance layer and must not leak through public routes or files.
- Facilitator routes and mutations must stay on a separate auth path from participant event access.
- Any new artifact that is not safe to reveal before the event belongs in the private runtime layer or a separate private ops workspace, not in tracked repo files.
