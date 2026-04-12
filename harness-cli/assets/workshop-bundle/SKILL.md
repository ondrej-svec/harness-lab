---
name: workshop
description: >
  Participant-facing skill for the Harness Lab workshop. Supports the
  `workshop` skill interface for setup, briefs, challenges, reference
  materials, recap, and repo analysis using live dashboard data when
  available and local fallback content otherwise. Facilitator commands
  live in SKILL-facilitator.md and load only after facilitator login.
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

Participant-facing skill for the Harness Lab workshop. Command semantics stay in English, but participant-facing delivery should follow the active workshop `contentLang` when live runtime data is available and otherwise resolve to a reviewed fallback locale instead of inheriting the raw language of whichever supporting doc was opened first.

## Purpose

This skill is the primary workshop interface for participants in Codex or pi. It should prefer live dashboard API data when available and fall back to the local bundled content when the API is unavailable.

The portable install path should make this skill usable from the participant's real working repo without requiring a clone of the Harness Lab source repo.

Core mental model:
- dashboard participant surface = orientation during the day
- dashboard facilitator surface = control of the workshop instance
- workshop skill = AI interface to the same workshop system
- workshop blueprint = public canonical definition of the workshop method
- `uiLang` = language of product chrome
- `contentLang` = language of workshop content for participant-facing delivery

## Language Resolution

Command semantics stay in English. Resolve the response language in this order:

1. If live workshop data provides `contentLang` and the command is participant-facing workshop delivery, use that locale.
2. Otherwise, match the user's current language when it maps to a reviewed locale in the repo or bundle.
3. If there is no clear live or user-language signal, default bundled fallback delivery to English (`en`).

Additional rules:
- the authored language of a supporting doc does not decide the reply language by itself
- if the requested locale has no reviewed variant, fall back to English and say so explicitly
- do not let a Czech-authored fallback file force a Czech answer when the resolved response locale is English

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
- `workshop-skill/locales/<locale>/` when a reviewed localized fallback doc exists for the requested delivery language
- `workshop-blueprint/` for the reusable workshop method
- challenge cards, project briefs, and public-safe framing

Rule:
- for all commands that need live workshop data, prefer `harness --json <command>` over direct API calls. The CLI handles authentication, session management, and origin headers. The skill must not make HTTP requests directly or store credentials.
- runtime data via CLI first for live workshop state
- repo docs first for durable workshop guidance
- if runtime is unavailable, fall back to repo material and say explicitly that the answer is fallback rather than live state
- runtime edits do not imply blueprint edits; reusable changes belong back in the repo deliberately
- prefer workshop `contentLang` for participant-facing responses in live mode
- if there is no live workshop context, resolve the fallback locale using the Language Resolution rules above and say when the answer is fallback content rather than live workshop state
- skill reference docs in `workshop-skill/*.md` are English-canonical per ADR `docs/adr/2026-04-12-skill-docs-english-canonical.md`. The agent reads the English source and responds in the participant's language by translating on the fly. Do not maintain parallel Czech copies for skill reference material.
- for participant-facing workshop copy that appears verbatim on the presenter surface (agenda scenes, briefs, challenge cards), reviewed Czech translations still matter — that governance lives in `workshop-content/agenda.json`, `content/project-briefs/`, and `content/challenge-cards/`, not in the skill docs.
- the `workshop-skill/locales/` tree is a legacy parallel structure that is being retired; new skill reference content goes only to the English root files. Existing Czech legacy files in `workshop-skill/locales/cs/` (if any) or at the root should be migrated in a follow-up session, not extended.
- do not translate workshop scene copy or brief text ad hoc when a reviewed locale exists in `workshop-content/` or `content/`

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

Ask the participant for the shared event code, then run `harness auth login --code <CODE>` to authenticate.
After success:
- confirm live mode is active
- say when the participant may need to log in again
- keep facilitator-only data unavailable
The CLI handles all HTTP requests, cookies, and session storage. The skill must not make HTTP requests directly.

### `workshop logout`

Run `harness auth logout` to clear the current session and return to fallback/public-only mode.

### `workshop setup`

Guide the participant through Codex or pi setup in the active workshop content language. Prefer the fastest viable path:
- pi in terminal when the participant wants a hackable multi-model interface
- Codex CLI on macOS/Linux
- Codex App on Windows or macOS
- web fallback if local install is blocked
Use `workshop-skill/locales/<locale>/setup.md` when present, otherwise fall back to `workshop-skill/setup.md`.

### `workshop brief`

Show the assigned project brief. Prefer `harness --json workshop brief` for live data. Include:
- problem statement
- user stories
- architecture considerations
- first recommended prompt for the AI agent
If live runtime brief data is unavailable, prefer `content/project-briefs/locales/<locale>/<brief>.md` when present and otherwise fall back to `content/project-briefs/<brief>.md`.

### `workshop briefs`

List every project brief available in the current instance so the team can pick one during Phase 3. Prefer `harness --json workshop briefs` for live data, which returns the same payload as `workshop brief` but framed as a catalogue — one line per brief with id, title, and the one-sentence problem, then a short pointer to how to pull the full brief.

If live runtime data is unavailable, enumerate every file under `content/project-briefs/locales/<locale>/*.md` (or `content/project-briefs/*.md` when no locale match) and summarize each by its `# Title` and the first paragraph of `## Problem`. Do not try to display full briefs in one response — keep the listing compact and tell the participant to run `workshop brief` for any one they want to read in detail.

### `workshop commitment`

Store a personal commitment the participant will act on the next time they work with an agent. This is the Phase 10 Reveal closing beat: one sentence, specific enough that the participant could tell a week later whether they actually did it.

Format the commitment as: *"The next time I work with an agent, the first thing I'll change is [specific action] — because [specific reason from today]."*

The skill writes the commitment to `.agents/notes/commitment.md` in the current working directory when that folder exists, or to `~/.harness/commitment.md` otherwise. Include the date, the workshop instance id if known, and the sentence itself. Acknowledge the save and remind the participant where the commitment lives so they can find it later. Never push the commitment anywhere else by default — sharing is an explicit opt-in and does not happen unless the participant asks for it.

### `workshop challenges`

Show available challenge cards. Prefer `harness --json workshop challenges` for live data. Clearly mark:
- semi-mandatory before lunch
- semi-mandatory after the continuation shift
- optional stretch cards
If live runtime challenge data is unavailable, prefer `content/challenge-cards/locales/<locale>/deck.md` when present and otherwise fall back to `content/challenge-cards/deck.md`.

### `workshop team`

Prefer `harness --json workshop team` for live data. Show:
- team name
- members
- repo URL
- current sprint checkpoint

### `workshop help`

Give phase-aware coaching. Examples:
- during Build Phase 1: remind the team to get a short `AGENTS.md`, a plan, commands, one executable check, and a reviewed output in place. Also include this provocation: "Zkuste toto: dejte agentovi úkol bez omezení a sledujte, co si vybere. Pak porovnejte výsledek se čtyřmi prvky dobrého úkolu (Goal / Context / Constraints / Done When). Co chybělo?"
- during the continuation shift: tell the team to read before editing and to preserve evidence of what they changed
- when the team is letting the agent work with more autonomy: push them toward tests, tracer bullets, or another executable check
- for UI work: recommend `agent exploration -> Playwright regression -> human review` as the safe default workflow
- when teams keep repeating the same rule out loud: push them to encode it in the repo instead of relying on chat memory
- when the user asks generally what the skill can do, prefer returning a short menu based on `workshop-skill/commands.md` plus the best next step

### `workshop template`

Generate a starter `AGENTS.md` for the participant's current project using the 4-element structure:
- goal
- context
- constraints
- done when
Use `workshop-skill/template-agents.md` as the default scaffold.
Keep it short and map-like. Prefer links to deeper docs over long prose dumps.

### `workshop recap`

Return a short post-workshop reinforcement prompt in the active workshop content language.
Use `workshop-skill/locales/<locale>/recap.md` when present, otherwise fall back to `workshop-skill/recap.md`.

### `workshop commands`

Return a short participant-facing menu of the skill surface:
- what the main commands are
- when to use them
- the shortest recommended path for a new participant
Use `workshop-skill/locales/<locale>/commands.md` when present, otherwise fall back to `workshop-skill/commands.md`.

### `workshop reference`

Return the workshop reference card from `workshop-skill/locales/<locale>/reference.md` when present, otherwise fall back to `workshop-skill/reference.md`.

### `workshop resources`

Return the participant-facing resource bundle after or during the workshop.
Use these sources together:
- `materials/locales/<locale>/participant-resource-kit.md` when present, otherwise `materials/participant-resource-kit.md`
- `docs/locales/<locale>/learner-resource-kit.md` when present, otherwise `docs/learner-resource-kit.md`

The response should:
- summarize what is in the kit
- explain what to use during the workshop versus after it
- point the participant to the most useful next artifact rather than dumping links only

### `workshop gallery`

Return the curated external reference gallery from `docs/locales/<locale>/learner-reference-gallery.md` when present, otherwise `docs/learner-reference-gallery.md`.
Use this when the participant asks for further reading, public examples, optional skill packs, or recommended external resources after the workshop.

### `workshop follow-up`

Return the follow-up package from `workshop-skill/locales/<locale>/follow-up-package.md` when present, otherwise `workshop-skill/follow-up-package.md`.
Use this when the participant asks what to do after the workshop, what to revisit tomorrow, or what materials to keep using next week.

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
- `workshop-skill/commands.md`
- `workshop-skill/reference.md`
- `workshop-skill/recap.md`
- `workshop-skill/template-agents.md`
- `workshop-skill/analyze-checklist.md`
- `workshop-skill/follow-up-package.md`
- `materials/participant-resource-kit.md`
- `materials/coaching-codex.md`
- `docs/learner-resource-kit.md`
- `docs/learner-reference-gallery.md`
- `content/project-briefs/*.md`
- `content/challenge-cards/deck.md`
- `content/codex-craft.md`
- `workshop-blueprint/*`
- `docs/workshop-event-context-contract.md`
- `docs/harness-cli-foundation.md`

## Style

- Be concise and directive.
- Use the resolved response language.
- English is the default bundled fallback locale when no live or user-language signal overrides it.
- Keep command names, file names, and code terms in English.
- Prefer actionable next steps over theory during build phases.
- Treat tests and executable checks as the default trust boundary once the agent is doing meaningful implementation work.
- Prefer repo-native guidance over advice that would stay only in chat.
- Treat `AGENTS.md` as a map that points to sources of truth, not as a giant instruction dump.
- Do not present unrestricted browser autonomy in a normal authenticated browser as the default recommendation.
