-- Simplify facilitator identity: Neon Auth as single source of truth.
-- instance_grants now references Neon Auth user IDs directly via neon_user_id.

-- Step 1: Add neon_user_id column to instance_grants
ALTER TABLE instance_grants ADD COLUMN IF NOT EXISTS neon_user_id TEXT;

-- Step 2: Backfill neon_user_id from facilitator_identities.auth_subject
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'instance_grants'
      AND column_name = 'facilitator_identity_id'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'facilitator_identities'
      AND column_name = 'auth_subject'
  ) THEN
    UPDATE instance_grants
    SET neon_user_id = fi.auth_subject
    FROM facilitator_identities fi
    WHERE instance_grants.facilitator_identity_id = fi.id
      AND fi.auth_subject IS NOT NULL
      AND instance_grants.neon_user_id IS NULL;
  END IF;
END $$;

-- Step 3: Drop the FK constraint on facilitator_identity_id
-- (constraint name comes from the original migration)
ALTER TABLE instance_grants DROP CONSTRAINT IF EXISTS instance_grants_facilitator_identity_id_fkey;

-- Step 4: Create index on neon_user_id for efficient lookups
CREATE INDEX IF NOT EXISTS instance_grants_neon_user_id_idx ON instance_grants(neon_user_id);
CREATE INDEX IF NOT EXISTS instance_grants_instance_neon_user_idx ON instance_grants(instance_id, neon_user_id);
