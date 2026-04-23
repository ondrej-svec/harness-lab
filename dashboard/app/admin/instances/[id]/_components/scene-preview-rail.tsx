import { AdminRouteLink } from "@/app/admin/admin-route-link";
import { buildAdminHref } from "@/lib/admin-page-view-model";
import type { adminCopy, UiLanguage } from "@/lib/ui-language";

import type { RichAgendaItem, RichPresenterScene } from "./agenda/types";

type Copy = (typeof adminCopy)[UiLanguage];

// Read-only preview for an agenda item's presenter scenes. Shows the
// rail of scenes and a stage for the selected one. No authoring
// affordances — adding, editing, moving, toggling, and setting-default
// are CLI-only (harness scene ...).
//
// Part of the 2026-04-23 minimal-UI plan, Phase 4. This component is
// intentionally a fresh build rather than a stripped SceneStageRail
// clone; the plan calls out "share types only; no flag-based dual-mode"
// so the authoring variant stays simple and this one can't drift into
// silently growing write controls.

export function ScenePreviewRail({
  item,
  scenes,
  selectedScene,
  defaultSceneId,
  lang,
  copy,
  instanceId,
}: {
  item: RichAgendaItem;
  scenes: RichPresenterScene[];
  selectedScene: RichPresenterScene | null;
  defaultSceneId: string | null;
  lang: UiLanguage;
  copy: Copy;
  instanceId: string;
}) {
  if (scenes.length === 0) {
    return (
      <section className="rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card-top),var(--card-bottom))] p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
          {copy.presenterStageEyebrow}
        </p>
        <h3 className="mt-2 text-base font-medium text-[var(--text-primary)]">
          {copy.presenterEmptyTitle}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          {copy.presenterEmptyBody}
        </p>
      </section>
    );
  }

  const activeSceneId = selectedScene?.id ?? null;

  return (
    <section className="rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card-top),var(--card-bottom))] p-4 shadow-[0_14px_30px_rgba(28,25,23,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
            {copy.presenterStageEyebrow}
          </p>
          <h3 className="mt-2 text-lg font-medium text-[var(--text-primary)]">
            {item.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {scenes.length === 1
              ? copy.presenterSceneCountSingular
              : copy.presenterSceneCountPlural.replace("{count}", String(scenes.length))}
          </p>
        </div>
      </div>

      <div className="mt-4 flex min-w-0 flex-col gap-4 xl:grid xl:grid-cols-[minmax(200px,16rem)_minmax(0,1fr)]">
        <nav aria-label={copy.presenterRailAriaLabel} className="flex min-w-0 flex-col gap-2">
          {scenes.map((scene) => (
            <ScenePreviewTile
              key={scene.id}
              scene={scene}
              isActive={scene.id === activeSceneId}
              isDefault={scene.id === defaultSceneId}
              href={buildAdminHref({
                lang,
                section: "run",
                instanceId,
                agendaItemId: item.id,
                sceneId: scene.id,
              })}
              copy={copy}
            />
          ))}
        </nav>

        <div className="min-w-0">
          {selectedScene ? (
            <ScenePreviewStage scene={selectedScene} isDefault={selectedScene.id === defaultSceneId} copy={copy} />
          ) : (
            <p className="text-sm leading-6 text-[var(--text-secondary)]">
              {copy.presenterPickScenePrompt}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function ScenePreviewTile({
  scene,
  isActive,
  isDefault,
  href,
  copy,
}: {
  scene: RichPresenterScene;
  isActive: boolean;
  isDefault: boolean;
  href: string;
  copy: Copy;
}) {
  const baseClassName =
    "group relative block w-full rounded-[16px] border px-3 py-3 text-left transition focus-visible:border-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/20";
  const stateClassName = isActive
    ? "border-[var(--text-primary)] bg-[var(--surface)] shadow-[0_10px_24px_rgba(28,25,23,0.08)]"
    : "border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--border-strong)] hover:bg-[var(--surface)]";

  return (
    <AdminRouteLink
      href={href}
      raw
      scroll={false}
      aria-current={isActive ? "true" : undefined}
      data-scene-preview-tile={scene.id}
      className={`${baseClassName} ${stateClassName}`}
    >
      <div className="flex items-start gap-2">
        <span
          aria-hidden="true"
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
            isActive ? "bg-[var(--text-primary)]" : "bg-[var(--border-strong)]"
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--text-primary)]">{scene.label}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] leading-4 text-[var(--text-muted)]">
            <span>{scene.sceneType}</span>
            {scene.chromePreset ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{scene.chromePreset}</span>
              </>
            ) : null}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {isDefault ? (
              <span className="rounded-full border border-[var(--border)] bg-[var(--card-top)] px-2 py-[1px] text-[10px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                {copy.presenterCurrentSceneLabel}
              </span>
            ) : null}
            {!scene.enabled ? (
              <span className="rounded-full border border-[var(--border)] px-2 py-[1px] text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                {copy.presenterSceneDisabled}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </AdminRouteLink>
  );
}

function ScenePreviewStage({
  scene,
  isDefault,
  copy,
}: {
  scene: RichPresenterScene;
  isDefault: boolean;
  copy: Copy;
}) {
  const notes = scene.facilitatorNotes ?? [];
  const hasNotes = notes.length > 0;

  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--card-top)] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-[var(--border)] px-2 py-[1px] text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
          {scene.surface === "participant" ? copy.participantSurfaceCardTitle : copy.presenterCardTitle}
        </span>
        {isDefault ? (
          <span className="rounded-full border border-[var(--border)] bg-[var(--card-top)] px-2 py-[1px] text-[10px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            {copy.presenterCurrentSceneLabel}
          </span>
        ) : null}
        {!scene.enabled ? (
          <span className="rounded-full border border-[var(--border)] px-2 py-[1px] text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {copy.presenterSceneDisabled}
          </span>
        ) : null}
      </div>

      {scene.title ? (
        <h4 className="text-lg font-medium leading-snug text-[var(--text-primary)]">{scene.title}</h4>
      ) : null}
      {scene.body ? (
        <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{scene.body}</p>
      ) : null}

      {hasNotes ? (
        <details className="mt-1 rounded-[12px] border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-sm leading-6 text-[var(--text-secondary)]">
          <summary className="cursor-pointer text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {copy.presenterFacilitatorNotesLabel}
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {notes.map((note, index) => (
              <li key={`${scene.id}-note-${index}`}>{note}</li>
            ))}
          </ul>
        </details>
      ) : null}

      <p className="mt-1 text-[11px] leading-5 text-[var(--text-muted)]">
        {copy.presenterReadOnlyHint}
      </p>
    </article>
  );
}
