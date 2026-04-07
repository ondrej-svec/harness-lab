import { beforeEach, describe, expect, it, vi } from "vitest";

const headers = vi.fn();
const redirect = vi.fn();
const getSession = vi.fn();

vi.mock("next/headers", () => ({
  headers,
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("@/lib/auth/server", () => ({
  auth: {
    getSession,
    signIn: {
      email: vi.fn(),
    },
    requestPasswordReset: vi.fn(),
  },
}));

const signInPageModulePromise = import("./page");

describe("facilitator sign-in page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headers.mockResolvedValue(new Headers([["host", "localhost:3000"]]));
    getSession.mockResolvedValue({ data: null });
  });

  it("renders the sign-in surface for unauthenticated facilitators", async () => {
    const { default: SignInPage } = await signInPageModulePromise;

    const view = await SignInPage({
      searchParams: Promise.resolve({ lang: "en" }),
    });

    expect(view).toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects authenticated facilitators back to admin", async () => {
    const { default: SignInPage } = await signInPageModulePromise;
    getSession.mockResolvedValue({
      data: {
        user: { id: "user-1", email: "facilitator@example.com" },
      },
    });

    const view = await SignInPage({
      searchParams: Promise.resolve({ lang: "cs" }),
    });

    expect(view).toBeTruthy();
    expect(redirect).toHaveBeenCalledWith("/admin");
  });

  it("renders the unavailable state when auth is not configured", async () => {
    vi.resetModules();
    vi.doMock("next/headers", () => ({
      headers,
    }));
    vi.doMock("next/navigation", () => ({
      redirect,
    }));
    vi.doMock("@/lib/auth/server", () => ({
      auth: null,
    }));

    const { default: SignInPage } = await import("./page");
    const view = await SignInPage({
      searchParams: Promise.resolve({ lang: "en", error: "unavailable" }),
    });

    expect(view).toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });
});
