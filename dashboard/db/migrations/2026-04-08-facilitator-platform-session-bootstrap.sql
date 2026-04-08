ALTER TABLE facilitator_device_auth
  ALTER COLUMN instance_id DROP NOT NULL;

DROP INDEX IF EXISTS facilitator_device_auth_device_code_hash_idx;
DROP INDEX IF EXISTS facilitator_device_auth_user_code_hash_idx;

CREATE UNIQUE INDEX IF NOT EXISTS facilitator_device_auth_device_code_hash_global_idx
  ON facilitator_device_auth (device_code_hash);

CREATE INDEX IF NOT EXISTS facilitator_device_auth_user_code_hash_global_idx
  ON facilitator_device_auth (user_code_hash);

ALTER TABLE facilitator_cli_sessions
  ALTER COLUMN instance_id DROP NOT NULL,
  ALTER COLUMN role DROP NOT NULL;
