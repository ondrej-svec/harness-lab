"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import type { UiLanguage } from "@/lib/ui-language";
import type { ParticipantDisambiguator } from "@/lib/participant-disambiguator";

type Match = {
  id: string;
  displayName: string;
  hasPassword: boolean;
  hasEmail?: boolean;
  emailDisplay?: string | null;
  disambiguator: ParticipantDisambiguator | null;
};

type View =
  | { kind: "typing" }
  | {
      kind: "set_password";
      participantId: string;
      displayName: string;
      requiresEmail: boolean;
      emailDisplay: string | null;
    }
  | { kind: "enter_password"; participantId: string; displayName: string }
  | { kind: "walk_in_refused" }
  | { kind: "already_bound" };

type Copy = {
  typePromptLabel: string;
  typePromptPlaceholder: string;
  continueButton: string;
  setPasswordPrompt: (name: string) => string;
  setPasswordSub: string;
  emailLabel: string;
  passwordLabel: string;
  enterPasswordPrompt: (name: string) => string;
  enterPasswordSub: string;
  walkInCreateOption: (name: string) => string;
  walkInRefusedTitle: string;
  walkInRefusedBody: string;
  alreadyBoundTitle: string;
  alreadyBoundBody: string;
  tryDifferentName: string;
  wrongCredentials: string;
  weakPassword: string;
  invalidEmail: string;
  emailTaken: string;
  genericError: string;
  loadingHint: string;
};

function cs(): Copy {
  return {
    typePromptLabel: "vaše jméno",
    typePromptPlaceholder: "začněte psát…",
    continueButton: "pokračovat",
    setPasswordPrompt: (name) => `vítej, ${name}`,
    setPasswordSub: "nastavte si heslo",
    emailLabel: "váš e-mail",
    passwordLabel: "heslo",
    enterPasswordPrompt: (name) => `vítej zpět, ${name}`,
    enterPasswordSub: "zadejte své heslo",
    walkInCreateOption: (name) => `＋ přidat "${name}" jako nového účastníka`,
    walkInRefusedTitle: "nejste na seznamu",
    walkInRefusedBody: "poproste facilitátora, aby vás přidal.",
    alreadyBoundTitle: "tato relace už patří někomu jinému",
    alreadyBoundBody: "pokud to nejste vy, odhlaste se v horní liště.",
    tryDifferentName: "zkusit jiné jméno",
    wrongCredentials: "heslo neodpovídá · zkuste znovu",
    weakPassword: "heslo musí mít alespoň 8 znaků",
    invalidEmail: "zadejte platný e-mail",
    emailTaken: "tento e-mail už má účet · zadejte heslo",
    genericError: "něco se pokazilo · zkuste to znovu",
    loadingHint: "načítám…",
  };
}

function en(): Copy {
  return {
    typePromptLabel: "your name",
    typePromptPlaceholder: "start typing…",
    continueButton: "continue",
    setPasswordPrompt: (name) => `welcome, ${name}`,
    setPasswordSub: "set your password",
    emailLabel: "your email",
    passwordLabel: "password",
    enterPasswordPrompt: (name) => `welcome back, ${name}`,
    enterPasswordSub: "enter your password",
    walkInCreateOption: (name) => `＋ add "${name}" as a new participant`,
    walkInRefusedTitle: "not on the roster",
    walkInRefusedBody: "ask your facilitator to add you.",
    alreadyBoundTitle: "this session is already identified as someone else",
    alreadyBoundBody: "if that's not you, use log out in the room header.",
    tryDifferentName: "try a different name",
    wrongCredentials: "that didn't match · try again",
    weakPassword: "password must be at least 8 characters",
    invalidEmail: "enter a valid email",
    emailTaken: "that email already has an account · enter the password",
    genericError: "something went wrong · try again",
    loadingHint: "looking…",
  };
}

export function ParticipantIdentifyFlow({
  lang,
  allowWalkIns,
  initialHint,
}: {
  lang: UiLanguage;
  allowWalkIns: boolean;
  initialHint?: string;
}) {
  const copy = lang === "cs" ? cs() : en();
  const router = useRouter();

  const [view, setView] = useState<View>(
    initialHint === "already_bound" ? { kind: "already_bound" } : { kind: "typing" },
  );
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [highlighted, setHighlighted] = useState(0);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Debounced suggest fetch
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (view.kind !== "typing") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setMatches([]);
      setSuggestLoading(false);
      return;
    }

    setSuggestLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/event-access/identify/suggest?q=${encodeURIComponent(trimmed)}`,
        );
        if (!response.ok) {
          setMatches([]);
          return;
        }
        const data = (await response.json()) as { ok: boolean; matches?: Match[] };
        setMatches(data.matches ?? []);
        setHighlighted(0);
      } catch {
        setMatches([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, view.kind]);

  const pickMatch = useCallback(
    (match: Match) => {
      setError(null);
      if (match.hasPassword) {
        setView({ kind: "enter_password", participantId: match.id, displayName: match.displayName });
      } else {
        setView({
          kind: "set_password",
          participantId: match.id,
          displayName: match.displayName,
          requiresEmail: match.hasEmail !== true,
          emailDisplay: match.emailDisplay ?? null,
        });
      }
    },
    [],
  );

  const pickWalkIn = useCallback(
    (typed: string) => {
      if (!allowWalkIns) {
        setView({ kind: "walk_in_refused" });
        return;
      }
      setError(null);
      setView({
        kind: "set_password",
        participantId: "",
        displayName: typed,
        requiresEmail: true,
        emailDisplay: null,
      });
    },
    [allowWalkIns],
  );

  const handleTypingSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const typed = query.trim();
      if (typed.length === 0) return;
      if (matches.length > 0 && highlighted < matches.length) {
        pickMatch(matches[highlighted]);
      } else {
        pickWalkIn(typed);
      }
    },
    [query, matches, highlighted, pickMatch, pickWalkIn],
  );

  const handleTypingKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (matches.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlighted((h) => Math.min(matches.length, h + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlighted((h) => Math.max(0, h - 1));
      }
    },
    [matches.length],
  );

  const handleSetPassword = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (view.kind !== "set_password") return;
      const form = e.currentTarget as HTMLFormElement;
      const formData = new FormData(form);
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");

      if (view.requiresEmail && email.indexOf("@") <= 0) {
        setError(copy.invalidEmail);
        return;
      }
      if (password.length < 8) {
        setError(copy.weakPassword);
        return;
      }

      setSubmitting(true);
      setError(null);
      try {
        const response = await fetch("/api/event-access/identify/set-password", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            participantId: view.participantId || undefined,
            displayName: view.participantId ? undefined : view.displayName,
            email: view.requiresEmail ? email : undefined,
            password,
          }),
        });
        const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (!response.ok || !data.ok) {
          if (data.error === "email_taken") {
            setError(copy.emailTaken);
          } else if (data.error === "weak_password") {
            setError(copy.weakPassword);
          } else if (data.error === "invalid_email") {
            setError(copy.invalidEmail);
          } else if (data.error === "walk_in_refused") {
            setView({ kind: "walk_in_refused" });
          } else if (data.error === "already_bound") {
            setView({ kind: "already_bound" });
          } else {
            setError(copy.genericError);
          }
          return;
        }
        router.refresh();
      } catch {
        setError(copy.genericError);
      } finally {
        setSubmitting(false);
      }
    },
    [view, router, copy],
  );

  const handleEnterPassword = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (view.kind !== "enter_password") return;
      const form = e.currentTarget as HTMLFormElement;
      const formData = new FormData(form);
      const password = String(formData.get("password") ?? "");

      if (password.length === 0) {
        setError(copy.wrongCredentials);
        return;
      }

      setSubmitting(true);
      setError(null);
      try {
        const response = await fetch("/api/event-access/identify/authenticate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            participantId: view.participantId,
            password,
          }),
        });
        const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (!response.ok || !data.ok) {
          if (data.error === "already_bound") {
            setView({ kind: "already_bound" });
          } else {
            setError(copy.wrongCredentials);
          }
          return;
        }
        router.refresh();
      } catch {
        setError(copy.genericError);
      } finally {
        setSubmitting(false);
      }
    },
    [view, router, copy],
  );

  const showCreateSentinel =
    view.kind === "typing" && query.trim().length >= 2 && !suggestLoading && allowWalkIns;
  const exactMatch = matches.some(
    (m) => m.displayName.toLocaleLowerCase() === query.trim().toLocaleLowerCase(),
  );

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6">
      <div className="w-full max-w-sm rounded-[22px] border border-[var(--border)] bg-[var(--surface-panel)] p-8 shadow-[var(--shadow-soft)] backdrop-blur">
        {view.kind === "typing" ? (
          <form onSubmit={handleTypingSubmit} className="flex flex-col gap-4">
            <label
              className="text-center text-lg font-medium text-[var(--text-primary)]"
              htmlFor="participant-name"
            >
              {copy.typePromptLabel}
            </label>
            <div className="relative">
              <input
                id="participant-name"
                name="displayName"
                type="text"
                autoFocus
                autoComplete="off"
                autoCapitalize="words"
                enterKeyHint="done"
                placeholder={copy.typePromptPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleTypingKeyDown}
                role="combobox"
                aria-autocomplete="list"
                aria-controls="participant-suggest-list"
                aria-expanded={matches.length > 0}
                aria-activedescendant={
                  matches.length > 0 ? `participant-suggest-${highlighted}` : undefined
                }
                className="w-full rounded-[16px] border border-[var(--border-strong)] bg-[var(--input-bg)] px-4 py-3 text-center text-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-[var(--text-primary)]"
              />
              {suggestLoading ? (
                <span
                  aria-hidden="true"
                  className="absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin rounded-full border-2 border-[color:color-mix(in_srgb,var(--accent-surface)_36%,transparent)] border-t-[var(--accent-surface)]"
                />
              ) : null}
            </div>
            {matches.length > 0 ? (
              <ul
                id="participant-suggest-list"
                role="listbox"
                aria-label={copy.typePromptLabel}
                className="overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--surface-panel)]"
              >
                {matches.map((match, index) => (
                  <li
                    id={`participant-suggest-${index}`}
                    key={match.id}
                    role="option"
                    aria-selected={highlighted === index}
                    onClick={() => pickMatch(match)}
                    onMouseEnter={() => setHighlighted(index)}
                    className={`flex cursor-pointer items-center justify-between border-t border-[var(--border)] px-3 py-2 text-[var(--text-primary)] first:border-t-0 ${
                      highlighted === index
                        ? "bg-[color:color-mix(in_srgb,var(--accent-surface)_10%,transparent)]"
                        : ""
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {highlighted === index ? (
                        <span className="font-semibold text-[var(--accent-surface)]">›</span>
                      ) : null}
                      <span className="text-[0.95rem]">{match.displayName}</span>
                      {match.disambiguator ? (
                        <span className="text-[11px] uppercase tracking-[0.06em] text-[var(--text-muted)]">
                          {match.disambiguator.value}
                        </span>
                      ) : null}
                    </span>
                    {match.hasPassword ? (
                      <span className="rounded-full border border-[color:color-mix(in_srgb,var(--foam)_24%,transparent)] bg-[color:color-mix(in_srgb,var(--foam)_10%,transparent)] px-2 py-0.5 text-[10px] lowercase tracking-[0.06em] text-[var(--foam)]">
                        {lang === "cs" ? "vracející se" : "returning"}
                      </span>
                    ) : null}
                  </li>
                ))}
                {showCreateSentinel && !exactMatch ? (
                  <li
                    id={`participant-suggest-${matches.length}`}
                    role="option"
                    aria-selected={highlighted === matches.length}
                    onClick={() => pickWalkIn(query.trim())}
                    onMouseEnter={() => setHighlighted(matches.length)}
                    className={`cursor-pointer border-t border-[var(--border)] px-3 py-2 italic text-[var(--text-secondary)] ${
                      highlighted === matches.length
                        ? "bg-[color:color-mix(in_srgb,var(--accent-surface)_10%,transparent)]"
                        : ""
                    }`}
                  >
                    {copy.walkInCreateOption(query.trim())}
                  </li>
                ) : null}
              </ul>
            ) : showCreateSentinel ? (
              <ul
                role="listbox"
                className="overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--surface-panel)]"
              >
                <li
                  role="option"
                  aria-selected
                  onClick={() => pickWalkIn(query.trim())}
                  className="cursor-pointer px-3 py-2 italic text-[var(--text-secondary)]"
                >
                  {copy.walkInCreateOption(query.trim())}
                </li>
              </ul>
            ) : null}
            <button
              type="submit"
              disabled={query.trim().length === 0}
              className="inline-flex justify-center rounded-full border border-[var(--accent-surface)] bg-[var(--accent-surface)] px-6 py-3 text-sm font-semibold lowercase tracking-[0.01em] text-[color:var(--accent-text)] shadow-[0_12px_24px_rgba(12,10,9,0.12)] transition disabled:opacity-50 hover:opacity-95"
            >
              {copy.continueButton}
            </button>
          </form>
        ) : null}

        {view.kind === "set_password" ? (
          <form onSubmit={handleSetPassword} className="flex flex-col gap-4">
            <div className="text-center">
              <p className="text-lg font-medium text-[var(--text-primary)]">
                {copy.setPasswordPrompt(view.displayName)}
              </p>
              <p className="mt-1 text-xs lowercase tracking-[0.04em] text-[var(--text-muted)]">
                {copy.setPasswordSub}
              </p>
            </div>
            {view.requiresEmail ? (
              <>
                <label className="sr-only" htmlFor="participant-email">
                  {copy.emailLabel}
                </label>
                <input
                  id="participant-email"
                  name="email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  placeholder={copy.emailLabel}
                  className="w-full rounded-[14px] border border-[var(--border-strong)] bg-[var(--input-bg)] px-4 py-3 text-center text-[0.95rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-[var(--text-primary)]"
                />
              </>
            ) : view.emailDisplay ? (
              <div className="rounded-[14px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface-panel)_78%,transparent)] px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  {copy.emailLabel}
                </p>
                <p className="mt-1 text-[0.95rem] text-[var(--text-primary)]">{view.emailDisplay}</p>
              </div>
            ) : null}
            <label className="sr-only" htmlFor="participant-password">
              {copy.passwordLabel}
            </label>
            <input
              id="participant-password"
              name="password"
              type="password"
              required
              minLength={8}
              autoFocus={!view.requiresEmail}
              autoComplete="new-password"
              placeholder={copy.passwordLabel}
              className="w-full rounded-[14px] border border-[var(--border-strong)] bg-[var(--input-bg)] px-4 py-3 text-center text-[0.95rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-[var(--text-primary)]"
            />
            {error ? (
              <p className="rounded-[10px] border border-[color:color-mix(in_srgb,var(--love)_40%,transparent)] bg-[color:color-mix(in_srgb,var(--love)_10%,transparent)] px-3 py-2 text-center text-xs lowercase text-[var(--love)]">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex justify-center rounded-full border border-[var(--accent-surface)] bg-[var(--accent-surface)] px-6 py-3 text-sm font-semibold lowercase tracking-[0.01em] text-[color:var(--accent-text)] shadow-[0_12px_24px_rgba(12,10,9,0.12)] transition disabled:opacity-50 hover:opacity-95"
            >
              {copy.continueButton}
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setView({ kind: "typing" });
              }}
              className="text-center text-xs lowercase tracking-[0.04em] text-[var(--text-muted)] underline-offset-4 hover:text-[var(--text-primary)] hover:underline"
            >
              {copy.tryDifferentName}
            </button>
          </form>
        ) : null}

        {view.kind === "enter_password" ? (
          <form onSubmit={handleEnterPassword} className="flex flex-col gap-4">
            <div className="text-center">
              <p className="text-lg font-medium text-[var(--text-primary)]">
                {copy.enterPasswordPrompt(view.displayName)}
              </p>
              <p className="mt-1 text-xs lowercase tracking-[0.04em] text-[var(--text-muted)]">
                {copy.enterPasswordSub}
              </p>
            </div>
            <label className="sr-only" htmlFor="participant-password">
              {copy.passwordLabel}
            </label>
            <input
              id="participant-password"
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              placeholder={copy.passwordLabel}
              className="w-full rounded-[14px] border border-[var(--border-strong)] bg-[var(--input-bg)] px-4 py-3 text-center text-[0.95rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-[var(--text-primary)]"
            />
            {error ? (
              <p className="rounded-[10px] border border-[color:color-mix(in_srgb,var(--love)_40%,transparent)] bg-[color:color-mix(in_srgb,var(--love)_10%,transparent)] px-3 py-2 text-center text-xs lowercase text-[var(--love)]">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex justify-center rounded-full border border-[var(--accent-surface)] bg-[var(--accent-surface)] px-6 py-3 text-sm font-semibold lowercase tracking-[0.01em] text-[color:var(--accent-text)] shadow-[0_12px_24px_rgba(12,10,9,0.12)] transition disabled:opacity-50 hover:opacity-95"
            >
              {copy.continueButton}
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setView({ kind: "typing" });
              }}
              className="text-center text-xs lowercase tracking-[0.04em] text-[var(--text-muted)] underline-offset-4 hover:text-[var(--text-primary)] hover:underline"
            >
              {copy.tryDifferentName}
            </button>
          </form>
        ) : null}

        {view.kind === "walk_in_refused" ? (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-lg font-medium text-[var(--text-primary)]">
              {copy.walkInRefusedTitle}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">{copy.walkInRefusedBody}</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setView({ kind: "typing" });
              }}
              className="inline-flex justify-center rounded-full border border-[var(--border-strong)] bg-transparent px-6 py-3 text-sm font-medium lowercase tracking-[0.01em] text-[var(--text-secondary)]"
            >
              {copy.tryDifferentName}
            </button>
          </div>
        ) : null}

        {view.kind === "already_bound" ? (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-lg font-medium text-[var(--text-primary)]">
              {copy.alreadyBoundTitle}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">{copy.alreadyBoundBody}</p>
          </div>
        ) : null}
      </div>
      <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">harness lab</p>
    </div>
  );
}
