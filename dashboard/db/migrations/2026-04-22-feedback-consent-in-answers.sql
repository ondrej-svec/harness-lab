-- Consent-to-be-quoted unification: move testimonial consent out of the
-- flat `allow_quote_by_name` column and into the `quote-ok` checkbox
-- answer inside `answers` jsonb. The original migration (2026-04-21)
-- created two parallel consent sources — a top-level column AND a
-- template checkbox question — which produced a participant UX with two
-- near-identical consent sentences AND a bug where the admin summary
-- read from the checkbox answer (always false because the participant
-- only ticked the flat-column checkbox) while the real consent lived in
-- the column. Collapsing to one source fixes the bug and removes the
-- split-brain from the data model.
--
-- Single source of truth after this migration: answers jsonb contains
-- `{"questionId":"quote-ok","type":"checkbox","checked":<bool>}` for
-- every submission. TESTIMONIAL_CONSENT_QUESTION_ID in
-- lib/runtime-contracts.ts pins the id.
--
-- Order of operations:
--
-- 1) Backfill rows where `quote-ok` already exists in answers — patch
--    its `checked` value to reflect the column (this is the actual
--    consent value; the flat column was the only one the participant UI
--    wrote reliably, so we trust it over whatever's inside the jsonb).
--
-- 2) Backfill rows where `quote-ok` is missing from answers — append it
--    with `checked = allow_quote_by_name`. Defensive: current validation
--    always inserts a checkbox answer for every required checkbox
--    question, so this branch should be empty on well-formed data.
--
-- 3) Drop the column.

UPDATE workshop_feedback_submissions
SET answers = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'questionId' = 'quote-ok' AND elem->>'type' = 'checkbox'
        THEN jsonb_set(elem, '{checked}', to_jsonb(allow_quote_by_name))
      ELSE elem
    END
  )
  FROM jsonb_array_elements(answers) AS elem
)
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements(answers) AS elem
  WHERE elem->>'questionId' = 'quote-ok' AND elem->>'type' = 'checkbox'
);

UPDATE workshop_feedback_submissions
SET answers = answers || jsonb_build_array(
  jsonb_build_object(
    'questionId', 'quote-ok',
    'type', 'checkbox',
    'checked', allow_quote_by_name
  )
)
WHERE NOT EXISTS (
  SELECT 1 FROM jsonb_array_elements(answers) AS elem
  WHERE elem->>'questionId' = 'quote-ok' AND elem->>'type' = 'checkbox'
);

ALTER TABLE workshop_feedback_submissions
  DROP COLUMN IF EXISTS allow_quote_by_name;
