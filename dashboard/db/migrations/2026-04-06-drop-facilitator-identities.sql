-- Drop the facilitator_identities table and the old FK column from instance_grants.
-- Neon Auth (neon_auth.user) is now the single source of truth for facilitator identity.

-- Step 1: Drop the old facilitator_identity_id column from instance_grants
ALTER TABLE instance_grants DROP COLUMN IF EXISTS facilitator_identity_id;

-- Step 2: Drop the facilitator_identities table
DROP TABLE IF EXISTS facilitator_identities;
