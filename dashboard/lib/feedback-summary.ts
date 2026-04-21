import type {
  BilingualText,
  FeedbackAnswer,
  FeedbackFormTemplate,
  FeedbackQuestion,
  FeedbackSubmissionRecord,
} from "./runtime-contracts";

/**
 * Aggregated post-workshop feedback summary. One card per template
 * question, type-aware. Computed from the effective template + all
 * submissions for an instance. Admin summary view renders this as a
 * grid with print-friendly styling.
 *
 * Privacy rule (v1): open-text and testimonial responses are always
 * rendered anonymously in the UI. `allowQuoteByName` travels on the
 * aggregate so the renderer can show a "consented to be quoted" badge
 * for the testimonial question — no participant names are displayed
 * anywhere. This is stricter than the brainstorm's gated-by-consent
 * rule and can be relaxed in v2 once a per-question attribution flag
 * exists. Until then, "don't show names" is a simple, correct default
 * that can't violate the Subjective Contract's consent rejection
 * criterion.
 */
export type OpenTextResponseAggregate = {
  text: string;
  allowQuoteByName: boolean;
  submittedAt: string;
};

export type FeedbackQuestionAggregate =
  | {
      id: string;
      type: "likert" | "stars";
      prompt: BilingualText;
      max: number;
      counts: number[]; // length = max; counts[i-1] = answers with value i
      totalAnswered: number;
      average: number | null;
    }
  | {
      id: string;
      type: "single-choice" | "multi-choice";
      prompt: BilingualText;
      options: Array<{ id: string; label: BilingualText; count: number }>;
      totalAnswered: number;
    }
  | {
      id: string;
      type: "open-text";
      prompt: BilingualText;
      responses: OpenTextResponseAggregate[];
      totalAnswered: number;
    }
  | {
      id: string;
      type: "checkbox";
      prompt: BilingualText;
      checkedCount: number;
      totalAnswered: number;
    };

export type FeedbackSummaryAggregate = {
  totalResponses: number;
  perQuestion: FeedbackQuestionAggregate[];
};

function findAnswer(
  submission: FeedbackSubmissionRecord,
  questionId: string,
): FeedbackAnswer | undefined {
  return submission.answers.find((a) => a.questionId === questionId);
}

function aggregateQuestion(
  question: FeedbackQuestion,
  submissions: FeedbackSubmissionRecord[],
): FeedbackQuestionAggregate {
  switch (question.type) {
    case "likert":
    case "stars": {
      const max = question.type === "likert" ? question.scale : question.max;
      const counts = Array.from({ length: max }, () => 0);
      let sum = 0;
      let n = 0;
      for (const sub of submissions) {
        const ans = findAnswer(sub, question.id);
        if (ans && (ans.type === "likert" || ans.type === "stars")) {
          if (ans.value >= 1 && ans.value <= max) {
            counts[ans.value - 1] += 1;
            sum += ans.value;
            n += 1;
          }
        }
      }
      return {
        id: question.id,
        type: question.type,
        prompt: question.prompt,
        max,
        counts,
        totalAnswered: n,
        average: n > 0 ? sum / n : null,
      };
    }
    case "single-choice": {
      const counts = new Map<string, number>();
      for (const opt of question.options) counts.set(opt.id, 0);
      let n = 0;
      for (const sub of submissions) {
        const ans = findAnswer(sub, question.id);
        if (ans && ans.type === "single-choice" && counts.has(ans.optionId)) {
          counts.set(ans.optionId, (counts.get(ans.optionId) ?? 0) + 1);
          n += 1;
        }
      }
      return {
        id: question.id,
        type: "single-choice",
        prompt: question.prompt,
        options: question.options.map((opt) => ({
          id: opt.id,
          label: opt.label,
          count: counts.get(opt.id) ?? 0,
        })),
        totalAnswered: n,
      };
    }
    case "multi-choice": {
      const counts = new Map<string, number>();
      for (const opt of question.options) counts.set(opt.id, 0);
      let n = 0;
      for (const sub of submissions) {
        const ans = findAnswer(sub, question.id);
        if (ans && ans.type === "multi-choice") {
          if (ans.optionIds.length > 0) n += 1;
          for (const id of ans.optionIds) {
            if (counts.has(id)) counts.set(id, (counts.get(id) ?? 0) + 1);
          }
        }
      }
      return {
        id: question.id,
        type: "multi-choice",
        prompt: question.prompt,
        options: question.options.map((opt) => ({
          id: opt.id,
          label: opt.label,
          count: counts.get(opt.id) ?? 0,
        })),
        totalAnswered: n,
      };
    }
    case "open-text": {
      const responses: OpenTextResponseAggregate[] = [];
      for (const sub of submissions) {
        const ans = findAnswer(sub, question.id);
        if (ans && ans.type === "open-text" && ans.text.trim().length > 0) {
          responses.push({
            text: ans.text,
            allowQuoteByName: sub.allowQuoteByName,
            submittedAt: sub.submittedAt,
          });
        }
      }
      responses.sort((left, right) => right.submittedAt.localeCompare(left.submittedAt));
      return {
        id: question.id,
        type: "open-text",
        prompt: question.prompt,
        responses,
        totalAnswered: responses.length,
      };
    }
    case "checkbox": {
      let checkedCount = 0;
      let n = 0;
      for (const sub of submissions) {
        const ans = findAnswer(sub, question.id);
        if (ans && ans.type === "checkbox") {
          n += 1;
          if (ans.checked) checkedCount += 1;
        }
      }
      return {
        id: question.id,
        type: "checkbox",
        prompt: question.prompt,
        checkedCount,
        totalAnswered: n,
      };
    }
  }
}

export function buildFeedbackSummaryAggregate(
  template: FeedbackFormTemplate,
  submissions: FeedbackSubmissionRecord[],
): FeedbackSummaryAggregate {
  return {
    totalResponses: submissions.length,
    perQuestion: template.questions.map((q) => aggregateQuestion(q, submissions)),
  };
}
