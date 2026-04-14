import { redirect } from "next/navigation";
import { requireFacilitatorPageAccess } from "@/lib/facilitator-access";
import { getPresenterScenesBySurface } from "@/lib/presenter-scenes";
import { buildPresenterPageState, buildPresenterRouteHref } from "@/lib/presenter-view-model";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import { getWorkshopState } from "@/lib/workshop-store";
import { adminCopy, resolveUiLanguage, withLang } from "@/lib/ui-language";
import { SceneBlocks, SceneCta, TeamTrailScene, buildFallbackBlocks } from "../../presenter/page";
import { PresenterShell, type PresenterSlide } from "../../_components/presenter-shell";
import { SceneMorphOverlay } from "../../_components/scene-morph-overlay";
import type { SceneRailItem } from "../../_components/scene-rail";
import { ViewTransitionCard } from "../../_components/view-transition-card";

export const dynamic = "force-dynamic";

export default async function InterceptedPresenterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ agendaItem?: string; scene?: string; lang?: string }>;
}) {
  const { id: instanceId } = await params;
  const query = await searchParams;
  const lang = resolveUiLanguage(query?.lang);
  const copy = adminCopy[lang];

  const instance = await getWorkshopInstanceRepository().getInstance(instanceId);
  if (!instance) {
    redirect("/admin");
  }

  await requireFacilitatorPageAccess(instanceId);

  const state = await getWorkshopState(instanceId);
  const teams = state.teams;
  const presenterState = buildPresenterPageState({
    state,
    requestedAgendaItemId: query?.agendaItem ?? null,
    requestedSceneId: query?.scene ?? null,
  });

  const activeAgendaItem = presenterState.activeAgendaItem;
  const selectedScene = presenterState.selectedScene;

  if (!activeAgendaItem || !selectedScene) {
    redirect(withLang(`/admin/instances/${instanceId}`, lang));
  }

  const surface = selectedScene.surface ?? "room";
  const scenePack = [...getPresenterScenesBySurface(activeAgendaItem, surface)]
    .filter((scene) => scene.enabled !== false || scene.id === selectedScene.id)
    .sort((left, right) => left.order - right.order);

  const closeHref = withLang(`/admin/instances/${instanceId}`, lang);

  // Cross-agenda navigation hrefs so the carousel can fall through to
  // a phase change when the user hits the edge of the current pack.
  const agendaIndex = state.agenda.findIndex((item) => item.id === activeAgendaItem.id);
  const previousAgendaItem = agendaIndex > 0 ? state.agenda[agendaIndex - 1] ?? null : null;
  const nextAgendaItem =
    agendaIndex >= 0 && agendaIndex < state.agenda.length - 1
      ? state.agenda[agendaIndex + 1] ?? null
      : null;

  // Pre-render every scene as a React element. The shell handles
  // navigation locally via state — no server round trip per swipe /
  // arrow / wheel / rail click.
  const slides: PresenterSlide[] = scenePack.map((scene) => {
    const isTeamTrail = scene.chromePreset === "team-trail";
    const blocks = scene.blocks.length > 0 ? scene.blocks : buildFallbackBlocks(scene);
    const morphName = `scene-${activeAgendaItem.id}-${scene.id}`;
    return {
      id: scene.id,
      content: (
        <main className="relative flex h-full min-h-screen w-full flex-col bg-[radial-gradient(circle_at_top_left,var(--ambient-right),transparent_24%),radial-gradient(circle_at_bottom_right,var(--ambient-left),transparent_22%),linear-gradient(180deg,var(--surface-admin),var(--surface-elevated))] px-6 py-12 text-[var(--text-primary)] sm:px-12 lg:px-20">
          <div className="mx-auto flex w-full max-w-[100rem] flex-1 flex-col justify-center">
            <ViewTransitionCard name={morphName}>
              {isTeamTrail ? (
                <TeamTrailScene
                  copy={copy}
                  scene={scene}
                  teams={teams}
                  lang={lang}
                  instanceId={instanceId}
                  agendaItem={activeAgendaItem}
                />
              ) : (
                <article className="space-y-10">
                  <header>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                      {activeAgendaItem.title} · {copy.presenterCardTitle}
                    </p>
                    <h1 className="mt-4 text-4xl font-medium leading-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
                      {scene.label}
                    </h1>
                  </header>
                  <SceneBlocks
                    blocks={blocks}
                    copy={copy}
                    activeAgendaItem={activeAgendaItem}
                    participantCueFirst={scene.chromePreset === "participant"}
                  />
                  {scene.ctaLabel ? (
                    <SceneCta href={scene.ctaHref} label={scene.ctaLabel} openLabel={copy.openLinkLabel} />
                  ) : null}
                </article>
              )}
            </ViewTransitionCard>
          </div>
        </main>
      ),
    };
  });

  const railItems: SceneRailItem[] = scenePack.map((scene) => ({
    id: scene.id,
    label: scene.label,
    href: buildPresenterRouteHref({
      lang,
      instanceId,
      agendaItemId: activeAgendaItem.id,
      sceneId: scene.id,
    }),
  }));

  return (
    <SceneMorphOverlay closeHref={closeHref} previousHref={null} nextHref={null}>
      <PresenterShell
        slides={slides}
        railItems={railItems}
        initialSceneId={selectedScene.id}
        instanceId={instanceId}
        lang={lang}
        previousAgendaItemId={previousAgendaItem?.id ?? null}
        nextAgendaItemId={nextAgendaItem?.id ?? null}
        previousAgendaLabel={previousAgendaItem ? `${previousAgendaItem.time} · ${previousAgendaItem.title}` : null}
        nextAgendaLabel={nextAgendaItem ? `${nextAgendaItem.time} · ${nextAgendaItem.title}` : null}
      />
    </SceneMorphOverlay>
  );
}
