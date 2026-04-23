import { z } from "zod";

import { emitRuntimeAlert } from "../runtime-alert";

/**
 * Top-level shape guard for the `blueprints.body` JSONB column.
 *
 * This is a *shape* guard, not a deep validator — same philosophy as
 * `workshop-state-schema.ts`. The goal is observability on structural
 * drift, not full validation. Field-level defaults are applied by the
 * normalizer in `blueprint-repository.ts` at read time.
 *
 * `.loose()` lets forward-compatible additions (new phase fields, new
 * scene kinds, etc.) flow through without alerts. Known fields are
 * optional and validated only at "right container?" level — leave
 * value-level coercion to the normalizer.
 *
 * Failure path: emit `HARNESS_RUNTIME_ALERT` with
 * `category: "jsonb_parse_failure"`, `column: "blueprints.body"`.
 */
export const BlueprintBodyShapeSchema = z
  .object({
    schemaVersion: z.number().optional(),
    name: z.string().optional(),
    language: z.string().optional(),
    teamMode: z.boolean().optional(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    startTime: z.string().optional(),
    principles: z.array(z.unknown()).optional(),
    phases: z.array(z.unknown()).optional(),
    inventory: z.object({}).loose().optional(),
  })
  .loose();

export type BlueprintBodyShape = z.infer<typeof BlueprintBodyShapeSchema>;

/**
 * Parse a raw `blueprints.body` JSONB value at the top-level shape
 * level. Returns the raw-but-shape-checked object on success, or
 * `null` on structural drift (and emits an alert).
 *
 * `raw === null` is treated as "no row" and returns `null` silently
 * (no alert) — only structural drift triggers the alert.
 */
export function parseBlueprintBodyShape(
  raw: unknown,
  context: { blueprintId: string },
): BlueprintBodyShape | null {
  if (raw === null || raw === undefined) return null;
  const result = BlueprintBodyShapeSchema.safeParse(raw);
  if (result.success) return result.data;
  emitRuntimeAlert({
    category: "jsonb_parse_failure",
    severity: "warning",
    instanceId: null,
    metadata: {
      column: "blueprints.body",
      blueprintId: context.blueprintId,
      issueCount: result.error.issues.length,
      firstIssuePath: result.error.issues[0]?.path.join(".") ?? "",
      firstIssueCode: result.error.issues[0]?.code ?? "",
    },
  });
  return null;
}
