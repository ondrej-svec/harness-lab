import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("@/lib/auth/server", () => ({
  auth: {
    resetPassword: vi.fn(),
  },
}));

const resetPasswordPageModulePromise = import("./page");

describe("reset password page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the missing token state when no reset token is present", async () => {
    const { default: ResetPasswordPage } = await resetPasswordPageModulePromise;

    const view = await ResetPasswordPage({
      searchParams: Promise.resolve({ lang: "en" }),
    });

    expect(view).toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("renders the password reset form when a token is present", async () => {
    const { default: ResetPasswordPage } = await resetPasswordPageModulePromise;

    const view = await ResetPasswordPage({
      searchParams: Promise.resolve({ lang: "cs", token: "reset-token", error: "password_mismatch" }),
    });

    expect(view).toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });
});
