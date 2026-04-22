-- Participant feedback lane + room-signal poll persistence.
-- These tables back the Neon repositories used by:
-- - lib/participant-feedback-repository.ts
-- - lib/poll-response-repository.ts

CREATE TABLE IF NOT EXISTS participant_feedback (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL REFERENCES workshop_instances(id) ON DELETE CASCADE,
  agenda_item_id TEXT,
  participant_moment_id TEXT,
  participant_id TEXT REFERENCES participants(id) ON DELETE SET NULL,
  session_key TEXT NOT NULL,
  team_id TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('blocker', 'question')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  promoted_to_ticker_at TIMESTAMPTZ,
  promoted_ticker_id TEXT
);

CREATE INDEX IF NOT EXISTS participant_feedback_instance_created_idx
  ON participant_feedback(instance_id, created_at DESC);

CREATE INDEX IF NOT EXISTS participant_feedback_instance_kind_idx
  ON participant_feedback(instance_id, kind, created_at DESC);

CREATE TABLE IF NOT EXISTS participant_poll_responses (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL REFERENCES workshop_instances(id) ON DELETE CASCADE,
  poll_id TEXT NOT NULL,
  participant_id TEXT REFERENCES participants(id) ON DELETE SET NULL,
  session_key TEXT NOT NULL,
  team_id TEXT,
  option_id TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS participant_poll_responses_instance_poll_session_unique
  ON participant_poll_responses(instance_id, poll_id, session_key);

CREATE INDEX IF NOT EXISTS participant_poll_responses_instance_poll_idx
  ON participant_poll_responses(instance_id, poll_id, submitted_at ASC);
