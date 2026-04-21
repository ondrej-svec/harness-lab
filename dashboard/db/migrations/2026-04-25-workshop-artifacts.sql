-- Cohort-specific artifact uploads (Phase 1b of
-- docs/plans/2026-04-21-feat-cohort-artifacts-plan.md).
--
-- Sidecar table for HTML / PDF / image files uploaded by facilitators
-- and scoped to a single workshop instance. Rows here are the canonical
-- record; the raw bytes live in Vercel Blob (private mode) under
-- `blob_key`. Cross-cohort isolation is enforced at read time by the
-- composite (instance_id, id) lookup — never resolve by `id` alone.
--
-- The `artifact` reference item kind (Phase 3) references `id` from
-- this table via the instance's `reference_groups` JSONB override; we
-- validate at the PATCH endpoint that any referenced id belongs to the
-- same instance. Artifacts never appear in workshop-content/reference.json.
--
-- FK cascade deletes the DB row when the parent instance is removed;
-- the corresponding blob keys are cleaned up at the application layer
-- (see deleteInstanceAndArtifacts) because blob storage has no
-- cross-row cascade semantics.

CREATE TABLE IF NOT EXISTS workshop_artifacts (
  instance_id   TEXT NOT NULL REFERENCES workshop_instances(id) ON DELETE CASCADE,
  id            TEXT NOT NULL,
  blob_key      TEXT NOT NULL,
  content_type  TEXT NOT NULL,
  filename      TEXT NOT NULL,
  byte_size     INTEGER NOT NULL,
  label         TEXT NOT NULL,
  description   TEXT,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (instance_id, id)
);

CREATE INDEX IF NOT EXISTS workshop_artifacts_instance_idx
  ON workshop_artifacts(instance_id);
