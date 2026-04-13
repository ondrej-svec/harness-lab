import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminRouteLink } from "@/app/admin/admin-route-link";
import { requireFacilitatorPageAccess } from "@/lib/facilitator-access";
import { getPresenterScenesBySurface } from "@/lib/presenter-scenes";
import { buildPresenterPageState, buildPresenterRouteHref } from "@/lib/presenter-view-model";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import { getWorkshopState } from "@/lib/workshop-store";
import type { AgendaItem, PresenterBlock, PresenterScene, Team } from "@/lib/workshop-data";
import { adminCopy, resolveUiLanguage, type UiLanguage } from "@/lib/ui-language";

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
  const teams = state.teams;
  const presenterState = buildPresenterPageState({
    state,
    requestedAgendaItemId: query?.agendaItem ?? null,
    requestedSceneId: query?.scene ?? null,
  });
  const presenterSceneSurface = presenterState.selectedScene?.surface ?? "room";
  const presenterScenePack = [...getPresenterScenesBySurface(presenterState.activeAgendaItem, presenterSceneSurface)]
    .filter((scene) => scene.enabled !== false || scene.id === presenterState.selectedScene?.id)
    .sort((left, right) => left.order - right.order);
  const selectedSceneIndex = presenterScenePack.findIndex((scene) => scene.id === presenterState.selectedScene?.id);
  const previousScene = selectedSceneIndex > 0 ? presenterScenePack[selectedSceneIndex - 1] ?? null : null;
  const nextScene = selectedSceneIndex >= 0 ? presenterScenePack[selectedSceneIndex + 1] ?? null : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,var(--ambient-right),transparent_24%),radial-gradient(circle_at_bottom_right,var(--ambient-left),transparent_22%),linear-gradient(180deg,var(--surface-admin),var(--surface-elevated))] text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-screen max-w-[100rem] flex-col justify-center px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
        {presenterState.selectedScene ? (
          presenterState.selectedScene.chromePreset === "team-trail" ? (
            <TeamTrailScene
              copy={copy}
              scene={presenterState.selectedScene}
              teams={teams}
              lang={lang}
              instanceId={instanceId}
              agendaItem={presenterState.activeAgendaItem}
              previousScene={previousScene}
              nextScene={nextScene}
              sceneIndex={selectedSceneIndex}
              sceneCount={presenterScenePack.length}
            />
          ) : (
            <RoomScene
              copy={copy}
              agendaItem={presenterState.activeAgendaItem}
              scene={presenterState.selectedScene}
              lang={lang}
              instanceId={instanceId}
              previousScene={previousScene}
              nextScene={nextScene}
              sceneIndex={selectedSceneIndex}
              sceneCount={presenterScenePack.length}
            />
          )
        ) : (
          <EmptyScene copy={copy} />
        )}
      </div>
    </main>
  );
}

function RoomScene({
  copy,
  agendaItem,
  scene,
  lang,
  instanceId,
  previousScene,
  nextScene,
  sceneIndex,
  sceneCount,
}: {
  copy: (typeof adminCopy)["cs" | "en"];
  agendaItem: AgendaItem | null;
  scene: PresenterScene;
  lang: UiLanguage;
  instanceId: string;
  previousScene: PresenterScene | null;
  nextScene: PresenterScene | null;
  sceneIndex: number;
  sceneCount: number;
}) {
  const blocks = scene.blocks.length > 0 ? scene.blocks : buildFallbackBlocks(scene);

  return (
    <div className="space-y-10">
      <SceneBlocks
        blocks={blocks}
        copy={copy}
        activeAgendaItem={agendaItem}
        participantCueFirst={scene.chromePreset === "participant"}
      />

      {scene.ctaLabel ? <SceneCta href={scene.ctaHref} label={scene.ctaLabel} openLabel={copy.openLinkLabel} /> : null}

      <ScenePager
        copy={copy}
        lang={lang}
        instanceId={instanceId}
        agendaItemId={agendaItem?.id ?? null}
        previousScene={previousScene}
        nextScene={nextScene}
        currentSceneLabel={scene.label}
        sceneIndex={sceneIndex}
        sceneCount={sceneCount}
      />
    </div>
  );
}

export function TeamTrailScene({
  copy,
  scene,
  teams,
  lang,
  instanceId,
  agendaItem,
  previousScene,
  nextScene,
  sceneIndex,
  sceneCount,
}: {
  copy: (typeof adminCopy)["cs" | "en"];
  scene: PresenterScene;
  teams: Team[];
  lang: UiLanguage;
  instanceId: string;
  agendaItem: AgendaItem | null;
  previousScene: PresenterScene | null;
  nextScene: PresenterScene | null;
  sceneIndex: number;
  sceneCount: number;
}) {
  const heroBlock = scene.blocks.find((block): block is Extract<PresenterBlock, { type: "hero" }> => block.type === "hero");
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        {heroBlock?.eyebrow ? (
          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{heroBlock.eyebrow}</p>
        ) : null}
        <h2 className="max-w-5xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--text-primary)] sm:text-5xl">
          {heroBlock?.title ?? scene.title}
        </h2>
        {heroBlock?.body ? (
          <p className="max-w-4xl text-lg leading-8 text-[var(--text-secondary)]">{heroBlock.body}</p>
        ) : null}
      </div>
      {teams.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => (
            <article
              key={team.id}
              className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-soft)] backdrop-blur"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-xl font-medium text-[var(--text-primary)]">{team.name}</h3>
                {team.anchor ? (
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">{team.anchor}</span>
                ) : null}
              </div>
              {team.checkIns.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {team.checkIns.map((entry) => (
                    <li
                      key={`${entry.phaseId}-${entry.writtenAt}`}
                      className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
                    >
                      <p className="whitespace-pre-line text-sm leading-6 text-[var(--text-secondary)]">{entry.content}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        {entry.phaseId}
                        {entry.writtenBy ? ` · ${entry.writtenBy}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">—</p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-6 text-[var(--text-muted)]">—</p>
      )}
      <ScenePager
        copy={copy}
        lang={lang}
        instanceId={instanceId}
        agendaItemId={agendaItem?.id ?? null}
        previousScene={previousScene}
        nextScene={nextScene}
        currentSceneLabel={scene.label}
        sceneIndex={sceneIndex}
        sceneCount={sceneCount}
      />
    </div>
  );
}

function ParticipantPreview({
  copy,
  activeAgendaItem,
  selectedSceneBody,
}: {
  copy: (typeof adminCopy)["cs" | "en"];
  activeAgendaItem: Awaited<ReturnType<typeof getWorkshopState>>["agenda"][number] | null;
  selectedSceneBody: string;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-soft)] px-6 py-6 sm:px-8 sm:py-8">
      <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{copy.presenterParticipantPreviewLabel}</p>
      <div className="mt-5 max-w-5xl">
        {activeAgendaItem ? (
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
            {activeAgendaItem.time} • {activeAgendaItem.title}
          </p>
        ) : null}
        <p className="mt-4 text-2xl font-medium leading-10 text-[var(--text-primary)] sm:text-[2.5rem] sm:leading-[1.15]">
          {selectedSceneBody}
        </p>
      </div>
    </div>
  );
}

function EmptyScene({ copy }: { copy: (typeof adminCopy)["cs" | "en"] }) {
  return (
    <div className="space-y-4 rounded-[32px] border border-[var(--border)] bg-[var(--surface-panel)] px-6 py-8 shadow-[var(--shadow-soft)] sm:px-8 sm:py-10">
      <h2 className="text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] sm:text-5xl">{copy.presenterNoSceneTitle}</h2>
      <p className="max-w-3xl text-base leading-7 text-[var(--text-secondary)]">{copy.presenterNoSceneBody}</p>
    </div>
  );
}

export function buildFallbackBlocks(scene: PresenterScene): PresenterBlock[] {
  if (scene.sceneType === "participant-view") {
    return [
      {
        id: "participant-preview-hero",
        type: "hero",
        eyebrow: undefined,
        title: scene.title,
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

export function SceneBlocks({
  blocks,
  copy,
  activeAgendaItem,
  participantCueFirst,
}: {
  blocks: PresenterBlock[];
  copy: (typeof adminCopy)["cs" | "en"];
  activeAgendaItem: AgendaItem | null;
  participantCueFirst?: boolean;
}) {
  const hasParticipantPreview = participantCueFirst && blocks.some((block) => block.type === "participant-preview");

  return (
    <div className="space-y-6">
      {blocks.map((block) => {
        if (block.type === "participant-preview") {
          return (
            <ParticipantPreview
              key={block.id}
              copy={copy}
              activeAgendaItem={activeAgendaItem}
              selectedSceneBody={block.body ?? activeAgendaItem?.roomSummary ?? ""}
            />
          );
        }

        if (block.type === "hero") {
          const heroBody = hasParticipantPreview ? null : block.body ?? null;
          return (
            <div key={block.id}>
              {block.eyebrow ? <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{block.eyebrow}</p> : null}
              <h2 className="mt-4 max-w-5xl text-4xl font-semibold leading-[0.95] tracking-[-0.05em] text-[var(--text-primary)] sm:text-6xl">
                {block.title}
              </h2>
              {heroBody ? (
                <p className="mt-6 max-w-4xl text-lg leading-8 text-[var(--text-secondary)] sm:text-xl">{heroBody}</p>
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
          const attribution = block.attribution?.trim() || copy.quoteSourceUnknown;
          return (
            <figure
              key={block.id}
              className="max-w-4xl border-l-[4px] border-[var(--text-primary)] pl-6 py-2"
            >
              <blockquote className="text-2xl font-medium italic leading-10 text-[var(--text-primary)]">
                “{block.quote}”
              </blockquote>
              <figcaption className="mt-4 text-sm text-[var(--text-muted)]">— {attribution}</figcaption>
            </figure>
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
                  <div key={item} className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-3">
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
              {block.caption || block.sourceLabel ? (
                <figcaption className="mt-3 space-y-2">
                  {block.caption ? <p className="text-sm leading-6 text-[var(--text-secondary)]">{block.caption}</p> : null}
                  {block.sourceLabel ? (
                    <ImageSourceAttribution
                      href={block.sourceHref ?? null}
                      label={block.sourceLabel}
                      openLabel={copy.openLinkLabel}
                    />
                  ) : null}
                </figcaption>
              ) : null}
            </figure>
          );
        }

        if (block.type === "link-list") {
          return (
            <BlockCard key={block.id} title={block.title}>
              <div className="space-y-3">
                {block.items.map((item) => (
                  <ActionableSceneLink
                    key={`${item.label}-${item.href ?? ""}`}
                    href={item.href ?? null}
                    label={item.label}
                    description={item.description}
                    openLabel={copy.openLinkLabel}
                  />
                ))}
              </div>
            </BlockCard>
          );
        }

        if (block.type === "callout") {
          const toneClass =
            block.tone === "warning"
              ? "border-[var(--border-strong)] bg-[color:color-mix(in_oklab,var(--surface-soft)_76%,#d97706_24%)]"
              : block.tone === "success"
                ? "border-[var(--border-strong)] bg-[color:color-mix(in_oklab,var(--surface-soft)_80%,#15803d_20%)]"
                : "border-[var(--border)] bg-[color:color-mix(in_oklab,var(--surface-soft)_88%,#2563eb_12%)]";

          return (
            <div key={block.id} data-tone={block.tone} className={`rounded-[28px] border p-6 ${toneClass}`}>
              {block.title ? (
                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{block.title}</p>
              ) : null}
              <p className={block.title ? "mt-3 text-base leading-7 text-[var(--text-primary)]" : "text-base leading-7 text-[var(--text-primary)]"}>
                {block.body}
              </p>
            </div>
          );
        }

        return null;
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

export function SceneCta({
  href,
  label,
  openLabel,
}: {
  href: string | null;
  label: string;
  openLabel: string;
}) {
  if (!href) {
    return (
      <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-soft)] px-5 py-4 text-base leading-7 text-[var(--text-primary)]">
        {label}
      </div>
    );
  }

  return (
    <a
      className="inline-flex w-full items-center justify-between rounded-[24px] border border-[var(--border-strong)] bg-[var(--surface-soft)] px-5 py-4 text-base text-[var(--text-primary)] transition hover:border-[var(--text-primary)] hover:bg-[var(--surface-panel)]"
      href={href}
      rel={isExternalHref(href) ? "noreferrer" : undefined}
      target={isExternalHref(href) ? "_blank" : undefined}
    >
      <span>{label}</span>
      <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{openLabel}</span>
    </a>
  );
}

function ActionableSceneLink({
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
    "rounded-[18px] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-3 transition hover:border-[var(--border-strong)] hover:bg-[var(--surface)]";
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-base font-medium text-[var(--text-primary)]">{label}</p>
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

function ImageSourceAttribution({
  href,
  label,
  openLabel,
}: {
  href: string | null;
  label: string;
  openLabel: string;
}) {
  if (!href) {
    return <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>;
  }

  return (
    <a
      className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
      href={href}
      rel={isExternalHref(href) ? "noreferrer" : undefined}
      target={isExternalHref(href) ? "_blank" : undefined}
    >
      <span>{label}</span>
      <span>{openLabel}</span>
    </a>
  );
}

function ScenePager({
  copy,
  lang,
  instanceId,
  agendaItemId,
  previousScene,
  nextScene,
  currentSceneLabel,
  sceneIndex,
  sceneCount,
}: {
  copy: (typeof adminCopy)["cs" | "en"];
  lang: UiLanguage;
  instanceId: string;
  agendaItemId: string | null;
  previousScene: PresenterScene | null;
  nextScene: PresenterScene | null;
  currentSceneLabel: string;
  sceneIndex: number;
  sceneCount: number;
}) {
  if (!agendaItemId || sceneCount <= 1 || sceneIndex < 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[var(--border)] bg-[color:color-mix(in_oklab,var(--surface-panel)_84%,transparent)] px-4 py-3 backdrop-blur sm:px-5">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
          {copy.presenterScenePagerLabel} {sceneIndex + 1}/{sceneCount}
        </p>
        <p className="mt-1 text-sm text-[var(--text-primary)]">{currentSceneLabel}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {previousScene ? (
          <AdminRouteLink
            className="inline-flex items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
            href={buildPresenterRouteHref({
              lang,
              instanceId,
              agendaItemId,
              sceneId: previousScene.id,
            })}
          >
            {copy.presenterPreviousSceneButton}
          </AdminRouteLink>
        ) : null}
        {nextScene ? (
          <AdminRouteLink
            className="inline-flex items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-soft)] px-4 py-2 text-sm text-[var(--text-primary)] transition hover:border-[var(--text-primary)] hover:bg-[var(--surface)]"
            href={buildPresenterRouteHref({
              lang,
              instanceId,
              agendaItemId,
              sceneId: nextScene.id,
            })}
          >
            {copy.presenterNextSceneButton}
          </AdminRouteLink>
        ) : null}
      </div>
    </div>
  );
}

function isExternalHref(href: string) {
  return /^https?:\/\//.test(href);
}
