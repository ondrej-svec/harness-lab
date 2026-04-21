import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireParticipantSession } from "@/lib/event-access";
import {
  FeedbackSubmissionLockedError,
  type FeedbackAnswer,
  type FeedbackFormTemplate,
  type FeedbackQuestion,
  type FeedbackSubmissionRecord,
} from "@/lib/runtime-contracts";
import { getFeedbackSubmissionRepository } from "@/lib/feedback-submission-repository";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import { resolveEffectiveFeedbackTemplate } from "@/lib/workshop-data";

/**
 * Feedback-submission lock window. Participants can resubmit within this
 * window (overwriting previous answers); after the window, the repo
 * throws FeedbackSubmissionLockedError and we return 409.
 */
const FEEDBACK_EDIT_WINDOW_HOURS = 24;

type FeedbackSubmissionBody = {
  answers?: unknown;
  allowQuoteByName?: unknown;
};

type ValidationResult =
  | { ok: true; answers: FeedbackAnswer[] }
  | { ok: false; error: string };

function validateAnswerForQuestion(
  question: FeedbackQuestion,
  raw: unknown,
): FeedbackAnswer | { __error: string } {
  if (!raw || typeof raw !== "object") {
    return { __error: `answer for ${question.id} must be an object` };
  }
  const obj = raw as Record<string, unknown>;
  if (obj.questionId !== question.id) {
    return { __error: `answer.questionId ${obj.questionId} does not match question ${question.id}` };
  }
  if (obj.type !== question.type) {
    return { __error: `answer.type ${obj.type} does not match question.type ${question.type}` };
  }

  switch (question.type) {
    case "likert":
    case "stars": {
      const value = Number(obj.value);
      const max = question.type === "likert" ? question.scale : question.max;
      if (!Number.isFinite(value) || value < 1 || value > max) {
        return { __error: `answer for ${question.id} must be a number in [1, ${max}]` };
      }
      return { questionId: question.id, type: question.type, value };
    }
    case "single-choice": {
      const optionId = typeof obj.optionId === "string" ? obj.optionId : "";
      const valid = question.options.some((opt) => opt.id === optionId);
      if (!valid) {
        return { __error: `answer.optionId ${optionId} is not a valid option for ${question.id}` };
      }
      return { questionId: question.id, type: "single-choice", optionId };
    }
    case "multi-choice": {
      const optionIds = Array.isArray(obj.optionIds) ? obj.optionIds : [];
      const validIds = new Set(question.options.map((opt) => opt.id));
      for (const id of optionIds) {
        if (typeof id !== "string" || !validIds.has(id)) {
          return { __error: `answer.optionIds contains invalid option for ${question.id}` };
        }
      }
      return { questionId: question.id, type: "multi-choice", optionIds: optionIds as string[] };
    }
    case "open-text": {
      const text = typeof obj.text === "string" ? obj.text : "";
      return { questionId: question.id, type: "open-text", text };
    }
    case "checkbox": {
      const checked = Boolean(obj.checked);
      return { questionId: question.id, type: "checkbox", checked };
    }
  }
}

function validateAnswers(
  template: FeedbackFormTemplate,
  rawAnswers: unknown,
): ValidationResult {
  if (!Array.isArray(rawAnswers)) {
    return { ok: false, error: "answers must be an array" };
  }

  const byQuestionId = new Map<string, unknown>();
  for (const item of rawAnswers) {
    if (item && typeof item === "object" && typeof (item as { questionId?: unknown }).questionId === "string") {
      byQuestionId.set((item as { questionId: string }).questionId, item);
    }
  }

  const answers: FeedbackAnswer[] = [];
  for (const question of template.questions) {
    const raw = byQuestionId.get(question.id);
    if (raw === undefined) {
      if (question.optional) {
        continue;
      }
      // Required questions must be present. Likert / stars / single-choice
      // with no answer = validation failure; open-text and checkbox tolerate
      // empty-string / false as "answered with a blank" rather than missing.
      if (question.type === "open-text") {
        answers.push({ questionId: question.id, type: "open-text", text: "" });
        continue;
      }
      if (question.type === "checkbox") {
        answers.push({ questionId: question.id, type: "checkbox", checked: false });
        continue;
      }
      return { ok: false, error: `missing required answer for ${question.id}` };
    }

    const validated = validateAnswerForQuestion(question, raw);
    if ("__error" in validated) {
      return { ok: false, error: validated.__error };
    }
    answers.push(validated);
  }

  return { ok: true, answers };
}

/**
 * Submit the post-workshop feedback form.
 *
 * Gated on `status === "ended"` (returns 404 otherwise — "feedback not
 * open yet"). Validates the body against the instance's effective
 * template (override or default). Upserts with a 24h edit window; after
 * the window the repository throws and we return 409.
 *
 * Attribution: participantId when the session is Neon-Auth'd; session_key
 * uses participantId when bound, else a session fallback. The unique
 * constraint on (instance_id, session_key) enforces one submission per
 * participant-session per instance.
 */
export async function POST(request: Request) {
  const access = await requireParticipantSession(request);
  if (!access.ok) {
    return access.response;
  }

  const instanceId = access.session.instanceId;
  const instance = await getWorkshopInstanceRepository().getInstance(instanceId);
  if (!instance) {
    return NextResponse.json({ ok: false, error: "instance_not_found" }, { status: 404 });
  }
  if (instance.status !== "ended") {
    return NextResponse.json({ ok: false, error: "feedback_not_open" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as FeedbackSubmissionBody | null;
  if (!body) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const template = resolveEffectiveFeedbackTemplate(instance);
  const validated = validateAnswers(template, body.answers);
  if (!validated.ok) {
    return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
  }

  const participantId = access.session.participantId ?? null;
  const sessionKey = participantId ?? `session:${instanceId}`;
  const allowQuoteByName = Boolean(body.allowQuoteByName);

  const submission: FeedbackSubmissionRecord = {
    id: `fs-${randomUUID()}`,
    instanceId,
    participantId,
    sessionKey,
    answers: validated.answers,
    allowQuoteByName,
    submittedAt: new Date().toISOString(),
  };

  try {
    const saved = await getFeedbackSubmissionRepository().upsert(
      instanceId,
      submission,
      { allowEditWithinHours: FEEDBACK_EDIT_WINDOW_HOURS },
    );
    return NextResponse.json({ ok: true, submission: saved });
  } catch (error) {
    if (error instanceof FeedbackSubmissionLockedError) {
      return NextResponse.json({ ok: false, error: "submission_locked" }, { status: 409 });
    }
    throw error;
  }
}

/**
 * Fetch the current participant's submission (if any) plus the effective
 * template. Used by the PostWorkshopSurface to pre-populate the form
 * within the edit window.
 */
export async function GET(request: Request) {
  const access = await requireParticipantSession(request);
  if (!access.ok) {
    return access.response;
  }

  const instanceId = access.session.instanceId;
  const instance = await getWorkshopInstanceRepository().getInstance(instanceId);
  if (!instance) {
    return NextResponse.json({ ok: false, error: "instance_not_found" }, { status: 404 });
  }
  if (instance.status !== "ended") {
    return NextResponse.json({ ok: false, error: "feedback_not_open" }, { status: 404 });
  }

  const template = resolveEffectiveFeedbackTemplate(instance);
  const sessionKey = access.session.participantId ?? `session:${instanceId}`;
  const existing = await getFeedbackSubmissionRepository().findBySessionKey(instanceId, sessionKey);

  return NextResponse.json({ ok: true, template, submission: existing });
}
