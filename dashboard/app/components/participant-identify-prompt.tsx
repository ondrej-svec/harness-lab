import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  bindParticipantToSession,
  getParticipantSession,
  participantSessionCookieName,
} from "@/lib/event-access";
import { hashSecret } from "@/lib/participant-event-access-repository";
import { resolveUiLanguage, withLang, type UiLanguage } from "@/lib/ui-language";
import { SubmitButton } from "./submit-button";

/**
 * Single-field "what's your name?" prompt rendered when a participant
 * has a valid session but no bound Participant entity. Posting the form
 * runs a server action that calls `bindParticipantToSession` and
 * redirects back to the participant home so the normal flow takes over.
 *
 * See docs/previews/2026-04-16-participant-identify-flow.md for the
 * UX contract — one input, one button, no explanation, no email here.
 */
export function ParticipantIdentifyPrompt({
  lang,
}: {
  lang: UiLanguage;
}) {
  const prompt = lang === "cs" ? "Jak se jmenujete?" : "What's your name?";
  const continueLabel = lang === "cs" ? "Pokračovat" : "Continue";
  const placeholder = lang === "cs" ? "Vaše jméno" : "Your name";

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6">
      <div className="w-full max-w-sm rounded-[24px] border border-[var(--border)] bg-[var(--surface-panel)] p-8 shadow-[var(--shadow-soft)] backdrop-blur">
        <form action={submitIdentifyAction} className="flex flex-col gap-5">
          <input name="lang" type="hidden" value={lang} />
          <label className="text-center text-lg font-medium text-[var(--text-primary)]" htmlFor="participant-name">
            {prompt}
          </label>
          <input
            id="participant-name"
            name="displayName"
            type="text"
            autoFocus
            required
            maxLength={80}
            autoComplete="off"
            autoCapitalize="words"
            enterKeyHint="done"
            placeholder={placeholder}
            aria-label={prompt}
            className="w-full rounded-[16px] border border-[var(--border-strong)] bg-[var(--input-bg)] px-4 py-3 text-center text-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-[var(--text-primary)]"
          />
          <SubmitButton
            className="inline-flex justify-center rounded-full border border-[var(--accent-surface)] bg-[var(--accent-surface)] px-6 py-3 text-sm font-semibold lowercase tracking-[0.01em] text-[color:var(--accent-text)] shadow-[0_12px_24px_rgba(12,10,9,0.12)] transition hover:opacity-95"
          >
            {continueLabel}
          </SubmitButton>
        </form>
      </div>
      <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">harness lab</p>
    </div>
  );
}

async function submitIdentifyAction(formData: FormData) {
  "use server";

  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
  const displayName = String(formData.get("displayName") ?? "");

  const cookieStore = await cookies();
  const token = cookieStore.get(participantSessionCookieName)?.value;
  if (!token) {
    redirect(withLang("/", lang));
  }

  const session = await getParticipantSession(token);
  if (!session) {
    redirect(withLang("/", lang));
  }

  const result = await bindParticipantToSession(session, hashSecret(token), displayName);
  if (!result.ok) {
    // For invalid_display_name, bounce back to the prompt with an
    // empty input. For already_bound, pretend success — the session
    // raced with itself and the next load will show the team.
    if (result.reason === "invalid_display_name") {
      redirect(withLang("/participant?identify=invalid", lang));
    }
  }

  redirect(withLang("/participant", lang));
}
