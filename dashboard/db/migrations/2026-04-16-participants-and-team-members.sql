-- Participants & team-members: first-class named-participant layer + normalized
-- team-membership join. See docs/plans/2026-04-16-feat-participant-management-
-- and-team-formation-plan.md and docs/previews/2026-04-16-participant-api-sketch.md.

CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL REFERENCES workshop_instances(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT,
  email_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  tag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS participants_instance_id_idx
  ON participants(instance_id);

-- Case-insensitive duplicate guard within an instance. Archived rows are
-- excluded so a facilitator can re-add someone under the same name after
-- removing them. Partial unique index matches the UI's dedupe behavior.
CREATE UNIQUE INDEX IF NOT EXISTS participants_instance_display_name_unique
  ON participants(instance_id, LOWER(display_name))
  WHERE archived_at IS NULL;

CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL REFERENCES workshop_instances(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One participant can belong to at most one team per instance. Move
-- semantics (assign-or-move) requires deleting the old row before
-- inserting the new, which is how PUT /api/admin/team-members works.
CREATE UNIQUE INDEX IF NOT EXISTS team_members_participant_unique
  ON team_members(participant_id);

CREATE INDEX IF NOT EXISTS team_members_instance_team_idx
  ON team_members(instance_id, team_id);

-- Soft binding from anonymous sessions to named participants. NULLABLE —
-- unbound sessions (anonymous redeem without self-identify) keep working
-- exactly as before. ON DELETE SET NULL means archiving a participant
-- preserves their in-flight session but drops the identity link.
ALTER TABLE participant_sessions
  ADD COLUMN IF NOT EXISTS participant_id TEXT
  REFERENCES participants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS participant_sessions_participant_id_idx
  ON participant_sessions(participant_id);
