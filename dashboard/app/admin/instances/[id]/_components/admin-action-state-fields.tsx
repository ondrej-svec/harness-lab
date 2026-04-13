import type { AdminSection } from "@/lib/admin-page-view-model";
import type { UiLanguage } from "@/lib/ui-language";

export function AdminActionStateFields({
  lang,
  section,
  instanceId,
}: {
  lang: UiLanguage;
  section: AdminSection;
  instanceId: string;
}) {
  return (
    <>
      <input name="lang" type="hidden" value={lang} />
      <input name="section" type="hidden" value={section} />
      <input name="instanceId" type="hidden" value={instanceId} />
    </>
  );
}
