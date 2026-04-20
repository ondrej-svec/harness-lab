import { expect, test } from "@playwright/test";

test.use({
  extraHTTPHeaders: {
    Authorization: `Basic ${Buffer.from("facilitator:secret").toString("base64")}`,
  },
});

test.describe("participant signal flow", () => {
  test("keeps private participant feedback available without forcing a room poll in the proof slice", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 960 });

    await page.goto("/?lang=en");
    await page.getByLabel("event code").fill("lantern8-context4-handoff2");
    await page.getByRole("button", { name: "open participant surface" }).click();
    await page.waitForURL("**/participant**");
    await page.getByLabel("What's your name?").fill("Signal Tester");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByLabel("What's your name?")).toBeHidden();

    await page.goto("/admin/instances/sample-studio-a?lang=en&section=run&agendaItem=talk");
    await page.getByRole("button", { name: "move live here" }).first().click();
    await expect(page.getByRole("heading", { name: "live participant contract" })).toBeVisible();
    await page.getByRole("button", { name: "show scene" }).nth(1).click();
    await expect(page.getByText("manual override")).toBeVisible();

    await page.goto("/participant?lang=en");
    await expect(page.getByRole("button", { name: "Send signal" })).toHaveCount(0);

    const participantMessage = "We need a quick steer on which repo signal to fix first.";
    await page.getByLabel("message").fill(participantMessage);
    await page.getByRole("button", { name: "Send privately" }).click();
    await expect(page.getByText("Private note sent.")).toBeVisible();
    await expect(page.getByText(participantMessage)).not.toBeVisible();

    await page.goto("/admin/instances/sample-studio-a?lang=en&section=run&agendaItem=talk");
    await expect(page.getByText("active room signal poll")).toBeVisible();
    await expect(page.getByText("No active poll is attached to the live participant moment.").first()).toBeVisible();
    await expect(page.getByText(participantMessage).first()).toBeVisible();
  });
});
