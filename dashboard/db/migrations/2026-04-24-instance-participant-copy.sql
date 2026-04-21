-- Per-instance participant copy overrides (Phase 3 of
-- docs/plans/2026-04-21-feat-dynamic-participant-reference-content-plan.md).
--
-- Narrow whitelist: only the post-workshop welcome + feedback + reference
-- section bodies are overridable. Button labels, eyebrows, errors, and
-- other chrome stay compiled to prevent scope creep into "half a CMS".
--
-- Shape is a deep-partial of OverridableParticipantCopy:
--   {
--     postWorkshop?: {
--       title?: string,
--       body?: string,
--       feedbackBody?: string,
--       referenceBody?: string,
--     }
--   }
--
-- NULL column === no overrides; resolver falls back to the compiled
-- getPostWorkshopCopy(lang) defaults.

ALTER TABLE workshop_instances
  ADD COLUMN IF NOT EXISTS participant_copy JSONB;
