"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type {
  FeedbackAnswer,
  FeedbackFormTemplate,
  FeedbackQuestion,
  FeedbackSubmissionRecord,
} from "@/lib/runtime-contracts";
import type { UiLanguage } from "@/lib/ui-language";
import { InlineSpinner } from "./inline-spinner";

type Status = { tone: "idle" | "success" | "error" | "locked"; message: string };

type AnswerDraft = {
  likert: Record<string, number>;
  stars: Record<string, number>;
  singleChoice: Record<string, string>;
  multiChoice: Record<string, string[]>;
  openText: Record<string, string>;
  checkbox: Record<string, boolean>;
};

function buildInitialDraft(
  template: FeedbackFormTemplate,
  existing: FeedbackSubmissionRecord | null,
): AnswerDraft {
  const draft: AnswerDraft = {
    likert: {},
    stars: {},
    singleChoice: {},
    multiChoice: {},
    openText: {},
    checkbox: {},
  };
  for (const q of template.questions) {
    switch (q.type) {
      case "likert":
      case "stars":
        draft[q.type === "likert" ? "likert" : "stars"][q.id] = 0;
        break;
      case "single-choice":
        draft.singleChoice[q.id] = "";
        break;
      case "multi-choice":
        draft.multiChoice[q.id] = [];
        break;
      case "open-text":
        draft.openText[q.id] = "";
        break;
      case "checkbox":
        draft.checkbox[q.id] = q.defaultChecked ?? false;
        break;
    }
  }

  if (existing) {
    for (const ans of existing.answers) {
      switch (ans.type) {
        case "likert":
          draft.likert[ans.questionId] = ans.value;
          break;
        case "stars":
          draft.stars[ans.questionId] = ans.value;
          break;
        case "single-choice":
          draft.singleChoice[ans.questionId] = ans.optionId;
          break;
        case "multi-choice":
          draft.multiChoice[ans.questionId] = [...ans.optionIds];
          break;
        case "open-text":
          draft.openText[ans.questionId] = ans.text;
          break;
        case "checkbox":
          draft.checkbox[ans.questionId] = ans.checked;
          break;
      }
    }
  }
  return draft;
}

function buildAnswers(template: FeedbackFormTemplate, draft: AnswerDraft): FeedbackAnswer[] {
  const answers: FeedbackAnswer[] = [];
  for (const q of template.questions) {
    switch (q.type) {
      case "likert": {
        const value = draft.likert[q.id] ?? 0;
        if (value > 0) {
          answers.push({ questionId: q.id, type: "likert", value });
        }
        break;
      }
      case "stars": {
        const value = draft.stars[q.id] ?? 0;
        if (value > 0) {
          answers.push({ questionId: q.id, type: "stars", value });
        }
        break;
      }
      case "single-choice": {
        const optionId = draft.singleChoice[q.id] ?? "";
        if (optionId) {
          answers.push({ questionId: q.id, type: "single-choice", optionId });
        }
        break;
      }
      case "multi-choice":
        answers.push({
          questionId: q.id,
          type: "multi-choice",
          optionIds: draft.multiChoice[q.id] ?? [],
        });
        break;
      case "open-text":
        answers.push({ questionId: q.id, type: "open-text", text: draft.openText[q.id] ?? "" });
        break;
      case "checkbox":
        answers.push({
          questionId: q.id,
          type: "checkbox",
          checked: draft.checkbox[q.id] ?? false,
        });
        break;
    }
  }
  return answers;
}

export function FeedbackFormRenderer({
  template,
  existing,
  lang,
  labels,
}: {
  template: FeedbackFormTemplate;
  existing: FeedbackSubmissionRecord | null;
  lang: UiLanguage;
  labels: {
    submitLabel: string;
    submittingLabel: string;
    successMessage: string;
    genericError: string;
    lockedMessage: string;
    allowQuoteByNameLabel: string;
    optionalHint: string;
  };
}) {
  const router = useRouter();
  const initialDraft = useMemo(() => buildInitialDraft(template, existing), [template, existing]);
  const [draft, setDraft] = useState<AnswerDraft>(initialDraft);
  const [allowQuoteByName, setAllowQuoteByName] = useState<boolean>(existing?.allowQuoteByName ?? false);
  const [status, setStatus] = useState<Status>({ tone: "idle", message: "" });
  const [isPending, startTransition] = useTransition();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const answers = buildAnswers(template, draft);

    startTransition(async () => {
      try {
        const response = await fetch("/api/participant/feedback-submission", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ answers, allowQuoteByName }),
        });

        if (response.status === 409) {
          setStatus({ tone: "locked", message: labels.lockedMessage });
          return;
        }
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          setStatus({ tone: "error", message: payload?.error ?? labels.genericError });
          return;
        }
        setStatus({ tone: "success", message: labels.successMessage });
        router.refresh();
      } catch {
        setStatus({ tone: "error", message: labels.genericError });
      }
    });
  };

  const isDisabled = isPending || status.tone === "success" || status.tone === "locked";

  return (
    <form onSubmit={submit} className="space-y-6">
      {template.questions.map((question) => (
        <QuestionField
          key={question.id}
          question={question}
          lang={lang}
          draft={draft}
          setDraft={setDraft}
          disabled={isDisabled}
          optionalHint={labels.optionalHint}
        />
      ))}

      <label className="flex items-start gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-3">
        <input
          type="checkbox"
          checked={allowQuoteByName}
          onChange={(event) => setAllowQuoteByName(event.target.checked)}
          disabled={isDisabled}
          className="mt-1"
        />
        <span className="text-sm leading-6 text-[var(--text-secondary)]">
          {labels.allowQuoteByNameLabel}
        </span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isDisabled}
          aria-busy={isPending}
          className={`inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface-soft)] px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--text-primary)] hover:bg-[var(--surface)] disabled:opacity-60 ${isPending ? "cursor-wait" : ""}`}
        >
          <InlineSpinner active={isPending} />
          <span>{isPending ? labels.submittingLabel : labels.submitLabel}</span>
        </button>
        {status.tone !== "idle" ? (
          <p
            className={`text-sm leading-6 ${
              status.tone === "success"
                ? "text-[var(--text-secondary)]"
                : status.tone === "locked"
                  ? "text-[var(--text-muted)]"
                  : "text-[var(--danger-text,#c53030)]"
            }`}
          >
            {status.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function QuestionField({
  question,
  lang,
  draft,
  setDraft,
  disabled,
  optionalHint,
}: {
  question: FeedbackQuestion;
  lang: UiLanguage;
  draft: AnswerDraft;
  setDraft: React.Dispatch<React.SetStateAction<AnswerDraft>>;
  disabled: boolean;
  optionalHint: string;
}) {
  const prompt = question.prompt[lang];
  const wrapperClass =
    "rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-5";

  switch (question.type) {
    case "likert": {
      const value = draft.likert[question.id] ?? 0;
      const scale = question.scale;
      return (
        <fieldset className={wrapperClass}>
          <legend className="text-sm font-medium text-[var(--text-primary)]">{prompt}</legend>
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: scale }, (_, i) => i + 1).map((n) => (
              <label
                key={n}
                className={`flex h-10 min-w-[2.5rem] cursor-pointer items-center justify-center rounded-full border px-3 text-sm font-medium transition ${
                  value === n
                    ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--surface)]"
                    : "border-[var(--border)] bg-[var(--surface-panel)] text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                } ${disabled ? "pointer-events-none opacity-50" : ""}`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={n}
                  checked={value === n}
                  onChange={() =>
                    setDraft((prev) => ({ ...prev, likert: { ...prev.likert, [question.id]: n } }))
                  }
                  disabled={disabled}
                  className="sr-only"
                />
                {n}
              </label>
            ))}
          </div>
          {question.anchorMin || question.anchorMax ? (
            <div className="mt-3 flex justify-between text-xs leading-5 text-[var(--text-muted)]">
              <span>{question.anchorMin?.[lang] ?? ""}</span>
              <span>{question.anchorMax?.[lang] ?? ""}</span>
            </div>
          ) : null}
        </fieldset>
      );
    }
    case "stars": {
      const value = draft.stars[question.id] ?? 0;
      return (
        <fieldset className={wrapperClass}>
          <legend className="text-sm font-medium text-[var(--text-primary)]">{prompt}</legend>
          <div className="mt-4 flex gap-1">
            {Array.from({ length: question.max }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() =>
                  setDraft((prev) => ({ ...prev, stars: { ...prev.stars, [question.id]: n } }))
                }
                disabled={disabled}
                aria-label={`${n}`}
                className={`text-2xl transition ${
                  value >= n ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                } ${disabled ? "pointer-events-none opacity-50" : "hover:text-[var(--text-primary)]"}`}
              >
                {value >= n ? "★" : "☆"}
              </button>
            ))}
          </div>
        </fieldset>
      );
    }
    case "single-choice": {
      const value = draft.singleChoice[question.id] ?? "";
      return (
        <fieldset className={wrapperClass}>
          <legend className="text-sm font-medium text-[var(--text-primary)]">{prompt}</legend>
          <div className="mt-4 flex flex-wrap gap-2">
            {question.options.map((opt) => (
              <label
                key={opt.id}
                className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                  value === opt.id
                    ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--surface)]"
                    : "border-[var(--border)] bg-[var(--surface-panel)] text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                } ${disabled ? "pointer-events-none opacity-50" : ""}`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={opt.id}
                  checked={value === opt.id}
                  onChange={() =>
                    setDraft((prev) => ({
                      ...prev,
                      singleChoice: { ...prev.singleChoice, [question.id]: opt.id },
                    }))
                  }
                  disabled={disabled}
                  className="sr-only"
                />
                {opt.label[lang]}
              </label>
            ))}
          </div>
        </fieldset>
      );
    }
    case "multi-choice": {
      const selected = draft.multiChoice[question.id] ?? [];
      const toggle = (optionId: string) => {
        setDraft((prev) => {
          const current = prev.multiChoice[question.id] ?? [];
          const next = current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId];
          return { ...prev, multiChoice: { ...prev.multiChoice, [question.id]: next } };
        });
      };
      return (
        <fieldset className={wrapperClass}>
          <legend className="text-sm font-medium text-[var(--text-primary)]">{prompt}</legend>
          <div className="mt-4 flex flex-wrap gap-2">
            {question.options.map((opt) => {
              const isSelected = selected.includes(opt.id);
              return (
                <label
                  key={opt.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                    isSelected
                      ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--surface)]"
                      : "border-[var(--border)] bg-[var(--surface-panel)] text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                  } ${disabled ? "pointer-events-none opacity-50" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(opt.id)}
                    disabled={disabled}
                    className="sr-only"
                  />
                  {opt.label[lang]}
                </label>
              );
            })}
          </div>
        </fieldset>
      );
    }
    case "open-text": {
      const value = draft.openText[question.id] ?? "";
      const placeholder = question.placeholder?.[lang];
      return (
        <label className={`block ${wrapperClass}`}>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {prompt}
            {question.optional ? (
              <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">{optionalHint}</span>
            ) : null}
          </span>
          <textarea
            value={value}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                openText: { ...prev.openText, [question.id]: event.target.value },
              }))
            }
            rows={question.rows ?? 3}
            placeholder={placeholder}
            disabled={disabled}
            className="mt-3 w-full rounded-[16px] border border-[var(--border)] bg-[var(--surface-panel)] px-3 py-2 text-sm leading-6 text-[var(--text-primary)] focus:border-[var(--border-strong)] focus:outline-none"
          />
        </label>
      );
    }
    case "checkbox": {
      const checked = draft.checkbox[question.id] ?? false;
      return (
        <label className={`flex items-start gap-3 ${wrapperClass}`}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                checkbox: { ...prev.checkbox, [question.id]: event.target.checked },
              }))
            }
            disabled={disabled}
            className="mt-1"
          />
          <span className="text-sm leading-6 text-[var(--text-secondary)]">{prompt}</span>
        </label>
      );
    }
  }
}
