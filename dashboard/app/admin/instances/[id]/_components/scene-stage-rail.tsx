import { AdminRouteLink } from "@/app/admin/admin-route-link";
import { AdminSubmitButton } from "@/app/admin/admin-submit-button";
import { buildAdminHref } from "@/lib/admin-page-view-model";
import { buildPresenterRouteHref } from "@/lib/presenter-view-model";
import { buildRepoBlobUrl } from "@/lib/repo-links";
import type { adminCopy, UiLanguage } from "@/lib/ui-language";
import { adminGhostButtonClassName } from "../../../admin-ui";
import {
  movePresenterSceneAction,
  removePresenterSceneAction,
  setDefaultPresenterSceneAction,
  togglePresenterSceneEnabledAction,
  updateSceneFieldAction,
} from "../_actions/scenes";
import { AdminActionStateFields } from "./admin-action-state-fields";
import { AddSceneRow } from "./agenda/add-scene-row";
import type { RichAgendaItem, RichPresenterScene, SourceRef } from "./agenda/types";
import { InlineField } from "./inline-field";
import { SceneRailKeyboardNav } from "./scene-rail-keyboard-nav";
import { ViewTransitionCard } from "./view-transition-card";

type Copy = (typeof adminCopy)[UiLanguage];

const SCENE_TYPE_OPTIONS = [
  { value: "briefing" },
  { value: "demo" },
  { value: "participant-view" },
  { value: "checkpoint" },
  { value: "reflection" },
  { value: "transition" },
  { value: "custom" },
] as const;

const SCENE_INTENT_OPTIONS = [
  { value: "framing" },
  { value: "teaching" },
  { value: "demo" },
  { value: "walkthrough" },
  { value: "checkpoint" },
  { value: "transition" },
  { value: "reflection" },
  { value: "custom" },
] as const;

const SCENE_CHROME_PRESET_OPTIONS = [
  { value: "minimal" },
  { value: "agenda" },
  { value: "checkpoint" },
  { value: "participant" },
  { value: "team-trail" },
] as const;

// Stage + rail layout for an agenda item's scene list. A compact rail
// of tiles (one per sibling scene) sits beside a single "stage" that
// renders the active scene at full fidelity. Replaces the previous
// approach of stacking every scene fully expanded.
//
// Active-scene selection is URL-driven via `?scene=<id>`. The parent
// resolves `selectedScene` from search params before rendering and
// passes it in. Rail tiles are `AdminRouteLink`s pointing at the same
// URL shape, so navigation plays nicely with the one-canvas morph.

export function SceneStageRail({
  eyebrow,
  title,
  description,
  scenes,
  selectedScene,
  item,
  lang,
  copy,
  instanceId,
  defaultSceneId,
  headerActions,
  emptyCopy,
  participantOnly = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  scenes: RichPresenterScene[];
  selectedScene: RichPresenterScene | null;
  item: RichAgendaItem;
  lang: UiLanguage;
  copy: Copy;
  instanceId: string;
  defaultSceneId: string | null;
  headerActions?: React.ReactNode;
  emptyCopy: string;
  participantOnly?: boolean;
}) {
  const activeSceneId = selectedScene?.id ?? null;

  const railItems = scenes.map((scene) => ({
    id: scene.id,
    href: buildAdminHref({
      lang,
      section: "agenda",
      instanceId,
      agendaItemId: item.id,
      sceneId: scene.id,
    }),
  }));

  return (
    <section className="rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card-top),var(--card-bottom))] p-4 shadow-[0_14px_30px_rgba(28,25,23,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{eyebrow}</p>
          <h3 className="mt-2 text-lg font-medium text-[var(--text-primary)]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
        </div>
        {headerActions ? <div className="flex flex-wrap gap-3">{headerActions}</div> : null}
      </div>

      {scenes.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{emptyCopy}</p>
      ) : (
        <div className="mt-4 flex min-w-0 flex-col gap-4 xl:grid xl:grid-cols-[minmax(200px,16rem)_minmax(0,1fr)]">
          <SceneRailKeyboardNav items={railItems} activeSceneId={activeSceneId}>
            <nav aria-label={title} className="flex min-w-0 flex-col gap-2">
              {scenes.map((scene) => (
                <SceneRailTile
                  key={scene.id}
                  scene={scene}
                  isActive={scene.id === activeSceneId}
                  isDefault={scene.id === defaultSceneId}
                  href={buildAdminHref({
                    lang,
                    section: "agenda",
                    instanceId,
                    agendaItemId: item.id,
                    sceneId: scene.id,
                  })}
                  copy={copy}
                />
              ))}
              <AddSceneRow
                lang={lang}
                instanceId={instanceId}
                agendaItemId={item.id}
                addLabel={copy.presenterAddSceneButton}
              />
            </nav>
          </SceneRailKeyboardNav>

          <div className="min-w-0">
            {selectedScene ? (
              <SceneStagePanel
                scene={selectedScene}
                item={item}
                lang={lang}
                copy={copy}
                instanceId={instanceId}
                isDefault={selectedScene.id === defaultSceneId}
                participantOnly={participantOnly}
              />
            ) : (
              <p className="text-sm leading-6 text-[var(--text-secondary)]">{emptyCopy}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function SceneRailTile({
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

  // raw={true} skips AdminRouteLink's inner centering span so this card
  // layout stays left-aligned; scroll={false} keeps the viewport where
  // it is so picking a sibling scene does not snap the page to top.
  return (
    <AdminRouteLink
      href={href}
      raw
      scroll={false}
      aria-current={isActive ? "true" : undefined}
      data-scene-rail-tile={scene.id}
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

function SceneStagePanel({
  scene,
  item,
  lang,
  copy,
  instanceId,
  isDefault,
  participantOnly,
}: {
  scene: RichPresenterScene;
  item: RichAgendaItem;
  lang: UiLanguage;
  copy: Copy;
  instanceId: string;
  isDefault: boolean;
  participantOnly: boolean;
}) {
  const sceneBlocks = scene.blocks ?? [];
  const surfaceLabel = participantOnly ? copy.participantSurfaceCardTitle : copy.presenterCardTitle;
  const sceneEditorHref = buildAdminHref({
    lang,
    section: "agenda",
    instanceId,
    agendaItemId: item.id,
    sceneId: scene.id,
    overlay: "scene-edit",
  });
  const presenterHref = buildPresenterRouteHref({
    lang,
    instanceId,
    agendaItemId: item.id,
    sceneId: scene.id,
  });
  const morphName = `scene-${item.id}-${scene.id}`;
  const hasNotes = (scene.facilitatorNotes ?? []).length > 0;
  const sourceRefs = scene.sourceRefs ?? [];

  return (
    <ViewTransitionCard name={morphName}>
      <div
        data-scene-stage={scene.id}
        className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_14px_28px_rgba(28,25,23,0.06)]"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-lg font-medium text-[var(--text-primary)]">
              <InlineField
                value={scene.label}
                fieldName="label"
                label={copy.sceneFieldLabel}
                action={updateSceneFieldAction}
                hiddenFields={{
                  instanceId,
                  agendaItemId: item.id,
                  sceneId: scene.id,
                  fieldName: "label",
                }}
              />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-sm leading-6 text-[var(--text-secondary)]">
              <span>{surfaceLabel}</span>
              <span aria-hidden="true">•</span>
              <InlineField
                value={scene.sceneType}
                fieldName="sceneType"
                label={copy.sceneFieldType}
                mode="select"
                options={SCENE_TYPE_OPTIONS}
                action={updateSceneFieldAction}
                hiddenFields={{
                  instanceId,
                  agendaItemId: item.id,
                  sceneId: scene.id,
                  fieldName: "sceneType",
                }}
              />
              {scene.intent ? (
                <>
                  <span aria-hidden="true">•</span>
                  <InlineField
                    value={scene.intent}
                    fieldName="intent"
                    label={copy.sceneFieldIntent}
                    mode="select"
                    options={SCENE_INTENT_OPTIONS}
                    action={updateSceneFieldAction}
                    hiddenFields={{
                      instanceId,
                      agendaItemId: item.id,
                      sceneId: scene.id,
                      fieldName: "intent",
                    }}
                  />
                </>
              ) : null}
              {scene.chromePreset ? (
                <>
                  <span aria-hidden="true">•</span>
                  <InlineField
                    value={scene.chromePreset}
                    fieldName="chromePreset"
                    label={copy.sceneFieldChromePreset}
                    mode="select"
                    options={SCENE_CHROME_PRESET_OPTIONS}
                    action={updateSceneFieldAction}
                    hiddenFields={{
                      instanceId,
                      agendaItemId: item.id,
                      sceneId: scene.id,
                      fieldName: "chromePreset",
                    }}
                  />
                </>
              ) : null}
              {isDefault ? <span>• {copy.presenterCurrentSceneLabel}</span> : null}
              {!scene.enabled ? <span>• {copy.presenterSceneDisabled}</span> : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AdminRouteLink href={presenterHref} className={adminGhostButtonClassName}>
              {participantOnly ? copy.presenterOpenParticipantButton : copy.presenterOpenSelectedScene}
            </AdminRouteLink>
            <a
              href={presenterHref}
              target="_blank"
              rel="noreferrer"
              aria-label="otevřít v novém okně"
              className={`${adminGhostButtonClassName} px-2`}
            >
              ↗
            </a>
            <details className="group relative">
              <summary className="inline-flex cursor-pointer list-none items-center rounded-[10px] px-2 py-1 text-xs lowercase text-[var(--text-muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]">
                více
              </summary>
              <div className="absolute right-0 z-10 mt-2 flex w-56 flex-col gap-1 rounded-[18px] border border-[var(--border-strong)] bg-[var(--surface)] p-2 shadow-[0_18px_36px_rgba(28,25,23,0.12)]">
                <form action={movePresenterSceneAction}>
                  <AdminActionStateFields lang={lang} section="agenda" instanceId={instanceId} />
                  <input name="agendaItemId" type="hidden" value={item.id} />
                  <input name="sceneId" type="hidden" value={scene.id} />
                  <input name="direction" type="hidden" value="up" />
                  <AdminSubmitButton className={`${adminGhostButtonClassName} w-full justify-start`}>
                    ↑ {copy.presenterMoveSceneUpButton}
                  </AdminSubmitButton>
                </form>
                <form action={movePresenterSceneAction}>
                  <AdminActionStateFields lang={lang} section="agenda" instanceId={instanceId} />
                  <input name="agendaItemId" type="hidden" value={item.id} />
                  <input name="sceneId" type="hidden" value={scene.id} />
                  <input name="direction" type="hidden" value="down" />
                  <AdminSubmitButton className={`${adminGhostButtonClassName} w-full justify-start`}>
                    ↓ {copy.presenterMoveSceneDownButton}
                  </AdminSubmitButton>
                </form>
                {!isDefault ? (
                  <form action={setDefaultPresenterSceneAction}>
                    <AdminActionStateFields lang={lang} section="agenda" instanceId={instanceId} />
                    <input name="agendaItemId" type="hidden" value={item.id} />
                    <input name="sceneId" type="hidden" value={scene.id} />
                    <AdminSubmitButton className={`${adminGhostButtonClassName} w-full justify-start`}>
                      {copy.presenterSetDefaultSceneButton}
                    </AdminSubmitButton>
                  </form>
                ) : null}
                <form action={togglePresenterSceneEnabledAction}>
                  <AdminActionStateFields lang={lang} section="agenda" instanceId={instanceId} />
                  <input name="agendaItemId" type="hidden" value={item.id} />
                  <input name="sceneId" type="hidden" value={scene.id} />
                  <input name="enabled" type="hidden" value={scene.enabled ? "false" : "true"} />
                  <AdminSubmitButton className={`${adminGhostButtonClassName} w-full justify-start`}>
                    {scene.enabled ? copy.presenterHideSceneButton : copy.presenterShowSceneButton}
                  </AdminSubmitButton>
                </form>
                <AdminRouteLink href={sceneEditorHref} className={`${adminGhostButtonClassName} w-full justify-start`}>
                  blocks / sources →
                </AdminRouteLink>
                <form action={removePresenterSceneAction}>
                  <AdminActionStateFields lang={lang} section="agenda" instanceId={instanceId} />
                  <input name="agendaItemId" type="hidden" value={item.id} />
                  <input name="sceneId" type="hidden" value={scene.id} />
                  <AdminSubmitButton className={`${adminGhostButtonClassName} w-full justify-start text-[var(--border-strong)]`}>
                    {copy.presenterRemoveSceneButton}
                  </AdminSubmitButton>
                </form>
              </div>
            </details>
          </div>
        </div>

        <div className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
          <InlineField
            value={scene.body ?? ""}
            fieldName="body"
            label={copy.sceneFieldBody}
            mode="textarea"
            action={updateSceneFieldAction}
            hiddenFields={{
              instanceId,
              agendaItemId: item.id,
              sceneId: scene.id,
              fieldName: "body",
            }}
          />
        </div>

        {sceneBlocks.length > 0 ? (
          <div className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.presenterRoomBlocksTitle}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {sceneBlocks.map((block) => (
                <span
                  key={block.id}
                  className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-secondary)]"
                >
                  {block.type}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <details className="group mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] transition group-open:text-[var(--text-primary)] hover:text-[var(--text-primary)]">
            <span>
              {copy.presenterFacilitatorNotesTitle}
              {sourceRefs.length > 0 ? ` · ${copy.agendaDetailSourceMaterialTitle}` : ""}
            </span>
            <span aria-hidden="true" className="text-[var(--text-muted)] transition-transform group-open:rotate-45">
              +
            </span>
          </summary>

          <div className="mt-3 whitespace-pre-line text-sm leading-6 text-[var(--text-secondary)]">
            <InlineField
              value={(scene.facilitatorNotes ?? []).join("\n")}
              fieldName="facilitatorNotes"
              label={copy.presenterFacilitatorNotesTitle}
              mode="textarea"
              placeholder={copy.presenterFacilitatorNotesTitle}
              action={updateSceneFieldAction}
              hiddenFields={{
                instanceId,
                agendaItemId: item.id,
                sceneId: scene.id,
                fieldName: "facilitatorNotes",
              }}
            />
            {!hasNotes ? (
              <p className="mt-1 text-xs text-[var(--text-muted)]">—</p>
            ) : null}
          </div>

          {sourceRefs.length > 0 ? (
            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {copy.agendaDetailSourceMaterialTitle}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {sourceRefs.map((ref: SourceRef) => {
                  const href = buildRepoBlobUrl(ref.path);
                  const className =
                    "flex items-center justify-between rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--card-top)]";
                  if (!href) {
                    return (
                      <div key={`${ref.path}-${ref.label}`} className={className}>
                        <span className="font-medium">{ref.label}</span>
                        <span className="text-xs text-[var(--text-muted)]">{ref.path}</span>
                      </div>
                    );
                  }
                  return (
                    <a
                      key={`${ref.path}-${ref.label}`}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className={className}
                    >
                      <span className="font-medium">{ref.label}</span>
                      <span className="text-xs text-[var(--text-muted)]">{copy.openLinkLabel}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          ) : null}
        </details>
      </div>
    </ViewTransitionCard>
  );
}
