-- Participant auth: link participant rows to Neon Auth users, add the
-- walk-in policy toggle, and create the in-room password-reset token
-- table. Backs phase 5.2 of
-- docs/plans/2026-04-19-feat-participant-auth-hardening-and-identify-plan.md
-- and the round-2 decisions in
-- docs/brainstorms/2026-04-20-neon-auth-participant-role-spike.md.

-- Optional link from a participant row to the Neon Auth user that owns
-- its credentials. Nullable — participants who never set a password
-- (never identified beyond the event-code session) and participants who
-- joined before this migration both keep neon_user_id = NULL. Once set,
-- the participant's identity survives cleared cookies on re-login.
ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS neon_user_id TEXT;

-- One-to-one linkage at the table level: a Neon user ID backs at most
-- one participant row. Nulls ignored. If we ever want multi-instance
-- reuse of a single Neon user, this predicate relaxes.
CREATE UNIQUE INDEX IF NOT EXISTS participants_neon_user_id_unique
  ON participants(neon_user_id)
  WHERE neon_user_id IS NOT NULL;

-- Walk-in policy toggle. Default TRUE preserves today's behavior
-- (anyone with the event code can type a new name and add themselves).
-- Facilitator flips to FALSE for invite-only workshops — unknown names
-- get the polite "ask your facilitator to add you" refusal surface.
ALTER TABLE workshop_instances
  ADD COLUMN IF NOT EXISTS allow_walk_ins BOOLEAN NOT NULL DEFAULT TRUE;

-- Facilitator-issued one-time password reset codes. The plaintext code
-- (three words from the same wordlist as event codes) is shown once to
-- the facilitator to read aloud, and never stored. Only the HMAC hash
-- and metadata persist.
CREATE TABLE IF NOT EXISTS participant_password_reset_tokens (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL REFERENCES workshop_instances(id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  issued_by_neon_user_id TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ
);

-- Redeem lookup: scoped to instance + hash, only live (unconsumed) rows.
CREATE INDEX IF NOT EXISTS participant_password_reset_tokens_lookup
  ON participant_password_reset_tokens(instance_id, token_hash)
  WHERE consumed_at IS NULL;

-- Cleanup sweep predicate.
CREATE INDEX IF NOT EXISTS participant_password_reset_tokens_expiry
  ON participant_password_reset_tokens(expires_at);
