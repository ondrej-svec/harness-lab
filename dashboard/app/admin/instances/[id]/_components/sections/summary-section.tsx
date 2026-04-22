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
      // Average is rendered as a hero inside the card; description stays
      // compact (response count only) to avoid duplicating the headline.
      return `${question.totalAnswered} ${copy.summaryResponsesWord}`;
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
      return <ScaleBars aggregate={question} lang={lang} copy={copy} />;
    case "single-choice":
    case "multi-choice":
      return <OptionBars aggregate={question} lang={lang} />;
    case "open-text":
      return <OpenTextList responses={question.responses} copy={copy} />;
    case "checkbox":
      return <CheckboxResult aggregate={question} copy={copy} />;
  }
}

/**
 * Scale distribution renderer. Lead with a big average hero so the
 * headline answer is scannable; then render the per-value distribution
 * as inline rows [value + anchor · bar · count]. Bar widths are scaled
 * against the modal count (not total) so even small samples read as a
 * clear shape. The modal row is emphasized; zero rows fade back.
 */
function ScaleBars({
  aggregate,
  lang,
  copy,
}: {
  aggregate: Extract<FeedbackQuestionAggregate, { type: "likert" | "stars" }>;
  lang: UiLanguage;
  copy: Copy;
}) {
  const total = aggregate.totalAnswered;
  const maxCount = aggregate.counts.reduce((a, b) => Math.max(a, b), 0);
  const average = aggregate.average;
  const anchorMin =
    aggregate.type === "likert" && aggregate.anchorMin ? aggregate.anchorMin[lang] : null;
  const anchorMax =
    aggregate.type === "likert" && aggregate.anchorMax ? aggregate.anchorMax[lang] : null;

  return (
    <div className="space-y-4">
      {average !== null ? (
        <AverageHero
          average={average}
          max={aggregate.max}
          anchorMin={anchorMin}
          anchorMax={anchorMax}
          copy={copy}
        />
      ) : null}

      <div className="space-y-1.5">
        {aggregate.counts.map((count, index) => {
          const value = index + 1;
          const widthPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const isZero = count === 0;
          const isMax = !isZero && count === maxCount;
          const endpointLabel =
            value === 1 ? anchorMin : value === aggregate.max ? anchorMax : null;
          return (
            <div key={value} className="flex items-center gap-3">
              <div className="flex w-14 shrink-0 items-baseline gap-1.5">
                <span
                  className={`text-sm tabular-nums ${
                    isZero ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]"
                  }`}
                >
                  {value}
                </span>
                {endpointLabel ? (
                  <span className="truncate text-[11px] leading-4 text-[var(--text-muted)]">
                    {endpointLabel}
                  </span>
                ) : null}
              </div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-soft)]">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${
                    isMax
                      ? "bg-[var(--text-primary)]"
                      : "bg-[var(--text-primary)]/40"
                  }`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <span
                className={`w-6 shrink-0 text-right text-sm tabular-nums ${
                  isZero ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]"
                }`}
              >
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {total === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">{copy.summaryOpenTextEmpty}</p>
      ) : null}
    </div>
  );
}

/**
 * Hero stat above a scale distribution: the average as a big number with
 * "z {max}" context, plus a scale dot that places the average on the
 * 1..max continuum. A line of anchor labels under the dot makes the
 * scale direction legible even to someone who hasn't seen the question
 * on the participant side.
 */
function AverageHero({
  average,
  max,
  anchorMin,
  anchorMax,
  copy,
}: {
  average: number;
  max: number;
  anchorMin: string | null;
  anchorMax: string | null;
  copy: Copy;
}) {
  const pct = max > 1 ? ((average - 1) / (max - 1)) * 100 : 50;
  return (
    <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-3">
      <div className="flex items-baseline gap-2">
        <span className="text-[32px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-[var(--text-primary)]">
          {average.toFixed(1)}
        </span>
        <span className="text-sm text-[var(--text-muted)]">
          {copy.summaryOfLabel} {max}
        </span>
        <span className="ml-auto text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
          {copy.summaryAverageLabel}
        </span>
      </div>
      <div className="relative mt-3 h-[3px] rounded-full bg-[var(--border)]">
        <div
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--text-primary)]"
          style={{ left: `${pct}%` }}
        />
      </div>
      {(anchorMin || anchorMax) ? (
        <div className="mt-1.5 flex justify-between text-[11px] leading-4 text-[var(--text-muted)]">
          <span>{anchorMin ?? `1`}</span>
          <span>{anchorMax ?? `${max}`}</span>
        </div>
      ) : null}
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
  const maxCount = aggregate.options.reduce((a, o) => Math.max(a, o.count), 0);
  return (
    <div className="space-y-2">
      {aggregate.options.map((option) => {
        const widthPct = maxCount > 0 ? (option.count / maxCount) * 100 : 0;
        const isZero = option.count === 0;
        const isMax = !isZero && option.count === maxCount;
        return (
          <div key={option.id} className="space-y-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span
                className={
                  isZero ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]"
                }
              >
                {option.label[lang]}
              </span>
              <span
                className={`tabular-nums ${
                  isZero ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]"
                }`}
              >
                {option.count}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-soft)]">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${
                  isMax ? "bg-[var(--text-primary)]" : "bg-[var(--text-primary)]/40"
                }`}
                style={{ width: `${widthPct}%` }}
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
