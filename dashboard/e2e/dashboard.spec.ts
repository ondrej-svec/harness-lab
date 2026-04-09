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
    await expect(page.locator("#overview").getByText(/Nejde o demo promptů ani o jednorázové hacky/i)).toBeVisible();
    await expect(page.getByText(/Celodenní workshop o tom, jak v týmu pracovat s AI coding agenty na skutečném softwaru/i)).toBeVisible();
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
    await expect(page.locator("#overview").getByText(/This is not prompt theatre or one-off hacking/i)).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "facilitator login" })).toBeVisible();

    await page.getByRole("link", { name: "harness lab" }).click();
    await expect(page).toHaveURL(/\/\?lang=en$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("keeps the public mobile hero visually stable", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/");
    await expect(page).toHaveScreenshot("public-mobile-home.png", {
      maxDiffPixelRatio: 0.05,
    });
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

    await expect(page.getByText("vrstva pro účastníky", { exact: true })).toBeVisible();
    await expect(page.getByText("opustit kontext místnosti")).toBeVisible();
    await expect(page.getByText("Co má tým držet viditelně před obědem")).toBeVisible();
    await expect(page.getByText("https://github.com/example/standup-bot")).toBeVisible();

    // Verify context-aware nav — room links visible, public anchors gone
    await expect(page.getByRole("navigation").getByRole("link", { name: "místnost" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "týmy" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "poznámky" })).toBeVisible();
  });

  test("keeps the participant mobile room view visually stable", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/");
    await page.getByLabel("event code").fill("lantern8-context4-handoff2");
    await page.getByRole("button", { name: "otevřít vrstvu pro účastníky" }).click();
    await expect(page).toHaveScreenshot("participant-mobile-room.png", {
      maxDiffPixelRatio: 0.05,
    });
  });
});

test.describe("facilitator sign-in", () => {
  test("redirects unauthenticated /admin to /admin/sign-in in neon mode", async ({ page }) => {
    // In file mode (e2e default), proxy doesn't redirect — requireFacilitatorPageAccess does.
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

  test("loads the workspace cockpit, filters instances, and can drive a critical workshop control", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: "workshopy a jejich instance" })).toBeVisible();
    await expect(page.getByLabel("hledat workshop")).toBeVisible();
    await page.getByLabel("hledat workshop").fill("Lab C");
    await page.getByRole("button", { name: "použít filtry" }).click();
    await expect(page.getByText("sample-lab-c")).toBeVisible();
    await expect(page.getByRole("link", { name: "otevřít řízení" })).toHaveCount(1);

    await page.goto("/admin");
    await page.getByRole("link", { name: "otevřít řízení" }).first().click();

    await expect(page).toHaveURL(/\/admin\/instances\/sample-studio-a/);
    await expect(page.getByRole("link", { name: "zpět na workspace" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "agenda" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "control room" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "handoff moment" })).toHaveCount(0);

    await page.getByRole("link", { name: /13:30 • Rotace týmů/i }).click();
    await expect(page).toHaveURL(/agendaItem=rotation/);
    await page.getByRole("button", { name: "posunout live sem" }).click();

    await expect(page.getByRole("heading", { name: "handoff moment" })).toBeVisible();
    await expect(page.getByText("13:30 • Rotace týmů").first()).toBeVisible();

    await page.getByRole("button", { name: "Odemknout" }).click();
    await expect(page.getByText(/předání je odemčeno/i).first()).toBeVisible();
    await page.goto("/admin/instances/sample-studio-a");
    await expect(page.getByRole("heading", { name: "handoff moment" })).toBeVisible();

    await page.goto("/admin/instances/sample-studio-a");
    await page.getByRole("link").filter({ hasText: "13:45 • Build Phase 2" }).first().click();
    await expect(page).toHaveURL(/agendaItem=build-2/);
    await page.getByRole("button", { name: "posunout live sem" }).click();
    await expect(page.getByText("13:45 • Build Phase 2").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "handoff moment" })).toHaveCount(0);
    await page.goto("/admin/instances/sample-studio-a");
    await expect(page.getByText("13:45 • Build Phase 2").first()).toBeVisible();
    await expect(page.getByText("14:45 • Intermezzo 2").first()).toBeVisible();

    await page.goto("/admin/instances/sample-studio-a?section=settings");
    await expect(page.getByRole("heading", { name: "participant plocha" })).toBeVisible();
    await page.getByRole("button", { name: "znovu skrýt" }).click();
    await expect(page.getByText(/předání je skryté/i).first()).toBeVisible();
  });

  test("keeps the facilitator overview visually stable", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1400 });
    await page.goto("/admin");
    await expect(page).toHaveScreenshot("facilitator-overview-desktop.png", {
      // Full-page facilitator pages shift in total document height across macOS and Ubuntu
      // because the same copy wraps slightly differently. Keep the regression focused on the
      // designed viewport shell instead of the scroll length.
      maxDiffPixelRatio: 0.08,
    });
  });

  test("uses a confirmation dialog before instance removal", async ({ page }) => {
    await page.goto("/admin");

    await page.getByRole("link", { name: "zkontrolovat odebrání" }).first().click();

    await expect(page.getByRole("heading", { name: "opravdu odebrat tuto instanci?" })).toBeVisible();
    await expect(page.getByText("Před odebráním vznikne automatický archiv")).toBeVisible();
    await expect(page.getByRole("button", { name: "potvrdit odebrání" })).toBeVisible();
  });

  test("reflows the expanded instance-creation sheet below workspace filters on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1200 });
    await page.goto("/admin");

    const filters = page.locator("form[method='get']").first();
    const createPanel = page.locator("details").first();
    await page.locator("details summary").first().click();

    await expect(createPanel).toHaveAttribute("open", "");

    const filtersBox = await filters.boundingBox();
    const createPanelBox = await createPanel.boundingBox();

    expect(filtersBox).not.toBeNull();
    expect(createPanelBox).not.toBeNull();
    expect(createPanelBox!.y).toBeGreaterThanOrEqual(filtersBox!.y + filtersBox!.height - 4);
    expect(createPanelBox!.x).toBeLessThanOrEqual(filtersBox!.x + 8);
    expect(createPanelBox!.width).toBeGreaterThanOrEqual(filtersBox!.width);
  });

  test("keeps the facilitator control room visually stable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 1200 });
    await page.goto("/admin/instances/sample-studio-a");
    await expect(page).toHaveScreenshot("facilitator-control-room-mobile.png", {
      mask: [page.getByText("Poslední archiv:")],
      maxDiffPixelRatio: 0.08,
    });
  });

  test("keeps the facilitator control room visually stable on ipad", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 1366 });
    await page.goto("/admin/instances/sample-studio-a");
    await expect(page).toHaveScreenshot("facilitator-control-room-ipad.png", {
      mask: [page.getByText("Poslední archiv:")],
      maxDiffPixelRatio: 0.08,
    });
  });

  test("shows facilitators section with file-mode fallback message", async ({ page }) => {
    await page.goto("/admin/instances/sample-studio-a?section=access");

    await expect(page.getByRole("heading", { name: "správa facilitátorů" })).toBeVisible();
    await expect(page.getByText("Správa facilitátorů vyžaduje neon mód.")).toBeVisible();
  });

  test("shows agenda source information on the agenda section", async ({ page }) => {
    await page.goto("/admin/instances/sample-studio-a?section=agenda");

    await expect(page.getByRole("heading", { name: "control room" })).toBeVisible();
    await page.getByRole("link").filter({ hasText: "Context is King" }).first().click();
    await expect(page).toHaveURL(/agendaItem=talk/);
    await page.getByText("zdroj a ukládání").click();
    await expect(page.getByText("dashboard/lib/workshop-data.ts")).toBeVisible();
    await expect(page.getByText("workshop_instances.workshop_state")).toBeVisible();
  });

  test("launches the room screen from the control room and supports participant walkthrough", async ({ page }) => {
    await page.goto("/admin/instances/sample-studio-a");

    await page.getByRole("link", { name: /13:30 • Rotace týmů/i }).click();
    await expect(page.getByText("Bez ústního handoffu")).toBeVisible();
    await expect(page.getByRole("link", { name: "otevřít projekci" })).toBeVisible();

    const [popup] = await Promise.all([
      page.waitForEvent("popup"),
      page.getByRole("link", { name: "otevřít projekci" }).click(),
    ]);

    await expect(popup.getByText("Bez ústního handoffu")).toBeVisible();
    await expect(popup.getByText("projekce pro místnost")).toHaveCount(0);
    await expect(popup.getByRole("link", { name: "zpět do režie" })).toHaveCount(0);
    await expect(popup.getByRole("navigation")).toHaveCount(0);
    await expect(popup.getByRole("link", { name: "další scéna" })).toBeVisible();

    await popup.getByRole("link", { name: "další scéna" }).click();
    await expect(popup).toHaveURL(/scene=rotation-instructions/);
    await expect(popup.getByRole("link", { name: "předchozí scéna" })).toBeVisible();

    const [walkthroughPopup] = await Promise.all([
      page.waitForEvent("popup"),
      page.getByRole("link", { name: "průchod participant vrstvou" }).click(),
    ]);

    await expect(walkthroughPopup.getByText("Nový tým začíná mapou, ne improvizací")).toBeVisible();
    await expect(walkthroughPopup.getByText("Vrstva pro účastníky nemá zachraňovat slabý signál v repu.")).toBeVisible();
    await expect(walkthroughPopup.getByText("signál z místnosti")).toHaveCount(0);
  });

  test("renders the room screen on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=rotation");

    await expect(page.getByText("Bez ústního handoffu")).toBeVisible();
  });

  test("keeps the default room screen visually stable on ipad", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=rotation");

    await expect(page).toHaveScreenshot("presenter-default-room-screen-ipad.png", {
      maxDiffPixelRatio: 0.08,
    });
  });

  test("keeps the participant walkthrough visually stable on ipad", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=talk&scene=talk-participant-view");

    await expect(page).toHaveScreenshot("presenter-participant-walkthrough-ipad.png", {
      maxDiffPixelRatio: 0.08,
    });
  });

  test("renders the opening proof scene with reviewed asset, source strip, and stable ipad layout", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=opening&scene=opening-handoff-loop&lang=en");

    await expect(page.getByText("Čtyři uzly, které musí držet pohromadě")).toBeVisible();
    await expect(page.getByText("Harness Lab blueprint asset")).toBeVisible();
    await expect(page.getByText("source material")).toBeVisible();
    await expect(page.locator('img[src="/blueprint/opening/opening-continuation-loop.svg"]')).toBeVisible();

    await expect(page).toHaveScreenshot("presenter-opening-proof-ipad.png", {
      maxDiffPixelRatio: 0.08,
    });
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
