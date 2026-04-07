import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn();
const resetPassword = vi.fn();

let authMock: {
  resetPassword: typeof resetPassword;
} | null;

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("@/lib/auth/server", () => ({
  get auth() {
    return authMock;
  },
}));

describe("reset password page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    authMock = {
      resetPassword,
    };
    resetPassword.mockResolvedValue({ error: null });
  });

  it("renders the missing token state when no reset token is present", async () => {
    const { default: ResetPasswordPage } = await import("./page");

    const view = await ResetPasswordPage({
      searchParams: Promise.resolve({ lang: "en" }),
    });

    expect(view).toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("renders the password reset form when a token is present", async () => {
    const { default: ResetPasswordPage } = await import("./page");

    const view = await ResetPasswordPage({
      searchParams: Promise.resolve({ lang: "cs", token: "reset-token", error: "password_mismatch" }),
    });

    expect(view).toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects to sign-in when auth is unavailable", async () => {
    authMock = null;
    const { resetPasswordAction } = await import("./page");
    const formData = new FormData();
    formData.set("lang", "en");

    await resetPasswordAction(formData);

    expect(redirect).toHaveBeenCalledWith("/admin/sign-in?error=unavailable&lang=en");
  });

  it("redirects when the reset token is missing", async () => {
    const { resetPasswordAction } = await import("./page");
    const formData = new FormData();
    formData.set("lang", "en");
    formData.set("newPassword", "secret");
    formData.set("confirmPassword", "secret");

    await resetPasswordAction(formData);

    expect(redirect).toHaveBeenCalledWith("/admin/reset-password?error=missing_token&lang=en");
  });

  it("redirects when the passwords do not match", async () => {
    const { resetPasswordAction } = await import("./page");
    const formData = new FormData();
    formData.set("lang", "en");
    formData.set("token", "reset-token");
    formData.set("newPassword", "secret");
    formData.set("confirmPassword", "different");

    await resetPasswordAction(formData);

    expect(redirect).toHaveBeenCalledWith("/admin/reset-password?error=password_mismatch&lang=en");
  });

  it("redirects with an encoded auth error", async () => {
    resetPassword.mockResolvedValue({ error: { message: "token expired" } });
    const { resetPasswordAction } = await import("./page");
    const formData = new FormData();
    formData.set("lang", "en");
    formData.set("token", "reset-token");
    formData.set("newPassword", "secret");
    formData.set("confirmPassword", "secret");

    await resetPasswordAction(formData);

    expect(resetPassword).toHaveBeenCalledWith({
      token: "reset-token",
      newPassword: "secret",
    });
    expect(redirect).toHaveBeenCalledWith("/admin/reset-password?error=token%20expired&lang=en");
  });

  it("redirects back to sign-in after a successful reset", async () => {
    const { resetPasswordAction } = await import("./page");
    const formData = new FormData();
    formData.set("token", "reset-token");
    formData.set("newPassword", "secret");
    formData.set("confirmPassword", "secret");

    await resetPasswordAction(formData);

    expect(redirect).toHaveBeenCalledWith("/admin/sign-in?reset=done");
  });
});
