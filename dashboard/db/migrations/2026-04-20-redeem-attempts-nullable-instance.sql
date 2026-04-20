-- Redeem rate-limit is keyed by fingerprint only since 7a2a980 because
-- the redeem path scans all instances to find a code match and
-- doesn't know the instanceId at write time. The repository inserts
-- rows with instance_id = NULL, which violated the NOT NULL + FK
-- constraint on participant_redeem_attempts. Drop NOT NULL and let
-- the FK stay (NULLs are allowed in foreign keys per SQL spec), and
-- add a fingerprint-only index so fingerprint-scoped failure counts
-- don't fall back to the composite index's prefix scan.

ALTER TABLE participant_redeem_attempts
  ALTER COLUMN instance_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS participant_redeem_attempts_fingerprint_created_idx
  ON participant_redeem_attempts(fingerprint, created_at);
