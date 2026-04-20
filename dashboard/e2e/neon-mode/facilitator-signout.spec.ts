import { expect, INSTANCE_ID, signInAsTestFacilitator, test } from "./fixtures";

// Covers the real facilitator logout path, then proves the admin
// guards send both the control-room route and the workspace route
// back to /admin/sign-in once the session is gone.
test("facilitator sign out clears access from both workspace and control-room surfaces", async ({ page }) => {
  await signInAsTestFacilitator(page.context());

  await page.goto(`/admin/instances/${INSTANCE_ID}?lang=en`);
  await expect(page).toHaveURL(new RegExp(`/admin/instances/${INSTANCE_ID}(\\?|$)`));
  await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();

  await page.getByRole("button", { name: /sign out/i }).click();
  await page.waitForURL(/\/admin\/sign-in(\?|$)/, { timeout: 10_000 });

  await page.goto(`/admin/instances/${INSTANCE_ID}`);
  await page.waitForURL(/\/admin\/sign-in(\?|$)/, { timeout: 10_000 });
  await page.goto("/admin");
  await page.waitForURL(/\/admin\/sign-in(\?|$)/, { timeout: 10_000 });
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
});
