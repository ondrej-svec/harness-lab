import type {
  FeedbackFormTemplate,
  FeedbackSubmissionRecord,
} from "@/lib/runtime-contracts";
import type { ParticipantReferenceGroup } from "@/lib/public-page-view-model";
import { publicCopy, type UiLanguage } from "@/lib/ui-language";
import { FeedbackFormRenderer } from "./feedback-form-renderer";
import { SubmitButton } from "./submit-button";

type Copy = (typeof publicCopy)[UiLanguage];

/**
 * Post-workshop participant surface. Renders when workshop_instances.status
 * is "ended" — replaces the live ParticipantRoomSurface with a resources-
 * first layout and a feedback form.
 *
 * v1 copy here is working-draft English. Phase 6 of
 * docs/plans/2026-04-21-feat-post-workshop-feedback-plan.md replaces it
 * with reviewed bilingual copy after HTML mockup + copy-table preview.
 */
export function PostWorkshopSurface({
  copy,
  lang,
  workshopContextLine,
  template,
  existingSubmission,
  referenceGroups,
  logoutAction,
}: {
  copy: Copy;
  lang: UiLanguage;
  workshopContextLine: string;
  template: FeedbackFormTemplate;
  existingSubmission: FeedbackSubmissionRecord | null;
  referenceGroups: ParticipantReferenceGroup[];
  logoutAction?: ((formData: FormData) => Promise<void>) | undefined;
}) {
  const surfaceCopy = getPostWorkshopCopy(lang);

  return (
    <>
      {workshopContextLine ? (
        <p className="border-b border-[var(--border)] py-3 text-sm lowercase text-[var(--text-muted)]">
          {workshopContextLine}
        </p>
      ) : null}

      <section className="border-b border-[var(--border)] py-10">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-soft)] sm:p-7">
          <p className="text-[11px] lowercase tracking-[0.22em] text-[var(--text-muted)]">
            {surfaceCopy.eyebrow}
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
            {surfaceCopy.title}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">
            {surfaceCopy.body}
          </p>
        </div>
      </section>

      <section className="border-b border-[var(--border)] py-10" id="feedback">
        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-7">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
            {surfaceCopy.feedbackEyebrow}
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            {surfaceCopy.feedbackTitle}
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
            {surfaceCopy.feedbackBody}
          </p>

          <div className="mt-6">
            <FeedbackFormRenderer
              template={template}
              existing={existingSubmission}
              lang={lang}
              labels={{
                submitLabel: surfaceCopy.submitLabel,
                submittingLabel: surfaceCopy.submittingLabel,
                successMessage: surfaceCopy.successMessage,
                genericError: surfaceCopy.genericError,
                lockedMessage: surfaceCopy.lockedMessage,
                allowQuoteByNameLabel: surfaceCopy.allowQuoteByNameLabel,
                optionalHint: surfaceCopy.optionalHint,
              }}
            />
          </div>
        </div>
      </section>

      {referenceGroups.length > 0 ? (
        <section className="py-10" id="reference">
          <div className="space-y-4">
            <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {surfaceCopy.referenceTitle}
              </p>
              <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                {surfaceCopy.referenceBody}
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {referenceGroups.map((group) => (
                <div
                  key={group.id}
                  className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-5"
                >
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    {group.title}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                    {group.description}
                  </p>
                  <div className="mt-4 space-y-3">
                    {group.items.map((item) => (
                      <a
                        key={item.id}
                        href={item.href ?? "#"}
                        rel={item.href?.startsWith("http") ? "noreferrer" : undefined}
                        target={item.href?.startsWith("http") ? "_blank" : undefined}
                        className="block rounded-[16px] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-3 transition hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{item.label}</p>
                          {item.href ? (
                            <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                              {copy.openLinkLabel}
                            </span>
                          ) : null}
                        </div>
                        {item.description ? (
                          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                            {item.description}
                          </p>
                        ) : null}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {logoutAction ? (
        <footer className="flex items-center justify-end gap-4 border-t border-[var(--border)] py-6">
          <form action={logoutAction}>
            <input name="lang" type="hidden" value={lang} />
            <SubmitButton className="rounded-full border border-[var(--border-strong)] px-5 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]">
              {copy.leaveRoomContext}
            </SubmitButton>
          </form>
        </footer>
      ) : null}
    </>
  );
}

/**
 * Post-workshop surface copy. Working draft for v1 — Phase 6 of the
 * plan replaces these with reviewed bilingual copy after preview
 * artifacts land. Participant-facing, so voice rules 1 / 2 / 2b from
 * feedback_participant_copy_voice.md apply.
 */
function getPostWorkshopCopy(lang: UiLanguage) {
  if (lang === "en") {
    return {
      eyebrow: "workshop ended",
      title: "Thanks for being here.",
      body: "The workshop is over, but the room stays open for a bit. The quickest thing you can do: leave us a short piece of feedback below. It shapes the next workshop, not just this one.",
      feedbackEyebrow: "feedback",
      feedbackTitle: "How did it land?",
      feedbackBody: "Short and honest beats polished. Skip anything that does not fit. You can come back and edit within 24 hours.",
      submitLabel: "Send feedback",
      submittingLabel: "Sending…",
      successMessage: "Thanks — we read every one of these.",
      genericError: "Could not send the feedback. Please try again.",
      lockedMessage: "Your earlier submission is locked. Thanks again for the feedback.",
      allowQuoteByNameLabel: "You can quote me by name in marketing materials.",
      optionalHint: "optional",
      referenceTitle: "reference",
      referenceBody: "The workshop materials stay reachable here for as long as you need them.",
    };
  }

  return {
    eyebrow: "workshop doběhl",
    title: "Díky, že jste byli u toho.",
    body: "Workshop skončil, ale místnost ještě chvíli zůstává otevřená. Nejjednodušší věc, kterou teď můžete udělat: nechat nám krátkou zpětnou vazbu. Pomáhá to nejen tomuto, ale hlavně dalšímu workshopu.",
    feedbackEyebrow: "zpětná vazba",
    feedbackTitle: "Jak to dopadlo?",
    feedbackBody: "Krátké a upřímné je lepší než uhlazené. Cokoli nesedí, přeskočte. Do 24 hodin se můžete vrátit a upravit.",
    submitLabel: "Odeslat zpětnou vazbu",
    submittingLabel: "Odesílám…",
    successMessage: "Díky — čteme každou.",
    genericError: "Zpětnou vazbu se nepodařilo odeslat. Zkuste to prosím znovu.",
    lockedMessage: "Vaše dřívější odpověď je uzamčena. Ještě jednou díky za zpětnou vazbu.",
    allowQuoteByNameLabel: "Můžete mě jmenovitě citovat v marketingových materiálech.",
    optionalHint: "nepovinné",
    referenceTitle: "podklady",
    referenceBody: "Workshopové materiály tu zůstávají dostupné, dokud je potřebujete.",
  };
}
