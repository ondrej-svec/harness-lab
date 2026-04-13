import { redirect } from "next/navigation";
import { requireFacilitatorPageAccess } from "@/lib/facilitator-access";
import { getPresenterScenesBySurface } from "@/lib/presenter-scenes";
import { buildPresenterPageState, buildPresenterRouteHref } from "@/lib/presenter-view-model";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import { getWorkshopState } from "@/lib/workshop-store";
import { adminCopy, resolveUiLanguage, withLang } from "@/lib/ui-language";
import { SceneMorphOverlay } from "../../_components/scene-morph-overlay";
import { SceneRail, type SceneRailItem } from "../../_components/scene-rail";
import { SceneSwiper } from "../../_components/scene-swiper";
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

  const selectedIndex = scenePack.findIndex((scene) => scene.id === selectedScene.id);
  const previousScene = selectedIndex > 0 ? scenePack[selectedIndex - 1] ?? null : null;
  const nextScene = selectedIndex >= 0 ? scenePack[selectedIndex + 1] ?? null : null;

  const hrefForScene = (sceneId: string) =>
    buildPresenterRouteHref({ lang, instanceId, agendaItemId: activeAgendaItem.id, sceneId });

  const railItems: SceneRailItem[] = scenePack.map((scene) => ({
    id: scene.id,
    label: scene.label,
    href: hrefForScene(scene.id),
  }));

  const closeHref = withLang(`/admin/instances/${instanceId}`, lang);
  const morphName = `scene-${activeAgendaItem.id}-${selectedScene.id}`;

  return (
    <SceneMorphOverlay closeHref={closeHref}>
      <SceneSwiper
        previousHref={previousScene ? hrefForScene(previousScene.id) : null}
        nextHref={nextScene ? hrefForScene(nextScene.id) : null}
      >
        <main className="flex h-full min-h-screen w-full items-center justify-center px-6 py-12 sm:px-12 lg:px-20">
          <ViewTransitionCard name={morphName}>
            <article className="max-w-[70rem] rounded-[32px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card-strong-top),var(--card-strong-bottom))] p-10 shadow-[0_30px_80px_rgba(28,25,23,0.25)] sm:p-14">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                {activeAgendaItem.title} · {copy.presenterCardTitle}
              </p>
              <h1 className="mt-4 text-4xl font-medium leading-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
                {selectedScene.label}
              </h1>
              {selectedScene.body ? (
                <p className="mt-6 max-w-[52rem] text-lg leading-8 text-[var(--text-secondary)] sm:text-xl">
                  {selectedScene.body}
                </p>
              ) : null}
              <p className="mt-10 text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                {selectedIndex + 1} / {scenePack.length}
              </p>
            </article>
          </ViewTransitionCard>
        </main>
      </SceneSwiper>
      <SceneRail items={railItems} activeSceneId={selectedScene.id} />
    </SceneMorphOverlay>
  );
}
