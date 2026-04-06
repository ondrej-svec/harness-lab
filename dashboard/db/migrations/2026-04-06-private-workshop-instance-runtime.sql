CREATE TABLE IF NOT EXISTS workshop_instances (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  workshop_meta JSONB NOT NULL,
  workshop_state JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'prepared',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS participant_event_access (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL REFERENCES workshop_instances(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS participant_sessions (
  token_hash TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL REFERENCES workshop_instances(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_validated_at TIMESTAMPTZ NOT NULL,
  absolute_expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS participant_sessions_instance_id_idx ON participant_sessions(instance_id);
CREATE INDEX IF NOT EXISTS participant_sessions_expires_at_idx ON participant_sessions(expires_at);

CREATE TABLE IF NOT EXISTS facilitator_identities (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  auth_subject TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS instance_grants (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL REFERENCES workshop_instances(id) ON DELETE CASCADE,
  facilitator_identity_id TEXT NOT NULL REFERENCES facilitator_identities(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS monitoring_snapshots (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL REFERENCES workshop_instances(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checkpoints (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL REFERENCES workshop_instances(id) ON DELETE CASCADE,
  team_id TEXT,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS instance_archives (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL REFERENCES workshop_instances(id) ON DELETE CASCADE,
  archive_status TEXT NOT NULL,
  storage_uri TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  instance_id TEXT REFERENCES workshop_instances(id) ON DELETE SET NULL,
  actor_kind TEXT NOT NULL,
  action TEXT NOT NULL,
  result TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
