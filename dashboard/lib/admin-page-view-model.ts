import type { WorkshopInstanceRecord, WorkshopState } from "./workshop-data";
import { resolveUiLanguage, type UiLanguage, withLang } from "./ui-language";

export const controlRoomSections = ["live", "agenda", "teams", "people", "signals", "access", "settings"] as const;
export type ControlRoomSection = (typeof controlRoomSections)[number];
export type AdminSection = ControlRoomSection;
export const controlRoomOverlays = ["agenda-edit", "agenda-add", "scene-edit", "scene-add"] as const;
export type ControlRoomOverlay = (typeof controlRoomOverlays)[number];

export const legacyAdminSectionMap = {
  overview: "agenda",
  agenda: "agenda",
  teams: "teams",
  people: "people",
  signals: "signals",
  access: "access",
  account: "settings",
} as const;

export type LegacyAdminSection = keyof typeof legacyAdminSectionMap;
export type WorkspaceInstanceStatusFilter = "all" | "created" | "prepared" | "running" | "archived";

type AdminCopy = Record<string, string>;
type AgendaItem = WorkshopState["agenda"][number];

export function resolveControlRoomSection(value: string | undefined): ControlRoomSection {
  return controlRoomSections.find((section) => section === value) ?? "agenda";
}

export function resolveLegacyAdminSection(value: string | undefined): LegacyAdminSection {
  return (Object.keys(legacyAdminSectionMap) as LegacyAdminSection[]).find((section) => section === value) ?? "overview";
}

export function mapLegacyAdminSectionToControlRoomSection(value: string | undefined): ControlRoomSection {
  return legacyAdminSectionMap[resolveLegacyAdminSection(value)];
}

export function buildAdminWorkspaceHref(options: {
  lang: UiLanguage;
  query?: string | null;
  status?: WorkspaceInstanceStatusFilter | null;
  removeInstanceId?: string | null;
}) {
  const params = new URLSearchParams();
  if (options.query?.trim()) {
    params.set("q", options.query.trim());
  }
  if (options.status && options.status !== "all") {
    params.set("status", options.status);
  }
  if (options.removeInstanceId?.trim()) {
    params.set("removeInstance", options.removeInstanceId.trim());
  }

  const query = params.toString();
  return withLang(query ? `/admin?${query}` : "/admin", options.lang);
}

export function buildAdminInstanceHref(options: {
  lang: UiLanguage;
  instanceId: string;
  section?: ControlRoomSection;
  teamId?: string | null;
  agendaItemId?: string | null;
  sceneId?: string | null;
  error?: string | null;
  password?: string | null;
  overlay?: ControlRoomOverlay | null;
}) {
  const { lang, instanceId, section, teamId, agendaItemId, sceneId, error, password, overlay } = options;
  const params = new URLSearchParams();
  if (section && section !== "agenda") {
    params.set("section", section);
  }
  if (teamId) {
    params.set("team", teamId);
  }
  if (agendaItemId) {
    params.set("agendaItem", agendaItemId);
  }
  if (sceneId) {
    params.set("scene", sceneId);
  }
  if (error) {
    params.set("error", error);
  }
  if (password) {
    params.set("password", password);
  }
  if (overlay) {
    params.set("overlay", overlay);
  }

  const query = params.toString();
  return withLang(query ? `/admin/instances/${instanceId}?${query}` : `/admin/instances/${instanceId}`, lang);
}

// Legacy compatibility during the route split. The old admin page model treated all links
// as one-page instance-scoped links; keep that shape available while control-room code migrates.
export function buildAdminHref(options: {
  lang: UiLanguage;
  section?: ControlRoomSection | LegacyAdminSection;
  instanceId?: string;
  teamId?: string | null;
  agendaItemId?: string | null;
  sceneId?: string | null;
  error?: string | null;
  password?: string | null;
  overlay?: ControlRoomOverlay | null;
}) {
  if (!options.instanceId) {
    return buildAdminWorkspaceHref({ lang: options.lang });
  }

  const section =
    options.section && options.section in legacyAdminSectionMap
      ? legacyAdminSectionMap[options.section as LegacyAdminSection]
      : resolveControlRoomSection(String(options.section ?? ""));

  return buildAdminInstanceHref({
    lang: options.lang,
    instanceId: options.instanceId,
    section,
    teamId: options.teamId,
    agendaItemId: options.agendaItemId,
    sceneId: options.sceneId,
    error: options.error,
    password: options.password,
    overlay: options.overlay,
  });
}

export function buildLegacyAdminRedirectHref(options: {
  lang: UiLanguage;
  instanceId: string;
  section?: string;
  teamId?: string | null;
  agendaItemId?: string | null;
  sceneId?: string | null;
  error?: string | null;
  password?: string | null;
}) {
  return buildAdminInstanceHref({
    lang: options.lang,
    instanceId: options.instanceId,
    section: mapLegacyAdminSectionToControlRoomSection(options.section),
    teamId: options.teamId,
    agendaItemId: options.agendaItemId,
    sceneId: options.sceneId,
    error: options.error,
    password: options.password,
  });
}

export function readControlRoomActionState(formData: FormData) {
  return {
    lang: resolveUiLanguage(String(formData.get("lang") ?? "")),
    section: resolveControlRoomSection(String(formData.get("section") ?? "")),
    instanceId: String(formData.get("instanceId") ?? "").trim(),
  };
}

export const readActionState = readControlRoomActionState;

export function resolveControlRoomOverlay(value: string | undefined): ControlRoomOverlay | null {
  return controlRoomOverlays.find((overlay) => overlay === value) ?? null;
}

export function resolveWorkspaceStatusFilter(value: string | undefined): WorkspaceInstanceStatusFilter {
  return ["created", "prepared", "running", "archived"].includes(String(value))
    ? (value as WorkspaceInstanceStatusFilter)
    : "all";
}

export function readWorkspaceFilters(searchParams: { q?: string; status?: string } | undefined) {
  return {
    query: searchParams?.q?.trim() ?? "",
    status: resolveWorkspaceStatusFilter(searchParams?.status),
  };
}

export function getWorkshopDisplayTitle(instance: WorkshopInstanceRecord) {
  return instance.workshopMeta.eventTitle?.trim() || instance.workshopMeta.title || instance.id;
}

export function getWorkshopLocationLines(instance: WorkshopInstanceRecord) {
  const lines = [
    [instance.workshopMeta.venueName, instance.workshopMeta.roomName].filter(Boolean).join(" • "),
    [instance.workshopMeta.addressLine, instance.workshopMeta.city].filter(Boolean).join(", "),
    instance.workshopMeta.locationDetails ?? "",
  ].filter(Boolean);

  return lines;
}

export function filterWorkshopInstances(
  instances: WorkshopInstanceRecord[],
  filters: { query: string; status: WorkspaceInstanceStatusFilter },
) {
  const query = filters.query.trim().toLowerCase();

  return instances.filter((instance) => {
    if (filters.status !== "all" && instance.status !== filters.status) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      instance.id,
      getWorkshopDisplayTitle(instance),
      instance.workshopMeta.city,
      instance.workshopMeta.dateRange,
      instance.workshopMeta.venueName,
      instance.workshopMeta.roomName,
      instance.workshopMeta.addressLine,
      instance.workshopMeta.facilitatorLabel,
      instance.workshopMeta.currentPhaseLabel,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function buildWorkspaceStatusSummary(instances: WorkshopInstanceRecord[]) {
  return {
    all: instances.length,
    created: instances.filter((instance) => instance.status === "created").length,
    prepared: instances.filter((instance) => instance.status === "prepared").length,
    running: instances.filter((instance) => instance.status === "running").length,
    archived: instances.filter((instance) => instance.status === "archived").length,
  };
}

export function buildWorkspaceStatusLabel(copy: AdminCopy, status: WorkshopInstanceRecord["status"]) {
  const labels: Record<WorkshopInstanceRecord["status"], string> = {
    created: copy.instanceStatusCreated,
    prepared: copy.instanceStatusPrepared,
    running: copy.instanceStatusRunning,
    archived: copy.instanceStatusArchived,
    removed: copy.instanceStatusRemoved,
  };

  return labels[status];
}

export function deriveControlRoomPageState(
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

export const deriveAdminPageState = deriveControlRoomPageState;

export function resolveActiveInstanceId(
  availableInstances: WorkshopInstanceRecord[],
  requestedInstanceId: string | undefined,
  defaultInstanceId: string,
) {
  return availableInstances.find((instance) => instance.id === requestedInstanceId)?.id ?? defaultInstanceId;
}

export function buildControlRoomSummaryStats(options: {
  copy: AdminCopy;
  state: WorkshopState;
  selectedInstance: WorkshopInstanceRecord | null;
  currentAgendaItem: AgendaItem | undefined;
}) {
  const { copy, state, selectedInstance, currentAgendaItem } = options;

  return [
    {
      label: copy.activeInstance,
      value: selectedInstance ? getWorkshopDisplayTitle(selectedInstance) : state.workshopMeta.eventTitle?.trim() || state.workshopId,
      hint: state.workshopId,
    },
    {
      label: copy.currentPhase,
      value: currentAgendaItem?.title ?? state.workshopMeta.currentPhaseLabel,
      hint: currentAgendaItem?.time ?? "",
    },
    {
      label: copy.participantSurfaceCardTitle,
      value: state.rotation.revealed ? copy.participantStateUnlocked : copy.participantStateHidden,
      hint: state.rotation.scenario,
    },
    {
      label: copy.teams,
      value: `${state.teams.length}`,
      hint: selectedInstance?.workshopMeta.dateRange ?? "",
    },
  ];
}

export const buildAdminSummaryStats = buildControlRoomSummaryStats;

export function buildControlRoomLiveState(options: {
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
      { label: copy.rotation, value: state.rotation.scenario },
      { label: copy.teams, value: `${state.teams.length}` },
    ],
    liveNowTitle: `${currentAgendaItem?.time ?? ""}${currentAgendaItem ? " • " : ""}${currentAgendaItem?.title ?? ""}`.trim(),
    liveNowDescription: currentAgendaItem?.roomSummary || currentAgendaItem?.description || "",
    nextUpLabel: nextAgendaItem ? `${copy.nextUp}: ${nextAgendaItem.time} • ${nextAgendaItem.title}` : null,
    agendaLink: buildAdminInstanceHref({ lang, section: "agenda", instanceId: activeInstanceId }),
    phaseOptions: state.agenda.map((item) => ({
      id: item.id,
      label: `${item.time} • ${item.title}`,
    })),
    participantState: state.rotation.revealed ? copy.participantStateUnlocked : copy.participantStateHidden,
  };
}

export const buildAdminOverviewState = buildControlRoomLiveState;

export function buildControlRoomSessionState(options: {
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

export const buildAdminSessionState = buildControlRoomSessionState;

export const resolveAdminSection = resolveControlRoomSection;
