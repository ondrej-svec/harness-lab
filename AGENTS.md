# Harness Lab

## Project Overview

Harness Lab is a full-day experiential developer workshop ("Developer Hackathon") teaching **harness engineering** — the discipline of engineering context, instructions, and workflows for AI coding agents.

The workshop uses a signature exercise called "The Silent Post": teams build projects with AI agents in the morning, then rotate completely after lunch. New teams continue using only what's in the repo. The quality of context engineering (AGENTS.md, skills, runbooks) determines whether the project survives the handoff.

**4 workshops**: 2× Brno (Apr 21, 23), 2× Prague (Apr 24, 29). ~20 devs each, mixed AI experience levels.

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

# No tests yet — this is content + a simple Next.js app
```

## Code Conventions

- Next.js App Router (no Pages Router)
- TypeScript strict mode
- Tailwind CSS for styling
- Content files in Markdown
- Keep it simple — this is a workshop support tool, not a product

## Key Constraints

- Dashboard must work on mobile (participants scan QR code)
- Workshop skill must be installable in both Codex and OpenCode
- All facilitation content must be in Czech
- No pre-work required from participants — everything works from zero on the day
