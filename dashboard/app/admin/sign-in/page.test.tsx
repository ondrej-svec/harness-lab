import { beforeEach, describe, expect, it, vi } from "vitest";

const headers = vi.fn();
const redirect = vi.fn();
const getSession = vi.fn();
const signInEmail = vi.fn();
const requestPasswordReset = vi.fn();

let authMock: {
  getSession: typeof getSession;
  signIn: { email: typeof signInEmail };
  requestPasswordReset: typeof requestPasswordReset;
} | null;

vi.mock("next/headers", () => ({
  headers,
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("@/lib/auth/server", () => ({
  get auth() {
    return authMock;
  },
}));

describe("facilitator sign-in page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    authMock = {
      getSession,
      signIn: { email: signInEmail },
      requestPasswordReset,
    };

    headers.mockResolvedValue(new Headers([["host", "localhost:3000"]]));
    getSession.mockResolvedValue({ data: null });
    signInEmail.mockResolvedValue({ error: null });
    requestPasswordReset.mockResolvedValue({ error: null });
  });

  it("derives the forwarded request origin when proxy headers are present", async () => {
    headers.mockResolvedValue(
      new Headers([
        ["x-forwarded-host", "dashboard.example.com"],
        ["x-forwarded-proto", "https"],
      ]),
    );
    const { getRequestOrigin } = await import("./page");

    await expect(getRequestOrigin()).resolves.toBe("https://dashboard.example.com");
  });

  it("falls back to http for localhost hosts", async () => {
    headers.mockResolvedValue(new Headers([["host", "localhost:3000"]]));
    const { getRequestOrigin } = await import("./page");

    await expect(getRequestOrigin()).resolves.toBe("http://localhost:3000");
  });

  it("returns null when request host headers are missing", async () => {
    headers.mockResolvedValue(new Headers());
    const { getRequestOrigin } = await import("./page");

    await expect(getRequestOrigin()).resolves.toBeNull();
  });

  it("renders the sign-in surface for unauthenticated facilitators", async () => {
    const { default: SignInPage } = await import("./page");

    const view = await SignInPage({
      searchParams: Promise.resolve({ lang: "en" }),
    });

    expect(view).toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects authenticated facilitators back to admin", async () => {
    const { default: SignInPage } = await import("./page");
    getSession.mockResolvedValue({
      data: {
        user: { id: "user-1", email: "facilitator@example.com" },
      },
    });

    const view = await SignInPage({
      searchParams: Promise.resolve({ lang: "en" }),
    });

    expect(view).toBeUndefined();
    expect(redirect).toHaveBeenCalledWith("/admin?lang=en");
  });

  it("renders the unavailable state when auth is not configured", async () => {
    authMock = null;
    const { default: SignInPage } = await import("./page");

    const view = await SignInPage({
      searchParams: Promise.resolve({ lang: "en", error: "unavailable" }),
    });

    expect(view).toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects to unavailable when sign-in auth is missing", async () => {
    authMock = null;
    const { signInAction } = await import("./page");
    const formData = new FormData();
    formData.set("lang", "en");

    await signInAction(formData);

    expect(redirect).toHaveBeenCalledWith("/admin/sign-in?error=unavailable&lang=en");
  });

  it("redirects with an encoded sign-in error from auth", async () => {
    signInEmail.mockResolvedValue({ error: { message: "bad password" } });
    const { signInAction } = await import("./page");
    const formData = new FormData();
    formData.set("lang", "en");
    formData.set("email", " facilitator@example.com ");
    formData.set("password", "secret");

    await signInAction(formData);

    expect(signInEmail).toHaveBeenCalledWith({
      email: "facilitator@example.com",
      password: "secret",
    });
    expect(redirect).toHaveBeenCalledWith("/admin/sign-in?error=bad%20password&lang=en");
  });

  it("redirects when a sign-in does not create a session", async () => {
    getSession.mockResolvedValue({ data: null });
    const { signInAction } = await import("./page");
    const formData = new FormData();
    formData.set("lang", "en");
    formData.set("email", "facilitator@example.com");
    formData.set("password", "secret");

    await signInAction(formData);

    expect(redirect).toHaveBeenCalledWith("/admin/sign-in?error=session_not_created&lang=en");
  });

  it("redirects to the admin dashboard after a successful sign-in", async () => {
    getSession.mockResolvedValue({
      data: {
        session: { id: "session-1" },
        user: { id: "user-1" },
      },
    });
    const { signInAction } = await import("./page");
    const formData = new FormData();
    formData.set("email", "facilitator@example.com");
    formData.set("password", "secret");

    await signInAction(formData);

    expect(redirect).toHaveBeenCalledWith("/admin");
  });

  it("redirects to unavailable when password reset auth is missing", async () => {
    authMock = null;
    const { requestPasswordResetAction } = await import("./page");
    const formData = new FormData();
    formData.set("lang", "en");

    await requestPasswordResetAction(formData);

    expect(redirect).toHaveBeenCalledWith("/admin/sign-in?error=unavailable&lang=en");
  });

  it("requests a password reset with an origin-aware reset URL", async () => {
    headers.mockResolvedValue(new Headers([["host", "localhost:3000"]]));
    const { requestPasswordResetAction } = await import("./page");
    const formData = new FormData();
    formData.set("lang", "en");
    formData.set("email", " facilitator@example.com ");

    await requestPasswordResetAction(formData);

    expect(requestPasswordReset).toHaveBeenCalledWith({
      email: "facilitator@example.com",
      redirectTo: "http://localhost:3000/admin/reset-password?lang=en",
    });
    expect(redirect).toHaveBeenCalledWith("/admin/sign-in?reset=requested&lang=en");
  });

  it("redirects with an encoded password reset error", async () => {
    requestPasswordReset.mockResolvedValue({ error: { message: "reset blocked" } });
    const { requestPasswordResetAction } = await import("./page");
    const formData = new FormData();
    formData.set("lang", "en");
    formData.set("email", "facilitator@example.com");

    await requestPasswordResetAction(formData);

    expect(redirect).toHaveBeenCalledWith("/admin/sign-in?error=reset%20blocked&lang=en");
  });
});
