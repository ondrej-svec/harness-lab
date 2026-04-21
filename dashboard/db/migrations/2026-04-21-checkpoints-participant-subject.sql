-- ProgressSubject data layer for optional-team-mode (Phase 2 of
-- docs/plans/2026-04-21-feat-optional-team-mode-plan.md).
--
-- Checkpoint rows reference a "subject" — either a team (team mode)
-- or a participant (participant mode). Schema enforces that exactly
-- one of team_id / participant_id is set on new inserts and updates.
--
-- NOT VALID skips validation of pre-migration rows so the constraint
-- does not reject the migration even if legacy data with a NULL
-- team_id exists somewhere. New writes are still protected.
ALTER TABLE checkpoints
  ADD COLUMN IF NOT EXISTS participant_id TEXT;

ALTER TABLE checkpoints
  ADD CONSTRAINT checkpoints_subject_xor
  CHECK ((team_id IS NULL) <> (participant_id IS NULL))
  NOT VALID;
