export class HarnessApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "HarnessApiError";
    this.status = details.status ?? null;
    this.payload = details.payload ?? null;
  }
}

function normalizeBaseUrl(url) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

async function parseJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function createHarnessClient({ fetchFn, session }) {
  if (!session?.dashboardUrl) {
    throw new HarnessApiError("Missing session configuration");
  }

  const baseUrl = normalizeBaseUrl(session.dashboardUrl);
  const authHeaders = {};

  if (session.authorizationHeader) {
    authHeaders.authorization = session.authorizationHeader;
  }

  if (session.cookieHeader) {
    authHeaders.cookie = session.cookieHeader;
  }

  if (session.accessToken) {
    authHeaders.authorization = `Bearer ${session.accessToken}`;
  }

  async function request(path, options = {}) {
    const method = options.method ?? "GET";
    const response = await fetchFn(`${baseUrl}${path}`, {
      method,
      headers: {
        accept: "application/json",
        ...authHeaders,
        ...(method !== "GET" && method !== "HEAD" ? { origin: baseUrl } : {}),
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...(options.headers ?? {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const payload = await parseJsonResponse(response);
    if (!response.ok) {
      const message =
        payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
          ? payload.error
          : `Request failed with status ${response.status}`;
      throw new HarnessApiError(message, { status: response.status, payload });
    }

    return payload;
  }

  return {
    verifyAccess() {
      return request("/api/workshop");
    },
    getAuthSession() {
      return request("/api/auth/get-session");
    },
    signOutAuthSession() {
      return request("/api/auth/sign-out", { method: "POST" });
    },
    startDeviceAuthorization() {
      return request("/api/auth/device/start", { method: "POST" });
    },
    pollDeviceAuthorization(deviceCode) {
      return request("/api/auth/device/poll", { method: "POST", body: { deviceCode } });
    },
    getDeviceSession() {
      return request("/api/auth/device/session");
    },
    signOutDeviceSession() {
      return request("/api/auth/device/logout", { method: "POST" });
    },
    getWorkshopStatus() {
      return request("/api/workshop");
    },
    listWorkshopInstances() {
      return request("/api/workshop/instances");
    },
    getWorkshopInstance(instanceId) {
      return request(`/api/workshop/instances/${encodeURIComponent(instanceId)}`);
    },
    getWorkshopParticipantAccess(instanceId) {
      return request(`/api/workshop/instances/${encodeURIComponent(instanceId)}/participant-access`);
    },
    issueWorkshopParticipantAccess(instanceId, input = {}) {
      return request(`/api/workshop/instances/${encodeURIComponent(instanceId)}/participant-access`, {
        method: "POST",
        body: { action: "rotate", ...input },
      });
    },
    getAgenda() {
      return request("/api/agenda");
    },
    getWorkshopAgenda(instanceId) {
      return request(`/api/workshop/instances/${encodeURIComponent(instanceId)}/agenda`);
    },
    setCurrentPhase(currentId) {
      return request("/api/agenda", { method: "PATCH", body: { currentId } });
    },
    setCurrentPhaseForInstance(instanceId, currentId) {
      return request(`/api/workshop/instances/${encodeURIComponent(instanceId)}/agenda`, {
        method: "PATCH",
        body: { itemId: currentId },
      });
    },
    archiveWorkshop(notes) {
      return request("/api/workshop/archive", { method: "POST", body: notes ? { notes } : {} });
    },
    createWorkshopInstance(input) {
      return request("/api/workshop/instances", { method: "POST", body: input });
    },
    updateWorkshopInstance(instanceId, input) {
      return request(`/api/workshop/instances/${encodeURIComponent(instanceId)}`, {
        method: "PATCH",
        body: { action: "update_metadata", ...input },
      });
    },
    resetWorkshopInstance(instanceId, templateId, blueprint) {
      return request(`/api/workshop/instances/${encodeURIComponent(instanceId)}`, {
        method: "PATCH",
        body: {
          action: "reset",
          ...(templateId ? { templateId } : {}),
          ...(blueprint ? { blueprint } : {}),
        },
      });
    },
    prepareWorkshopInstance(instanceId) {
      return request("/api/workshop", {
        method: "POST",
        body: { action: "prepare", instanceId },
      });
    },
    removeWorkshopInstance(instanceId) {
      return request(`/api/workshop/instances/${encodeURIComponent(instanceId)}`, {
        method: "PATCH",
        body: { action: "remove" },
      });
    },

    // Participant methods
    async redeemEventAccess(eventCode) {
      const url = `${baseUrl}/api/event-access/redeem`;
      const response = await fetchFn(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          origin: baseUrl,
        },
        body: JSON.stringify({ eventCode }),
      });
      const data = await response.json();
      const setCookie = response.headers.getSetCookie?.() ?? [];
      return { ...data, setCookie, status: response.status };
    },
    logoutParticipant() {
      return request("/api/event-access/logout", { method: "POST" });
    },
    getBriefs() {
      return request("/api/briefs");
    },
    getChallenges() {
      return request("/api/challenges");
    },
    getTeams() {
      return request("/api/teams");
    },
    getCheckpoints() {
      return request("/api/checkpoints");
    },
    getParticipantContext() {
      return request("/api/event-context/core");
    },
  };
}
