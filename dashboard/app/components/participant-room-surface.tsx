import type { ReactNode } from "react";
import {
  buildParticipantPanelState,
  buildParticipantTeamCards,
  buildSharedRoomNotes,
} from "@/lib/public-page-view-model";
import type { ParticipantTeamLookup } from "@/lib/event-access";
import type { ParticipantSession } from "@/lib/runtime-contracts";
import { publicCopy, type UiLanguage } from "@/lib/ui-language";
import type { PresenterBlock, WorkshopState } from "@/lib/workshop-data";
import { SubmitButton } from "./submit-button";

type AgendaItem = WorkshopState["agenda"][number];
type PublicNote = WorkshopState["ticker"][number];

export function ParticipantRoomSurface({
  copy,
  lang,
  workshopContextLine,
  currentAgendaItem,
  nextAgendaItem,
  participantSession,
  participantTeams,
  publicNotes,
  rotationRevealed,
  logoutAction,
}: {
  copy: (typeof publicCopy)[UiLanguage];
  lang: UiLanguage;
  workshopContextLine: string;
  currentAgendaItem: AgendaItem | undefined;
  nextAgendaItem: AgendaItem | undefined;
  participantSession: ParticipantSession;
  participantTeams: ParticipantTeamLookup | null;
  publicNotes: PublicNote[];
  rotationRevealed: boolean;
  logoutAction?: ((formData: FormData) => Promise<void>) | undefined;
}) {
  const participantPanel = buildParticipantPanelState({
    copy,
    lang,
    currentAgendaItem,
    nextAgendaItem,
    participantSession,
    rotationRevealed,
  });
  const teamCards = buildParticipantTeamCards(participantTeams);
  const sharedNotes = buildSharedRoomNotes(publicNotes);
  const roomNotesSummary = sharedNotes.length > 0 ? `${sharedNotes.length}` : "0";

  return (
    <>
      {workshopContextLine ? (
        <p className="border-b border-[var(--border)] py-3 text-sm lowercase text-[var(--text-muted)]">
          {workshopContextLine}
        </p>
      ) : null}

      <section className="border-b border-[var(--border)] py-10" id="room">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-soft)] backdrop-blur sm:p-7">
          <SectionLabel>{copy.participantEyebrow}</SectionLabel>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
            {participantPanel.title}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">{participantPanel.body}</p>

          <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)]">
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{participantPanel.currentPhaseLabel}</p>
              <p className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{participantPanel.currentPhaseTitle}</p>
              {participantPanel.currentPhaseDescription ? (
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{participantPanel.currentPhaseDescription}</p>
              ) : null}
              {participantPanel.nextPhaseLabel ? (
                <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{participantPanel.nextPhaseLabel}</p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard label={copy.metricNext} value={participantPanel.nextPhaseTitle ?? copy.metricReflection} />
              <MetricCard label={participantPanel.sessionUntilLabel} value={participantPanel.sessionUntilValue} />
              <a
                href="#notes"
                className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition hover:border-[var(--border-strong)]"
              >
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">{copy.sharedRoomNotes}</p>
                <p className="mt-3 text-base font-medium leading-6 text-[var(--text-primary)]">{roomNotesSummary}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{copy.navNotes}</p>
              </a>
            </div>
          </div>

          {participantPanel.guidanceBlocks.length > 0 ? (
            <div className="mt-6 space-y-4">
              <SectionLabel>{participantPanel.guidanceLabel ?? copy.participantEyebrow}</SectionLabel>
              <ParticipantGuidanceBlocks blocks={participantPanel.guidanceBlocks} copy={copy} participantPanel={participantPanel} />
            </div>
          ) : null}
          {participantPanel.guidanceCtaLabel ? (
            <GuidanceCta href={participantPanel.guidanceCtaHref} label={participantPanel.guidanceCtaLabel} openLabel={copy.openLinkLabel} />
          ) : null}
        </div>
      </section>

      <section className="grid gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div id="teams">
          <SectionLabel>{copy.roomData}</SectionLabel>
          {teamCards.length > 0 ? (
            <div className="mt-4 grid gap-4">
              {teamCards.map((team) => (
                <article key={team.id} className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-soft)] backdrop-blur">
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-medium text-[var(--text-primary)]">{team.name}</h3>
                      <p className="text-sm text-[var(--text-muted)]">{team.city}</p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">{team.id}</span>
                  </div>
                  {"members" in team && Array.isArray(team.members) && team.members.length > 0 ? (
                    <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{team.members.join(", ")}</p>
                  ) : null}
                  <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[var(--text-secondary)]">{team.checkpoint}</p>
                  {team.repoUrl ? (
                    <a
                      className="mt-4 block break-all rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                      href={team.repoUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {team.repoUrl}
                    </a>
                  ) : (
                    <p className="mt-4 rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-muted)]">
                      {copy.noRoomData}
                    </p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{copy.noRoomData}</p>
          )}
        </div>

        <div id="notes">
          <SectionLabel>{copy.sharedRoomNotes}</SectionLabel>
          {sharedNotes.length > 0 ? (
            <div className="mt-4 grid gap-4">
              {sharedNotes.map((note) => (
                <div key={note} className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-4 text-sm leading-6 text-[var(--text-secondary)] shadow-[var(--shadow-soft)] backdrop-blur whitespace-pre-line">
                  {note}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{copy.noRoomData}</p>
          )}
        </div>
      </section>

      {logoutAction ? (
        <footer className="flex items-center justify-between gap-4 border-t border-[var(--border)] py-6">
          <p className="text-sm text-[var(--text-muted)]">
            {participantPanel.sessionUntilLabel}: {participantPanel.sessionUntilValue}
          </p>
          <form action={logoutAction}>
            <input name="lang" type="hidden" value={lang} />
            <SubmitButton
              className="rounded-full border border-[var(--border-strong)] px-5 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {copy.leaveRoomContext}
            </SubmitButton>
          </form>
        </footer>
      ) : null}
    </>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11px] lowercase tracking-[0.22em] text-[var(--text-muted)]">{children}</p>;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-3 text-base font-medium leading-6 text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function ParticipantGuidanceBlocks({
  blocks,
  copy,
  participantPanel,
}: {
  blocks: PresenterBlock[];
  copy: (typeof publicCopy)[UiLanguage];
  participantPanel: ReturnType<typeof buildParticipantPanelState>;
}) {
  return (
    <div className="space-y-4">
      {blocks.map((block) => {
        if (block.type === "hero") {
          return (
            <div key={block.id} className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {block.eyebrow ?? participantPanel.guidanceLabel ?? copy.participantEyebrow}
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{block.title}</h3>
              {block.body ? <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{block.body}</p> : null}
            </div>
          );
        }

        if (block.type === "participant-preview") {
          return (
            <div key={block.id} className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5">
              {block.body ? <p className="text-sm leading-7 text-[var(--text-secondary)]">{block.body}</p> : null}
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <MiniMetric label={participantPanel.currentPhaseLabel} value={participantPanel.currentPhaseTitle} />
                <MiniMetric label={copy.metricNext} value={participantPanel.nextPhaseTitle ?? copy.metricReflection} />
                <MiniMetric label={participantPanel.sessionUntilLabel} value={participantPanel.sessionUntilValue} />
              </div>
            </div>
          );
        }

        if (block.type === "bullet-list") {
          return (
            <ParticipantBlockCard key={block.id} title={block.title}>
              <ul className="space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
                {block.items.map((item) => (
                  <li key={item}>{"\u2022"} {item}</li>
                ))}
              </ul>
            </ParticipantBlockCard>
          );
        }

        if (block.type === "checklist") {
          return (
            <ParticipantBlockCard key={block.id} title={block.title}>
              <div className="space-y-3">
                {block.items.map((item) => (
                  <div key={item} className="flex gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-3">
                    <span className="mt-1 h-3 w-3 rounded-full border border-[var(--border-strong)]" />
                    <p className="text-sm leading-6 text-[var(--text-secondary)]">{item}</p>
                  </div>
                ))}
              </div>
            </ParticipantBlockCard>
          );
        }

        if (block.type === "steps") {
          return (
            <ParticipantBlockCard key={block.id} title={block.title}>
              <div className="space-y-4">
                {block.items.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="grid gap-3 sm:grid-cols-[2rem_minmax(0,1fr)]">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-sm text-[var(--text-primary)]">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{item.title}</p>
                      {item.body ? <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{item.body}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </ParticipantBlockCard>
          );
        }

        if (block.type === "callout") {
          const toneClass =
            block.tone === "warning"
              ? "border-[var(--border-strong)] bg-[var(--surface-panel)]"
              : "border-[var(--border)] bg-[var(--surface)]";
          return (
            <div key={block.id} className={`rounded-[24px] border p-5 ${toneClass}`}>
              {block.title ? <p className="text-sm font-medium text-[var(--text-primary)]">{block.title}</p> : null}
              <p className={block.title ? "mt-2 text-sm leading-7 text-[var(--text-secondary)]" : "text-sm leading-7 text-[var(--text-secondary)]"}>
                {block.body}
              </p>
            </div>
          );
        }

        if (block.type === "rich-text") {
          return (
            <div
              key={block.id}
              className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-sm leading-7 text-[var(--text-secondary)] whitespace-pre-line"
            >
              {block.content}
            </div>
          );
        }

        if (block.type === "quote") {
          const attribution = block.attribution?.trim() || copy.quoteSourceUnknown;
          return (
            <div key={block.id} className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] px-5 py-5">
              <blockquote className="text-lg leading-8 text-[var(--text-primary)]">&ldquo;{block.quote}&rdquo;</blockquote>
              <p className="mt-3 text-sm text-[var(--text-muted)]">{attribution}</p>
            </div>
          );
        }

        if (block.type === "link-list") {
          return (
            <ParticipantBlockCard key={block.id} title={block.title}>
              <div className="space-y-3">
                {block.items.map((item) => (
                  <ActionablePanelLink
                    key={`${item.label}-${item.href ?? ""}`}
                    href={item.href ?? null}
                    label={item.label}
                    description={item.description}
                    openLabel={copy.openLinkLabel}
                  />
                ))}
              </div>
            </ParticipantBlockCard>
          );
        }

        if (block.type === "image") {
          return (
            <figure key={block.id} className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={block.src} alt={block.alt} className="w-full rounded-[18px] object-cover" />
              {block.caption ? <figcaption className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{block.caption}</figcaption> : null}
            </figure>
          );
        }

        return null;
      })}
    </div>
  );
}

function ParticipantBlockCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5">
      {title ? <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{title}</p> : null}
      <div className={title ? "mt-4" : ""}>{children}</div>
    </div>
  );
}

function GuidanceCta({ href, label, openLabel }: { href: string | null; label: string; openLabel: string }) {
  return (
    <div className="mt-5">
      <ActionablePrimaryLink href={href} label={label} openLabel={openLabel} />
    </div>
  );
}

function ActionablePrimaryLink({ href, label, openLabel }: { href: string | null; label: string; openLabel: string }) {
  if (!href) {
    return (
      <div className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-medium text-[var(--text-primary)]">
        {label}
      </div>
    );
  }

  return (
    <a
      className="inline-flex w-full items-center justify-between rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--text-primary)] hover:bg-[var(--surface-panel)]"
      href={href}
      rel={isExternalHref(href) ? "noreferrer" : undefined}
      target={isExternalHref(href) ? "_blank" : undefined}
    >
      <span>{label}</span>
      <span className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">{openLabel}</span>
    </a>
  );
}

function ActionablePanelLink({
  href,
  label,
  description,
  openLabel,
}: {
  href: string | null;
  label: string;
  description?: string;
  openLabel: string;
}) {
  const className =
    "rounded-[16px] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-3 transition hover:border-[var(--border-strong)] hover:bg-[var(--surface)]";
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
        {href ? <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{openLabel}</span> : null}
      </div>
      {description ? <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{description}</p> : null}
    </>
  );

  if (!href) {
    return <div className={className}>{content}</div>;
  }

  return (
    <a
      className={`block ${className}`}
      href={href}
      rel={isExternalHref(href) ? "noreferrer" : undefined}
      target={isExternalHref(href) ? "_blank" : undefined}
    >
      {content}
    </a>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-panel)] p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-3 text-sm leading-6 text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function isExternalHref(href: string) {
  return /^https?:\/\//.test(href);
}
