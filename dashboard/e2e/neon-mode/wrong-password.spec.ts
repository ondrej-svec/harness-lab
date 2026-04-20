/**
 * Spec (c) from Phase 5.6 Layer 3:
 *   wrong password → generic error → retry → room
 *
 * Confirms the returning-identify path surfaces the
 * "that didn't match" copy without leaking whether the email or the
 * password was the wrong half.
 */

import { expect, redeemEventCode, signOutParticipant, test, uniqueTestEmail } from "./fixtures";

test("returning identify with wrong password shows generic error, then succeeds on retry", async ({ page }) => {
  const email = uniqueTestEmail();
  const password = "longenoughpassword";

  // First-time identify to establish the account.
  await redeemEventCode(page);
  await page.getByRole("combobox", { name: /your name/i }).fill("Jana");
  await page.getByRole("option", { name: /Jana Nováková/i }).click();
  await page.getByPlaceholder(/your email/i).fill(email);
  await page.getByPlaceholder("password").fill(password);
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page.getByText(/welcome, Jana/i)).toBeHidden({ timeout: 10_000 });

  // Sign out, re-redeem, supply a wrong password.
  await signOutParticipant(page);
  await redeemEventCode(page);
  await page.getByRole("combobox", { name: /your name/i }).fill("Jana");
  await page.getByRole("option", { name: /Jana Nováková/i }).click();
  await expect(page.getByText(/welcome back, Jana/i)).toBeVisible();

  await page.getByPlaceholder("password").fill("definitely-not-the-real-one");
  await page.getByRole("button", { name: /continue/i }).click();

  // Generic error — "that didn't match" — and we stay on the
  // enter_password sub-view so the participant can retry.
  await expect(page.getByText(/that didn't match/i)).toBeVisible();
  await expect(page.getByText(/welcome back, Jana/i)).toBeVisible();

  // Retry with the correct password — should succeed.
  await page.getByPlaceholder("password").fill(password);
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page.getByText(/welcome back, Jana/i)).toBeHidden({ timeout: 10_000 });
});
