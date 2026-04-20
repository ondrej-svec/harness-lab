import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getParticipantSessionFromCookieStore,
  getParticipantTeamLookup,
  getParticipantSessionCookieOptions,
  participantSessionCookieName,
  revokeParticipantSession,
} from "@/lib/event-access";
import { getParticipantRepository } from "@/lib/participant-repository";
import { getTeamMemberRepository } from "@/lib/team-member-repository";
import {
  buildParticipantReferenceGroups,
  buildWorkshopContextLine,
  deriveHomePageState,
} from "@/lib/public-page-view-model";
import { getWorkshopState } from "@/lib/workshop-store";
import { publicCopy, resolveUiLanguage, withLang } from "@/lib/ui-language";
import { ParticipantIdentifyPrompt } from "../components/participant-identify-prompt";
import { ParticipantRoomSurface } from "../components/participant-room-surface";
import { SiteHeader } from "../components/site-header";
import { ParticipantLiveRefresh } from "../components/participant-live-refresh";

export const dynamic = "force-dynamic";

async function logoutAction(formData: FormData) {
  "use server";
  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));

  const cookieStore = await cookies();
  const token = cookieStore.get(participantSessionCookieName)?.value;
  await revokeParticipantSession(token);
  cookieStore.set(participantSessionCookieName, "", getParticipantSessionCookieOptions(new Date(0)));

  redirect(withLang("/", lang));
}

export default async function ParticipantPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const params = await searchParams;
  const lang = resolveUiLanguage(params?.lang);
  const copy = publicCopy[lang];
  const participantSession = await getParticipantSessionFromCookieStore();

  if (!participantSession) {
    redirect(withLang("/", lang));
  }

  // Session exists but no bound Participant — show the one-field self-
  // identify prompt and nothing else. See docs/previews/2026-04-16-
  // participant-identify-flow.md for the UX contract.
  if (!participantSession.participantId) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,var(--ambient-left),transparent_28%),linear-gradient(180deg,var(--surface),var(--surface-elevated))] text-[var(--text-primary)]">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8 sm:py-7">
          <SiteHeader
            isParticipant
            lang={lang}
            copy={copy}
            csHref={withLang("/participant", "cs")}
            enHref={withLang("/participant", "en")}
          />
          <ParticipantIdentifyPrompt lang={lang} />
        </div>
      </main>
    );
  }

  const state = await getWorkshopState(participantSession.instanceId);
  const participantTeams = await getParticipantTeamLookup(participantSession.instanceId);
  const participantTeamAssignment = participantSession.participantId
    ? await getTeamMemberRepository().findMemberByParticipant(participantSession.instanceId, participantSession.participantId)
    : null;
  const activeParticipant = await getParticipantRepository().findParticipant(
    participantSession.instanceId,
    participantSession.participantId,
  );
  const activeParticipantTeam = participantTeamAssignment
    ? state.teams.find((team) => team.id === participantTeamAssignment.teamId) ?? null
    : null;
  const { currentAgendaItem, nextAgendaItem, participantNotes, rotationRevealed, liveMoment, workshopMeta } = deriveHomePageState(state);
  const workshopContextLine = buildWorkshopContextLine(workshopMeta);
  const referenceGroups = buildParticipantReferenceGroups({
    lang,
    setupPaths: state.setupPaths,
  });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,var(--ambient-left),transparent_28%),linear-gradient(180deg,var(--surface),var(--surface-elevated))] text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8 sm:py-7">
        <SiteHeader
          isParticipant
          lang={lang}
          copy={copy}
          csHref={withLang("/participant", "cs")}
          enHref={withLang("/participant", "en")}
        />

        <ParticipantLiveRefresh
          currentFingerprint={[
            liveMoment.agendaItemId ?? "",
            liveMoment.roomSceneId ?? "",
            liveMoment.participantMomentId ?? "",
            liveMoment.activePollId ?? "",
          ].join(":")}
        />
        <ParticipantRoomSurface
          copy={copy}
          lang={lang}
          workshopContextLine={workshopContextLine}
          currentAgendaItem={currentAgendaItem}
          nextAgendaItem={nextAgendaItem}
          liveMoment={liveMoment}
          participantSession={participantSession}
          participantTeams={participantTeams}
          activeParticipantTeam={activeParticipantTeam}
          activeParticipant={activeParticipant}
          briefs={state.briefs}
          challenges={state.challenges}
          publicNotes={participantNotes}
          agenda={state.agenda}
          referenceGroups={referenceGroups}
          rotationRevealed={rotationRevealed}
          logoutAction={logoutAction}
        />
      </div>
    </main>
  );
}
