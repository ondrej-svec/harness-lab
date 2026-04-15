# workshop-skill/

## Mission

Authored participant-facing skill that an AI coding agent (Codex, Claude Code, pi) consumes in the workshop. This directory holds the skill itself, not derivative runtime state. **Participant surface and facilitator surface are split.**

## Read First

Before editing anything under `workshop-skill/`:

1. [`../docs/agents-md-standard.md`](../docs/agents-md-standard.md) — the map-not-manual rule that applies to the skill's `template-agents.md` and `analyze-checklist.md`.
2. [`../docs/adr/2026-04-12-skill-docs-english-canonical.md`](../docs/adr/2026-04-12-skill-docs-english-canonical.md) — English is the canonical language for skill reference docs; the agent translates on the fly.
3. [`SKILL.md`](SKILL.md) for the participant menu surface and [`SKILL-facilitator.md`](SKILL-facilitator.md) for the facilitator surface.
4. [`../docs/resource-packaging-model.md`](../docs/resource-packaging-model.md) for how the skill ships inside the portable bundle.

## Task Routing

- Participant command or reference edit → update `SKILL.md`, `commands.md`, `reference.md`, etc. Keep the participant surface small — a 30-command menu is extraneous cognitive load.
- Facilitator command or login flow → update `SKILL-facilitator.md` only. The participant skill must not know facilitator commands exist.
- Bundle stale after a content change → `node harness-cli/scripts/sync-workshop-bundle.mjs`. Treat the packaged bundle under `harness-cli/assets/workshop-bundle/` as a generated mirror; never hand-edit.
- New translation concern → do not maintain parallel Czech copies of skill reference docs. The agent translates on the fly per the English-canonical ADR.

## Verification Boundary

- The bundle mirror must match authored sources. `cd harness-cli && npm run verify:workshop-bundle` is the hard gate.
- Participant/facilitator split is a trust boundary: a participant install path must never pull the facilitator skill without an explicit flag. `harness-cli/test/run-cli.test.js` asserts this — do not relax those tests.
- Skill reference docs are English-canonical (`docs/adr/2026-04-12-skill-docs-english-canonical.md`); do not invite the `marvin:copy-editor` Czech gate onto this directory.

## Done Criteria

1. `cd harness-cli && npm run verify:workshop-bundle` passes after any source change here.
2. `npm test` in `harness-cli/` passes, including the participant/facilitator split regression.
3. Participant surface stays participant-only; facilitator content stays in `SKILL-facilitator.md`.
4. No parallel Czech copies added.
