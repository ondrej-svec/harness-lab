-- Revealable event codes: store AES-256-GCM ciphertext alongside the
-- existing hash so the facilitator can retrieve the raw code from the
-- admin UI without weakening the DB-leak threat model. The hash remains
-- the source of truth for redemption; the ciphertext is only read by
-- the reveal server action.
--
-- Additive, nullable column — legacy rows keep `code_ciphertext IS NULL`
-- and surface as "rotate to enable reveal" in the UI.

ALTER TABLE participant_event_access
  ADD COLUMN IF NOT EXISTS code_ciphertext TEXT;
