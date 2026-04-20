-- Participant auth: link participant rows to Neon Auth users and add
-- the walk-in policy toggle. Backs phase 5.2 of
-- docs/plans/2026-04-19-feat-participant-auth-hardening-and-identify-plan.md
-- and the round-2 decisions in
-- docs/brainstorms/2026-04-20-neon-auth-participant-role-spike.md.
--
-- Note: earlier drafts included a participant_password_reset_tokens
-- table. Dropped before application — the in-room reset flow uses the
-- facilitator's live admin session to call auth.admin.setUserPassword
-- directly, so no separate token table is needed.

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
