import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const getSession = vi.fn();
const redirect = vi.fn();
const approveDeviceAuthorizationForCurrentSession = vi.fn();
const denyDeviceAuthorization = vi.fn();

let authMock: {
  getSession: typeof getSession;
} | null;

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("@/lib/auth/server", () => ({
  get auth() {
    return authMock;
  },
}));

vi.mock("@/lib/auth/neon-auth-proxy", () => ({
  getSession: () => getSession(),
}));

vi.mock("@/lib/facilitator-cli-auth-repository", () => ({
  approveDeviceAuthorizationForCurrentSession,
  denyDeviceAuthorization,
}));

describe("admin device page", () => {
  let originalNeonAuthBaseUrl: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    authMock = {
      getSession,
    };
    originalNeonAuthBaseUrl = process.env.NEON_AUTH_BASE_URL;
    process.env.NEON_AUTH_BASE_URL = "https://auth.example.com";
    approveDeviceAuthorizationForCurrentSession.mockResolvedValue({ ok: true });
    denyDeviceAuthorization.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    if (originalNeonAuthBaseUrl === undefined) delete process.env.NEON_AUTH_BASE_URL;
    else process.env.NEON_AUTH_BASE_URL = originalNeonAuthBaseUrl;
  });

  it("shows the facilitator sign-in gate when no session exists", async () => {
    const { default: AdminDevicePage } = await import("./page");
    getSession.mockResolvedValue({ data: null });

    const view = await AdminDevicePage({
      searchParams: Promise.resolve({ user_code: "abcd-efgh" }),
    });

    expect(view).toBeTruthy();
  });

  it("shows the approval surface for an authenticated facilitator", async () => {
    const { default: AdminDevicePage } = await import("./page");
    getSession.mockResolvedValue({
      data: {
        user: { id: "user-1", email: "facilitator@example.com" },
      },
    });

    const view = await AdminDevicePage({
      searchParams: Promise.resolve({ user_code: "abcd-efgh", approved: "ABCD-EFGH" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain("Device code approved");
    expect(html).toContain("approve another code");
    expect(html).not.toContain("approve cli login");
  });

  it("redirects when approve is submitted without a code", async () => {
    const { approveAction } = await import("./page");

    await approveAction(new FormData());

    expect(redirect).toHaveBeenCalledWith("/admin/device?error=missing_code");
  });

  it("redirects to the approved state after a successful approval", async () => {
    const { approveAction } = await import("./page");
    const formData = new FormData();
    formData.set("userCode", " abcd-efgh ");

    await approveAction(formData);

    expect(approveDeviceAuthorizationForCurrentSession).toHaveBeenCalledWith("ABCD-EFGH");
    expect(redirect).toHaveBeenCalledWith("/admin/device?approved=ABCD-EFGH");
  });

  it("redirects with the repository error when approval fails", async () => {
    approveDeviceAuthorizationForCurrentSession.mockResolvedValue({ ok: false, error: "approval_failed" });
    const { approveAction } = await import("./page");
    const formData = new FormData();
    formData.set("userCode", "ABCD-EFGH");

    await approveAction(formData);

    expect(redirect).toHaveBeenCalledWith("/admin/device?error=approval_failed");
  });

  it("redirects when deny is submitted without a code", async () => {
    const { denyAction } = await import("./page");

    await denyAction(new FormData());

    expect(redirect).toHaveBeenCalledWith("/admin/device?error=missing_code");
  });

  it("redirects to the denied state after a successful denial", async () => {
    const { denyAction } = await import("./page");
    const formData = new FormData();
    formData.set("userCode", " abcd-efgh ");

    await denyAction(formData);

    expect(denyDeviceAuthorization).toHaveBeenCalledWith("ABCD-EFGH");
    expect(redirect).toHaveBeenCalledWith("/admin/device?denied=ABCD-EFGH");
  });

  it("redirects with the repository error when deny fails", async () => {
    denyDeviceAuthorization.mockResolvedValue({ ok: false, error: "deny_failed" });
    const { denyAction } = await import("./page");
    const formData = new FormData();
    formData.set("userCode", "ABCD-EFGH");

    await denyAction(formData);

    expect(redirect).toHaveBeenCalledWith("/admin/device?error=deny_failed");
  });
});
