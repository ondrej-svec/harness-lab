import { beforeEach, describe, expect, it, vi } from "vitest";

const requireFacilitatorActionAccess = vi.fn();
const redirect = vi.fn((href: string) => {
  // Mirror Next.js behavior: redirect() throws NEXT_REDIRECT in real life.
  // We throw a tagged error so tests can assert the redirect happened and
  // inspect the target href, without pulling in the real Next.js runtime.
  const err = new Error(`NEXT_REDIRECT: ${href}`);
  (err as Error & { __redirectHref?: string }).__redirectHref = href;
  throw err;
});
const updateInstance = vi.fn();
const getInstance = vi.fn();
const appendAudit = vi.fn();

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("@/lib/facilitator-access", () => ({
  requireFacilitatorActionAccess,
}));

vi.mock("@/lib/admin-page-view-model", () => ({
  readActionState: (formData: FormData) => ({
    lang: String(formData.get("lang") ?? "en"),
    section: String(formData.get("section") ?? "settings"),
    instanceId: String(formData.get("instanceId") ?? ""),
  }),
  buildAdminHref: ({ instanceId, section }: { instanceId: string; section: string; error?: string }) =>
    `/admin/instances/${instanceId}?section=${section}`,
}));

vi.mock("@/lib/workshop-instance-repository", () => ({
  getWorkshopInstanceRepository: () => ({
    getInstance,
    updateInstance,
  }),
}));

vi.mock("@/lib/audit-log-repository", () => ({
  getAuditLogRepository: () => ({
    append: appendAudit,
  }),
}));

const actionModulePromise = import("@/app/admin/instances/[id]/_actions/lifecycle");

function buildFormData({
  instanceId,
  confirmation,
}: {
  instanceId: string;
  confirmation: string;
}): FormData {
  const fd = new FormData();
  fd.set("instanceId", instanceId);
  fd.set("lang", "en");
  fd.set("section", "settings");
  fd.set("confirmation", confirmation);
  return fd;
}

describe("endWorkshopAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireFacilitatorActionAccess.mockResolvedValue(undefined);
  });

  it("writes status=ended + audit entry when confirmation matches and instance is not yet ended", async () => {
    getInstance.mockResolvedValue({
      id: "sample-studio-a",
      status: "running",
      workshopMeta: { title: "Sample", contentLang: "en" },
    });

    const { endWorkshopAction } = await actionModulePromise;

    const err = await endWorkshopAction(
      buildFormData({ instanceId: "sample-studio-a", confirmation: "sample-studio-a" }),
    ).catch((e: Error) => e);

    // redirect throws — that's the success path
    expect((err as Error & { __redirectHref?: string }).__redirectHref).toBe(
      "/admin/instances/sample-studio-a?section=settings",
    );

    expect(updateInstance).toHaveBeenCalledWith(
      "sample-studio-a",
      expect.objectContaining({ status: "ended" }),
    );
    expect(appendAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "instance_ended",
        instanceId: "sample-studio-a",
        result: "success",
        metadata: { previousStatus: "running" },
      }),
    );
  });

  it("refuses when confirmation text does not match the instance id", async () => {
    const { endWorkshopAction } = await actionModulePromise;

    const err = await endWorkshopAction(
      buildFormData({ instanceId: "sample-studio-a", confirmation: "wrong-id" }),
    ).catch((e: Error) => e);

    expect((err as Error & { __redirectHref?: string }).__redirectHref).toContain("endError=confirm");
    expect(getInstance).not.toHaveBeenCalled();
    expect(updateInstance).not.toHaveBeenCalled();
    expect(appendAudit).not.toHaveBeenCalled();
  });

  it("is idempotent — does nothing when instance is already ended", async () => {
    getInstance.mockResolvedValue({
      id: "sample-studio-a",
      status: "ended",
      workshopMeta: { title: "Sample", contentLang: "en" },
    });

    const { endWorkshopAction } = await actionModulePromise;

    await endWorkshopAction(
      buildFormData({ instanceId: "sample-studio-a", confirmation: "sample-studio-a" }),
    ).catch(() => undefined);

    expect(getInstance).toHaveBeenCalled();
    expect(updateInstance).not.toHaveBeenCalled();
    expect(appendAudit).not.toHaveBeenCalled();
  });
});
