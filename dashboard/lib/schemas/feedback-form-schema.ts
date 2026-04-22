import { z } from "zod";

import type { FeedbackFormTemplate } from "../runtime-contracts";
import { emitRuntimeAlert } from "../runtime-alert";

const BilingualTextSchema = z.object({
  cs: z.string(),
  en: z.string(),
});

const OptionSchema = z.object({
  id: z.string(),
  label: BilingualTextSchema,
});

const FeedbackQuestionSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string(),
    type: z.literal("likert"),
    scale: z.union([z.literal(4), z.literal(5), z.literal(7)]),
    prompt: BilingualTextSchema,
    anchorMin: BilingualTextSchema.optional(),
    anchorMax: BilingualTextSchema.optional(),
    optional: z.boolean().optional(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("stars"),
    max: z.literal(5),
    prompt: BilingualTextSchema,
    optional: z.boolean().optional(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("single-choice"),
    prompt: BilingualTextSchema,
    options: z.array(OptionSchema),
    optional: z.boolean().optional(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("multi-choice"),
    prompt: BilingualTextSchema,
    options: z.array(OptionSchema),
    optional: z.boolean().optional(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("open-text"),
    prompt: BilingualTextSchema,
    placeholder: BilingualTextSchema.optional(),
    rows: z.number().int().positive().optional(),
    optional: z.boolean().optional(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("checkbox"),
    prompt: BilingualTextSchema,
    defaultChecked: z.boolean().optional(),
    optional: z.boolean().optional(),
  }),
]);

export const FeedbackFormSchema = z.object({
  version: z.number().int().nonnegative(),
  questions: z.array(FeedbackQuestionSchema),
});

/**
 * Parse a feedback-form JSONB value with drift tolerance.
 *
 * Returns the parsed template on success. On parse failure emits a
 * `HARNESS_RUNTIME_ALERT` with `category: "jsonb_parse_failure"` and
 * returns `null` so the caller can fall back to the default template
 * rather than crash the request.
 *
 * `raw` may be `null` (column stored NULL), in which case the function
 * returns `null` without alerting — this is the documented "no override"
 * path, not drift.
 */
export function parseFeedbackForm(
  raw: unknown,
  context: { instanceId: string },
): FeedbackFormTemplate | null {
  if (raw === null || raw === undefined) return null;
  const result = FeedbackFormSchema.safeParse(raw);
  if (result.success) return result.data as FeedbackFormTemplate;
  emitRuntimeAlert({
    category: "jsonb_parse_failure",
    severity: "warning",
    instanceId: context.instanceId,
    metadata: {
      column: "feedback_form",
      issueCount: result.error.issues.length,
      firstIssuePath: result.error.issues[0]?.path.join(".") ?? "",
      firstIssueCode: result.error.issues[0]?.code ?? "",
    },
  });
  return null;
}
