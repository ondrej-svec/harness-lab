import { AdminSubmitButton } from "@/app/admin/admin-submit-button";
import {
  AdminPanel,
  adminInputClassName,
  adminPrimaryButtonClassName,
} from "../../../../admin-ui";
import { getParticipantRepository } from "@/lib/participant-repository";
import { getTeamMemberRepository } from "@/lib/team-member-repository";
import type { ParticipantRecord, TeamMemberRecord } from "@/lib/runtime-contracts";
import type { Team } from "@/lib/workshop-data";
import type { adminCopy, UiLanguage } from "@/lib/ui-language";
import { PeopleWorkspace } from "./people-section-client";
import { PeopleRandomize } from "./people-randomize";
import {
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
  teams,
}: {
  lang: UiLanguage;
  /** @deprecated — retained for prop parity; kept for future copy-driven migration. */
  copy?: Copy;
  instanceId: string;
  teams: readonly Team[];
}) {
  const [participants, members] = await Promise.all([
    getParticipantRepository().listParticipants(instanceId),
    getTeamMemberRepository().listMembers(instanceId),
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
      <PeopleRandomize
        lang={lang}
        instanceId={instanceId}
        existingTeamCount={teams.length}
        participantCount={serializedParticipants.filter((p) => p.archivedAt === null).length}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(22rem,0.9fr)_minmax(0,1.1fr)]">
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
        />
      </div>
    </div>
  );
}
