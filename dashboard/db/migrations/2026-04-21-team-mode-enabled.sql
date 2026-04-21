-- Workshop mode toggle. Default TRUE preserves today's team-based
-- behavior for existing workshop instances so in-flight rosters, teams,
-- and rotation plans are never silently flipped by a schema change.
--
-- The application code flips the default to FALSE when creating NEW
-- instances (see createWorkshopInstance in workshop-store.ts) to match
-- the expected common case where real team work is hard to arrange and
-- participant-first is the default reality. Facilitator toggles via
-- the admin UI; server action refuses changes while status = 'running'
-- to avoid mid-workshop data/UI inconsistency.
--
-- Tracked in docs/plans/2026-04-21-feat-optional-team-mode-plan.md
-- (Phase 1). Decisions originate from
-- docs/brainstorms/2026-04-21-optional-team-mode-brainstorm.md.
ALTER TABLE workshop_instances
  ADD COLUMN IF NOT EXISTS team_mode_enabled BOOLEAN NOT NULL DEFAULT TRUE;
