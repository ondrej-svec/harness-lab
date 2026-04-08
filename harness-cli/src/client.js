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
    const response = await fetchFn(`${baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        accept: "application/json",
        ...authHeaders,
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
    getAgenda() {
      return request("/api/agenda");
    },
    setCurrentPhase(currentId) {
      return request("/api/agenda", { method: "PATCH", body: { currentId } });
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
  };
}
