import { expect, test } from "@playwright/test";

test.describe("participant dashboard", () => {
  test("shows the dominant workshop flow on mobile without browser errors", async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Harness Lab" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Kontext k workshopu bez řídicího šumu." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Vstup do room contextu" })).toBeVisible();
    await expect(page.getByText("Repo before improvisation")).toBeVisible();
    await expect(page.getByText("Build Phase 1")).toBeVisible();
    await expect(page.getByText("Rotace týmů")).toBeVisible();
    await expect(page.getByText("Public notes")).toBeVisible();

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test("unlocks private participant context only after redeeming the event code", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Vstup do room contextu" })).toBeVisible();
    await page.getByLabel("Event code").fill("lantern8-context4-handoff2");
    await page.getByRole("button", { name: "Enter room context" }).click();

    await expect
      .poll(async () => {
        const cookies = await page.context().cookies();
        return cookies.some((cookie) => cookie.name === "harness_event_session");
      })
      .toBe(true);

    await page.reload();

    await expect(page.getByRole("heading", { name: "Room context unlocked." })).toBeVisible();
    await expect(page.getByText("Leave room context")).toBeVisible();
    await expect(page.getByText("https://github.com/example/standup-bot")).toBeVisible();
  });
});

test.describe("facilitator admin", () => {
  test.use({
    httpCredentials: {
      username: "facilitator",
      password: "secret",
    },
  });

  test("loads the protected admin surface and can drive a critical workshop control", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: "Řízení workshopu" })).toBeVisible();
    await expect(page.getByText("Aktivní instance")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Continuation controls" })).toBeVisible();

    await Promise.all([
      page.waitForURL("**/admin"),
      page.getByRole("button", { name: "Odemknout" }).click(),
    ]);
    await expect(page.locator("div").filter({ hasText: /^Rotaceodemčeno$/ }).first()).toBeVisible();

    await page.goto("/admin");
    await Promise.all([
      page.waitForURL("**/admin"),
      page.getByRole("button", { name: "Vytvořit archiv" }).click(),
    ]);

    await expect(page.getByText("Poslední archiv:")).toBeVisible();
  });
});
