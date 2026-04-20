/**
 * Roster row already has an email → first-time password setup should
 * not ask the participant to type it again.
 */

import { expect, redeemEventCode, test } from "./fixtures";

test("first-time roster identify skips the email prompt when the participant already has one", async ({ page }) => {
  const password = "longenoughpassword";

  await redeemEventCode(page);
  await page.getByRole("combobox", { name: /your name/i }).fill("Jan Černý");
  await page.getByRole("option", { name: /Jan Černý/i }).click();

  await expect(page.getByText(/welcome, Jan Černý/i)).toBeVisible();
  await expect(page.getByPlaceholder(/your email/i)).toHaveCount(0);
  await expect(page.getByText(/.\*\*\*@harness-lab-test\.invalid/i)).toBeVisible();
  await page.getByPlaceholder("password").fill(password);
  await page.getByRole("button", { name: /continue/i }).click();

  await expect(page.getByText(/welcome, Jan Černý/i)).toBeHidden({ timeout: 10_000 });
  await expect(page.getByRole("combobox", { name: /your name/i })).toHaveCount(0);
});
