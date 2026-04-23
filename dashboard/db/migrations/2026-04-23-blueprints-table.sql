-- Blueprints as data. The runtime source of truth for reusable workshop
-- blueprints. The dashboard seeds from `workshop-blueprint/default.json`
-- on first boot (inline below); thereafter, all blueprint edits happen
-- via CLI and this table is authoritative.
--
-- Tracked in docs/plans/2026-04-23-feat-minimal-ui-and-blueprint-as-data-plan.md
-- (Phase 1). Decisions originate from
-- docs/brainstorms/2026-04-23-minimal-facilitator-ui-and-instance-override-model-brainstorm.md.
--
-- Schema notes:
--   - `id` is a stable slug used by CLI (`harness blueprint push ... --as <id>`).
--   - `name` mirrors `id` at seed; CLI edits can diverge if the facilitator
--     wants a friendly display name distinct from the slug.
--   - `version` bumps monotonically on `upsert`. Optimistic concurrency
--     lives on `version` (same pattern as `workshop_instances.state_version`).
--   - `body` is the full blueprint JSON. A zod `.loose()` shape guard
--     at `dashboard/lib/schemas/blueprint-schema.ts` tolerates forward-
--     compatible additions and emits `HARNESS_RUNTIME_ALERT` on drift.
--   - `language` and `team_mode` are hoisted out of `body` for indexability
--     and because the CLI lists filter on them; they stay in sync with
--     equivalent fields in `body` at write time.
--
-- Seed: `harness-lab-default` is the reference Harness Lab full-day EN
-- workshop. The `ON CONFLICT (id) DO NOTHING` clause keeps this idempotent
-- on re-run, including on production databases where the row already exists.

CREATE TABLE IF NOT EXISTS blueprints (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  version INTEGER NOT NULL DEFAULT 1,
  body JSONB NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  language TEXT NOT NULL,
  team_mode BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS blueprints_language_idx ON blueprints(language);

INSERT INTO blueprints (id, name, version, body, language, team_mode)
VALUES (
  'harness-lab-default',
  'harness-lab-default',
  1,
  '{
    "schemaVersion": 1,
    "name": "harness-lab-default",
    "language": "en",
    "teamMode": true,
    "title": "Harness Lab",
    "subtitle": "Public-readable 11-phase mirror of the Harness Lab workshop day",
    "startTime": "09:10",
    "principles": [
      "Context before generation",
      "Verification is the trust boundary",
      "Work so a fresh reader can continue"
    ],
    "phases": [
      { "id": "opening", "order": 1, "label": "Opening and orientation", "durationMinutes": 30, "startTime": "09:10", "kind": "shared", "goal": "Open the day as a shared start: why harness engineering matters right now, what the room will do from the first beat to the reveal, and how we will know the work can stand without improvised rescue.", "scenes": [] },
      { "id": "talk", "order": 2, "label": "The Craft Underneath", "durationMinutes": 25, "startTime": "09:40", "kind": "shared", "goal": "Turn the opening energy into a precise thesis: harness engineering is team infrastructure for working with agents, and the first build move must begin with map, boundaries, and proof rather than another prompt.", "scenes": [] },
      { "id": "demo", "order": 3, "label": "Let me show you", "durationMinutes": 25, "startTime": "10:05", "kind": "shared", "goal": "Use one compact story to show a real working line: context, bounded next steps, implementation, change control, and explicit fallback moves when something goes wrong.", "scenes": [] },
      { "id": "build-1", "order": 4, "label": "Build Phase 1", "durationMinutes": 65, "startTime": "10:30", "kind": "team", "goal": "Get every table to a real before-lunch baseline: a navigable repo, AGENTS.md, a plan, one explicit check, and a first reviewed slice of work.", "scenes": [] },
      { "id": "intermezzo-1", "order": 5, "label": "Intermezzo 1", "durationMinutes": 40, "startTime": "11:35", "kind": "shared", "goal": "Make the first round of learning visible across the room and reconnect teams to the discipline behind the output, not only to the output itself.", "scenes": [] },
      { "id": "lunch-reset", "order": 6, "label": "Lunch", "durationMinutes": 75, "startTime": "12:15", "kind": "shared", "goal": "Interrupt the momentum before the afternoon shift and force teams to leave behind a repo a fresh reader can actually enter.", "scenes": [] },
      { "id": "rotation", "order": 7, "label": "Team rotation", "durationMinutes": 15, "startTime": "13:30", "kind": "team", "goal": "Force a quiet start after rotation and let repo quality reveal what is genuinely legible.", "scenes": [] },
      { "id": "build-2", "order": 8, "label": "Build Phase 2 · first push", "durationMinutes": 60, "startTime": "13:45", "kind": "team", "goal": "Continue in your own repo after a fresh outside read, then turn that friction into stronger maps, stronger checks, and stronger continuation guidance.", "scenes": [] },
      { "id": "intermezzo-2", "order": 9, "label": "Intermezzo 2", "durationMinutes": 5, "startTime": "14:45", "kind": "shared", "goal": "Capture what truly helped after rotation and what is emerging as a weak point in the room''s current way of working.", "scenes": [] },
      { "id": "build-2-second-push", "order": 10, "label": "Build Phase 2 · second push", "durationMinutes": 55, "startTime": "14:50", "kind": "shared", "goal": "Apply the intermezzo''s signal. Iterate, extend, push further. Commit and make the repo readable for Reveal.", "scenes": [] },
      { "id": "reveal", "order": 11, "label": "Reveal and reflection", "durationMinutes": 45, "startTime": "15:45", "kind": "shared", "goal": "Close the day by naming the signals that helped the work carry forward after the reshuffle and fresh read, and turn them into next practice rather than a pleasant ending.", "scenes": [] }
    ],
    "inventory": { "briefs": [], "challenges": [] }
  }'::jsonb,
  'en',
  true
)
ON CONFLICT (id) DO NOTHING;
