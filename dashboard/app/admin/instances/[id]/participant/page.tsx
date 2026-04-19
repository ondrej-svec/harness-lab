import { redirect } from "next/navigation";
import { ParticipantRoomSurface } from "@/app/components/participant-room-surface";
import { SiteHeader } from "@/app/components/site-header";
import { requireFacilitatorPageAccess } from "@/lib/facilitator-access";
import { deriveHomePageState } from "@/lib/public-page-view-model";
import { publicCopy, resolveUiLanguage, withLang } from "@/lib/ui-language";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import { getWorkshopState } from "@/lib/workshop-store";

export const dynamic = "force-dynamic";

function buildParticipantMirrorSession(instanceId: string) {
  const now = Date.now();

  return {
    instanceId,
    lastValidatedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 12 * 60 * 60 * 1000).toISOString(),
    absoluteExpiresAt: new Date(now + 16 * 60 * 60 * 1000).toISOString(),
  };
}

export default async function AdminParticipantMirrorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string }>;
}) {
  const routeParams = await params;
  const query = await searchParams;
  const lang = resolveUiLanguage(query?.lang);
  const copy = publicCopy[lang];
  const instanceId = routeParams.id;
  const instance = await getWorkshopInstanceRepository().getInstance(instanceId);

  if (!instance) {
    redirect(withLang("/admin", lang));
  }

  await requireFacilitatorPageAccess(instanceId);

  const state = await getWorkshopState(instanceId);
  const { currentAgendaItem, nextAgendaItem, participantNotes, rotationRevealed } = deriveHomePageState(state);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,var(--ambient-left),transparent_28%),linear-gradient(180deg,var(--surface),var(--surface-elevated))] text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8 sm:py-7">
        <SiteHeader
          isParticipant
          lang={lang}
          copy={copy}
          csHref={`/admin/instances/${instanceId}/participant`}
          enHref={`/admin/instances/${instanceId}/participant?lang=en`}
        />
        <ParticipantRoomSurface
          copy={copy}
          lang={lang}
          workshopContextLine=""
          currentAgendaItem={currentAgendaItem}
          nextAgendaItem={nextAgendaItem}
          participantSession={buildParticipantMirrorSession(instanceId)}
          participantTeams={{
            items: state.teams.map((team) => ({
              id: team.id,
              name: team.name,
              city: team.city,
              members: team.members,
              repoUrl: team.repoUrl,
              checkIns: team.checkIns,
              projectBriefId: team.projectBriefId,
              anchor: team.anchor,
            })),
          }}
          activeParticipantTeam={state.teams[0] ?? null}
          briefs={state.briefs}
          challenges={state.challenges}
          publicNotes={participantNotes}
          rotationRevealed={rotationRevealed}
        />
      </div>
    </main>
  );
}
