import type { ControlRoomOverlay } from "@/lib/admin-page-view-model";
import type { adminCopy, UiLanguage } from "@/lib/ui-language";
import type { AgendaItem } from "@/lib/workshop-data";
import { AdminSheet } from "../../../../admin-ui";
import type { RichAgendaItem, RichPresenterScene } from "../agenda/types";
import {
  AgendaItemCreateSheetBody,
  AgendaItemEditorSheetBody,
  PresenterSceneCreateSheetBody,
  PresenterSceneEditorSheetBody,
} from "./agenda-sheets";

type Copy = (typeof adminCopy)[UiLanguage];

export function AgendaSheetOverlays({
  lang,
  copy,
  instanceId,
  activeOverlay,
  showAgendaDetail,
  selectedAgendaItem,
  selectedScene,
  agenda,
  agendaBaseHref,
  sceneBaseHref,
}: {
  lang: UiLanguage;
  copy: Copy;
  instanceId: string;
  activeOverlay: ControlRoomOverlay | null;
  showAgendaDetail: boolean;
  selectedAgendaItem: RichAgendaItem | null | undefined;
  selectedScene: RichPresenterScene | null;
  agenda: AgendaItem[];
  agendaBaseHref: string;
  sceneBaseHref: string;
}) {
  if (activeOverlay === "agenda-edit" && showAgendaDetail && selectedAgendaItem) {
    return (
      <AdminSheet
        eyebrow={copy.agendaEditEyebrow}
        title={copy.agendaEditTitle}
        description={copy.agendaEditDescription}
        closeHref={agendaBaseHref}
        closeLabel={copy.closePanelButton}
      >
        <AgendaItemEditorSheetBody item={selectedAgendaItem} lang={lang} section="agenda" instanceId={instanceId} copy={copy} />
      </AdminSheet>
    );
  }

  if (activeOverlay === "agenda-add") {
    return (
      <AdminSheet
        eyebrow={copy.agendaEditEyebrow}
        title={copy.addAgendaItemTitle}
        description={copy.addAgendaItemDescription}
        closeHref={agendaBaseHref}
        closeLabel={copy.closePanelButton}
      >
        <AgendaItemCreateSheetBody
          agenda={agenda}
          selectedAgendaItemId={selectedAgendaItem?.id ?? null}
          lang={lang}
          section="agenda"
          instanceId={instanceId}
          copy={copy}
        />
      </AdminSheet>
    );
  }

  if (activeOverlay === "scene-edit" && selectedAgendaItem && selectedScene) {
    return (
      <AdminSheet
        eyebrow={copy.agendaPresenterGroupTitle}
        title={copy.sceneEditTitle}
        description={copy.sceneEditDescription}
        closeHref={sceneBaseHref}
        closeLabel={copy.closePanelButton}
      >
        <PresenterSceneEditorSheetBody
          item={selectedAgendaItem}
          scene={selectedScene}
          lang={lang}
          section="agenda"
          instanceId={instanceId}
          copy={copy}
        />
      </AdminSheet>
    );
  }

  if (activeOverlay === "scene-add" && selectedAgendaItem) {
    return (
      <AdminSheet
        eyebrow={copy.agendaPresenterGroupTitle}
        title={copy.sceneAddTitle}
        description={copy.sceneAddDescription}
        closeHref={sceneBaseHref}
        closeLabel={copy.closePanelButton}
      >
        <PresenterSceneCreateSheetBody
          item={selectedAgendaItem}
          lang={lang}
          section="agenda"
          instanceId={instanceId}
          copy={copy}
        />
      </AdminSheet>
    );
  }

  return null;
}
