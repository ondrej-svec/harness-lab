import { z } from "zod";

import { emitRuntimeAlert } from "../runtime-alert";

/**
 * Top-level shape guard for the `workshop_instances.workshop_state`
 * JSONB column.
 *
 * This is intentionally a *shape* guard, not a deep validator. The
 * existing field-level normalizer (`normalizeStoredWorkshopState` in
 * `workshop-store.ts`) already fills in per-field defaults for legacy
 * rows — that's the value it provides. What has been missing is an
 * alertable signal when the column contains something structurally
 * wrong at the top level (null, a primitive, an array, a string that
 * failed to parse upstream, a completely unrelated object shape).
 *
 * The schema tolerates unknown fields (`.loose()`) so forward-compatible
 * additions don't trigger false alerts. Each known field is optional
 * and only validated at the "is it the right container?" level (array
 * vs object) — leave value-level coercion to the field normalizer.
 *
 * Failure path: emit `HARNESS_RUNTIME_ALERT` with
 * `category: "jsonb_parse_failure"`, `column: "workshop_state"`. The
 * caller decides whether to fall back to a seed-derived default or
 * propagate the drift as an error. The goal is observability: the
 * 2026-04-20 incident class stops being silent.
 */
export const WorkshopStateShapeSchema = z
  .object({
    version: z.number().optional(),
    workshopId: z.string().optional(),
    workshopMeta: z.object({}).loose().optional(),
    agenda: z.array(z.unknown()).optional(),
    liveMoment: z.object({}).loose().optional(),
    teams: z.array(z.unknown()).optional(),
    briefs: z.array(z.unknown()).optional(),
    challenges: z.array(z.unknown()).optional(),
    rotation: z.object({}).loose().optional(),
    ticker: z.array(z.unknown()).optional(),
    monitoring: z.array(z.unknown()).optional(),
    sprintUpdates: z.array(z.unknown()).optional(),
    participantCheckIns: z.array(z.unknown()).optional(),
    setupPaths: z.array(z.unknown()).optional(),
  })
  .loose();

export type WorkshopStateShape = z.infer<typeof WorkshopStateShapeSchema>;

/**
 * Parse a raw `workshop_state` JSONB value at the top-level shape
 * level. Returns the raw-but-shape-checked object on success, or
 * `null` on structural drift (and emits an alert).
 *
 * The caller should pass the result to the field-level normalizer
 * in `workshop-store.ts` for default-filling, then use the resulting
 * fully-typed `WorkshopState`. On `null`, the caller should fall
 * back to a seed-derived default instead of crashing the request.
 *
 * `raw === null` is treated as "no row" (an empty state row shouldn't
 * exist but if it does, the caller seeds it). No alert is emitted in
 * that case — only structural drift alerts.
 */
export function parseWorkshopStateShape(
  raw: unknown,
  context: { instanceId: string },
): WorkshopStateShape | null {
  if (raw === null || raw === undefined) return null;
  const result = WorkshopStateShapeSchema.safeParse(raw);
  if (result.success) return result.data;
  emitRuntimeAlert({
    category: "jsonb_parse_failure",
    severity: "warning",
    instanceId: context.instanceId,
    metadata: {
      column: "workshop_state",
      issueCount: result.error.issues.length,
      firstIssuePath: result.error.issues[0]?.path.join(".") ?? "",
      firstIssueCode: result.error.issues[0]?.code ?? "",
    },
  });
  return null;
}
