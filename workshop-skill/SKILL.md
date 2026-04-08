---
name: workshop
description: >
  Participant-facing skill for the Harness Lab workshop. Supports the
  `workshop` skill interface for setup, briefs, challenges, recap, and
  facilitator actions using live dashboard data when available and local
  fallback content otherwise.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Agent
  - AskUserQuestion
  - Write
  - Edit
  - Bash
---

# Workshop

Participant-facing skill for the Harness Lab workshop. All participant-facing copy is Czech. Technical terms stay in English.

## Purpose

This skill is the primary workshop interface for participants in Codex or pi. It should prefer live dashboard API data when available and fall back to the local bundled content when the API is unavailable.

Core mental model:
- dashboard participant surface = orientace během dne
- dashboard facilitator surface = řízení workshop instance
- workshop skill = AI interface ke stejnému workshop systému
- workshop blueprint = veřejná kanonická definice workshop method

## Sources Of Truth

Use runtime dashboard data for anything that changes during the workshop day:
- current agenda phase
- continuation reveal state
- live team registry
- checkpoints and sprint updates
- facilitator-only status when the command explicitly requires facilitator access

Use repo-native content for stable public guidance:
- `content/` workshop materials
- `workshop-skill/` reference docs
- `workshop-blueprint/` for the reusable workshop method
- challenge cards, project briefs, and public-safe framing

Rule:
- runtime APIs first for live workshop state
- repo docs first for durable workshop guidance
- if runtime is unavailable, fall back to repo material and say explicitly that the answer is fallback rather than live state
- runtime edits do not imply blueprint edits; reusable changes belong back in the repo deliberately

## Commands

Syntax:
- in Codex, invoke this skill as `$workshop ...`
- in pi, load it with `/skill:workshop` or let pi auto-load it, then ask for the relevant workshop action in natural language
- the command names below are runtime-neutral descriptions of the same interface

### `workshop`

Show:
- current agenda phase
- what the team should be doing right now
- next hard milestone before the next facilitation checkpoint
- if the dashboard is unavailable, infer the likely phase from local workshop materials and say clearly that this is fallback mode
- if private event access is not active, clearly say which answers are fallback/public-only versus live event context

### `workshop login`

Ask for the shared event code and redeem it into a short-lived participant session.
After success:
- confirm live mode is active
- say when the participant may need to log in again
- keep facilitator-only data unavailable

### `workshop logout`

Clear the current participant session and return to fallback/public-only mode.

### `workshop setup`

Guide the participant through Codex or pi setup in Czech. Prefer the fastest viable path:
- pi in terminal when the participant wants a hackable multi-model interface
- Codex CLI on macOS/Linux
- Codex App on Windows or macOS
- web fallback if local install is blocked
Use the content from `workshop-skill/setup.md`.

### `workshop brief`

Show the assigned project brief. Include:
- problem statement
- user stories
- architecture considerations
- first recommended prompt for the AI agent

### `workshop challenges`

Show available challenge cards, clearly marking:
- semi-mandatory before lunch
- semi-mandatory after the continuation shift
- optional stretch cards

### `workshop team`

Show:
- team name
- members
- repo URL
- current sprint checkpoint

### `workshop help`

Give phase-aware coaching. Examples:
- during Build Phase 1: remind the team to get a short `AGENTS.md`, a plan, commands, one executable check, and a reviewed output in place
- during the continuation shift: tell the team to read before editing and to preserve evidence of what they changed
- when the team is letting the agent work with more autonomy: push them toward tests, tracer bullets, or another executable check
- for UI work: recommend `agent exploration -> Playwright regression -> human review` as the safe default workflow
- when teams keep repeating the same rule out loud: push them to encode it in the repo instead of relying on chat memory

### `workshop template`

Generate a starter `AGENTS.md` for the participant's current project using the 4-element structure:
- goal
- context
- constraints
- done when
Use `workshop-skill/template-agents.md` as the default scaffold.
Keep it short and map-like. Prefer links to deeper docs over long prose dumps.

### `workshop recap`

Return a short post-workshop reinforcement prompt in Czech.
Use the content from `workshop-skill/recap.md`.

### `workshop closing`

Prepare Ondrej's closing synthesis by using:
- sprint checkpoints from the dashboard
- monitoring summary
- W³ commitments or closing notes
Use `workshop-skill/closing-skill.md`.
Treat this as facilitator-facing. Do not proactively surface it to participants during normal workshop help.

### `workshop reference`

Return the workshop reference card from `workshop-skill/reference.md`.

### `workshop facilitator login`

Authenticate as a facilitator through the `harness` CLI privileged path.
The skill should ask the facilitator to complete CLI login/bootstrap if needed, then use the CLI-backed session for subsequent commands.
This is a facilitator-only command — do not surface to participants.

### `workshop facilitator status`

Show the current instance state, agenda phase, facilitator list, and team count.
Requires active facilitator session.

### `workshop facilitator grant <email> <role>`

Grant a Neon Auth user access to the current workshop instance.
Roles: owner, operator, observer. Requires `owner` role.

### `workshop facilitator revoke <email>`

Revoke a facilitator's access to the current instance. Requires `owner` role.

### `workshop facilitator create-instance`

Create a new workshop instance from a template. Requires facilitator session.

The skill should support rich event metadata, not just id and city:
- `id`
- `templateId`
- `eventTitle`
- `city`
- `dateRange`
- `venueName`
- `roomName`
- `addressLine`
- `locationDetails`
- `facilitatorLabel`

### `workshop facilitator update-instance <instance-id>`

Update event metadata for an existing workshop instance. Requires facilitator session.
Use this when the facilitator wants to correct or refine date, venue, room, address, or event title without resetting the instance.

### `workshop facilitator remove-instance`

Remove a workshop instance from the active list without deleting its archive history. Requires facilitator session.

### `workshop facilitator prepare`

Set the current instance to `prepared` state. Verify event code is ready.

### `workshop facilitator agenda`

Inspect and edit the local agenda copy for one workshop instance. Requires facilitator session.

### `workshop facilitator scenes`

Inspect and edit presenter scenes for one workshop instance. This includes listing scenes for an agenda item, creating a new scene, editing content, changing default scene, reordering scenes, and enabling or hiding scenes. Requires facilitator session.

### `workshop facilitator archive`

Archive the current workshop instance with optional notes.

### `workshop analyze`

Review the team's repo against the handoff criteria in `workshop-skill/analyze-checklist.md`.
Return:
- what helps continuation
- what is missing
- one concrete next improvement
- whether the repo makes the next safe move obvious for a new team

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
- `workshop-skill/facilitator.md`
- `content/project-briefs/*.md`
- `content/challenge-cards/deck.md`
- `workshop-blueprint/*`
- `docs/workshop-event-context-contract.md`
- `docs/harness-cli-foundation.md`

## Style

- Be concise and directive.
- Use Czech for explanations.
- Keep command names, file names, and code terms in English.
- Prefer actionable next steps over theory during build phases.
- Treat tests and executable checks as the default trust boundary once the agent is doing meaningful implementation work.
- Prefer repo-native guidance over advice that would stay only in chat.
- Treat `AGENTS.md` as a map that points to sources of truth, not as a giant instruction dump.
- Do not present unrestricted browser autonomy in a normal authenticated browser as the default recommendation.
