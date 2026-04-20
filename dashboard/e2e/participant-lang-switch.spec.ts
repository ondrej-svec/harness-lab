import { expect, test } from "@playwright/test";

/**
 * Regression test for the participant language switcher.
 *
 * The historical bug: clicking `cs` or `en` on /participant sent users
 * to the public homepage (/) because SiteHeader defaulted csHref/enHref
 * to `/`. Participants saw the public landing and assumed their session
 * expired, when in fact the session cookie was intact.
 *
 * The fix: participant-page callers override csHref/enHref to
 * /participant?lang=cs|en. This test guards the fix.
 */

test.describe("participant language switch", () => {
  test("clicking cs on /participant preserves path and session", async ({ page }) => {
    await page.setViewportSize({ width: 834, height: 1194 });

    await page.goto("/?lang=en");
    await page.getByRole("textbox", { name: /event code/i }).fill("lantern8-context4-handoff2");
    await page.getByRole("button", { name: /open participant surface/i }).click();

    await expect(page).toHaveURL(/\/participant\?lang=en/);

    // Capture the session cookie before the language switch.
    const cookiesBefore = await page.context().cookies();
    const sessionBefore = cookiesBefore.find((c) => c.name === "harness_event_session");
    expect(sessionBefore, "session cookie exists before lang switch").toBeDefined();

    // Click the cs switcher in the SiteHeader. There is also a cs link in
    // public-page navigation, so scope to the header region to be safe.
    await page.getByRole("link", { name: /^cs$/i }).first().click();

    // URL must stay on /participant.
    await expect(page).toHaveURL(/\/participant(\?|$)/);

    // Session cookie must be unchanged.
    const cookiesAfter = await page.context().cookies();
    const sessionAfter = cookiesAfter.find((c) => c.name === "harness_event_session");
    expect(sessionAfter?.value).toBe(sessionBefore?.value);
  });
});
