/**
 * Specs (a) + (b) from Phase 5.6 Layer 3 fused into one round-trip:
 *   redeem → pick from roster → set password → in the room
 *   sign out → re-redeem → pick same name → enter password → in the room
 *
 * Two halves so the second can rely on the first having created the
 * Neon Auth account; the fixture wipes per-test, so combining keeps
 * state intact.
 */

import { expect, redeemEventCode, signOutParticipant, test, uniqueTestEmail } from "./fixtures";

test("first-time identify, then returning identify (full round-trip)", async ({ page }) => {
  const email = uniqueTestEmail();
  const password = "longenoughpassword";

  // First-time: redeem → pick → set password.
  await redeemEventCode(page);
  await page.getByRole("combobox", { name: /your name/i }).fill("Jana");
  await page.getByRole("option", { name: /Jana Nováková/i }).click();
  await expect(page.getByText(/welcome, Jana/i)).toBeVisible();
  await page.getByPlaceholder(/your email/i).fill(email);
  await page.getByPlaceholder("password").fill(password);
  await page.getByRole("button", { name: /continue/i }).click();
  // Identify card disappears once we're in the room.
  await expect(page.getByText(/welcome, Jana/i)).toBeHidden({ timeout: 10_000 });
  await expect(page.getByRole("combobox", { name: /your name/i })).toHaveCount(0);

  // Sign out: clear all cookies (event-code + Neon Auth) so the next
  // visit looks like a fresh browser.
  await signOutParticipant(page);

  // Returning: same roster pick now shows the "returning" badge and
  // routes to the enter-password sub-view.
  await redeemEventCode(page);
  await page.getByRole("combobox", { name: /your name/i }).fill("Jana");
  await expect(page.getByRole("option", { name: /Jana Nováková/i })).toBeVisible();
  await expect(page.getByText(/returning/i)).toBeVisible();
  await page.getByRole("option", { name: /Jana Nováková/i }).click();

  await expect(page.getByText(/welcome back, Jana/i)).toBeVisible();
  await expect(page.getByPlaceholder(/your email/i)).toHaveCount(0);
  await page.getByPlaceholder("password").fill(password);
  await page.getByRole("button", { name: /continue/i }).click();

  await expect(page.getByText(/welcome back, Jana/i)).toBeHidden({ timeout: 10_000 });
  await expect(page.getByRole("combobox", { name: /your name/i })).toHaveCount(0);
});
