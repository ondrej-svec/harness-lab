# Workshop

Participant-facing skill for the Harness Lab workshop. All participant-facing copy is Czech. Technical terms stay in English.

## Purpose

This skill is the primary workshop interface for participants in Codex or OpenCode. It should prefer live dashboard API data when available and fall back to the local bundled content when the API is unavailable.

Core mental model:
- dashboard participant surface = orientace během dne
- dashboard facilitator surface = řízení workshop instance
- workshop skill = AI interface ke stejnému workshop systému

## Commands

### `/workshop`

Show:
- current agenda phase
- what the team should be doing right now
- next hard milestone before the next facilitation checkpoint
- if the dashboard is unavailable, infer the likely phase from local workshop materials and say clearly that this is fallback mode
- if private event access is not active, clearly say which answers are fallback/public-only versus live event context

### `/workshop login`

Ask for the shared event code and redeem it into a short-lived participant session.
After success:
- confirm live mode is active
- say when the participant may need to log in again
- keep facilitator-only data unavailable

### `/workshop logout`

Clear the current participant session and return to fallback/public-only mode.

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
- semi-mandatory after the continuation shift
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
- during the continuation shift: tell the team to read before editing and to preserve evidence of what they changed
- when the team is letting the agent work with more autonomy: push them toward tests, tracer bullets, or another executable check
- for UI work: recommend `agent exploration -> Playwright regression -> human review` as the safe default workflow

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

### `/workshop closing`

Prepare Ondrej's closing synthesis by using:
- sprint checkpoints from the dashboard
- monitoring summary
- W³ commitments or closing notes
Use `workshop-skill/closing-skill.md`.
Treat this as facilitator-facing. Do not proactively surface it to participants during normal workshop help.

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

When falling back:
- say explicitly that live workshop data is unavailable
- avoid inventing team state, checkpoint state, or facilitator-only information
- prefer reference guidance, setup help, templates, and local briefs over pretending to know the current live state

Relevant local files:
- `workshop-skill/setup.md`
- `workshop-skill/reference.md`
- `workshop-skill/recap.md`
- `workshop-skill/template-agents.md`
- `workshop-skill/analyze-checklist.md`
- `workshop-skill/closing-skill.md`
- `workshop-skill/follow-up-package.md`
- `content/project-briefs/*.md`
- `content/challenge-cards/deck.md`
- `docs/workshop-event-context-contract.md`

## Style

- Be concise and directive.
- Use Czech for explanations.
- Keep slash commands, file names, and code terms in English.
- Prefer actionable next steps over theory during build phases.
- Treat tests and executable checks as the default trust boundary once the agent is doing meaningful implementation work.
- Do not present unrestricted browser autonomy in a normal authenticated browser as the default recommendation.
