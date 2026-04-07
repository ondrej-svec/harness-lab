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

    await expect(page.getByRole("heading", { name: "harness lab" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "vstup do kontextu místnosti" })).toBeVisible();
    await expect(page.getByText("repo před improvizací")).toBeVisible();
    await expect(page.getByText(/Celodenní workshop o kontextu, workflow a spolupráci s AI coding agenty/i)).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "repo" })).toHaveAttribute(
      "href",
      "https://github.com/ondrej-svec/harness-lab",
    );
    await expect(page.getByRole("navigation").getByRole("link", { name: "vstup pro facilitátora" })).toBeVisible();

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test("supports an explicit english public surface and preserves the language in navigation", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/?lang=en");

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { name: "enter room context" })).toBeVisible();
    await expect(page.getByText("repo before improvisation")).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "facilitator login" })).toBeVisible();

    await page.getByRole("link", { name: "harness lab" }).click();
    await expect(page).toHaveURL(/\/\?lang=en$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("unlocks private participant context only after redeeming the event code", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "vstup do kontextu místnosti" })).toBeVisible();
    await page.getByLabel("event code").fill("lantern8-context4-handoff2");
    await page.getByRole("button", { name: "otevřít vrstvu pro účastníky" }).click();

    await expect
      .poll(async () => {
        const cookies = await page.context().cookies();
        return cookies.some((cookie) => cookie.name === "harness_event_session");
      })
      .toBe(true);

    await page.reload();

    await expect(page.getByText("vrstva pro účastníky")).toBeVisible();
    await expect(page.getByText("opustit kontext místnosti")).toBeVisible();
    await expect(page.getByText("https://github.com/example/standup-bot")).toBeVisible();

    // Verify context-aware nav — room links visible, public anchors gone
    await expect(page.getByRole("navigation").getByRole("link", { name: "místnost" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "týmy" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "poznámky" })).toBeVisible();
  });
});

test.describe("facilitator sign-in", () => {
  test("redirects unauthenticated /admin to /admin/sign-in in neon mode", async ({ page }) => {
    // In file mode (e2e default), middleware doesn't redirect — requireFacilitatorPageAccess does.
    // Without auth headers, the server action redirects to /admin/sign-in.
    await page.goto("/admin");

    // Should show sign-in page (either via redirect or direct render after server-side check)
    await expect(page.getByRole("heading", { name: "přihlášení facilitátora" })).toBeVisible();
    await expect(page.locator("#sign-in-email")).toBeVisible();
    await expect(page.locator("#sign-in-password")).toBeVisible();
    await expect(page.getByRole("button", { name: "přihlásit se" })).toBeVisible();
  });

  test("sign-in page renders correctly in english", async ({ page }) => {
    await page.goto("/admin/sign-in?lang=en");

    await expect(page.getByRole("heading", { name: "facilitator sign-in" })).toBeVisible();
    await expect(page.locator("#sign-in-email")).toBeVisible();
    await expect(page.locator("#sign-in-password")).toBeVisible();
    await expect(page.getByRole("button", { name: "sign in" })).toBeVisible();
    await expect(page.getByRole("button", { name: "send reset link" })).toBeVisible();
    await expect(page.getByRole("link", { name: /back to overview/ })).toBeVisible();
  });

  test("sign-in page shows error state", async ({ page }) => {
    await page.goto("/admin/sign-in?error=invalid");

    await expect(page.getByText("Neplatné přihlašovací údaje.")).toBeVisible();
  });

  test("sign-in page shows unavailable state when Neon Auth is not configured", async ({ page }) => {
    await page.goto("/admin/sign-in?error=unavailable");

    await expect(page.getByText("Neon Auth is not configured.")).toBeVisible();
  });
});

test.describe("facilitator admin (file mode)", () => {
  // File-mode auth: send Basic Auth header directly since there's no 401 challenge.
  test.use({
    extraHTTPHeaders: {
      Authorization: `Basic ${Buffer.from("facilitator:secret").toString("base64")}`,
    },
  });

  test("loads the protected admin surface and can drive a critical workshop control", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: "řízení workshopu" })).toBeVisible();
    await expect(page.getByText("aktivní instance")).toBeVisible();
    await expect(page.getByRole("link", { name: "agenda" })).toBeVisible();
    await expect(page.getByRole("link", { name: "účet" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "ovládání continuation shiftu" })).toBeVisible();

    await Promise.all([
      page.waitForURL("**/admin"),
      page.getByRole("button", { name: "Odemknout" }).click(),
    ]);
    await expect(page.getByText(/^odemčeno$/).first()).toBeVisible();

    await page.goto("/admin");
    await Promise.all([
      page.waitForURL("**/admin"),
      page.getByRole("button", { name: "vytvořit archiv" }).click(),
    ]);

    await expect(page.getByText("Poslední archiv:")).toBeVisible();
  });

  test("shows facilitators section with file-mode fallback message", async ({ page }) => {
    await page.goto("/admin?section=access");

    await expect(page.getByRole("heading", { name: "správa facilitátorů" })).toBeVisible();
    await expect(page.getByText("Správa facilitátorů vyžaduje neon mód.")).toBeVisible();
  });

  test("shows agenda source information on the agenda section", async ({ page }) => {
    await page.goto("/admin?section=agenda");

    await expect(page.getByRole("heading", { name: "agenda a fáze" })).toBeVisible();
    await expect(page.getByText("dashboard/lib/workshop-data.ts")).toBeVisible();
    await expect(page.getByText("workshop_instances.workshop_state")).toBeVisible();
  });

  test("facilitators API returns list with auth", async ({ request }) => {
    const response = await request.get("/api/admin/facilitators");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.grants)).toBe(true);
  });
});

test.describe("facilitator API (unauthenticated)", () => {
  test("facilitators API returns 401 without auth", async ({ playwright }) => {
    const context = await playwright.request.newContext({
      baseURL: "http://127.0.0.1:3100",
    });
    const response = await context.get("/api/admin/facilitators");
    expect(response.status()).toBe(401);
    await context.dispose();
  });
});
