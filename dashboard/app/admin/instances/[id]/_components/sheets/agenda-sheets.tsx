import { AdminSubmitButton } from "@/app/admin/admin-submit-button";
import type { AdminSection } from "@/lib/admin-page-view-model";
import type { adminCopy, UiLanguage } from "@/lib/ui-language";
import type { AgendaItem, PresenterScene } from "@/lib/workshop-data";
import {
  FieldLabel,
  adminDangerButtonClassName,
  adminInputClassName,
  adminPrimaryButtonClassName,
  adminSecondaryButtonClassName,
} from "../../../../admin-ui";
import {
  addAgendaItemAction,
  moveAgendaItemAction,
  removeAgendaItemAction,
  saveAgendaDetailsAction,
  setAgendaAction,
} from "../../_actions/agenda";
import {
  addPresenterSceneAction,
  movePresenterSceneAction,
  removePresenterSceneAction,
  setDefaultPresenterSceneAction,
  togglePresenterSceneEnabledAction,
  updatePresenterSceneAction,
} from "../../_actions/scenes";
import { SceneBlockEditor } from "../../scene-block-editor";
import { AdminActionStateFields } from "../admin-action-state-fields";
import type { RichAgendaItem, RichPresenterScene } from "../agenda/types";

type Copy = (typeof adminCopy)[UiLanguage];

function listToTextareaValue(items?: string[]) {
  return (items ?? []).join("\n");
}

function stringifyJson(value: unknown) {
  return JSON.stringify(value ?? [], null, 2);
}

export function AgendaItemEditorSheetBody({
  item,
  lang,
  section,
  instanceId,
  copy,
}: {
  item: RichAgendaItem;
  lang: UiLanguage;
  section: AdminSection;
  instanceId: string;
  copy: Copy;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.runtimeCopyBadge}</p>
        <p className="mt-2 text-base font-semibold text-[var(--text-primary)]">
          {item.time} • {item.title}
        </p>
      </div>

      <form action={saveAgendaDetailsAction} className="space-y-4">
        <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
        <input name="agendaId" type="hidden" value={item.id} />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_9rem]">
          <div>
            <FieldLabel htmlFor="agenda-title">{copy.agendaFieldTitle}</FieldLabel>
            <input id="agenda-title" name="title" defaultValue={item.title} className={`${adminInputClassName} mt-2`} />
          </div>
          <div>
            <FieldLabel htmlFor="agenda-time">{copy.agendaFieldTime}</FieldLabel>
            <input id="agenda-time" name="time" defaultValue={item.time} className={`${adminInputClassName} mt-2`} />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="agenda-goal">{copy.agendaFieldGoal}</FieldLabel>
          <textarea
            id="agenda-goal"
            name="goal"
            rows={3}
            defaultValue={item.goal}
            className={`${adminInputClassName} mt-2`}
          />
        </div>
        <div>
          <FieldLabel htmlFor="agenda-room-summary">{copy.agendaFieldRoomSummary}</FieldLabel>
          <textarea
            id="agenda-room-summary"
            name="roomSummary"
            rows={4}
            defaultValue={item.roomSummary}
            className={`${adminInputClassName} mt-2`}
          />
        </div>
        <div>
          <FieldLabel htmlFor="agenda-prompts">{copy.agendaFieldFacilitatorPrompts}</FieldLabel>
          <textarea
            id="agenda-prompts"
            name="facilitatorPrompts"
            rows={5}
            defaultValue={listToTextareaValue(item.facilitatorPrompts)}
            className={`${adminInputClassName} mt-2`}
          />
        </div>
        <div>
          <FieldLabel htmlFor="agenda-watch-fors">{copy.agendaFieldWatchFors}</FieldLabel>
          <textarea
            id="agenda-watch-fors"
            name="watchFors"
            rows={5}
            defaultValue={listToTextareaValue(item.watchFors)}
            className={`${adminInputClassName} mt-2`}
          />
        </div>
        <div>
          <FieldLabel htmlFor="agenda-checkpoints">{copy.agendaFieldCheckpointQuestions}</FieldLabel>
          <textarea
            id="agenda-checkpoints"
            name="checkpointQuestions"
            rows={5}
            defaultValue={listToTextareaValue(item.checkpointQuestions)}
            className={`${adminInputClassName} mt-2`}
          />
        </div>
        <AdminSubmitButton className={`${adminPrimaryButtonClassName} w-full`}>{copy.saveAgendaItemButton}</AdminSubmitButton>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        <form action={moveAgendaItemAction}>
          <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
          <input name="agendaId" type="hidden" value={item.id} />
          <input name="direction" type="hidden" value="up" />
          <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`}>{copy.moveUpButton}</AdminSubmitButton>
        </form>
        <form action={moveAgendaItemAction}>
          <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
          <input name="agendaId" type="hidden" value={item.id} />
          <input name="direction" type="hidden" value="down" />
          <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`}>{copy.moveDownButton}</AdminSubmitButton>
        </form>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <form action={setAgendaAction}>
          <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
          <input name="agendaId" type="hidden" value={item.id} />
          <input name="returnTo" type="hidden" value="detail" />
          <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`}>{copy.setCurrentPhase}</AdminSubmitButton>
        </form>
        <form action={removeAgendaItemAction}>
          <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
          <input name="agendaId" type="hidden" value={item.id} />
          <AdminSubmitButton className={`${adminDangerButtonClassName} w-full`}>{copy.removeAgendaItemButton}</AdminSubmitButton>
        </form>
      </div>
    </div>
  );
}

export function AgendaItemCreateSheetBody({
  agenda,
  selectedAgendaItemId,
  lang,
  section,
  instanceId,
  copy,
}: {
  agenda: AgendaItem[];
  selectedAgendaItemId: string | null;
  lang: UiLanguage;
  section: AdminSection;
  instanceId: string;
  copy: Copy;
}) {
  return (
    <form action={addAgendaItemAction} className="space-y-4">
      <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
      <div>
        <FieldLabel htmlFor="new-agenda-title">{copy.agendaFieldTitle}</FieldLabel>
        <input id="new-agenda-title" name="title" placeholder={copy.addAgendaItemTitle} className={`${adminInputClassName} mt-2`} />
      </div>
      <div>
        <FieldLabel htmlFor="new-agenda-time">{copy.agendaFieldTime}</FieldLabel>
        <input id="new-agenda-time" name="time" placeholder="16:10" className={`${adminInputClassName} mt-2`} />
      </div>
      <div>
        <FieldLabel htmlFor="new-agenda-goal">{copy.agendaFieldGoal}</FieldLabel>
        <textarea
          id="new-agenda-goal"
          name="goal"
          rows={3}
          placeholder={copy.agendaNewGoalPlaceholder}
          className={`${adminInputClassName} mt-2`}
        />
      </div>
      <div>
        <FieldLabel htmlFor="new-agenda-room-summary">{copy.agendaFieldRoomSummary}</FieldLabel>
        <textarea
          id="new-agenda-room-summary"
          name="roomSummary"
          rows={4}
          placeholder={copy.teamCheckpointPlaceholder}
          className={`${adminInputClassName} mt-2`}
        />
      </div>
      <div>
        <FieldLabel htmlFor="new-agenda-prompts">{copy.agendaFieldFacilitatorPrompts}</FieldLabel>
        <textarea
          id="new-agenda-prompts"
          name="facilitatorPrompts"
          rows={4}
          placeholder={copy.agendaNewPromptPlaceholder}
          className={`${adminInputClassName} mt-2`}
        />
      </div>
      <div>
        <FieldLabel htmlFor="new-agenda-watch-fors">{copy.agendaFieldWatchFors}</FieldLabel>
        <textarea
          id="new-agenda-watch-fors"
          name="watchFors"
          rows={4}
          placeholder={copy.agendaNewWatchForPlaceholder}
          className={`${adminInputClassName} mt-2`}
        />
      </div>
      <div>
        <FieldLabel htmlFor="new-agenda-checkpoints">{copy.agendaFieldCheckpointQuestions}</FieldLabel>
        <textarea
          id="new-agenda-checkpoints"
          name="checkpointQuestions"
          rows={4}
          placeholder={copy.agendaNewCheckpointPlaceholder}
          className={`${adminInputClassName} mt-2`}
        />
      </div>
      <div>
        <FieldLabel htmlFor="new-agenda-after">{copy.agendaFieldInsertAfter}</FieldLabel>
        <select
          id="new-agenda-after"
          name="afterItemId"
          defaultValue={selectedAgendaItemId ?? ""}
          className={`${adminInputClassName} mt-2`}
        >
          {agenda.map((item) => (
            <option key={item.id} value={item.id}>
              {item.time} • {item.title}
            </option>
          ))}
        </select>
      </div>
      <AdminSubmitButton className={`${adminPrimaryButtonClassName} w-full`}>{copy.addAgendaItemButton}</AdminSubmitButton>
    </form>
  );
}

const presenterSceneTypeOptions: PresenterScene["sceneType"][] = [
  "briefing",
  "demo",
  "participant-view",
  "checkpoint",
  "reflection",
  "transition",
  "custom",
];

const presenterSceneIntentOptions: PresenterScene["intent"][] = [
  "framing",
  "teaching",
  "demo",
  "walkthrough",
  "checkpoint",
  "transition",
  "reflection",
  "custom",
];

const presenterChromePresetOptions: PresenterScene["chromePreset"][] = [
  "minimal",
  "agenda",
  "checkpoint",
  "participant",
  "team-trail",
];

export function PresenterSceneCreateSheetBody({
  item,
  lang,
  section,
  instanceId,
  copy,
}: {
  item: RichAgendaItem;
  lang: UiLanguage;
  section: AdminSection;
  instanceId: string;
  copy: Copy;
}) {
  return (
    <form action={addPresenterSceneAction} className="space-y-4">
      <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
      <input name="agendaItemId" type="hidden" value={item.id} />
      <PresenterSceneFormFields copy={copy} lang={lang} />
      <AdminSubmitButton className={`${adminPrimaryButtonClassName} w-full`}>{copy.createSceneButton}</AdminSubmitButton>
    </form>
  );
}

export function PresenterSceneEditorSheetBody({
  item,
  scene,
  lang,
  section,
  instanceId,
  copy,
}: {
  item: RichAgendaItem;
  scene: RichPresenterScene;
  lang: UiLanguage;
  section: AdminSection;
  instanceId: string;
  copy: Copy;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{item.time} • {item.title}</p>
        <p className="mt-2 text-base font-semibold text-[var(--text-primary)]">{scene.label}</p>
      </div>

      <form action={updatePresenterSceneAction} className="space-y-4">
        <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
        <input name="agendaItemId" type="hidden" value={item.id} />
        <input name="sceneId" type="hidden" value={scene.id} />
        <PresenterSceneFormFields copy={copy} lang={lang} scene={scene} />
        <AdminSubmitButton className={`${adminPrimaryButtonClassName} w-full`}>{copy.saveSceneButton}</AdminSubmitButton>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        <form action={movePresenterSceneAction}>
          <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
          <input name="agendaItemId" type="hidden" value={item.id} />
          <input name="sceneId" type="hidden" value={scene.id} />
          <input name="direction" type="hidden" value="up" />
          <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`}>{copy.presenterMoveSceneUpButton}</AdminSubmitButton>
        </form>
        <form action={movePresenterSceneAction}>
          <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
          <input name="agendaItemId" type="hidden" value={item.id} />
          <input name="sceneId" type="hidden" value={scene.id} />
          <input name="direction" type="hidden" value="down" />
          <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`}>{copy.presenterMoveSceneDownButton}</AdminSubmitButton>
        </form>
        <form action={setDefaultPresenterSceneAction}>
          <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
          <input name="agendaItemId" type="hidden" value={item.id} />
          <input name="sceneId" type="hidden" value={scene.id} />
          <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`}>{copy.presenterSetDefaultSceneButton}</AdminSubmitButton>
        </form>
        <form action={togglePresenterSceneEnabledAction}>
          <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
          <input name="agendaItemId" type="hidden" value={item.id} />
          <input name="sceneId" type="hidden" value={scene.id} />
          <input name="enabled" type="hidden" value={scene.enabled ? "false" : "true"} />
          <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`}>
            {scene.enabled ? copy.presenterHideSceneButton : copy.presenterShowSceneButton}
          </AdminSubmitButton>
        </form>
      </div>

      <form action={removePresenterSceneAction}>
        <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
        <input name="agendaItemId" type="hidden" value={item.id} />
        <input name="sceneId" type="hidden" value={scene.id} />
        <AdminSubmitButton className={`${adminDangerButtonClassName} w-full`}>{copy.presenterRemoveSceneButton}</AdminSubmitButton>
      </form>
    </div>
  );
}

function PresenterSceneFormFields({
  copy,
  lang,
  scene,
}: {
  copy: Copy;
  lang: UiLanguage;
  scene?: RichPresenterScene;
}) {
  return (
    <>
      <div>
        <FieldLabel htmlFor="scene-label">{copy.sceneFieldLabel}</FieldLabel>
        <input id="scene-label" name="label" defaultValue={scene?.label ?? ""} className={`${adminInputClassName} mt-2`} />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <FieldLabel htmlFor="scene-type">{copy.sceneFieldType}</FieldLabel>
          <select id="scene-type" name="sceneType" defaultValue={scene?.sceneType ?? "briefing"} className={`${adminInputClassName} mt-2`}>
            {presenterSceneTypeOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="scene-intent">{copy.sceneFieldIntent}</FieldLabel>
          <select id="scene-intent" name="intent" defaultValue={scene?.intent ?? "framing"} className={`${adminInputClassName} mt-2`}>
            {presenterSceneIntentOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="scene-preset">{copy.sceneFieldChromePreset}</FieldLabel>
          <select
            id="scene-preset"
            name="chromePreset"
            defaultValue={scene?.chromePreset ?? "minimal"}
            className={`${adminInputClassName} mt-2`}
          >
            {presenterChromePresetOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <FieldLabel htmlFor="scene-title">{copy.sceneFieldTitle}</FieldLabel>
        <input id="scene-title" name="title" defaultValue={scene?.title ?? ""} className={`${adminInputClassName} mt-2`} />
      </div>
      <div>
        <FieldLabel htmlFor="scene-body">{copy.sceneFieldBody}</FieldLabel>
        <textarea id="scene-body" name="body" rows={4} defaultValue={scene?.body ?? ""} className={`${adminInputClassName} mt-2`} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <FieldLabel htmlFor="scene-cta-label">{copy.sceneFieldCtaLabel}</FieldLabel>
          <input id="scene-cta-label" name="ctaLabel" defaultValue={scene?.ctaLabel ?? ""} className={`${adminInputClassName} mt-2`} />
        </div>
        <div>
          <FieldLabel htmlFor="scene-cta-href">{copy.sceneFieldCtaHref}</FieldLabel>
          <input id="scene-cta-href" name="ctaHref" defaultValue={scene?.ctaHref ?? ""} className={`${adminInputClassName} mt-2`} />
        </div>
      </div>
      <div>
        <FieldLabel htmlFor="scene-notes">{copy.sceneFieldFacilitatorNotes}</FieldLabel>
        <textarea
          id="scene-notes"
          name="facilitatorNotes"
          rows={4}
          defaultValue={listToTextareaValue(scene?.facilitatorNotes)}
          className={`${adminInputClassName} mt-2`}
        />
      </div>
      <div>
        <FieldLabel htmlFor="scene-source-refs">{copy.sceneFieldSourceRefs}</FieldLabel>
        <textarea
          id="scene-source-refs"
          name="sourceRefs"
          rows={6}
          defaultValue={stringifyJson(scene?.sourceRefs ?? [])}
          className={`${adminInputClassName} mt-2 font-mono text-xs leading-6`}
        />
      </div>
      <div>
        <FieldLabel htmlFor="scene-block-editor">{copy.sceneFieldBlocks}</FieldLabel>
        <SceneBlockEditor initialBlocks={scene?.blocks ?? []} inputName="blocks" lang={lang} />
        <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{copy.sceneJsonHint}</p>
      </div>
    </>
  );
}
