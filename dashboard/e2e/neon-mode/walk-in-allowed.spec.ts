/**
 * Spec (e) from Phase 5.6 Layer 3:
 *   walk-in allowed → type new name → submit → set password → in the room
 *
 * Default for the seeded test instance is allow_walk_ins=true. The
 * combobox shows the "+ add as new" sentinel for unrecognized names;
 * picking it routes through the same set_password sub-view as the
 * roster-pick path.
 */

import { expect, redeemEventCode, test, uniqueTestEmail } from "./fixtures";

test("walk-in: typing an unknown name surfaces the create sentinel and registers the participant", async ({ page }) => {
  const email = uniqueTestEmail();
  const password = "longenoughpassword";

  await redeemEventCode(page);

  const walkInName = `Walker ${Date.now().toString().slice(-6)}`;
  await page.getByRole("combobox", { name: /your name/i }).fill(walkInName);

  // Suggest returns no roster match → the "+ add ... as a new
  // participant" option appears (allow_walk_ins=true).
  const sentinel = page.getByText(new RegExp(`add "${walkInName}" as a new participant`, "i"));
  await expect(sentinel).toBeVisible();
  await sentinel.click();

  await expect(page.getByText(`welcome, ${walkInName}`)).toBeVisible();
  await page.getByPlaceholder(/your email/i).fill(email);
  await page.getByPlaceholder("password").fill(password);
  await page.getByRole("button", { name: /continue/i }).click();

  await expect(page.getByText(`welcome, ${walkInName}`)).toBeHidden({ timeout: 10_000 });
});
