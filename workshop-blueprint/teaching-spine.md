# Workshop Teaching Spine

This document defines what Harness Lab should repeatedly teach, recommend, and normalize through the day.

The aim is not to add a separate rubric on top of the workshop. The aim is to make the desired operating habits the default behavior of the room, the dashboard, the workshop skill, and the facilitator prompts.

## Core Thesis

Participants are not here to learn "how to prompt better."

They are here to learn how to build a repository and workflow that an AI coding agent and another team can actually continue. The engineer's role shifts upward:

- humans steer
- agents execute
- the repo carries context
- verification carries trust

## Five Habits To Install

### 1. Map before motion

Teach:
- start by making the repo navigable
- use `AGENTS.md` as a short map to the important files, rules, and next steps

What to say:
- "Než začnete generovat feature, udělejte z repa místo, kde se dá orientovat."

Adoption signal:
- the team has a short `AGENTS.md`, clear entry points, and an explicit next safe step

Anchor moment:
- The first time you open a new repo, a new task, or a new agent session.

### 2. If it is not in the repo, it does not exist

Teach:
- decisions, constraints, and working rules belong in tracked artifacts
- oral handoff, chat memory, and facilitator memory are not durable context

What to say:
- "To, co má přežít vás i context window, musí být dohledatelné v repu."

Adoption signal:
- new assumptions become docs, plan updates, runbooks, or tests instead of staying in chat

Anchor moment:
- The moment you close a chat window, finish a call, or end a pairing session where a decision was made.

### 3. Verification is the trust boundary

Teach:
- the more autonomy the agent gets, the stronger the verification loop must become
- use the smallest useful test, tracer bullet, browser regression, or check

What to say:
- "Jakmile agent pracuje samostatněji, nestačí důvěra. Potřebujete důkaz."

Adoption signal:
- meaningful work has executable evidence attached to it

Anchor moment:
- The moment you feel confident enough to move on — that confidence is the trigger to verify, not skip verification.

### 4. Boundaries create speed

Teach:
- simple architecture rules and explicit constraints help agents move faster with less drift
- prefer boring, legible structure over clever opacity

What to say:
- "Mantinely nejsou brzda. S agentem jsou to koleje."

Adoption signal:
- the repo names boundaries, commands, and done criteria clearly enough that a new team can act without guessing

Anchor moment:
- The moment before you delegate a task to the agent — write the constraint before the prompt.

### 5. Cleanup is part of build

Teach:
- drift compounds quickly in agent-heavy workflows
- repeated review comments should become templates, checks, or reusable guidance

What to say:
- "Když vás něco bolí podruhé, nemá to zůstat jen jako připomínka v hlavě."

Adoption signal:
- teams stop to simplify, document, or encode a recurring rule before moving on

Anchor moment:
- The second time the same review comment, friction point, or manual step appears.

## Phase-By-Phase Teaching Moves

### Opening and framing

Teach:
- the workshop is about operating systems for agent work, not prompt theatre
- the real output is a repo that can speak for itself

Facilitator line:
- "Dnes nebudeme soutěžit v promptování. Budeme stavět pracovní systém, který přežije handoff."

### Context is King talk

Teach:
- progressive disclosure beats giant prompts
- `AGENTS.md` should be a map, not an encyclopedia
- repository knowledge should become the system of record

Demonstrate:
- a weak task with missing constraints
- a stronger task with goal, context, constraints, and done criteria
- the difference between a giant blob and a layered map

### Build Phase 1

Teach:
- before lunch, teams should establish the operating surface that makes later autonomy safe

Push teams toward:
- short `AGENTS.md`
- plan or tracked implementation path
- build/test commands
- one executable verification loop
- one reviewed output

### Continuation shift

Teach:
- continuation is the real exam
- the receiving team should diagnose before editing

Push teams toward:
- reading `README`, `AGENTS.md`, and the current plan first
- writing what helped, what is missing, what is risky, and what the next safe move is

### Reveal and reflection

Teach:
- repeated pain should become a better harness artifact
- the harness is part of the product, not support material around it

Push teams toward:
- concrete examples of what saved time
- concrete examples of what remained implicit
- one improvement they would carry back to real work next week
