import type { WorkshopInstanceRecord, WorkshopState } from "./workshop-data";
import { resolveUiLanguage, type UiLanguage, withLang } from "./ui-language";

export const adminSections = ["overview", "agenda", "teams", "signals", "access", "account"] as const;
export type AdminSection = (typeof adminSections)[number];

type AdminCopy = Record<string, string>;
type AgendaItem = WorkshopState["agenda"][number];

export function resolveAdminSection(value: string | undefined): AdminSection {
  return adminSections.find((section) => section === value) ?? "overview";
}

export function buildAdminHref(options: {
  lang: UiLanguage;
  section?: AdminSection;
  instanceId?: string;
  error?: string | null;
  password?: string | null;
}) {
  const { lang, section, instanceId, error, password } = options;
  const params = new URLSearchParams();
  if (section && section !== "overview") {
    params.set("section", section);
  }
  if (instanceId) {
    params.set("instance", instanceId);
  }
  if (error) {
    params.set("error", error);
  }
  if (password) {
    params.set("password", password);
  }

  const query = params.toString();
  return withLang(query ? `/admin?${query}` : "/admin", lang);
}

export function readActionState(formData: FormData) {
  return {
    lang: resolveUiLanguage(String(formData.get("lang") ?? "")),
    section: resolveAdminSection(String(formData.get("section") ?? "")),
    instanceId: String(formData.get("instanceId") ?? "").trim(),
  };
}

export function deriveAdminPageState(
  state: WorkshopState,
  availableInstances: WorkshopInstanceRecord[],
  activeInstanceId: string,
) {
  const currentAgendaItem = state.agenda.find((item) => item.status === "current") ?? state.agenda[0];
  const nextAgendaItem = state.agenda.find((item) => item.status === "upcoming") ?? null;
  const selectedInstance = availableInstances.find((instance) => instance.id === activeInstanceId) ?? null;

  return {
    currentAgendaItem,
    nextAgendaItem,
    selectedInstance,
  };
}

export function resolveActiveInstanceId(
  availableInstances: WorkshopInstanceRecord[],
  requestedInstanceId: string | undefined,
  defaultInstanceId: string,
) {
  return availableInstances.find((instance) => instance.id === requestedInstanceId)?.id ?? defaultInstanceId;
}

export function buildAdminSummaryStats(options: {
  copy: AdminCopy;
  state: WorkshopState;
  selectedInstance: WorkshopInstanceRecord | null;
  currentAgendaItem: AgendaItem | undefined;
}) {
  const { copy, state, selectedInstance, currentAgendaItem } = options;

  return [
    {
      label: copy.activeInstance,
      value: selectedInstance?.workshopMeta.city ?? state.workshopId,
      hint: state.workshopId,
    },
    {
      label: copy.currentPhase,
      value: currentAgendaItem?.title ?? state.workshopMeta.currentPhaseLabel,
      hint: currentAgendaItem?.time ?? "",
    },
    {
      label: copy.rotation,
      value: state.rotation.revealed ? copy.rotationUnlocked : copy.rotationHidden,
      hint: state.rotation.scenario,
    },
    {
      label: copy.teams,
      value: `${state.teams.length}`,
      hint: selectedInstance?.workshopMeta.dateRange ?? "",
    },
  ];
}

export function buildAdminOverviewState(options: {
  copy: AdminCopy;
  lang: UiLanguage;
  state: WorkshopState;
  activeInstanceId: string;
  currentAgendaItem: AgendaItem | undefined;
  nextAgendaItem: AgendaItem | null;
}) {
  const { copy, lang, state, activeInstanceId, currentAgendaItem, nextAgendaItem } = options;

  return {
    compactRows: [
      { label: lang === "cs" ? "id instance" : "instance id", value: state.workshopId },
      { label: copy.currentPhase, value: state.workshopMeta.currentPhaseLabel },
      { label: copy.rotation, value: state.rotation.scenario },
    ],
    liveNowTitle: `${currentAgendaItem?.time ?? ""}${currentAgendaItem ? " • " : ""}${currentAgendaItem?.title ?? ""}`.trim(),
    liveNowDescription: currentAgendaItem?.description ?? "",
    nextUpLabel: nextAgendaItem ? `${copy.nextUp}: ${nextAgendaItem.time} • ${nextAgendaItem.title}` : null,
    agendaLink: buildAdminHref({ lang, section: "agenda", instanceId: activeInstanceId }),
    phaseOptions: state.agenda.map((item) => ({
      id: item.id,
      label: `${item.time} • ${item.title}`,
    })),
    participantState: state.rotation.revealed ? copy.participantStateUnlocked : copy.participantStateHidden,
  };
}

export function buildAdminSessionState(options: {
  copy: AdminCopy;
  signedInEmail: string | null;
  signedInName: string | null;
  currentRole: string | null;
  latestArchive: { createdAt: string; retentionUntil: string | null } | null;
}) {
  const { copy, signedInEmail, signedInName, currentRole, latestArchive } = options;

  return {
    signedInLine: signedInEmail
      ? `${copy.signedInAs}: ${signedInName ?? signedInEmail}${currentRole ? ` • ${currentRole}` : ""}`
      : null,
    archiveLine: latestArchive
      ? `${copy.latestArchivePrefix} ${latestArchive.createdAt} • ${copy.retentionUntil} ${latestArchive.retentionUntil ?? copy.retentionUnset}.`
      : null,
  };
}
