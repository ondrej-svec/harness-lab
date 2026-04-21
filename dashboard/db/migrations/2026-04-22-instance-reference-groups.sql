-- Per-instance reference catalog override (Phase 1c of
-- docs/plans/2026-04-21-feat-dynamic-participant-reference-content-plan.md).
--
-- Additive schema: workshop_instances.reference_groups (nullable JSONB)
-- Per-instance override of the default participant reference catalog.
-- NULL means "use the built-in default from getDefaultReferenceView(lang)"
-- which is compiled from workshop-content/reference.json at build time.
--
-- Shape mirrors GeneratedReferenceView["groups"]: an ordered array of
-- { id, title, description, items } where each item is a discriminated
-- union by `kind` (external / repo-blob / repo-tree / repo-root) carrying
-- `label`, `description`, and the kind-specific href/path fields.
-- See dashboard/lib/types/bilingual-reference.ts.
--
-- Read-path normalization: `WorkshopInstanceRecord.referenceGroups` is
-- `GeneratedReferenceGroup[] | null`. Resolvers fall back to the
-- compiled default when null — so pre-migration rows and legacy payloads
-- without this column render unchanged.

ALTER TABLE workshop_instances
  ADD COLUMN IF NOT EXISTS reference_groups JSONB;
