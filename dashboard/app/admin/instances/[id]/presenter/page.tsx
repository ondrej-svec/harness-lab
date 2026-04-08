import Link from "next/link";
import { redirect } from "next/navigation";
import { requireFacilitatorPageAccess } from "@/lib/facilitator-access";
import { buildAdminInstanceHref } from "@/lib/admin-page-view-model";
import { buildSharedRoomNotes } from "@/lib/public-page-view-model";
import { buildPresenterPageState, buildPresenterRouteHref } from "@/lib/presenter-view-model";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import { getWorkshopState } from "@/lib/workshop-store";
import { adminCopy, resolveUiLanguage } from "@/lib/ui-language";

export const dynamic = "force-dynamic";

export default async function PresenterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ agendaItem?: string; scene?: string; lang?: string }>;
}) {
  const routeParams = await params;
  const query = await searchParams;
  const lang = resolveUiLanguage(query?.lang);
  const copy = adminCopy[lang];
  const instanceId = routeParams.id;
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
  const presenterAgendaIndex = presenterState.activeAgendaItem
    ? state.agenda.findIndex((item) => item.id === presenterState.activeAgendaItem?.id)
    : -1;
  const presenterNextAgendaItem = presenterAgendaIndex >= 0 ? state.agenda[presenterAgendaIndex + 1] ?? null : null;
  const sharedNotes = buildSharedRoomNotes(state.ticker);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,var(--ambient-right),transparent_26%),linear-gradient(180deg,var(--surface-admin),var(--surface-elevated))] px-5 py-5 text-[var(--text-primary)] sm:px-8 sm:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-[30px] border border-[var(--border)] bg-[var(--surface-panel)] px-6 py-5 shadow-[var(--shadow-soft)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{copy.presenterPageEyebrow}</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] sm:text-5xl">
                {presenterState.activeAgendaItem?.title ?? state.workshopMeta.currentPhaseLabel}
              </h1>
              {presenterState.selectedScene ? (
                <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">{presenterState.selectedScene.label}</p>
              ) : (
                <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">{copy.presenterNoSceneBody}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                href={buildAdminInstanceHref({ lang, instanceId })}
              >
                {copy.presenterBack}
              </Link>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-soft)]">
            <p className="px-2 text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{copy.presenterAgendaLabel}</p>
            <nav className="mt-3 flex flex-col gap-2">
              {presenterState.agendaItems.map((item) => {
                const defaultScene =
                  item.presenterScenes.find((scene) => scene.id === item.defaultPresenterSceneId && scene.enabled) ??
                  item.presenterScenes.find((scene) => scene.enabled);
                return (
                  <Link
                    key={item.id}
                    href={buildPresenterRouteHref({
                      lang,
                      instanceId,
                      agendaItemId: item.id,
                      sceneId: defaultScene?.id ?? null,
                    })}
                    className={`rounded-[20px] border px-3 py-3 text-sm transition ${
                      presenterState.activeAgendaItem?.id === item.id
                        ? "border-[var(--border-strong)] bg-[var(--surface-soft)] text-[var(--text-primary)]"
                        : "border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{item.time}</span>
                    <span className="mt-1 block font-medium">{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          <section className="space-y-6">
            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-soft)] sm:p-8">
              {presenterState.selectedScene ? (
                presenterState.selectedScene.sceneType === "participant-view" ? (
                  <ParticipantPreview
                    copy={copy}
                    state={state}
                    activeAgendaItem={presenterState.activeAgendaItem}
                    nextAgendaItem={presenterNextAgendaItem}
                    selectedSceneBody={presenterState.selectedScene.body}
                    sharedNotes={sharedNotes}
                  />
                ) : (
                  <RoomScene copy={copy} state={state} title={presenterState.selectedScene.title} body={presenterState.selectedScene.body} ctaLabel={presenterState.selectedScene.ctaLabel} />
                )
              ) : (
                <EmptyScene copy={copy} />
              )}
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-soft)]">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{copy.presenterScenesLabel}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {(presenterState.activeAgendaItem?.presenterScenes ?? []).map((scene) => (
                  scene.enabled ? (
                    <Link
                      key={scene.id}
                      href={buildPresenterRouteHref({
                        lang,
                        instanceId,
                        agendaItemId: presenterState.activeAgendaItem?.id ?? null,
                        sceneId: scene.id,
                      })}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        presenterState.selectedScene?.id === scene.id
                          ? "border-[var(--border-strong)] bg-[var(--surface-soft)] text-[var(--text-primary)]"
                          : "border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {scene.label}
                    </Link>
                  ) : (
                    <span
                      key={scene.id}
                      className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)]"
                    >
                      {scene.label} • {copy.presenterSceneDisabled}
                    </span>
                  )
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function RoomScene({
  copy,
  state,
  title,
  body,
  ctaLabel,
}: {
  copy: (typeof adminCopy)["cs" | "en"];
  state: Awaited<ReturnType<typeof getWorkshopState>>;
  title: string;
  body: string;
  ctaLabel: string | null;
}) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{copy.presenterCueLabel}</p>
        <h2 className="mt-4 max-w-4xl text-4xl font-semibold leading-[0.95] tracking-[-0.05em] text-[var(--text-primary)] sm:text-6xl">
          {title}
        </h2>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--text-secondary)] sm:text-xl">{body}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile label={copy.currentPhase} value={state.workshopMeta.currentPhaseLabel} />
        <MetricTile label={copy.rotation} value={state.rotation.revealed ? copy.rotationUnlocked : copy.rotationHidden} />
        <MetricTile label={copy.teams} value={`${state.teams.length}`} />
      </div>

      {ctaLabel ? (
        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-soft)] px-5 py-4 text-base leading-7 text-[var(--text-primary)]">
          {ctaLabel}
        </div>
      ) : null}
    </div>
  );
}

function ParticipantPreview({
  copy,
  state,
  activeAgendaItem,
  nextAgendaItem,
  selectedSceneBody,
  sharedNotes,
}: {
  copy: (typeof adminCopy)["cs" | "en"];
  state: Awaited<ReturnType<typeof getWorkshopState>>;
  activeAgendaItem: Awaited<ReturnType<typeof getWorkshopState>>["agenda"][number] | null;
  nextAgendaItem: Awaited<ReturnType<typeof getWorkshopState>>["agenda"][number] | null;
  selectedSceneBody: string;
  sharedNotes: string[];
}) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{copy.presenterParticipantPreviewLabel}</p>
        <h2 className="mt-4 text-4xl font-semibold leading-[0.95] tracking-[-0.05em] text-[var(--text-primary)] sm:text-6xl">
          {activeAgendaItem?.title ?? state.workshopMeta.currentPhaseLabel}
        </h2>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--text-secondary)] sm:text-xl">{selectedSceneBody}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.currentPhase}</p>
          <p className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">
            {`${activeAgendaItem?.time ?? ""}${activeAgendaItem ? " • " : ""}${activeAgendaItem?.title ?? state.workshopMeta.currentPhaseLabel}`.trim()}
          </p>
          {activeAgendaItem?.description ? (
            <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">{activeAgendaItem.description}</p>
          ) : null}
          {nextAgendaItem ? (
            <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
              {copy.nextUp}: {nextAgendaItem.time} • {nextAgendaItem.title}
            </p>
          ) : null}
        </div>

        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.presenterScenesLabel}</p>
          <div className="mt-4 space-y-3">
            {sharedNotes.slice(0, 3).map((note) => (
              <div key={note} className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
                {note}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.teams.slice(0, 3).map((team) => (
          <article key={team.id} className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{team.id}</p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{team.name}</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">{team.city}</p>
            <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)] whitespace-pre-line">{team.checkpoint}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function EmptyScene({ copy }: { copy: (typeof adminCopy)["cs" | "en"] }) {
  return (
    <div className="space-y-4">
      <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{copy.presenterPageEyebrow}</p>
      <h2 className="text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">{copy.presenterNoSceneTitle}</h2>
      <p className="max-w-2xl text-base leading-7 text-[var(--text-secondary)]">{copy.presenterNoSceneBody}</p>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-3 text-lg font-medium text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
