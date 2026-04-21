import { AdminSubmitButton } from "@/app/admin/admin-submit-button";
import {
  AdminPanel,
  FieldLabel,
  adminInputClassName,
  adminPrimaryButtonClassName,
  adminSecondaryButtonClassName,
} from "../../../../admin-ui";
import { getParticipantRepository } from "@/lib/participant-repository";
import { getTeamCompositionHistoryRepository } from "@/lib/team-composition-history-repository";
import { getTeamMemberRepository } from "@/lib/team-member-repository";
import type {
  ParticipantRecord,
  TeamCompositionHistoryEvent,
  TeamMemberRecord,
} from "@/lib/runtime-contracts";
import type { Team } from "@/lib/workshop-data";
import type { adminCopy, UiLanguage } from "@/lib/ui-language";
import { PeopleWorkspace } from "./people-section-client";
import { PeopleRandomize } from "./people-randomize";
import { TeamsSection } from "./teams-section";
import {
  addTeamHistoryMarkerAction,
  addParticipantsFromPasteAction,
} from "../../_actions/participants";

type Copy = (typeof adminCopy)[UiLanguage];

/**
 * Server component — loads participants + team_members for the instance
 * and passes them to the interactive client workspace. The paste form
 * here is a server action so initial intake works without JS; everything
 * else (inline edits, assign / unassign, drag-and-drop) is client-side.
 */
export async function PeopleSection({
  lang,
  instanceId,
  copy,
  teams,
  teamModeEnabled = true,
}: {
  lang: UiLanguage;
  copy: Copy;
  instanceId: string;
  teams: readonly Team[];
  teamModeEnabled?: boolean;
}) {
  const [participants, members, history] = await Promise.all([
    getParticipantRepository().listParticipants(instanceId),
    getTeamMemberRepository().listMembers(instanceId),
    getTeamCompositionHistoryRepository().list(instanceId),
  ]);

  const serializedParticipants: ParticipantRecord[] = participants.map((p) => ({ ...p }));
  const serializedMembers: TeamMemberRecord[] = members.map((m) => ({ ...m }));

  const pasteLabel = lang === "cs" ? "Přidat lidi" : "Add people";
  const pastePlaceholder =
    lang === "cs"
      ? "Anna\nDavid, david@example.com\nEva, eva@example.com, senior"
      : "Ada Lovelace\nLinus, linus@example.com\nGrace, grace@example.com, senior";
  const pasteHint =
    lang === "cs"
      ? "Jeden řádek na osobu. Jméno, nebo Jméno, e-mail, nebo Jméno, e-mail, pozice. Oddělovače: čárka, tab, středník."
      : "One per line. Name, or Name, email, or Name, email, tag. Separators: comma, tab, semicolon.";
  const commitLabel = lang === "cs" ? "Přidat do poolu" : "Add to pool";

  return (
    <div className="flex flex-col gap-6">
      {teamModeEnabled ? (
        <PeopleRandomize
          lang={lang}
          instanceId={instanceId}
          existingTeamCount={teams.length}
          participantCount={serializedParticipants.filter((p) => p.archivedAt === null).length}
        />
      ) : null}
      <div className={teamModeEnabled ? "grid gap-6 xl:grid-cols-[minmax(22rem,0.9fr)_minmax(0,1.1fr)]" : "grid gap-6"}>
        <AdminPanel
          eyebrow={pasteLabel}
          title={lang === "cs" ? "vlož seznam" : "paste your roster"}
          description={pasteHint}
        >
          <form action={addParticipantsFromPasteAction} className="grid gap-3">
            <input name="instanceId" type="hidden" value={instanceId} />
            <textarea
              name="rawText"
              placeholder={pastePlaceholder}
              rows={6}
              className={`${adminInputClassName} font-mono text-[13px]`}
            />
            <AdminSubmitButton className={adminPrimaryButtonClassName}>
              {commitLabel}
            </AdminSubmitButton>
          </form>
        </AdminPanel>

        <PeopleWorkspace
          lang={lang}
          instanceId={instanceId}
          teams={teams.map((team) => ({ id: team.id, name: team.name, projectBriefId: team.projectBriefId }))}
          participants={serializedParticipants}
          members={serializedMembers}
          teamModeEnabled={teamModeEnabled}
        />
      </div>

      {teamModeEnabled ? (
        <TeamsSection
          lang={lang}
          copy={copy}
          instanceId={instanceId}
          state={{ teams: teams.map((team) => ({ ...team })) }}
        />
      ) : null}

      {teamModeEnabled ? (
        <TeamHistoryPanel
          lang={lang}
          copy={copy}
          instanceId={instanceId}
          history={history}
          participants={serializedParticipants}
          teams={teams.map((team) => ({ id: team.id, name: team.name }))}
        />
      ) : null}
    </div>
  );
}

function TeamHistoryPanel({
  lang,
  copy,
  instanceId,
  history,
  participants,
  teams,
}: {
  lang: UiLanguage;
  copy: Copy;
  instanceId: string;
  history: TeamCompositionHistoryEvent[];
  participants: ParticipantRecord[];
  teams: Array<{ id: string; name: string }>;
}) {
  const participantNameById = new Map(
    participants.map((participant) => [participant.id, participant.displayName]),
  );
  const teamNameById = new Map(teams.map((team) => [team.id, team.name]));
  const visibleHistory = [...history].sort((left, right) =>
    right.capturedAt.localeCompare(left.capturedAt),
  );

  const markerLabel = lang === "cs" ? "označit začátek reshuffle" : "mark reshuffle start";
  const markerDescription =
    lang === "cs"
      ? "Vložte explicitní marker, když začíná nová rotace nebo větší přeskládání týmů."
      : "Add an explicit marker when a new rotation or a larger team reshape starts.";
  const markerPlaceholder =
    lang === "cs"
      ? "Např. Rotace 2 po checkpoint review"
      : "For example: Rotation 2 after checkpoint review";
  const historyTitle = lang === "cs" ? "historie složení týmů" : "team composition history";
  const historyDescription =
    lang === "cs"
      ? "Append-only timeline toho, kdo se kdy přiřadil, přesunul nebo uvolnil zpět do poolu."
      : "Append-only timeline of who was assigned, moved, or released back to the pool.";
  const emptyLabel =
    lang === "cs"
      ? "Zatím není zaznamenaná žádná změna složení týmů."
      : "No team-composition changes have been recorded yet.";

  return (
    <AdminPanel
      eyebrow={copy.navPeople}
      title={historyTitle}
      description={historyDescription}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(20rem,0.78fr)_minmax(0,1.22fr)]">
        <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
            {markerLabel}
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            {markerDescription}
          </p>
          <form action={addTeamHistoryMarkerAction} className="mt-4 space-y-3">
            <input name="instanceId" type="hidden" value={instanceId} />
            <FieldLabel htmlFor="team-history-marker-note">
              {lang === "cs" ? "poznámka" : "note"}
            </FieldLabel>
            <textarea
              id="team-history-marker-note"
              name="note"
              rows={3}
              placeholder={markerPlaceholder}
              className={`${adminInputClassName} mt-2`}
            />
            <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`}>
              {markerLabel}
            </AdminSubmitButton>
          </form>
        </div>

        <div
          data-testid="team-history-list"
          className="space-y-3"
        >
          {visibleHistory.length === 0 ? (
            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4 text-sm text-[var(--text-muted)]">
              {emptyLabel}
            </div>
          ) : (
            visibleHistory.map((event) => {
              const participantLabel = event.participantId
                ? participantNameById.get(event.participantId) ?? event.participantId
                : null;
              const fromTeamLabel = event.fromTeamId
                ? teamNameById.get(event.fromTeamId) ?? event.fromTeamId
                : null;
              const toTeamLabel = event.toTeamId
                ? teamNameById.get(event.toTeamId) ?? event.toTeamId
                : null;
              const timeLabel = new Intl.DateTimeFormat(
                lang === "cs" ? "cs-CZ" : "en-US",
                { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" },
              ).format(new Date(event.capturedAt));

              return (
                <article
                  key={event.id}
                  className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        {event.eventType.replaceAll("_", " ")}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">
                        {describeHistoryEvent({
                          lang,
                          event,
                          participantLabel,
                          fromTeamLabel,
                          toTeamLabel,
                        })}
                      </p>
                      {event.note ? (
                        <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
                          {event.note}
                        </p>
                      ) : null}
                    </div>
                    <time
                      className="shrink-0 text-xs text-[var(--text-muted)]"
                      dateTime={event.capturedAt}
                    >
                      {timeLabel}
                    </time>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </AdminPanel>
  );
}

function describeHistoryEvent({
  lang,
  event,
  participantLabel,
  fromTeamLabel,
  toTeamLabel,
}: {
  lang: UiLanguage;
  event: TeamCompositionHistoryEvent;
  participantLabel: string | null;
  fromTeamLabel: string | null;
  toTeamLabel: string | null;
}) {
  if (event.eventType === "rotation_marker") {
    return (
      event.note ??
      (lang === "cs" ? "Začal nový blok reshuffle." : "A new reshape block started.")
    );
  }

  if (event.eventType === "assigned") {
    return lang === "cs"
      ? `${participantLabel ?? "Účastník"} přiřazen do ${toTeamLabel ?? "týmu"}.`
      : `${participantLabel ?? "Participant"} assigned to ${toTeamLabel ?? "a team"}.`;
  }

  if (event.eventType === "moved") {
    return lang === "cs"
      ? `${participantLabel ?? "Účastník"} přesunut z ${fromTeamLabel ?? "týmu"} do ${toTeamLabel ?? "jiného týmu"}.`
      : `${participantLabel ?? "Participant"} moved from ${fromTeamLabel ?? "a team"} to ${toTeamLabel ?? "another team"}.`;
  }

  return lang === "cs"
    ? `${participantLabel ?? "Účastník"} vrácen do poolu z ${fromTeamLabel ?? "týmu"}.`
    : `${participantLabel ?? "Participant"} returned to the pool from ${fromTeamLabel ?? "a team"}.`;
}
