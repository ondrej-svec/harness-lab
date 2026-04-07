CREATE TABLE IF NOT EXISTS facilitator_device_auth (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL REFERENCES workshop_instances(id) ON DELETE CASCADE,
  device_code_hash TEXT NOT NULL,
  user_code_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  interval_seconds INTEGER NOT NULL,
  verification_uri TEXT NOT NULL,
  approved_at TIMESTAMPTZ,
  denied_at TIMESTAMPTZ,
  exchanged_at TIMESTAMPTZ,
  neon_user_id TEXT,
  role TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS facilitator_device_auth_device_code_hash_idx
  ON facilitator_device_auth (instance_id, device_code_hash);

CREATE INDEX IF NOT EXISTS facilitator_device_auth_user_code_hash_idx
  ON facilitator_device_auth (instance_id, user_code_hash);

CREATE TABLE IF NOT EXISTS facilitator_cli_sessions (
  token_hash TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL REFERENCES workshop_instances(id) ON DELETE CASCADE,
  neon_user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  auth_mode TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS facilitator_cli_sessions_instance_id_idx
  ON facilitator_cli_sessions (instance_id, expires_at);
