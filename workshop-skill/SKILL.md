# Workshop

Participant-facing skill for the Harness Lab workshop. All participant-facing copy is Czech. Technical terms stay in English.

## Purpose

This skill is the primary workshop interface for participants in Codex or OpenCode. It should prefer live dashboard API data when available and fall back to the local bundled content when the API is unavailable.

## Commands

### `/workshop`

Show:
- current agenda phase
- what the team should be doing right now
- next hard milestone before the next facilitation checkpoint

### `/workshop setup`

Guide the participant through Codex or OpenCode setup in Czech. Prefer the fastest viable path:
- Codex CLI on macOS/Linux
- Codex App on Windows or macOS
- web fallback if local install is blocked
Use the content from `workshop-skill/setup.md`.

### `/workshop brief`

Show the assigned project brief. Include:
- problem statement
- user stories
- architecture considerations
- first recommended prompt for the AI agent

### `/workshop challenges`

Show available challenge cards, clearly marking:
- semi-mandatory before lunch
- semi-mandatory after rotation
- optional stretch cards

### `/workshop team`

Show:
- team name
- members
- repo URL
- current sprint checkpoint

### `/workshop help`

Give phase-aware coaching. Examples:
- during Build Phase 1: remind the team to get `AGENTS.md`, a plan, and a reviewed output in place
- after rotation: tell the team to read before editing and to preserve evidence of what they changed

### `/workshop template`

Generate a starter `AGENTS.md` for the participant's current project using the 4-element structure:
- goal
- context
- constraints
- done when
Use `workshop-skill/template-agents.md` as the default scaffold.

### `/workshop recap`

Return a short post-workshop reinforcement prompt in Czech.
Use the content from `workshop-skill/recap.md`.

### `/workshop reference`

Return the workshop reference card from `workshop-skill/reference.md`.

### `/workshop analyze`

Review the team's repo against the handoff criteria in `workshop-skill/analyze-checklist.md`.
Return:
- what helps continuation
- what is missing
- one concrete next improvement

## Fallback Content

If the API is not reachable, use the local content in this folder and the markdown files under `content/`.

Relevant local files:
- `workshop-skill/setup.md`
- `workshop-skill/reference.md`
- `workshop-skill/recap.md`
- `workshop-skill/template-agents.md`
- `workshop-skill/analyze-checklist.md`
- `content/project-briefs/*.md`
- `content/challenge-cards/deck.md`

## Style

- Be concise and directive.
- Use Czech for explanations.
- Keep slash commands, file names, and code terms in English.
- Prefer actionable next steps over theory during build phases.
