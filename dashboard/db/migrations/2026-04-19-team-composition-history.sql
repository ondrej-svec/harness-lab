-- Append-only team-composition history for the facilitator People surface.
-- Keeps current truth in team_members and adds durable operational history.

CREATE TABLE IF NOT EXISTS team_composition_history (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL REFERENCES workshop_instances(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  participant_id TEXT REFERENCES participants(id) ON DELETE CASCADE,
  from_team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  to_team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_kind TEXT NOT NULL,
  note TEXT,
  rotation_id TEXT
);

CREATE INDEX IF NOT EXISTS team_composition_history_instance_captured_idx
  ON team_composition_history(instance_id, captured_at DESC);

CREATE INDEX IF NOT EXISTS team_composition_history_rotation_idx
  ON team_composition_history(instance_id, rotation_id)
  WHERE rotation_id IS NOT NULL;
