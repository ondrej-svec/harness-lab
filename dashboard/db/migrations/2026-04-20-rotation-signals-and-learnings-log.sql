-- Code/schema drift: commit 31b0021 (2026-04-09) shipped
-- NeonRotationSignalRepository and NeonLearningsLogRepository without
-- companion CREATE TABLE statements. Any rotation-signal capture or
-- cross-cohort learnings write under HARNESS_STORAGE_MODE=neon crashes
-- with "relation does not exist".
--
-- Column shapes match the exact INSERT/SELECT in:
--   lib/rotation-signal-repository.ts
--   lib/learnings-log-repository.ts
--
-- tags + artifact_paths use JSONB because the writer casts with
-- ::jsonb and the reader lets the driver deserialize back to JS
-- arrays. team_id is a non-FK TEXT because signals should survive
-- team deletion (facilitators may reshuffle teams during the day);
-- the instance_id FK with ON DELETE CASCADE handles instance
-- teardown.

CREATE TABLE IF NOT EXISTS rotation_signals (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL REFERENCES workshop_instances(id) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ NOT NULL,
  captured_by TEXT NOT NULL,
  team_id TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  free_text TEXT NOT NULL,
  artifact_paths JSONB
);

CREATE INDEX IF NOT EXISTS rotation_signals_instance_captured_at_idx
  ON rotation_signals(instance_id, captured_at);

-- learnings_log is intentionally instance-linked via FK but the file
-- variant keeps entries OUTSIDE the instance directory so they
-- survive instance teardown (see repo header). Mirror that intent
-- here with ON DELETE SET NULL — the signal payload keeps the
-- instanceId inside its JSONB and stays queryable across cohorts.
CREATE TABLE IF NOT EXISTS learnings_log (
  cohort TEXT NOT NULL,
  instance_id TEXT REFERENCES workshop_instances(id) ON DELETE SET NULL,
  logged_at TIMESTAMPTZ NOT NULL,
  signal JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS learnings_log_cohort_logged_at_idx
  ON learnings_log(cohort, logged_at);
