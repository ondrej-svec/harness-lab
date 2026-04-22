import { z } from "zod";

import type { OverridableParticipantCopy } from "../workshop-data";
import { emitRuntimeAlert } from "../runtime-alert";

export const ParticipantCopySchema = z.object({
  postWorkshop: z
    .object({
      title: z.string().optional(),
      body: z.string().optional(),
      feedbackBody: z.string().optional(),
      referenceBody: z.string().optional(),
    })
    .optional(),
});

/**
 * Parse a participant_copy JSONB value with drift tolerance.
 *
 * Every field is optional by design — the shape is a thin override
 * layer over the compiled participant copy. Parse failure means the
 * column value is structurally wrong (e.g., not an object), not that
 * a field is missing.
 *
 * `raw === null` is the documented "no override" path.
 */
export function parseParticipantCopy(
  raw: unknown,
  context: { instanceId: string },
): OverridableParticipantCopy | null {
  if (raw === null || raw === undefined) return null;
  const result = ParticipantCopySchema.safeParse(raw);
  if (result.success) return result.data as OverridableParticipantCopy;
  emitRuntimeAlert({
    category: "jsonb_parse_failure",
    severity: "warning",
    instanceId: context.instanceId,
    metadata: {
      column: "participant_copy",
      issueCount: result.error.issues.length,
      firstIssuePath: result.error.issues[0]?.path.join(".") ?? "",
      firstIssueCode: result.error.issues[0]?.code ?? "",
    },
  });
  return null;
}
