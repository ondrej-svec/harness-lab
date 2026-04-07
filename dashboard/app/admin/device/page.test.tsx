import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();

vi.mock("@/lib/auth/server", () => ({
  auth: {
    getSession,
  },
}));

vi.mock("@/lib/facilitator-cli-auth-repository", () => ({
  approveDeviceAuthorizationForCurrentSession: vi.fn(),
  denyDeviceAuthorization: vi.fn(),
}));

const adminDevicePageModulePromise = import("./page");

describe("admin device page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the facilitator sign-in gate when no session exists", async () => {
    const { default: AdminDevicePage } = await adminDevicePageModulePromise;
    getSession.mockResolvedValue({ data: null });

    const view = await AdminDevicePage({
      searchParams: Promise.resolve({ user_code: "abcd-efgh" }),
    });

    expect(view).toBeTruthy();
  });

  it("shows the approval surface for an authenticated facilitator", async () => {
    const { default: AdminDevicePage } = await adminDevicePageModulePromise;
    getSession.mockResolvedValue({
      data: {
        user: { id: "user-1", email: "facilitator@example.com" },
      },
    });

    const view = await AdminDevicePage({
      searchParams: Promise.resolve({ user_code: "abcd-efgh", approved: "ABCD-EFGH" }),
    });

    expect(view).toBeTruthy();
  });
});
