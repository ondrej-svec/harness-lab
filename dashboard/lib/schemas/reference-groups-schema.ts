import { z } from "zod";

import type { GeneratedReferenceGroup } from "../types/bilingual-reference";
import { emitRuntimeAlert } from "../runtime-alert";

const ReferenceGroupIdSchema = z.enum(["defaults", "accelerators", "explore"]);

const GeneratedReferenceItemSchema = z.discriminatedUnion("kind", [
  z.object({
    id: z.string(),
    kind: z.literal("external"),
    href: z.string(),
    label: z.string(),
    description: z.string(),
    body: z.string().optional(),
  }),
  z.object({
    id: z.string(),
    kind: z.literal("repo-blob"),
    path: z.string(),
    label: z.string(),
    description: z.string(),
    body: z.string().optional(),
  }),
  z.object({
    id: z.string(),
    kind: z.literal("repo-tree"),
    path: z.string(),
    label: z.string(),
    description: z.string(),
    body: z.string().optional(),
  }),
  z.object({
    id: z.string(),
    kind: z.literal("repo-root"),
    label: z.string(),
    description: z.string(),
    body: z.string().optional(),
  }),
  z.object({
    id: z.string(),
    kind: z.literal("hosted"),
    bodyPath: z.string().optional(),
    sourceUrl: z.string().optional(),
    label: z.string(),
    description: z.string(),
    body: z.string().optional(),
  }),
  z.object({
    id: z.string(),
    kind: z.literal("artifact"),
    artifactId: z.string(),
    label: z.string(),
    description: z.string(),
    body: z.string().optional(),
  }),
]);

const GeneratedReferenceGroupSchema = z.object({
  id: ReferenceGroupIdSchema,
  title: z.string(),
  description: z.string(),
  items: z.array(GeneratedReferenceItemSchema),
});

export const ReferenceGroupsSchema = z.array(GeneratedReferenceGroupSchema);

/**
 * Parse a reference_groups JSONB value with drift tolerance.
 *
 * Returns the parsed array on success. On parse failure emits a
 * `HARNESS_RUNTIME_ALERT` and returns `null` so callers fall back to
 * the blueprint-derived default reference catalog.
 *
 * `raw === null` is the documented "no override" path.
 */
export function parseReferenceGroups(
  raw: unknown,
  context: { instanceId: string },
): GeneratedReferenceGroup[] | null {
  if (raw === null || raw === undefined) return null;
  const result = ReferenceGroupsSchema.safeParse(raw);
  if (result.success) return result.data as GeneratedReferenceGroup[];
  emitRuntimeAlert({
    category: "jsonb_parse_failure",
    severity: "warning",
    instanceId: context.instanceId,
    metadata: {
      column: "reference_groups",
      issueCount: result.error.issues.length,
      firstIssuePath: result.error.issues[0]?.path.join(".") ?? "",
      firstIssueCode: result.error.issues[0]?.code ?? "",
    },
  });
  return null;
}
