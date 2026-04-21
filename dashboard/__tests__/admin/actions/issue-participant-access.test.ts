import { beforeEach, describe, expect, it, vi } from "vitest";

const requireFacilitatorActionAccess = vi.fn();
const getFacilitatorSession = vi.fn();
const issueParticipantEventAccess = vi.fn();
const redirect = vi.fn((href: string) => {
  const err = new Error(`NEXT_REDIRECT: ${href}`);
  (err as Error & { __redirectHref?: string }).__redirectHref = href;
  throw err;
});
const cookieStoreSet = vi.fn();

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ set: cookieStoreSet }),
}));

vi.mock("@/lib/facilitator-access", () => ({
  requireFacilitatorActionAccess,
}));

vi.mock("@/lib/facilitator-session", () => ({
  getFacilitatorSession,
}));

vi.mock("@/lib/admin-page-view-model", () => ({
  readActionState: (formData: FormData) => ({
    lang: String(formData.get("lang") ?? "en"),
    section: String(formData.get("section") ?? "access"),
    instanceId: String(formData.get("instanceId") ?? ""),
  }),
  buildAdminHref: ({ instanceId, section }: { instanceId: string; section: string }) =>
    `/admin/instances/${instanceId}?section=${section}`,
}));

vi.mock("@/lib/neon-db", () => ({
  getNeonSql: () => ({ query: vi.fn() }),
}));

vi.mock("@/lib/instance-grant-repository", () => ({
  getInstanceGrantRepository: () => ({
    getActiveGrantByNeonUserId: vi.fn(),
    createGrant: vi.fn(),
    revokeGrant: vi.fn(),
  }),
}));

vi.mock("@/lib/audit-log-repository", () => ({
  getAuditLogRepository: () => ({
    append: vi.fn(),
  }),
}));

vi.mock("@/lib/workshop-instance-repository", () => ({
  getWorkshopInstanceRepository: () => ({
    getInstance: vi.fn(),
    updateInstance: vi.fn(),
  }),
}));

vi.mock("@/lib/participant-access-management", () => ({
  issueParticipantEventAccess,
}));

const actionModulePromise = import("@/app/admin/instances/[id]/_actions/access");

function buildFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("lang", "en");
  fd.set("section", "access");
  fd.set("instanceId", "sample-studio-a");
  for (const [key, value] of Object.entries(overrides)) {
    fd.set(key, value);
  }
  return fd;
}

function getExpiresAtArg(): string | undefined {
  const call = issueParticipantEventAccess.mock.calls[0];
  return call?.[0]?.expiresAt;
}

describe("issueParticipantAccessAction — expiration choice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireFacilitatorActionAccess.mockResolvedValue(undefined);
    getFacilitatorSession.mockResolvedValue({ neonUserId: "neon-123" });
    issueParticipantEventAccess.mockResolvedValue({
      ok: true,
      issuedCode: "lantern-8-context-4",
      access: { codeId: "code-1" },
    });
  });

  it("omits expiresAt when the form field is missing (backend default applies)", async () => {
    const { issueParticipantAccessAction } = await actionModulePromise;
    await issueParticipantAccessAction(buildFormData()).catch(() => undefined);
    expect(getExpiresAtArg()).toBeUndefined();
  });

  it("passes expiresAt ~14 days out when expiresInDays=14 (default dropdown)", async () => {
    const { issueParticipantAccessAction } = await actionModulePromise;
    const before = Date.now();
    await issueParticipantAccessAction(buildFormData({ expiresInDays: "14" })).catch(() => undefined);
    const arg = getExpiresAtArg();
    expect(arg).toBeDefined();
    const parsed = Date.parse(arg as string);
    expect(parsed - before).toBeGreaterThanOrEqual(14 * 24 * 60 * 60 * 1000 - 1_000);
    expect(parsed - before).toBeLessThanOrEqual(14 * 24 * 60 * 60 * 1000 + 1_000);
  });

  it("clamps expiresInDays to 365 when caller sends something absurd", async () => {
    const { issueParticipantAccessAction } = await actionModulePromise;
    const before = Date.now();
    await issueParticipantAccessAction(buildFormData({ expiresInDays: "9999" })).catch(() => undefined);
    const arg = getExpiresAtArg();
    expect(arg).toBeDefined();
    const parsed = Date.parse(arg as string);
    expect(parsed - before).toBeLessThanOrEqual(365 * 24 * 60 * 60 * 1000 + 1_000);
  });

  it("treats non-numeric expiresInDays as missing (backend default)", async () => {
    const { issueParticipantAccessAction } = await actionModulePromise;
    await issueParticipantAccessAction(buildFormData({ expiresInDays: "custom" })).catch(() => undefined);
    expect(getExpiresAtArg()).toBeUndefined();
  });

  it("rejects non-positive expiresInDays as missing", async () => {
    const { issueParticipantAccessAction } = await actionModulePromise;
    await issueParticipantAccessAction(buildFormData({ expiresInDays: "0" })).catch(() => undefined);
    expect(getExpiresAtArg()).toBeUndefined();
  });
});
