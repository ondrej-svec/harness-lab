import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireFacilitatorPageAccess } from "@/lib/facilitator-access";
import { buildAdminInstanceHref } from "@/lib/admin-page-view-model";
import { buildSharedRoomNotes } from "@/lib/public-page-view-model";
import { buildPresenterPageState, buildPresenterRouteHref } from "@/lib/presenter-view-model";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import { getWorkshopState } from "@/lib/workshop-store";
import type { AgendaItem, PresenterBlock, PresenterScene } from "@/lib/workshop-data";
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
                <RoomScene
                  copy={copy}
                  state={state}
                  agendaItem={presenterState.activeAgendaItem}
                  nextAgendaItem={presenterNextAgendaItem}
                  scene={presenterState.selectedScene}
                />
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
  agendaItem,
  nextAgendaItem,
  scene,
}: {
  copy: (typeof adminCopy)["cs" | "en"];
  state: Awaited<ReturnType<typeof getWorkshopState>>;
  agendaItem: AgendaItem | null;
  nextAgendaItem: AgendaItem | null;
  scene: PresenterScene;
}) {
  const blocks = scene.blocks.length > 0 ? scene.blocks : buildFallbackBlocks(scene);
  const showSceneContext =
    scene.chromePreset === "checkpoint" || scene.chromePreset === "agenda" || scene.chromePreset === "participant";

  return (
    <div className="space-y-8">
      {showSceneContext ? (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.currentPhase}</p>
            <p className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">
              {agendaItem ? `${agendaItem.time} • ${agendaItem.title}` : state.workshopMeta.currentPhaseLabel}
            </p>
            {agendaItem?.roomSummary ? (
              <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">{agendaItem.roomSummary}</p>
            ) : null}
          </div>
          <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {scene.chromePreset === "participant" ? copy.presenterParticipantPreviewLabel : copy.nextUp}
            </p>
            <p className="mt-3 text-lg font-medium text-[var(--text-primary)]">
              {scene.chromePreset === "participant"
                ? scene.title
                : nextAgendaItem
                  ? `${nextAgendaItem.time} • ${nextAgendaItem.title}`
                  : copy.presenterNoSceneTitle}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              {scene.chromePreset === "checkpoint"
                ? copy.presenterCueLabel
                : scene.chromePreset === "participant"
                  ? scene.body || copy.presenterNoSceneBody
                  : copy.presenterScenesLabel}
            </p>
          </div>
        </div>
      ) : null}

      <SceneBlocks
        blocks={blocks}
        copy={copy}
        state={state}
        activeAgendaItem={agendaItem}
        nextAgendaItem={nextAgendaItem}
      />

      {scene.ctaLabel ? (
        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-soft)] px-5 py-4 text-base leading-7 text-[var(--text-primary)]">
          {scene.ctaLabel}
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

function buildFallbackBlocks(scene: PresenterScene): PresenterBlock[] {
  if (scene.sceneType === "participant-view") {
    return [
      {
        id: "participant-preview-hero",
        type: "hero",
        eyebrow: "Participant surface",
        title: scene.title,
        body: scene.body || undefined,
      },
      { id: "participant-preview", type: "participant-preview", body: scene.body },
    ];
  }

  const blocks: PresenterBlock[] = [
    {
      id: "hero",
      type: "hero",
      title: scene.title,
      body: scene.body || undefined,
    },
  ];

  if (scene.body.trim().length > 0) {
    blocks.push({ id: "body", type: "rich-text", content: scene.body });
  }

  return blocks;
}

function SceneBlocks({
  blocks,
  copy,
  state,
  activeAgendaItem,
  nextAgendaItem,
}: {
  blocks: PresenterBlock[];
  copy: (typeof adminCopy)["cs" | "en"];
  state: Awaited<ReturnType<typeof getWorkshopState>>;
  activeAgendaItem: AgendaItem | null;
  nextAgendaItem: AgendaItem | null;
}) {
  return (
    <div className="space-y-6">
      {blocks.map((block) => {
        if (block.type === "participant-preview") {
          return (
            <ParticipantPreview
              key={block.id}
              copy={copy}
              state={state}
              activeAgendaItem={activeAgendaItem}
              nextAgendaItem={nextAgendaItem}
              selectedSceneBody={block.body ?? activeAgendaItem?.roomSummary ?? ""}
              sharedNotes={buildSharedRoomNotes(state.ticker)}
            />
          );
        }

        if (block.type === "hero") {
          return (
            <div key={block.id}>
              {block.eyebrow ? (
                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{block.eyebrow}</p>
              ) : (
                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{copy.presenterCueLabel}</p>
              )}
              <h2 className="mt-4 max-w-5xl text-4xl font-semibold leading-[0.95] tracking-[-0.05em] text-[var(--text-primary)] sm:text-6xl">
                {block.title}
              </h2>
              {block.body ? (
                <p className="mt-6 max-w-4xl text-lg leading-8 text-[var(--text-secondary)] sm:text-xl">{block.body}</p>
              ) : null}
            </div>
          );
        }

        if (block.type === "rich-text") {
          return (
            <div key={block.id} className="max-w-4xl whitespace-pre-line text-lg leading-8 text-[var(--text-secondary)]">
              {block.content}
            </div>
          );
        }

        if (block.type === "bullet-list") {
          return (
            <BlockCard key={block.id} title={block.title}>
              <ul className="space-y-3 text-base leading-7 text-[var(--text-secondary)]">
                {block.items.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </BlockCard>
          );
        }

        if (block.type === "quote") {
          return (
            <div key={block.id} className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-soft)] px-6 py-6">
              <blockquote className="text-2xl font-medium leading-10 text-[var(--text-primary)]">“{block.quote}”</blockquote>
              {block.attribution ? (
                <p className="mt-4 text-sm text-[var(--text-muted)]">{block.attribution}</p>
              ) : null}
            </div>
          );
        }

        if (block.type === "steps") {
          return (
            <BlockCard key={block.id} title={block.title}>
              <div className="space-y-4">
                {block.items.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="grid gap-2 md:grid-cols-[2.5rem_minmax(0,1fr)]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-sm font-medium text-[var(--text-primary)]">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-lg font-medium text-[var(--text-primary)]">{item.title}</p>
                      {item.body ? <p className="mt-1 text-base leading-7 text-[var(--text-secondary)]">{item.body}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </BlockCard>
          );
        }

        if (block.type === "checklist") {
          return (
            <BlockCard key={block.id} title={block.title}>
              <div className="space-y-3">
                {block.items.map((item) => (
                  <div key={item} className="flex gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-3">
                    <span className="mt-1 h-3 w-3 rounded-full border border-[var(--border-strong)]" />
                    <p className="text-base leading-7 text-[var(--text-secondary)]">{item}</p>
                  </div>
                ))}
              </div>
            </BlockCard>
          );
        }

        if (block.type === "image") {
          return (
            <figure key={block.id} className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={block.src} alt={block.alt} className="w-full rounded-[20px] object-cover" />
              {block.caption ? <figcaption className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{block.caption}</figcaption> : null}
            </figure>
          );
        }

        if (block.type === "link-list") {
          return (
            <BlockCard key={block.id} title={block.title}>
              <div className="space-y-3">
                {block.items.map((item) => (
                  <div key={`${item.label}-${item.href ?? ""}`} className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-3">
                    <p className="text-base font-medium text-[var(--text-primary)]">{item.label}</p>
                    {item.description ? <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{item.description}</p> : null}
                  </div>
                ))}
              </div>
            </BlockCard>
          );
        }

        return (
          <BlockCard key={block.id} title={block.title}>
            <p className="text-base leading-7 text-[var(--text-secondary)]">{block.body}</p>
          </BlockCard>
        );
      })}
    </div>
  );
}

function BlockCard({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-soft)] p-6">
      {title ? <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{title}</p> : null}
      <div className={title ? "mt-4" : ""}>{children}</div>
    </div>
  );
}
