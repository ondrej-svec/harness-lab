-- Post-workshop feedback form (Phase 1 of
-- docs/plans/2026-04-21-feat-post-workshop-feedback-plan.md).
--
-- Two additive schema pieces:
--
-- 1) workshop_instances.feedback_form (nullable JSONB)
--    Per-instance override of the default question template. NULL means
--    "use the built-in default from getDefaultFeedbackTemplate()". Shape
--    is a FeedbackFormTemplate: { questions: FeedbackQuestion[] } where
--    each question is a tagged union (likert / stars / single-choice /
--    multi-choice / open-text / checkbox) with bilingual prompt keys.
--
-- 2) workshop_feedback_submissions
--    One row per (instance, session_key) carrying the structured
--    answers JSONB. Unique constraint enforces one submission per
--    participant-session per instance; edits within the lock window are
--    implemented as UPSERTs at the repository layer (see
--    FeedbackSubmissionRepository — the lock window is enforced in code
--    via a submitted_at age check, not at the DB level).
--
-- Retention: no ON DELETE SET NULL for participant_id — if the
-- participant row is archived, the submission row stays (feedback value
-- persists beyond participant identity). The participant_id column is
-- nullable because walk-ins without Neon Auth have no participant row
-- to attach to anyway.

ALTER TABLE workshop_instances
  ADD COLUMN IF NOT EXISTS feedback_form JSONB;

CREATE TABLE IF NOT EXISTS workshop_feedback_submissions (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL REFERENCES workshop_instances(id) ON DELETE CASCADE,
  participant_id TEXT,
  session_key TEXT NOT NULL,
  answers JSONB NOT NULL,
  allow_quote_by_name BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS workshop_feedback_submissions_instance_session_unique
  ON workshop_feedback_submissions(instance_id, session_key);

CREATE INDEX IF NOT EXISTS workshop_feedback_submissions_instance_submitted_idx
  ON workshop_feedback_submissions(instance_id, submitted_at DESC);
