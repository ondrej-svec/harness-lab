-- Per-instance Markdown bodies for hosted reference items (Phase 2 of
-- docs/plans/2026-04-21-feat-dynamic-participant-reference-content-plan.md).
--
-- Sidecar table — separate from workshop_instances.reference_groups
-- (Phase 1c) so that participant hot-path reads stay lean. Body rows
-- are pulled only when the hosted-reference route is hit at
-- /participant/reference/<itemId>.
--
-- Resolution precedence (see reference-body-repository + the route):
--   sidecar row (instance-specific override)
--     → compiled-default body inlined in dashboard/lib/generated/reference-*.json
--       (via GeneratedReferenceItem.body for kind === "hosted")
--   → 404 if neither exists.
--
-- FK cascades on instance removal so archived/removed instances don't
-- leave orphan body rows.

CREATE TABLE IF NOT EXISTS workshop_reference_bodies (
  instance_id TEXT NOT NULL REFERENCES workshop_instances(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (instance_id, item_id)
);

CREATE INDEX IF NOT EXISTS workshop_reference_bodies_instance_updated_idx
  ON workshop_reference_bodies(instance_id, updated_at DESC);
