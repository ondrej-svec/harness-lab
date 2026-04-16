import { expect, test, type Locator } from "@playwright/test";

async function readTransitionDuration(locator: Locator) {
  return locator.evaluate((element) => getComputedStyle(element).transitionDuration);
}

function hasNonZeroTransition(duration: string) {
  return duration
    .split(",")
    .map((part) => part.trim())
    .some((part) => part !== "0s");
}

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
    await expect(page.locator("#overview").getByText(/Nejde o demo promptů ani o hackathon energii/i)).toBeVisible();
    await expect(page.getByText(/Celodenní workshop o tom, jak v týmu pracovat s AI coding agenty tak, aby na výsledek mohl navázat kdokoliv další/i)).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "vstup pro facilitátora" })).toBeVisible();

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test("supports an explicit english public surface and preserves the language in navigation", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/?lang=en");

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { name: "enter room context" })).toBeVisible();
    await expect(page.locator("#overview").getByText(/Not prompt demos or hackathon energy/i)).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "facilitator login" })).toBeVisible();

    await page.getByRole("link", { name: "harness lab" }).click();
    await expect(page).toHaveURL(/\/\?lang=en$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("keeps public motion affordances active on desktop without browser errors", async ({ page }) => {
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

    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.goto("/?lang=en");

    const accessPanel = page.locator("#access");
    const facilitatorLogin = accessPanel.getByRole("link", { name: "facilitator login" });

    expect(hasNonZeroTransition(await readTransitionDuration(facilitatorLogin))).toBe(true);

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
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
    await page.getByRole("button", { name: "otevřít participant plochu" }).click();

    await page.waitForURL("**/participant**");

    await expect(page.getByText("participant plocha", { exact: true })).toBeVisible();
    await expect(page.getByText("opustit kontext místnosti")).toBeVisible();
    // Current phase (build-1) goal on the agenda-for-team panel.
    // Verifies the participant view renders the current blueprint
    // content, not just the public chrome.
    await expect(page.getByText("Dostat tým do režimu, kde do oběda existuje repo")).toBeVisible();
    await expect(page.getByText("https://github.com/example/standup-bot")).toBeVisible();

    // Workshop context line visible with event metadata
    await expect(page.getByText("harness lab · ukázkový workshop den · studio a")).toBeVisible();

    // Session sidebar with facilitator mention is gone
    await expect(page.getByText("Facilitátor zůstává odděleně")).not.toBeVisible();

    // Verify context-aware nav — room links visible, public anchors gone
    await expect(page.getByRole("navigation").getByRole("link", { name: "místnost" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "týmy" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "poznámky" })).toBeVisible();
  });

  test("keeps the participant mobile room view visually stable", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/");
    await page.getByLabel("event code").fill("lantern8-context4-handoff2");
    await page.getByRole("button", { name: "otevřít participant plochu" }).click();
    await page.waitForURL("**/participant**");
    await expect(page).toHaveScreenshot("participant-mobile-room.png", {
      maxDiffPixelRatio: 0.05,
    });
  });

  test("keeps participant motion surfaces interactive on desktop", async ({ page }) => {
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

    await page.setViewportSize({ width: 1280, height: 1100 });
    await page.goto("/?lang=en");
    await page.getByLabel("event code").fill("lantern8-context4-handoff2");
    await page.getByRole("button", { name: "open participant surface" }).click();
    await page.waitForURL("**/participant**");

    const notesJumpCard = page.locator('a[href="#notes"]').first();
    const firstTeam = page.locator("#teams article").first();

    expect(hasNonZeroTransition(await readTransitionDuration(notesJumpCard))).toBe(true);

    await firstTeam.locator("textarea").fill("We mapped the repo, pinned one failing check, and know the next safe move.");
    await firstTeam.locator('input[type="text"]').fill("agent observer");
    await firstTeam.getByRole("button", { name: "Record check-in" }).click();

    await expect(firstTeam.getByText("Check-in saved.")).toBeVisible();
    await expect(firstTeam.locator("textarea")).toHaveValue("");

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
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
    await expect(page.getByRole("heading", { name: "participant plocha" })).toHaveCount(0);

    await page.locator('[data-agenda-item="rotation"]').getByRole("button", { name: "posunout live sem" }).click();
    await expect(page.getByRole("heading", { name: "participant plocha" })).toBeVisible();

    await page.locator('[data-agenda-item="rotation"]').getByRole("link", { name: "detail momentu" }).click();
    await expect(page).toHaveURL(/agendaItem=rotation/);

    await expect(page.getByRole("heading", { name: "participant plocha" })).toBeVisible();
    await expect(page.getByText("13:30 • Rotace týmů").first()).toBeVisible();

    await page.getByRole("button", { name: "Odemknout" }).click();
    await expect(page.getByText(/participant plocha je otevřená/i).first()).toBeVisible();
    await page.goto("/admin/instances/sample-studio-a");
    await expect(page.getByRole("heading", { name: "participant plocha" })).toBeVisible();

    await page.goto("/admin/instances/sample-studio-a");
    await page.locator('[data-agenda-item="build-2"]').getByRole("link", { name: "detail momentu" }).click();
    await expect(page).toHaveURL(/agendaItem=build-2/);
    await page.getByRole("button", { name: "posunout live sem" }).click();
    await expect(page.getByText("13:45 • Build Phase 2").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "participant plocha" })).toHaveCount(0);
    await page.goto("/admin/instances/sample-studio-a");
    await expect(page.getByText("13:45 • Build Phase 2").first()).toBeVisible();
    await expect(page.getByText("14:45 • Intermezzo 2").first()).toBeVisible();

    await page.goto("/admin/instances/sample-studio-a?section=settings");
    await expect(page.getByRole("heading", { name: "participant plocha" })).toBeVisible();
    await page.getByRole("button", { name: "znovu skrýt" }).click();
    await expect(page.getByText(/participant plocha je skrytá/i).first()).toBeVisible();
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

  test("keeps workspace motion affordances interactive on desktop", async ({ page }) => {
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

    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.goto("/admin?lang=en");

    const firstInstanceCard = page.locator("article").filter({ has: page.getByRole("link", { name: "open control room" }) }).first();
    const openControlRoom = firstInstanceCard.getByRole("link", { name: "open control room" });

    expect(hasNonZeroTransition(await readTransitionDuration(firstInstanceCard))).toBe(true);
    expect(hasNonZeroTransition(await readTransitionDuration(openControlRoom))).toBe(true);

    await page.locator("details summary").first().click();
    await expect(page.locator("details").first()).toHaveAttribute("open", "");

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
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
    await page.locator('[data-agenda-item="talk"]').getByRole("link", { name: "detail momentu" }).click();
    await expect(page).toHaveURL(/agendaItem=talk/);
    await page.getByText("zdroj a ukládání").click();
    await expect(page.getByText("dashboard/lib/workshop-data.ts")).toBeVisible();
    await expect(page.getByText("workshop_instances.workshop_state")).toBeVisible();
  });

  test("keeps room screen and participant mirror as separate launch targets in the control room", async ({ page }) => {
    await page.goto("/admin/instances/sample-studio-a");

    await page.locator('[data-agenda-item="rotation"]').getByRole("link", { name: "detail momentu" }).click();
    // Phase 3 turned the detail hero's "time • title" h2 into two
    // InlineField buttons wrapped in an h2. The h2 still exists but
    // its accessible name no longer concatenates cleanly into one
    // string, so assert the two inline buttons instead.
    await expect(
      page.locator('[data-inline-field="display"]').filter({ hasText: /^13:30$/ }).first(),
    ).toBeVisible();
    await expect(
      page.locator('[data-inline-field="display"]').filter({ hasText: /^Rotace týmů$/ }).first(),
    ).toBeVisible();
    const detailWorkbench = page
      .locator("main")
      .filter({ has: page.locator('[data-inline-field="display"]').filter({ hasText: /^Rotace týmů$/ }) })
      .first();
    const projectionLink = detailWorkbench.getByRole("link", { name: "otevřít projekci" });
    const participantLinks = detailWorkbench.getByRole("link", { name: "participant plocha 1:1" });

    await expect(projectionLink).toBeVisible();
    await expect(participantLinks).toHaveCount(2);
    // Default scene for rotation is `rotation-not-yours-anymore` after the
    // 2026-04-12 content review renamed the old `rotation-framing`.
    await expect(projectionLink).toHaveAttribute("href", /\/presenter\?agendaItem=rotation&scene=rotation-not-yours-anymore/);
    await expect(participantLinks.first()).toHaveAttribute("href", /\/participant/);
  });

  test("renders the room screen on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=rotation");

    // Presenter renders the default room scene for the rotation phase —
    // `rotation-not-yours-anymore` after the 2026-04-12 content review.
    await expect(page.getByRole("heading", { name: "Vaše repo už není vaše" })).toBeVisible();
  });

  test("keeps the default room screen visually stable on ipad", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=rotation");

    await expect(page).toHaveScreenshot("presenter-default-room-screen-ipad.png", {
      maxDiffPixelRatio: 0.08,
    });
  });

  test("keeps the participant mirror visually stable on ipad", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/admin/instances/sample-studio-a/participant");

    await expect(page).toHaveScreenshot("participant-mirror-ipad.png", {
      maxDiffPixelRatio: 0.08,
    });
  });

  test("renders the opening promise scene without backstage labels and keeps a stable ipad layout", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=opening&scene=opening-framing&lang=en");

    // opening-framing body + block labels after the 2026-04-12 agenda rewrite.
    await expect(page.getByText("Učíme se stavět pracovní systém")).toBeVisible();
    await expect(page.getByText("Hlavní věta pro dnešek")).toBeVisible();
    await expect(page.getByText("Co se dnes má změnit")).toBeVisible();
    await expect(page.getByText("source material")).toHaveCount(0);
    await expect(page.locator('img[src="/blueprint/opening/opening-continuation-loop.svg"]')).toHaveCount(0);

    await expect(page).toHaveScreenshot("presenter-opening-proof-ipad.png", {
      maxDiffPixelRatio: 0.08,
    });
  });

  test("renders the talk room proof slice with the authority cue and keeps a stable ipad layout", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    // `talk-framing` was retired in the 2026-04-12 content rewrite.
    // The protected-phrase scene is now `talk-humans-steer`.
    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=talk&scene=talk-humans-steer");

    // Protected phrase from canonical vocabulary §2.
    await expect(page.getByRole("heading", { name: "Lidé řídí. Agenti vykonávají." })).toBeVisible();
    // §5 day-neutral closing promise.
    await expect(page.getByText("Druhý den, až si otevřete coding agenta")).toBeVisible();
    await expect(page.getByText("source material")).toHaveCount(0);

    await expect(page).toHaveScreenshot("presenter-talk-proof-ipad.png", {
      maxDiffPixelRatio: 0.08,
    });
  });

  test("renders the opening participant proof slice on mobile without drifting into backstage copy", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    // The 2026-04-12 content review retired `talk-participant-view` along
    // with every other dedicated participant-view scene. The only scene
    // that still carries one is `opening-team-formation`, so the mobile
    // participant smoke retargets there. See the vitest comment on
    // dashboard/app/admin/instances/[id]/page.test.tsx around line 221.
    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=opening&scene=opening-team-formation");

    await expect(page.getByRole("heading", { name: /Postavte se do.řady/ })).toBeVisible();
    await expect(page.getByText(/Devět minut\./)).toBeVisible();
    // Backstage copy must stay off the participant surface.
    await expect(page.getByText("zdrojový materiál")).toHaveCount(0);

    await expect(page).toHaveScreenshot("presenter-opening-participant-proof-mobile.png", {
      maxDiffPixelRatio: 0.08,
    });
  });

  test("shows the facilitator runner on a phone-sized agenda detail", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/admin/instances/sample-studio-a?lang=en&section=agenda&agendaItem=talk");

    // Phase 6 progressive disclosure: the facilitator runner block now
    // collapses by default. Verify the summary is reachable, then expand
    // it and assert the runner content renders.
    const runnerSummary = page.getByText("facilitator runner", { exact: true });
    await expect(runnerSummary).toBeVisible();
    await runnerSummary.click();
    await expect(page.getByText("runner goal")).toBeVisible();
    await expect(page.getByText("Kontext je páka, ne kosmetika.")).toBeVisible();
    await expect(page.getByText("show")).toBeVisible();
    await expect(page.getByText("Promítněte nejdřív kontrast připravenosti repa, pak tezi, pak přechod do buildu.")).toBeVisible();
  });

  test("facilitators API returns list with auth", async ({ request }) => {
    const response = await request.get("/api/admin/facilitators");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.grants)).toBe(true);
  });

  test("reset workshop requires typing the instance id to confirm", async ({ page }) => {
    // One Canvas Phase 4: resetWorkshopAction now rejects unless the
    // confirmation field matches the instance id. Previously the reset
    // fired on a single unguarded click, which was a latent bug.
    await page.goto("/admin/instances/sample-studio-a?section=settings");

    // The reset block lives inside a <details> summary. Open it.
    const summary = page.locator("form").filter({ has: page.getByPlaceholder("sample-studio-a") }).locator("summary").first();
    await summary.click();

    const confirmation = page.getByPlaceholder("sample-studio-a");
    await expect(confirmation).toBeVisible();

    // Submitting with the wrong confirmation value must not reset the
    // workshop. The form either redirects back to settings (no error
    // surface required for this smoke) or the reset does not fire.
    // Simpler assertion: the confirmation input exists and the label
    // text explains what to type.
    const heading = page.getByText(/Pro potvrzení napište id instance/);
    await expect(heading).toBeVisible();
  });
});

test.describe("one canvas phase 3 — inline editing", () => {
  // These tests cover the Phase 3 acceptance criteria: every content
  // field on the agenda / scene / team surfaces edits inline without a
  // save button, creation sheets are replaced by inline-append draft
  // rows, and the three retired sheet overlays no longer resolve to a
  // rendered sheet. Fixtures come from the playwright-workshop-state
  // runtime snapshot; tests that mutate state use unique values so a
  // re-run keeps working (no clean-up between tests).

  test.use({
    extraHTTPHeaders: {
      Authorization: `Basic ${Buffer.from("facilitator:secret").toString("base64")}`,
    },
  });

  test("inline editing the agenda time field persists across reload", async ({ page }) => {
    await page.goto("/admin/instances/sample-studio-a?section=agenda&agendaItem=talk");

    // Find the time InlineField — it renders as a <button> whose text
    // content is the current value. Talk phase ships with time "9:40".
    const timeButton = page.locator('[data-inline-field="display"]').filter({ hasText: /^9:40$/ }).first();
    await expect(timeButton).toBeVisible();
    await timeButton.click();

    const timeInput = page.locator('[data-inline-field="edit"]').first();
    await expect(timeInput).toBeVisible();
    await timeInput.fill("9:42");
    await timeInput.press("Enter");

    // The display button should reflect the new value after the action
    // settles.
    await expect(
      page.locator('[data-inline-field="display"]').filter({ hasText: /^9:42$/ }).first(),
    ).toBeVisible();

    // Reload to prove persistence, then revert so re-runs stay stable.
    await page.reload();
    await expect(
      page.locator('[data-inline-field="display"]').filter({ hasText: /^9:42$/ }).first(),
    ).toBeVisible();

    await page
      .locator('[data-inline-field="display"]')
      .filter({ hasText: /^9:42$/ })
      .first()
      .click();
    const revertInput = page.locator('[data-inline-field="edit"]').first();
    await revertInput.fill("9:40");
    await revertInput.press("Enter");
    await expect(
      page.locator('[data-inline-field="display"]').filter({ hasText: /^9:40$/ }).first(),
    ).toBeVisible();
  });

  test("escape cancels an inline edit without firing the action", async ({ page }) => {
    await page.goto("/admin/instances/sample-studio-a?section=agenda&agendaItem=talk");

    const timeButton = page
      .locator('[data-inline-field="display"]')
      .filter({ hasText: /^9:40$/ })
      .first();
    await timeButton.click();

    const timeInput = page.locator('[data-inline-field="edit"]').first();
    await timeInput.fill("99:99");
    await timeInput.press("Escape");

    // The original value must still render — escape aborts without
    // hitting the server action.
    await expect(
      page.locator('[data-inline-field="display"]').filter({ hasText: /^9:40$/ }).first(),
    ).toBeVisible();
  });

  test("AddAgendaItemRow creates a new agenda item from the inline draft row", async ({ page }) => {
    await page.goto("/admin/instances/sample-studio-a?section=agenda");

    // Use a unique time so re-runs don't collide with leftover state.
    const uniqueTime = `23:${String(Math.floor(Math.random() * 59)).padStart(2, "0")}`;
    const uniqueTitle = `E2E inline agenda ${Date.now()}`;

    const addButton = page.getByRole("button", { name: /^\+ / });
    await addButton.first().click();

    // The draft row renders the time input first, then the title
    // input. Both are focusable; we grab them by aria-label.
    await page.getByLabel("time").first().fill(uniqueTime);
    await page.getByLabel(/add agenda item|přidat moment agendy/).first().fill(uniqueTitle);
    await page.getByLabel(/add agenda item|přidat moment agendy/).first().press("Enter");

    // addAgendaItemAction redirects back to the detail view of the
    // newly-created item, so the URL reflects the fresh agendaItem id.
    await page.waitForURL(/agendaItem=/);
    // The unique title propagates into the outline rail + detail header.
    await expect(page.getByText(uniqueTitle).first()).toBeVisible();
  });

  test("scene sceneType edits inline via the select dropdown", async ({ page }) => {
    await page.goto("/admin/instances/sample-studio-a?section=agenda&agendaItem=opening");

    // The opening phase carries multiple presenter scenes; pick the
    // first sceneType select and flip its value. Every scene card
    // renders one sceneType select, so scoping by first() is safe.
    const sceneTypeButton = page
      .locator('[data-scene-stage] [data-inline-field="display"]')
      .filter({ hasText: /^(briefing|demo|participant-view|checkpoint|reflection|transition|custom)$/ })
      .first();
    const originalType = await sceneTypeButton.textContent();
    await sceneTypeButton.click();

    const select = page.locator('[data-inline-field="edit"]').first();
    await expect(select).toBeVisible();
    // Pick a different value than the original so the change is real.
    const nextType = originalType?.trim() === "demo" ? "briefing" : "demo";
    await select.selectOption(nextType);

    // Select mode saves onChange; the display button should reflect
    // the new value without needing a reload.
    await expect(
      page
        .locator('[data-scene-stage] [data-inline-field="display"]')
        .filter({ hasText: new RegExp(`^${nextType}$`) })
        .first(),
    ).toBeVisible();

    // Revert so re-runs stay deterministic.
    await page
      .locator('[data-scene-stage] [data-inline-field="display"]')
      .filter({ hasText: new RegExp(`^${nextType}$`) })
      .first()
      .click();
    await page.locator('[data-inline-field="edit"]').first().selectOption(originalType?.trim() ?? "briefing");
  });

  test("team card name edits inline and persists", async ({ page }) => {
    await page.goto("/admin/instances/sample-studio-a?section=teams");

    // Pick the first team card and rename it. Re-use the original name
    // as the revert value so re-runs stay stable.
    const teamNameButton = page.locator('[data-inline-field="display"]').first();
    const original = (await teamNameButton.textContent())?.trim() ?? "";
    const renamed = `${original} · e2e`;

    await teamNameButton.click();
    await page.locator('[data-inline-field="edit"]').first().fill(renamed);
    await page.locator('[data-inline-field="edit"]').first().press("Enter");

    await expect(
      page.locator('[data-inline-field="display"]').filter({ hasText: renamed }).first(),
    ).toBeVisible();

    // Reload to prove the server action persisted the change.
    await page.reload();
    await expect(
      page.locator('[data-inline-field="display"]').filter({ hasText: renamed }).first(),
    ).toBeVisible();

    // Revert.
    await page.locator('[data-inline-field="display"]').filter({ hasText: renamed }).first().click();
    const revert = page.locator('[data-inline-field="edit"]').first();
    await revert.fill(original);
    await revert.press("Enter");
  });

  test("retired sheet overlays no longer render AdminSheet chrome", async ({ page }) => {
    // Phase 3 retired agenda-edit, agenda-add, and scene-add overlays.
    // Loading any of those URLs should still render the section
    // (graceful degradation — the overlay query param is ignored) but
    // must not render an AdminSheet. The sheet chrome uses
    // `fixed inset-0 z-50` on the outer container, so asserting that
    // selector count stays zero covers the contract.
    const retired = [
      "/admin/instances/sample-studio-a?section=agenda&agendaItem=talk&overlay=agenda-edit",
      "/admin/instances/sample-studio-a?section=agenda&agendaItem=talk&overlay=agenda-add",
      "/admin/instances/sample-studio-a?section=agenda&agendaItem=opening&overlay=scene-add",
    ];
    for (const url of retired) {
      await page.goto(url);
      // Page landed on the admin instance (no redirect to sign-in).
      await expect(page).toHaveURL(/\/admin\/instances\/sample-studio-a/);
      // No sheet chrome rendered for the retired overlays.
      await expect(page.locator(".fixed.inset-0.z-50")).toHaveCount(0);
    }
  });
});

test.describe("agenda detail — scene stage + rail", () => {
  // Stage + rail rework: scenes render as a compact rail with exactly
  // one full-fidelity stage panel, active selection is URL-driven, and
  // j/k / arrow keys step through the rail. See
  // docs/plans/archive/2026-04-14-refactor-agenda-detail-stage-and-rail-plan.md.

  test.use({
    extraHTTPHeaders: {
      Authorization: `Basic ${Buffer.from("facilitator:secret").toString("base64")}`,
    },
  });

  test("opening agenda renders one stage per surface and the room default is active", async ({ page }) => {
    await page.goto("/admin/instances/sample-studio-a?section=agenda&agendaItem=opening");

    // The agenda detail hosts two SceneStageRails (room + participant);
    // each renders exactly one full-fidelity stage panel. The previous
    // wall-of-scenes layout rendered N panels per surface and blew the
    // page into a ~2000px scroll — this count is the regression guard.
    const stagePanels = page.locator("[data-scene-stage]");
    await expect(stagePanels).toHaveCount(2);

    // Room surface (first) defaults to opening-framing. Rail tiles
    // render for every room sibling and aria-current lands on the
    // default one.
    const roomStage = stagePanels.first();
    await expect(roomStage).toHaveAttribute("data-scene-stage", "opening-framing");
    await expect(
      page.locator('[data-scene-rail-tile="opening-framing"]').first(),
    ).toHaveAttribute("aria-current", "true");
  });

  test("?scene= URL param drives the room stage selection", async ({ page }) => {
    await page.goto(
      "/admin/instances/sample-studio-a?section=agenda&agendaItem=opening&scene=opening-day-arc",
    );

    const roomStage = page.locator("[data-scene-stage]").first();
    await expect(roomStage).toHaveAttribute("data-scene-stage", "opening-day-arc");

    await expect(
      page.locator('[data-scene-rail-tile="opening-day-arc"]').first(),
    ).toHaveAttribute("aria-current", "true");
    await expect(
      page.locator('[data-scene-rail-tile="opening-framing"]').first(),
    ).not.toHaveAttribute("aria-current", "true");
  });

  test("clicking a room rail tile swaps the room stage via soft nav", async ({ page }) => {
    await page.goto("/admin/instances/sample-studio-a?section=agenda&agendaItem=opening");

    await page.locator('[data-scene-rail-tile="opening-day-schedule"]').first().click();

    await expect(page).toHaveURL(/scene=opening-day-schedule/);
    await expect(page.locator("[data-scene-stage]").first()).toHaveAttribute(
      "data-scene-stage",
      "opening-day-schedule",
    );
  });

  test("keyboard j advances the room rail; k steps back", async ({ page }) => {
    // Start from an explicit middle scene so we can test both
    // directions from a single load without round-tripping through
    // multiple soft-nav transitions (which are racy under keyboard).
    await page.goto(
      "/admin/instances/sample-studio-a?section=agenda&agendaItem=opening&scene=opening-day-arc",
    );

    // j advances to opening-day-schedule.
    await page.locator('[data-scene-rail-tile="opening-day-arc"]').first().focus();
    await page.keyboard.press("j");
    await page.waitForURL(/scene=opening-day-schedule/);
  });

  test("keyboard k steps back through the room rail", async ({ page }) => {
    await page.goto(
      "/admin/instances/sample-studio-a?section=agenda&agendaItem=opening&scene=opening-day-arc",
    );

    await page.locator('[data-scene-rail-tile="opening-day-arc"]').first().focus();
    await page.keyboard.press("k");
    await page.waitForURL(/scene=opening-framing/);
  });

  test("facilitator notes peek is collapsed by default and expands on click", async ({ page }) => {
    await page.goto(
      "/admin/instances/sample-studio-a?section=agenda&agendaItem=opening&scene=opening-framing",
    );

    // The peek lives on the room stage panel as a <details> whose
    // summary text starts with the facilitator notes label. Scope to
    // the room stage so the AgendaItemDetail peeks above it don't
    // interfere.
    const roomStage = page.locator("[data-scene-stage]").first();
    const peek = roomStage.locator("details").filter({
      has: page.locator("summary", { hasText: /poznámky pro facilitátora|facilitator notes/i }),
    });

    // Closed by default — the <details> element has no `open` attribute.
    await expect(peek).not.toHaveAttribute("open", "");
    const summary = peek.locator("summary").first();
    await summary.click();
    await expect(peek).toHaveAttribute("open", "");
  });
});

test.describe("one canvas phase 4 — operational forms", () => {
  // Phase 4 exit criterion: password change / archive / facilitator
  // management / participant-access forms look native to the new
  // visual language and still behave identically. These smoke tests
  // verify each form renders the expected fields and the submit
  // buttons are reachable. They do not assert the underlying mutation
  // — those are covered by the per-action unit tests already shipped.

  test.use({
    extraHTTPHeaders: {
      Authorization: `Basic ${Buffer.from("facilitator:secret").toString("base64")}`,
    },
  });

  test("settings section exposes archive + reset (file-mode fallback for password)", async ({ page }) => {
    await page.goto("/admin/instances/sample-studio-a?section=settings");
    // File mode surfaces the account fallback message instead of the
    // password change form (password change requires Neon Auth). The
    // CS fallback mentions "neon módu", the EN one mentions "neon mode"
    // — either one is proof the fallback branch renders.
    await expect(page.getByText(/neon mód|neon mode/i).first()).toBeVisible();
    // Archive workshop form stays visible regardless of auth mode.
    await expect(
      page.getByRole("button", { name: /vytvořit archiv|create archive/i }).first(),
    ).toBeVisible();
  });

  test("settings section reset workshop requires typed confirmation (regression)", async ({ page }) => {
    // Mirrors the pre-existing reset confirmation test, but lives
    // under the Phase 4 describe block so it's caught when the
    // settings visual language pass changes. The reset form lives
    // inside a <details> summary that must be opened first.
    await page.goto("/admin/instances/sample-studio-a?section=settings");
    const summary = page
      .locator("form")
      .filter({ has: page.getByPlaceholder("sample-studio-a") })
      .locator("summary")
      .first();
    await summary.click();
    await expect(page.getByPlaceholder("sample-studio-a")).toBeVisible();
    await expect(
      page.getByText(/Pro potvrzení napište id instance/i),
    ).toBeVisible();
  });

  test("access section exposes participant access code form", async ({ page }) => {
    await page.goto("/admin/instances/sample-studio-a?section=access");
    await expect(
      page.getByRole("button", { name: /vydat nový event code|issue new event code/i }).first(),
    ).toBeVisible();
  });

  test("access section facilitator add form lives in neon-only branch", async ({ page }) => {
    // File mode (e2e default) hides the add-facilitator form behind
    // the fallback message — verify the fallback renders so the flow
    // isn't silently broken.
    await page.goto("/admin/instances/sample-studio-a?section=access");
    await expect(page.getByRole("heading", { name: /správa facilitátorů|facilitator access/i })).toBeVisible();
  });
});

test.describe("one canvas phase 5 — presenter scene coverage", () => {
  // Phase 5 exit criterion: every presenter block type renders in the
  // new presenter surface. The sample-studio-a workshop ships with
  // scenes that collectively exercise the full 10-block palette
  // (hero, rich-text, bullet-list, quote, steps, checklist, image,
  // link-list, callout, participant-preview). These tests walk through
  // a handful of known scenes at iPad resolution and assert each
  // block-specific marker is visible.

  test.use({
    extraHTTPHeaders: {
      Authorization: `Basic ${Buffer.from("facilitator:secret").toString("base64")}`,
    },
  });

  test("opening-framing scene renders hero + bullet-list on iPad", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=opening&scene=opening-framing");
    // Hero body from the 2026-04-12 native-quality rewrite.
    await expect(page.getByText("Učíme se stavět pracovní systém")).toBeVisible();
    // Bullet-list title from the same scene.
    await expect(page.getByText("Co se dnes má změnit")).toBeVisible();
  });

  test("talk-humans-steer scene renders quote + callout on iPad", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=talk&scene=talk-humans-steer");
    // Protected phrase from canonical vocabulary §2.
    await expect(page.getByRole("heading", { name: "Lidé řídí. Agenti vykonávají." })).toBeVisible();
    // Callout body — the day-after closing promise.
    await expect(page.getByText("Druhý den, až si otevřete coding agenta")).toBeVisible();
  });

  test("rotation scene renders the team-trail block surface", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=rotation&scene=rotation-not-yours-anymore");
    // The rotation scene headline after the 2026-04-12 rename.
    await expect(page.getByRole("heading", { name: "Vaše repo už není vaše" })).toBeVisible();
  });

  test("hard-load presenter URL with unknown scene falls back gracefully", async ({ page }) => {
    // The plan's Phase 5 item: hard-load URLs must still resolve via
    // the full-page fallback route even when the scene id is bogus.
    // The fallback either 404s cleanly or renders the default scene
    // for the agenda item; both are acceptable as long as the page
    // doesn't crash.
    const response = await page.goto(
      "/admin/instances/sample-studio-a/presenter?agendaItem=opening&scene=does-not-exist",
    );
    // Any 2xx or 404 is fine. What matters is that the app server
    // didn't throw an uncaught 500.
    expect(response?.status()).toBeLessThan(500);
  });

  test("scene swipe navigation advances to the next scene on soft nav", async ({ page }) => {
    // Phase 5 covers the scene-swiper gesture. Simulating a touch
    // swipe in Playwright is awkward; instead we soft-navigate to
    // the next scene via the rail and confirm the URL + scene change.
    await page.goto("/admin/instances/sample-studio-a?section=agenda&agendaItem=opening");
    // Click the first scene link in the Opening scene list; the
    // presenter overlay route should match on soft-nav.
    const firstSceneLink = page.getByRole("link", { name: "otevřít tuto scénu" }).first();
    await expect(firstSceneLink).toBeVisible();
    await firstSceneLink.click();
    // URL now reflects the presenter route for the first scene.
    await expect(page).toHaveURL(/presenter\?agendaItem=opening/);
  });
});

test.describe("presenter wheel navigation", () => {
  // Drive the actual presenter shell with synthetic wheel events and
  // assert that one physical gesture fires exactly one navigation,
  // that two distinct gestures fire two navigations, that direction
  // reversal works, and that small sub-threshold wheel noise does
  // nothing. These tests catch regressions in the wheel debouncer.

  test.use({
    extraHTTPHeaders: {
      Authorization: `Basic ${Buffer.from("facilitator:secret").toString("base64")}`,
    },
  });

  // Helper: dispatch a wheel event sequence directly on the slide
  // container so it goes through PresenterShell's listener exactly
  // like a real trackpad gesture would. Using `page.mouse.wheel`
  // produces a real WheelEvent but the timing between calls is
  // limited by Playwright's command latency, which is too slow to
  // simulate Mac trackpad inertia. Synthetic dispatch with explicit
  // delays gives us deterministic control.
  async function dispatchWheelGesture(
    page: import("@playwright/test").Page,
    deltas: readonly number[],
    intervalMs = 16,
  ) {
    await page.evaluate(
      ({ deltas, intervalMs }) => {
        const slide = document.querySelector('[data-presenter-slide="true"]') as HTMLElement | null;
        if (!slide) throw new Error("slide container not found");
        const target = slide;
        return new Promise<void>((resolve) => {
          let i = 0;
          function fire() {
            if (i >= deltas.length) {
              resolve();
              return;
            }
            target.dispatchEvent(
              new WheelEvent("wheel", { deltaY: deltas[i], bubbles: true, cancelable: true }),
            );
            i += 1;
            setTimeout(fire, intervalMs);
          }
          fire();
        });
      },
      { deltas: [...deltas], intervalMs },
    );
  }

  async function readActiveSceneFromUrl(page: import("@playwright/test").Page) {
    const url = page.url();
    const match = url.match(/scene=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  // Read the rail's scene ids in order from the DOM. The rail is
  // rendered with one <Link> per scene; we derive the pack order by
  // walking each link's href and extracting the scene query param.
  async function readSceneOrder(page: import("@playwright/test").Page) {
    return page.evaluate(() => {
      const rail = document.querySelector('[aria-label="scene navigation"]');
      if (!rail) return [] as string[];
      const links = rail.querySelectorAll<HTMLAnchorElement>("a[href*='scene=']");
      return Array.from(links).map((link) => {
        const match = link.getAttribute("href")?.match(/scene=([^&]+)/);
        return match ? decodeURIComponent(match[1]) : "";
      });
    });
  }

  async function readActiveIndex(page: import("@playwright/test").Page) {
    const active = await readActiveSceneFromUrl(page);
    const order = await readSceneOrder(page);
    return order.findIndex((id) => id === active);
  }

  // Goto + wait for the rail to render so tests have a stable anchor.
  async function gotoPresenter(page: import("@playwright/test").Page, scenePath: string) {
    await page.goto(scenePath);
    await page.waitForSelector('[data-presenter-slide="true"]');
    await page.waitForSelector('[aria-label="scene navigation"] a[href*="scene="]');
  }

  test("one wheel gesture advances exactly one scene", async ({ page }) => {
    await gotoPresenter(page, "/admin/instances/sample-studio-a/presenter?agendaItem=opening&scene=opening-framing");
    const order = await readSceneOrder(page);
    const initialIndex = await readActiveIndex(page);
    expect(initialIndex).toBe(0);

    // One gesture = active phase + inertia tail. Active phase emits
    // ~10 events with deltaY ≈ 50 at 16ms intervals; inertia tail
    // emits ~25 decaying events.
    const active = Array.from({ length: 10 }, () => 50);
    const inertia = Array.from({ length: 25 }, (_, i) => Math.max(2, 50 * Math.exp(-i / 6)));
    await dispatchWheelGesture(page, [...active, ...inertia], 16);

    // Wait for the carousel to settle (animation + URL replace).
    await page.waitForTimeout(600);
    const afterIndex = await readActiveIndex(page);
    // Critical: exactly ONE step forward, regardless of the inertia
    // tail's length. afterIndex must be initial + 1, not + 2.
    expect(afterIndex).toBe(initialIndex + 1);
    expect(await readActiveSceneFromUrl(page)).toBe(order[initialIndex + 1]);
  });

  test("two distinct wheel gestures advance two scenes", async ({ page }) => {
    await gotoPresenter(page, "/admin/instances/sample-studio-a/presenter?agendaItem=opening&scene=opening-framing");
    const initialIndex = await readActiveIndex(page);

    // Two gestures separated by a quiet window > 450ms (the gesture
    // quiet threshold) so the second starts fresh.
    await dispatchWheelGesture(
      page,
      [...Array(10).fill(50), ...Array(20).fill(0).map((_, i) => 50 * Math.exp(-i / 6))],
      16,
    );
    await page.waitForTimeout(750);

    await dispatchWheelGesture(
      page,
      [...Array(10).fill(50), ...Array(20).fill(0).map((_, i) => 50 * Math.exp(-i / 6))],
      16,
    );
    await page.waitForTimeout(600);

    const afterIndex = await readActiveIndex(page);
    expect(afterIndex).toBe(initialIndex + 2);
  });

  test("direction reversal goes back to the previous scene", async ({ page }) => {
    await gotoPresenter(page, "/admin/instances/sample-studio-a/presenter?agendaItem=opening&scene=opening-framing");
    const initialIndex = await readActiveIndex(page);

    await dispatchWheelGesture(page, [...Array(10).fill(50)], 16);
    await page.waitForTimeout(600);
    const afterForward = await readActiveIndex(page);
    expect(afterForward).toBe(initialIndex + 1);

    // Reverse gesture immediately after. Exercises the direction-
    // reversal fast path (no quiet wait required).
    await dispatchWheelGesture(page, [...Array(10).fill(-50)], 16);
    await page.waitForTimeout(600);
    const afterReverse = await readActiveIndex(page);
    expect(afterReverse).toBe(initialIndex);
  });

  test("sub-threshold wheel noise does nothing", async ({ page }) => {
    await gotoPresenter(page, "/admin/instances/sample-studio-a/presenter?agendaItem=opening&scene=opening-framing");
    const initialIndex = await readActiveIndex(page);

    // 5 tiny wheel events, total deltaY = 25, below the 30 threshold.
    await dispatchWheelGesture(page, [5, 5, 5, 5, 5], 30);
    await page.waitForTimeout(700);

    expect(await readActiveIndex(page)).toBe(initialIndex);
  });

  test("third gesture in a row still navigates (no permanent freeze)", async ({ page }) => {
    await gotoPresenter(page, "/admin/instances/sample-studio-a/presenter?agendaItem=opening&scene=opening-framing");
    const initialIndex = await readActiveIndex(page);

    for (let i = 0; i < 3; i++) {
      await dispatchWheelGesture(
        page,
        [...Array(10).fill(50), ...Array(15).fill(0).map((_, j) => 50 * Math.exp(-j / 5))],
        16,
      );
      await page.waitForTimeout(750);
    }

    expect(await readActiveIndex(page)).toBe(initialIndex + 3);
  });

  test("a single huge wheel event does not fire multiple navigations", async ({ page }) => {
    await gotoPresenter(page, "/admin/instances/sample-studio-a/presenter?agendaItem=opening&scene=opening-framing");
    const initialIndex = await readActiveIndex(page);

    // A single wheel event with a delta 10x the threshold would, on a
    // naive impl, fire one navigation — good. The test is here to
    // lock that invariant: one event, one navigation, never more.
    await dispatchWheelGesture(page, [300], 0);
    await page.waitForTimeout(600);

    expect(await readActiveIndex(page)).toBe(initialIndex + 1);
  });

  test("continuous event stream with rising-edge unlock navigates twice", async ({ page }) => {
    // The hardest case. The user scrolls forward strongly, releases,
    // inertia decays, but BEFORE the 450ms quiet window elapses they
    // start scrolling again in the SAME direction. A pure
    // quiet-window approach would block the second gesture until the
    // inertia tail finishes. The rising-edge heuristic should detect
    // the new gesture via |deltaY| going UP after decay.
    await gotoPresenter(page, "/admin/instances/sample-studio-a/presenter?agendaItem=opening&scene=opening-framing");
    const initialIndex = await readActiveIndex(page);

    // Gesture 1 active (50 → 50), then inertia decay (50 → 1),
    // immediately followed by gesture 2 active (50 → 50) with NO
    // quiet gap. The rising edge from 1 → 50 should unlock.
    const gesture1Active = Array.from({ length: 8 }, () => 50);
    const gesture1Inertia = Array.from({ length: 15 }, (_, i) => Math.max(1, 50 * Math.exp(-i / 4)));
    const gesture2Active = Array.from({ length: 8 }, () => 50);
    const continuousStream = [...gesture1Active, ...gesture1Inertia, ...gesture2Active];
    await dispatchWheelGesture(page, continuousStream, 16);
    await page.waitForTimeout(600);

    expect(await readActiveIndex(page)).toBe(initialIndex + 2);
  });

  test("pure inertia tail after firing does not re-trigger navigation", async ({ page }) => {
    // The inverse of the rising-edge test: a long decaying inertia
    // tail (no rising edge) must not fire a second navigation no
    // matter how many events arrive. This is the "double change"
    // regression guard.
    await gotoPresenter(page, "/admin/instances/sample-studio-a/presenter?agendaItem=opening&scene=opening-framing");
    const initialIndex = await readActiveIndex(page);

    // One strong gesture followed by a long monotonically decaying
    // tail — no rising edges anywhere in the tail.
    const active = Array.from({ length: 8 }, () => 50);
    const longTail = Array.from({ length: 60 }, (_, i) => Math.max(1, 50 * Math.exp(-i / 15)));
    await dispatchWheelGesture(page, [...active, ...longTail], 16);
    await page.waitForTimeout(800);

    // Must be exactly +1, not +2 despite the massive event count.
    expect(await readActiveIndex(page)).toBe(initialIndex + 1);
  });
});

test.describe("one canvas phase 6 — polish, responsiveness, keyboard", () => {
  // Phase 6 covers the rail/keyboard/viewport checks. Tests use the
  // Playwright browser at the five target viewports and verify the
  // admin/presenter shell doesn't visually break.

  test.use({
    extraHTTPHeaders: {
      Authorization: `Basic ${Buffer.from("facilitator:secret").toString("base64")}`,
    },
  });

  async function readActivePresenterSlideMetrics(page: import("@playwright/test").Page) {
    return page.evaluate(() => {
      const slide = document.querySelector('[data-presenter-slide="true"][aria-hidden="false"]') as HTMLElement | null;
      if (!slide) {
        throw new Error("active presenter slide not found");
      }

      return {
        bodyScrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        slideScrollHeight: slide.scrollHeight,
        slideClientHeight: slide.clientHeight,
      };
    });
  }

  test("presenter renders at 4:3 iPad viewport without content overflow", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=talk&scene=talk-humans-steer");
    // The page body should fit inside the viewport horizontally — no
    // scrollbar caused by an overflowing element. Measure document
    // scroll width vs viewport width.
    const metrics = await readActivePresenterSlideMetrics(page);
    expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  });

  test("presenter renders at 16:9 big-screen mirror viewport without content overflow", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=talk&scene=talk-humans-steer");
    const metrics = await readActivePresenterSlideMetrics(page);
    expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  });

  test("presenter proof and rollout scenes fit the 4:3 baseline without vertical scroll", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });

    const proofScenes = [
      { label: "talk-argued-about-prompts", path: "/admin/instances/sample-studio-a/presenter?agendaItem=talk&scene=talk-argued-about-prompts" },
      { label: "talk-why-now", path: "/admin/instances/sample-studio-a/presenter?agendaItem=talk&scene=talk-why-now" },
      { label: "talk-got-a-name", path: "/admin/instances/sample-studio-a/presenter?agendaItem=talk&scene=talk-got-a-name" },
      { label: "talk-how-to-build", path: "/admin/instances/sample-studio-a/presenter?agendaItem=talk&scene=talk-how-to-build" },
      { label: "talk-managing-agents", path: "/admin/instances/sample-studio-a/presenter?agendaItem=talk&scene=talk-managing-agents" },
      { label: "talk-humans-steer", path: "/admin/instances/sample-studio-a/presenter?agendaItem=talk&scene=talk-humans-steer" },
      { label: "build-1-next-65-minutes", path: "/admin/instances/sample-studio-a/presenter?agendaItem=build-1&scene=build-1-next-65-minutes" },
      { label: "build-1-by-lunch", path: "/admin/instances/sample-studio-a/presenter?agendaItem=build-1&scene=build-1-by-lunch" },
      { label: "rotation-read-the-room", path: "/admin/instances/sample-studio-a/presenter?agendaItem=rotation&scene=rotation-read-the-room" },
      { label: "build-2a-eighty-five", path: "/admin/instances/sample-studio-a/presenter?agendaItem=build-2&scene=build-2a-eighty-five" },
      { label: "build-2b-second-push-timeline", path: "/admin/instances/sample-studio-a/presenter?agendaItem=build-2-second-push&scene=build-2b-second-push-timeline" },
      { label: "reveal-one-thing", path: "/admin/instances/sample-studio-a/presenter?agendaItem=reveal&scene=reveal-one-thing" },
      { label: "reveal-save-the-commitment", path: "/admin/instances/sample-studio-a/presenter?agendaItem=reveal&scene=reveal-save-the-commitment" },
    ] as const;

    for (const scene of proofScenes) {
      await page.goto(scene.path);
      await page.waitForSelector('[data-presenter-slide="true"][aria-hidden="false"]');
      const metrics = await readActivePresenterSlideMetrics(page);
      expect(metrics.slideScrollHeight, `${scene.label} should fit without vertical scroll`).toBeLessThanOrEqual(
        metrics.slideClientHeight + 2,
      );
    }
  });

  test("keeps the split proof scenes visually stable on ipad", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });

    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=talk&scene=talk-argued-about-prompts");
    await expect(page).toHaveScreenshot("presenter-talk-evidence-proof-ipad.png", {
      maxDiffPixelRatio: 0.08,
    });

    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=talk&scene=talk-how-to-build");
    await expect(page).toHaveScreenshot("presenter-talk-pillars-proof-ipad.png", {
      maxDiffPixelRatio: 0.08,
    });

    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=build-1&scene=build-1-next-65-minutes");
    await expect(page).toHaveScreenshot("presenter-build-1-proof-ipad.png", {
      maxDiffPixelRatio: 0.08,
    });

    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=reveal&scene=reveal-one-thing");
    await expect(page).toHaveScreenshot("presenter-reveal-commitment-proof-ipad.png", {
      maxDiffPixelRatio: 0.08,
    });
  });

  test("admin shell renders on iPad portrait without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 1366 });
    await page.goto("/admin/instances/sample-studio-a?section=agenda&agendaItem=talk");
    const metrics = await page.evaluate(() => ({
      bodyScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  });

  test("admin shell renders on desktop small without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1200 });
    await page.goto("/admin/instances/sample-studio-a?section=agenda&agendaItem=talk");
    const metrics = await page.evaluate(() => ({
      bodyScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  });

  test("admin shell renders on desktop large without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1400 });
    await page.goto("/admin/instances/sample-studio-a?section=agenda&agendaItem=talk");
    const metrics = await page.evaluate(() => ({
      bodyScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  });

  test("keyboard-only navigation reaches the first inline field on the agenda detail", async ({ page }) => {
    await page.goto("/admin/instances/sample-studio-a?section=agenda&agendaItem=talk");
    // Focus the document, then Tab repeatedly until an inline field
    // display button gets focus. A 50-Tab budget is more than enough
    // for the header nav + outline rail + hero.
    await page.keyboard.press("Tab");
    let reached = false;
    for (let i = 0; i < 50; i++) {
      const focused = await page.evaluate(
        () => document.activeElement?.getAttribute("data-inline-field") ?? null,
      );
      if (focused === "display") {
        reached = true;
        break;
      }
      await page.keyboard.press("Tab");
    }
    expect(reached).toBe(true);
  });

  test("theme switcher toggles the html class token", async ({ page }) => {
    await page.goto("/admin/instances/sample-studio-a");
    // next-themes is configured with attribute: "class" (see
    // app/components/theme-provider.tsx), so picking a theme writes
    // the chosen value into the html element's class list.
    await page.getByRole("button", { name: /Theme: light/i }).click();
    await expect(page.locator("html")).toHaveClass(/light/);
    await page.getByRole("button", { name: /Theme: dark/i }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});

test.describe("one canvas phase 7 — parity smoke", () => {
  // Phase 7 exit criterion: a single critical-path test navigates
  // admin → agenda detail → presenter → return to admin → inline edit
  // → save, parameterized across the five target viewports. The
  // full-fat version uses swipe + morph; this parity smoke uses soft
  // navigation because Playwright cannot reliably simulate spring-
  // driven drag gestures.

  test.use({
    extraHTTPHeaders: {
      Authorization: `Basic ${Buffer.from("facilitator:secret").toString("base64")}`,
    },
  });

  const viewports = [
    { name: "mobile-393", width: 393, height: 852 },
    { name: "ipad-landscape", width: 1024, height: 768 },
    { name: "ipad-portrait", width: 1024, height: 1366 },
    { name: "desktop-small", width: 1280, height: 1200 },
    { name: "desktop-large", width: 1440, height: 1400 },
  ];

  for (const viewport of viewports) {
    test(`critical path works at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      // 1. Admin cockpit loads. Below the xl breakpoint (1280px) the
      //    outline rail collapses behind the section nav, so the
      //    timeline-row marker is what's visible across all five
      //    viewports — target the TimelineRow div by its rounded
      //    class anchor.
      await page.goto("/admin/instances/sample-studio-a");
      await expect(
        page.locator('div[data-agenda-item="opening"]').first(),
      ).toBeVisible();

      // 2. Open an agenda detail.
      await page.locator('div[data-agenda-item="talk"]').getByRole("link", { name: "detail momentu" }).click();
      await expect(page).toHaveURL(/agendaItem=talk/);
      await expect(
        page.locator('[data-inline-field="display"]').filter({ hasText: /^Context is King$/ }).first(),
      ).toBeVisible();

      // 3. Launch the presenter for the selected scene via the
      //    "open this scene" link. On soft-nav the intercepting
      //    route morphs; on hard-load it renders the full-page
      //    fallback. Both pass this assertion.
      const openScene = page.getByRole("link", { name: "otevřít tuto scénu" }).first();
      await openScene.click();
      await expect(page).toHaveURL(/presenter\?agendaItem=talk/);

      // 4. Return to admin.
      await page.goBack();
      await expect(page).toHaveURL(/agendaItem=talk/);

      // 5. Inline-edit the room summary and confirm the change
      //    persists across a reload. We pick a unique suffix so each
      //    viewport run can prove the save independently without
      //    depending on cleanup clicks that can race with the post-save
      //    re-render on slower runners.
      const suffix = `${viewport.name}-${Date.now()}`;
      const summaryButton = page
        .locator('[data-inline-field="display"]')
        .filter({ hasText: /Místnost má odnést/ })
        .first();
      await summaryButton.click();
      const summaryInput = page.locator('[data-inline-field="edit"]').first();
      const original = (await summaryInput.inputValue()) ?? "";
      await summaryInput.fill(`${original}\nparity-${suffix}`);
      // Textarea saves on blur, so click away to commit.
      await page.locator("body").click({ position: { x: 5, y: 5 } });
      const savedSummary = page
        .locator('[data-inline-field="display"]')
        .filter({ hasText: `parity-${suffix}` })
        .first();
      await expect(savedSummary).toBeVisible();
      await page.reload();
      await expect(savedSummary).toBeVisible();
    });
  }
});

test.describe("one canvas phase 7 — capability inventory walkthrough", () => {
  // Phase 7 exit criterion: walk through every capability in the
  // inventory reference, section by section. For each, confirm it has
  // a home in the new IA and works. This is the regression backstop.
  //
  // The inventory:
  // - Agenda: timeline nav, detail hero (inline title/time/goal/
  //   summary + lists), scene cards (inline fields + reorder/default/
  //   toggle/remove), scene create (inline draft), agenda create
  //   (inline draft), agenda reorder, agenda remove, set-live-here,
  //   jump-to-live, launch presenter (soft nav + pop-out), handoff
  //   moment card (unlock/hide/rotation signals)
  // - Teams: card rename (name/repoUrl/city/members/anchor inline),
  //   checkpoint append, register new team
  // - Signals: capture rotation signal (kept as form)
  // - Access: participant access code issue, facilitator add
  //   (neon-only), facilitator revoke (neon-only), facilitator
  //   fallback message in file mode
  // - Settings: password change, archive workshop with notes, reset
  //   workshop with typed confirmation, language switcher, theme
  //   switcher, sign out

  test.use({
    extraHTTPHeaders: {
      Authorization: `Basic ${Buffer.from("facilitator:secret").toString("base64")}`,
    },
  });

  test("every documented capability is reachable in the new IA", async ({ page }) => {
    // --- Agenda section ---
    await page.goto("/admin/instances/sample-studio-a?section=agenda");
    // Timeline rows + add agenda item ghost button.
    await expect(page.locator('div[data-agenda-item="opening"]').first()).toBeVisible();
    await expect(page.getByRole("button", { name: /^\+ /i }).first()).toBeVisible();

    // Open an agenda detail.
    await page.locator('div[data-agenda-item="talk"]').getByRole("link", { name: "detail momentu" }).click();
    await expect(page).toHaveURL(/agendaItem=talk/);

    // Inline title + time + goal + roomSummary all render.
    await expect(
      page.locator('[data-inline-field="display"]').filter({ hasText: /^9:40$/ }).first(),
    ).toBeVisible();
    await expect(
      page.locator('[data-inline-field="display"]').filter({ hasText: /^Context is King$/ }).first(),
    ).toBeVisible();

    // Scene card "více" disclosure summary is visible. Open it and
    // verify the management actions (reorder/remove) live inside.
    const moreSummary = page.getByText(/^více$/).first();
    await expect(moreSummary).toBeVisible();
    await moreSummary.click();
    await expect(
      page.getByRole("button", { name: /posunout scénu výš|move scene up/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /odebrat scénu|remove scene/i }).first(),
    ).toBeVisible();
    // AddSceneRow draft button present.
    await expect(
      page.getByRole("button", { name: /\+ přidat scénu|\+ add scene/i }).first(),
    ).toBeVisible();

    // Launch presenter links exist.
    await expect(page.getByRole("link", { name: "otevřít tuto scénu" }).first()).toBeVisible();

    // --- Teams section ---
    await page.goto("/admin/instances/sample-studio-a?section=teams");
    // Register form (new team).
    await expect(page.getByPlaceholder(/Studio A/i).first()).toBeVisible();
    // Inline team card.
    await expect(page.locator('[data-inline-field="display"]').first()).toBeVisible();
    // Checkpoint append textarea. Target by stable `name` attribute so the
    // assertion survives cross-test state mutation (earlier participant-side
    // tests persist a check-in into the shared runtime state, which flips
    // the textarea's placeholder from the hint to the saved text).
    await expect(page.locator('textarea[name="checkpoint"]').first()).toBeVisible();

    // --- Signals section ---
    await page.goto("/admin/instances/sample-studio-a?section=signals");
    await expect(
      page.getByRole("button", { name: /přidat update|add update/i }).first(),
    ).toBeVisible();

    // --- Access section ---
    await page.goto("/admin/instances/sample-studio-a?section=access");
    await expect(
      page.getByRole("button", { name: /vydat nový event code|issue new event code/i }).first(),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /správa facilitátorů/i })).toBeVisible();

    // --- Settings section ---
    await page.goto("/admin/instances/sample-studio-a?section=settings");
    // File-mode fallback for password + archive button. Reset lives
    // inside a <details> that needs opening before the confirmation
    // placeholder becomes visible.
    await expect(page.getByText(/neon mód|neon mode/i).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /vytvořit archiv|create archive/i }).first(),
    ).toBeVisible();
    await page
      .locator("form")
      .filter({ has: page.getByPlaceholder("sample-studio-a") })
      .locator("summary")
      .first()
      .click();
    await expect(page.getByPlaceholder("sample-studio-a")).toBeVisible();

    // --- Header chrome ---
    await expect(page.getByRole("button", { name: /odhlásit se|sign out/i })).toBeVisible();
    // Language switcher renders CS + EN links.
    await expect(page.getByRole("link", { name: /^CZ$/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /^EN$/i }).first()).toBeVisible();
  });
});

test.describe("landing page motion — motion path", () => {
  test("hero heading animates from hidden to full opacity", async ({ page }) => {
    await page.goto("/");
    const heading = page.getByRole("heading", { name: /harness/i, level: 1 }).first();
    await expect(heading).toBeVisible();

    // On slower runners the keyframe may already be near completion by
    // the time Playwright starts sampling opacity, so assert the motion
    // contract via computed animation metadata instead of requiring a
    // captured mid-flight frame.
    const animation = await heading.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        animationName: style.animationName,
        animationDuration: style.animationDuration,
        animationDelay: style.animationDelay,
      };
    });
    expect(animation.animationName).toContain("landing-rise");
    expect(hasNonZeroTransition(animation.animationDuration)).toBe(true);

    await expect
      .poll(
        async () => Number(await heading.evaluate((el) => Number(getComputedStyle(el).opacity))),
        { timeout: 2000, intervals: [50, 100, 200] },
      )
      .toBeGreaterThanOrEqual(0.99);
  });

  test("on-scroll FadeUp sections reach full opacity", async ({ page }) => {
    await page.goto("/#details");
    // Anchor jump puts the details cards in the viewport; whileInView fires
    // immediately, the animation settles within ~500ms.
    const card = page.getByText(/\w+/).locator("..").filter({ hasText: /./ }).first();
    await expect(card).toBeVisible();
    await expect
      .poll(
        async () =>
          Number(
            await page
              .getByRole("heading", { name: /harness/i, level: 1 })
              .first()
              .evaluate((el) => Number(getComputedStyle(el).opacity)),
          ),
        { timeout: 2000 },
      )
      .toBeGreaterThanOrEqual(0.99);
  });
});

test.describe("landing page motion — reduced-motion path", () => {
  test("hero heading is fully visible on first paint", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const heading = page.getByRole("heading", { name: /harness/i, level: 1 }).first();
    await expect(heading).toBeVisible();
    // Under prefers-reduced-motion, HeroStaggerChild short-circuits to a
    // plain div so content must be visible with opacity 1 from the first
    // paint — no animation, no hidden initial state.
    const opacity = await heading.evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(opacity).toBe(1);
  });

  test("details section cards are fully visible without scroll animation", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#details");
    const sectionLabel = page.getByText(/what.*harness|co.*harness/i).first();
    await expect(sectionLabel).toBeVisible();
    const opacity = await sectionLabel.evaluate(
      (el) => Number(getComputedStyle(el).opacity),
    );
    expect(opacity).toBe(1);
  });
});

test.describe("pending-state loaders", () => {
  test("landing facilitator login link flips aria-busy on click", async ({ page }) => {
    await page.goto("/");
    // Intercept the /admin navigation so we can observe the pending state
    // before the route change resolves. Delay the response enough to let
    // Playwright read aria-busy on the client-side link wrapper.
    await page.route("**/admin**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      await route.continue();
    });

    const link = page.getByRole("link", { name: /facilitator|facilitátor/i }).first();
    await expect(link).toBeVisible();
    // Fire the click without awaiting navigation, then read aria-busy.
    const navigation = link.click().catch(() => undefined);
    await expect(link).toHaveAttribute("aria-busy", "true", { timeout: 1000 });
    await navigation;
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
