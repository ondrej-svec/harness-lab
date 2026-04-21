import type { WorkshopInstanceStatus } from "@/lib/workshop-data";
import type { UiLanguage, adminCopy } from "@/lib/ui-language";
import type {
  FeedbackQuestionAggregate,
  FeedbackSummaryAggregate,
  OpenTextResponseAggregate,
} from "@/lib/feedback-summary";
import { AdminPanel, ControlCard } from "../../../../admin-ui";

type Copy = (typeof adminCopy)[UiLanguage];

/**
 * Post-workshop feedback summary. One card per template question,
 * type-aware renderers. Empty state renders when instance is not yet
 * ended. Print-friendly via Tailwind `print:` utilities on the admin
 * shell (rail + cockpit are hidden in print).
 *
 * Privacy (v1): open-text responses are rendered anonymously. A small
 * badge marks responses where the participant opted in to being quoted
 * by name — useful signal for facilitators curating testimonials later.
 * No participant names are displayed anywhere in v1.
 */
export function SummarySection({
  lang,
  copy,
  instanceStatus,
  aggregate,
  participantsWithAccessCount,
}: {
  lang: UiLanguage;
  copy: Copy;
  instanceStatus: WorkshopInstanceStatus;
  aggregate: FeedbackSummaryAggregate;
  participantsWithAccessCount: number;
}) {
  if (instanceStatus !== "ended") {
    return (
      <AdminPanel
        eyebrow={copy.summaryEmptyEyebrow}
        title={copy.summaryEmptyTitle}
        description={copy.summaryEmptyDescription}
      >
        <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            {copy.summaryEmptyBody}
          </p>
        </div>
      </AdminPanel>
    );
  }

  const responseCounterText = copy.summaryResponseCounter
    .replace("{submitted}", String(aggregate.totalResponses))
    .replace("{total}", String(participantsWithAccessCount));

  return (
    <div className="space-y-6">
      <AdminPanel
        eyebrow={copy.summaryEyebrow}
        title={copy.summaryTitle}
        description={copy.summaryDescription}
      >
        <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
          {responseCounterText}
        </div>
      </AdminPanel>

      <div className="grid gap-4 xl:grid-cols-2">
        {aggregate.perQuestion.map((question) => (
          <QuestionAggregateCard key={question.id} question={question} lang={lang} copy={copy} />
        ))}
      </div>
    </div>
  );
}

function QuestionAggregateCard({
  question,
  lang,
  copy,
}: {
  question: FeedbackQuestionAggregate;
  lang: UiLanguage;
  copy: Copy;
}) {
  const prompt = question.prompt[lang];
  const description = buildDescriptionForQuestion(question, copy);

  return (
    <ControlCard title={prompt} description={description}>
      {renderQuestion(question, lang, copy)}
    </ControlCard>
  );
}

function buildDescriptionForQuestion(question: FeedbackQuestionAggregate, copy: Copy): string {
  switch (question.type) {
    case "likert":
    case "stars":
      return question.average !== null
        ? `${copy.summaryAverageLabel} ${question.average.toFixed(2)} · ${question.totalAnswered} ${copy.summaryResponsesWord}`
        : `${question.totalAnswered} ${copy.summaryResponsesWord}`;
    case "single-choice":
    case "multi-choice":
      return `${question.totalAnswered} ${copy.summaryResponsesWord}`;
    case "open-text":
      return `${question.totalAnswered} ${copy.summaryResponsesWord}`;
    case "checkbox":
      return `${question.checkedCount} / ${question.totalAnswered} ${copy.summaryCheckedOfTotal}`;
  }
}

function renderQuestion(question: FeedbackQuestionAggregate, lang: UiLanguage, copy: Copy) {
  switch (question.type) {
    case "likert":
    case "stars":
      return <ScaleBars aggregate={question} />;
    case "single-choice":
    case "multi-choice":
      return <OptionBars aggregate={question} lang={lang} />;
    case "open-text":
      return <OpenTextList responses={question.responses} copy={copy} />;
    case "checkbox":
      return <CheckboxResult aggregate={question} copy={copy} />;
  }
}

function ScaleBars({
  aggregate,
}: {
  aggregate: Extract<FeedbackQuestionAggregate, { type: "likert" | "stars" }>;
}) {
  const total = aggregate.totalAnswered;
  return (
    <div className="space-y-2">
      {aggregate.counts.map((count, index) => {
        const value = index + 1;
        const width = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={value} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-sm text-[var(--text-primary)]">
              <span>{value}</span>
              <span className="text-[var(--text-muted)]">{count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-soft)]">
              <div
                className="h-full rounded-full bg-[var(--text-primary)]"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OptionBars({
  aggregate,
  lang,
}: {
  aggregate: Extract<FeedbackQuestionAggregate, { type: "single-choice" | "multi-choice" }>;
  lang: UiLanguage;
}) {
  const total = aggregate.totalAnswered;
  return (
    <div className="space-y-2">
      {aggregate.options.map((option) => {
        const width = total > 0 ? (option.count / total) * 100 : 0;
        return (
          <div key={option.id} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-sm text-[var(--text-primary)]">
              <span>{option.label[lang]}</span>
              <span className="text-[var(--text-muted)]">{option.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-soft)]">
              <div
                className="h-full rounded-full bg-[var(--text-primary)]"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OpenTextList({
  responses,
  copy,
}: {
  responses: OpenTextResponseAggregate[];
  copy: Copy;
}) {
  if (responses.length === 0) {
    return (
      <p className="text-sm leading-6 text-[var(--text-muted)]">{copy.summaryOpenTextEmpty}</p>
    );
  }
  return (
    <div className="space-y-3">
      {responses.map((response, index) => (
        <div
          key={`${response.submittedAt}-${index}`}
          className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-3"
        >
          <p className="whitespace-pre-line text-sm leading-6 text-[var(--text-primary)]">
            {response.text}
          </p>
          {response.allowQuoteByName ? (
            <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {copy.summaryQuoteConsentBadge}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function CheckboxResult({
  aggregate,
  copy,
}: {
  aggregate: Extract<FeedbackQuestionAggregate, { type: "checkbox" }>;
  copy: Copy;
}) {
  return (
    <p className="text-sm leading-6 text-[var(--text-secondary)]">
      {aggregate.checkedCount} {copy.summaryOfLabel} {aggregate.totalAnswered}{" "}
      {copy.summaryCheckedThisBox}
    </p>
  );
}
