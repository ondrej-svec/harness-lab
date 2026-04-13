import type { ControlRoomOverlay } from "@/lib/admin-page-view-model";
import type { adminCopy, UiLanguage } from "@/lib/ui-language";
import type { AgendaItem } from "@/lib/workshop-data";
import { AdminSheet } from "../../../../admin-ui";
import type { RichAgendaItem, RichPresenterScene } from "../agenda/types";
import { PresenterSceneEditorSheetBody } from "./agenda-sheets";

type Copy = (typeof adminCopy)[UiLanguage];

// Only `scene-edit` remains as an overlay, and only for the structured
// fields that don't yet have an inline equivalent: source-refs (array
// of {path, label}) and presenter blocks (via SceneBlockEditor). Every
// other content field on the scene — label, title, body, sceneType,
// intent, chromePreset, ctaLabel, ctaHref, facilitatorNotes — edits
// inline on the scene summary card. agenda-edit / agenda-add /
// scene-add overlays were retired in favor of inline-field editing and
// inline-append draft rows (AddAgendaItemRow, AddSceneRow).
export function AgendaSheetOverlays({
  lang,
  copy,
  instanceId,
  activeOverlay,
  selectedAgendaItem,
  selectedScene,
  sceneBaseHref,
}: {
  lang: UiLanguage;
  copy: Copy;
  instanceId: string;
  activeOverlay: ControlRoomOverlay | null;
  showAgendaDetail?: boolean;
  selectedAgendaItem: RichAgendaItem | null | undefined;
  selectedScene: RichPresenterScene | null;
  agenda?: AgendaItem[];
  agendaBaseHref?: string;
  sceneBaseHref: string;
}) {
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

  return null;
}
