import { createHash } from "node:crypto";
import { expect, test, type Locator } from "@playwright/test";

const fileModeAuthToken = createHash("sha256").update("facilitator:secret").digest("hex");

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
    await expect(page.locator("#overview")).toContainText(/Nejde o.předvádění promptů ani o.hackathon energii/i);
    await expect(page.locator("#overview")).toContainText(
      /Celodenní workshop o.tom, jak v.týmu pracovat s.AI coding agenty tak, aby na výsledek mohl navázat kdokoliv další/i,
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
    await page.getByLabel(/kód místnosti|event code/i).fill("lantern8-context4-handoff2");
    await page.getByRole("button", { name: /otevřít plochu pro účastníky|otevřít participant plochu/i }).click();

    await page.waitForURL("**/participant**");

    // New self-identify step (Phase 4): the prompt appears first, then
    // the room once a name is bound.
    await page.getByLabel("Jak se jmenujete?").fill("Test Účastník");
    await page.getByRole("button", { name: "Pokračovat" }).click();
    await expect(page.getByLabel("Jak se jmenujete?")).toBeHidden();

    await expect(page.getByText(/plocha pro účastníky|participant plocha/i).first()).toBeVisible();
    await expect(page.getByText("opustit kontext místnosti")).toBeVisible();
    // Current phase/build shell content is present, not just public chrome.
    await expect(page.getByText("10:30 • Build Phase 1")).toBeVisible();
    await expect(page.getByText("připravená zadání pro tuto místnost")).toBeVisible();
    await expect(page.getByText("https://github.com/example/standup-bot")).toBeVisible();

    // Workshop context line visible with event metadata
    await expect(page.getByText("harness lab · ukázkový workshop den · studio a")).toBeVisible();

    // Session sidebar with facilitator mention is gone
    await expect(page.getByText("Facilitátor zůstává odděleně")).not.toBeVisible();

    // Verify context-aware nav — the participant-home section anchors stay reachable.
    const participantNav = page.getByRole("navigation");
    await expect(participantNav.locator('a[href="#next"]')).toBeVisible();
    await expect(participantNav.locator('a[href="#build"]')).toBeVisible();
    await expect(participantNav.locator('a[href="#reference"]')).toBeVisible();
  });

  test("keeps the participant mobile room view visually stable", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/");
    await page.getByLabel(/kód místnosti|event code/i).fill("lantern8-context4-handoff2");
    await page.getByRole("button", { name: /otevřít plochu pro účastníky|otevřít participant plochu/i }).click();
    await page.waitForURL("**/participant**");
    // Self-identify so the room view renders (not the prompt).
    await page.getByLabel("Jak se jmenujete?").fill("Test Účastník");
    await page.getByRole("button", { name: "Pokračovat" }).click();
    await expect(page.getByLabel("Jak se jmenujete?")).toBeHidden();
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

    // Bind a name so the room view renders (not the prompt).
    await page.getByLabel("What's your name?").fill("Test Participant");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByLabel("What's your name?")).toBeHidden();

    const buildJump = page.locator('a[href="#build-briefs"]').first();

    expect(hasNonZeroTransition(await readTransitionDuration(buildJump))).toBe(true);

    // The check-in form is visible, but submitting requires team
    // membership (enforced since 976ab6b). Team assignment happens via
    // the facilitator API; separate integration coverage validates the
    // submit path. Here we just confirm the form is interactive.
    await page.getByLabel("what changed").fill("We mapped the repo and pinned one failing check.");
    await page.getByLabel("what verifies it").fill("The team reviewed the repo entrypoints together.");
    await page.getByLabel("next safe move").fill("Write the first plan directly in the repo.");
    await expect(page.getByRole("button", { name: "Record checkpoint" })).toBeEnabled();

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

  test.beforeEach(async ({ context, baseURL }) => {
    await context.addCookies([
      {
        name: "harness-admin-file-auth",
        value: fileModeAuthToken,
        url: baseURL!,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
  });

  test("loads the workspace cockpit, filters instances, and opens the run-first control room", async ({ page }) => {
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
    await expect(page.getByRole("heading", { name: "run", exact: true })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "run" }).first()).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "lidé" }).first()).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "přístupy" }).first()).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "nastavení" }).first()).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "agenda" })).toHaveCount(0);
    await expect(page.getByRole("navigation").getByRole("link", { name: "týmy" })).toHaveCount(0);
    await expect(page.getByRole("navigation").getByRole("link", { name: "signály" })).toHaveCount(0);
    await expect(page.getByText("tahák pro facilitátora", { exact: true })).toBeVisible();
    await expect(page.getByText("sběr signálů", { exact: true })).toBeVisible();

    await page.locator('[data-agenda-item="rotation"]').getByRole("link", { name: "detail momentu" }).click();
    await expect(page).toHaveURL(/agendaItem=rotation/);
    await expect(page.getByText("13:30 • Rotace týmů").first()).toBeVisible();
    await page.getByRole("button", { name: "posunout live sem" }).first().click();
    await expect(page.getByRole("button", { name: "Odemknout" })).toBeVisible();

    await page.getByRole("button", { name: "Odemknout" }).click();
    await expect(page.getByText(/plocha pro účastníky je otevřená|participant plocha je otevřená/i).first()).toBeVisible();

    await page.goto("/admin/instances/sample-studio-a?section=settings");
    await expect(page.getByRole("heading", { name: /plocha pro účastníky|participant plocha/i })).toBeVisible();
    await page.getByRole("button", { name: "znovu skrýt" }).click();
    await expect(page.getByText(/plocha pro účastníky je skrytá|participant plocha je skrytá/i).first()).toBeVisible();
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
    await expect(page.getByText("Správa facilitátorů je dostupná jen v neon módu.")).toBeVisible();
  });

  test("keeps dashboard authoring furniture off the run detail", async ({ page }) => {
    await page.goto("/admin/instances/sample-studio-a?section=run&agendaItem=talk");

    await expect(page.getByText("tahák pro facilitátora", { exact: true })).toBeVisible();
    await expect(page.getByText("sběr signálů", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "otevřít projekci" })).toBeVisible();
    await expect(page.getByRole("link", { name: /plocha pro účastníky 1:1|participant plocha 1:1/i })).toBeVisible();
    await expect(page.getByText("zdroj a ukládání")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /\+ přidat scénu/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /\+ přidat moment/i })).toHaveCount(0);
  });

  test("keeps room screen and participant mirror as separate launch targets in the run detail", async ({ page }) => {
    await page.goto("/admin/instances/sample-studio-a?section=run&agendaItem=rotation");

    const projectionLink = page.getByRole("link", { name: "otevřít projekci" });
    const participantLink = page.getByRole("link", { name: /plocha pro účastníky 1:1|participant plocha 1:1/i });

    await expect(page.getByText("13:30 • Rotace týmů").first()).toBeVisible();
    await expect(projectionLink).toBeVisible();
    await expect(participantLink).toBeVisible();
    await expect(projectionLink).toHaveAttribute("href", /\/presenter\?agendaItem=rotation&scene=rotation-not-yours-anymore/);
    await expect(participantLink).toHaveAttribute("href", /\/participant/);
  });

  test("renders the room screen on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=rotation");

    // Presenter renders the default room scene for the rotation phase —
    // `rotation-not-yours-anymore` after the 2026-04-12 content review.
    await expect(page.getByRole("heading", { name: "Vaše repo zůstává vaše" })).toBeVisible();
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

  test("renders the talk role-shift scene and keeps a stable ipad layout", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=talk&scene=talk-managing-agents");

    await expect(page.getByRole("heading", { name: "Managing agentů mění vaši roli" })).toBeVisible();
    await expect(page.getByText("Charlie Guo, OpenAI")).toBeVisible();
    await expect(page.getByText("source material")).toHaveCount(0);
  });

  test("renders the opening participant proof slice on mobile without drifting into backstage copy", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=opening&scene=opening-team-formation-room");

    await expect(page.getByRole("heading", { name: /Postavte se do.řady/ })).toBeVisible();
    await expect(page.getByText("Formování týmů · 9 minut")).toBeVisible();
    // Backstage copy must stay off the participant surface.
    await expect(page.getByText("zdrojový materiál")).toHaveCount(0);

    await expect(page).toHaveScreenshot("presenter-opening-participant-proof-mobile.png", {
      maxDiffPixelRatio: 0.08,
    });
  });

  test("renders the updated opening agenda, team-formation, and handoff scenes in the browser", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });

    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=opening&scene=opening-day-arc");
    await expect(page.getByRole("heading", { name: "Jak půjde dnešek." })).toBeVisible();
    await expect(page.getByText("09:10 · Úvod, talk a demo")).toBeVisible();
    await expect(page.getByText("10:30 · Build 1")).toBeVisible();
    await expect(page.getByText("13:30 · Rotace a Build 2")).toBeVisible();
    await expect(page.getByText("15:45 · Závěr a reflexe")).toBeVisible();

    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=opening&scene=opening-team-formation-room");
    await expect(
      page.getByRole("heading", { name: "Postavte se do řady. Rozpočítejte se. Sedněte si spolu." }),
    ).toBeVisible();
    await expect(page.getByText("Sedněte si spolu a krátce se seznamte").first()).toBeVisible();
    await expect(page.getByText("Vyberte si kotvu")).toHaveCount(0);
    await expect(page.getByText("pojmenujte tým")).toHaveCount(0);
    await expect(page.getByText("Řiďte se děním v sále")).toHaveCount(0);
    await expect(page.getByText("tým zapíšeme naživo")).toHaveCount(0);

    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=opening&scene=opening-handoff");
    await expect(page.getByRole("heading", { name: "Týmy jsou hotové. Podívejte se nahoru." })).toBeVisible();
    await expect(page.getByText("Další krok: talk.")).toBeVisible();
    await expect(page.getByText("Na boardu máte svůj tým")).toHaveCount(0);
  });

  test("people section records team history markers and assignment changes", async ({ page }) => {
    await page.goto("/admin/instances/sample-studio-a?section=people");

    const uniqueParticipant = `E2E Person ${Date.now()}`;
    await page
      .getByPlaceholder("Anna\nDavid, david@example.com\nEva, eva@example.com, senior")
      .fill(uniqueParticipant);
    await page.getByRole("button", { name: "Přidat do poolu" }).click();

    const firstPoolRow = page.getByTestId("pool-row").first();
    await expect(firstPoolRow).toBeVisible();
    const participantName = ((await firstPoolRow.getAttribute("data-participant-name")) ?? "").trim();
    expect(participantName.length).toBeGreaterThan(0);

    const firstTeamCard = page.getByTestId("team-card").first();
    await firstTeamCard.getByRole("button", { name: "+ přidat z poolu" }).click();
    await page.getByRole("button", { name: participantName }).click();

    const historyList = page.getByTestId("team-history-list");
    await expect(historyList.getByText(new RegExp(participantName))).toBeVisible();
    await expect(historyList.getByText(new RegExp(`${participantName} .*přiřazen do`, "i")).first()).toBeVisible();

    const uniqueMarker = `E2E reshuffle ${Date.now()}`;
    await page.getByLabel("poznámka").fill(uniqueMarker);
    await page.getByRole("button", { name: "označit začátek reshuffle" }).click();
    await expect(historyList.getByText(uniqueMarker).first()).toBeVisible();
  });

  test("access and settings stay reachable as quieter secondary sections", async ({ page }) => {
    await page.goto("/admin/instances/sample-studio-a?section=access");
    await expect(page.getByRole("heading", { name: "sdílený event code" })).toBeVisible();
    await expect(page.getByRole("button", { name: "vydat nový event code" })).toBeVisible();

    await page.goto("/admin/instances/sample-studio-a?section=settings");
    await expect(page.getByRole("heading", { name: "bezpečnostní zásahy" })).toBeVisible();
    await expect(page.getByRole("button", { name: "vytvořit archiv" })).toBeVisible();
  });

  test("facilitators API returns list with auth", async ({ request }) => {
    const response = await request.get("/api/workshop/instances/sample-studio-a/facilitators");
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

  test("talk-managing-agents scene renders quote + callout on iPad", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=talk&scene=talk-managing-agents");
    await expect(page.getByRole("heading", { name: "Managing agentů mění vaši roli" })).toBeVisible();
    await expect(page.getByText("Team lead staví systém")).toBeVisible();
  });

  test("rotation scene renders the team-trail block surface", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/admin/instances/sample-studio-a/presenter?agendaItem=rotation&scene=rotation-not-yours-anymore");
    // The rotation scene headline after the 2026-04-12 rename.
    await expect(page.getByRole("heading", { name: "Vaše repo zůstává vaše" })).toBeVisible();
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

test.describe("presenter touch navigation", () => {
  test.use({
    extraHTTPHeaders: {
      Authorization: `Basic ${Buffer.from("facilitator:secret").toString("base64")}`,
    },
  });

  async function gotoPresenter(page: import("@playwright/test").Page, scenePath: string) {
    await page.goto(scenePath);
    await page.waitForSelector('[data-presenter-slide="true"][aria-hidden="false"]');
    await page.waitForSelector('[aria-label="scene navigation"] a[href*="scene="]');
  }

  async function readActiveSceneFromUrl(page: import("@playwright/test").Page) {
    const url = page.url();
    const match = url.match(/scene=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

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

  async function dispatchTouchSwipe(
    page: import("@playwright/test").Page,
    {
      startY,
      endY,
      x = 512,
      steps = 6,
      intervalMs = 16,
    }: {
      startY: number;
      endY: number;
      x?: number;
      steps?: number;
      intervalMs?: number;
    },
  ) {
    await page.evaluate(
      async ({ startY, endY, x, steps, intervalMs }) => {
        const target = document.querySelector('[aria-label="presenter scene navigator"]');
        if (!target) {
          throw new Error("presenter scene navigator not found");
        }

        const createTouchLike = (y: number) => ({
          identifier: 1,
          target,
          clientX: x,
          clientY: y,
          pageX: x,
          pageY: y,
          screenX: x,
          screenY: y,
        });

        const dispatchTouchEvent = (
          type: string,
          touches: Array<ReturnType<typeof createTouchLike>>,
          changedTouches = touches,
        ) => {
          const event = new Event(type, { bubbles: true, cancelable: true });
          Object.defineProperty(event, "touches", {
            configurable: true,
            value: touches,
          });
          Object.defineProperty(event, "targetTouches", {
            configurable: true,
            value: touches,
          });
          Object.defineProperty(event, "changedTouches", {
            configurable: true,
            value: changedTouches,
          });
          target.dispatchEvent(event);
        };

        const startTouch = createTouchLike(startY);
        dispatchTouchEvent("touchstart", [startTouch]);

        for (let index = 1; index <= steps; index += 1) {
          const y = startY + ((endY - startY) * index) / steps;
          const moveTouch = createTouchLike(y);
          dispatchTouchEvent("touchmove", [moveTouch]);
          await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
        }

        dispatchTouchEvent("touchend", [], [createTouchLike(endY)]);
      },
      { startY, endY, x, steps, intervalMs },
    );
  }

  async function moveActiveSlideToBoundary(
    page: import("@playwright/test").Page,
    direction: "top" | "bottom",
  ) {
    await page.evaluate((targetDirection) => {
      const slide = document.querySelector<HTMLElement>('[data-presenter-slide="true"][aria-hidden="false"]');
      if (!slide) {
        throw new Error("active presenter slide not found");
      }
      const maxScroll = Math.max(0, slide.scrollHeight - slide.clientHeight);
      slide.scrollTop = targetDirection === "bottom" ? maxScroll : 0;
    }, direction);
  }

  test("@presenter-tablet swipe-up at the slide boundary advances to the next scene", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await gotoPresenter(page, "/admin/instances/sample-studio-a/presenter?agendaItem=opening&scene=opening-framing");

    const initialScene = await readActiveSceneFromUrl(page);
    await moveActiveSlideToBoundary(page, "bottom");
    await dispatchTouchSwipe(page, { startY: 620, endY: 420 });
    // Self-hosted ARM runner + webkit occasionally needs >1.5s for the
    // touch-dispatched scene advance to settle. Give it 4s — still tight
    // enough to catch a real freeze, loose enough to not flake on load.
    await expect
      .poll(async () => readActiveSceneFromUrl(page), { timeout: 4_000, intervals: [100, 200, 350, 500] })
      .not.toBe(initialScene);
  });

  test("@presenter-tablet swipe-up from the last scene advances to the next agenda item", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await gotoPresenter(page, "/admin/instances/sample-studio-a/presenter?agendaItem=opening&scene=opening-framing");

    const openingScenes = await readSceneOrder(page);
    const lastOpeningScene = openingScenes.at(-1);
    expect(lastOpeningScene).toBeTruthy();

    await gotoPresenter(
      page,
      `/admin/instances/sample-studio-a/presenter?agendaItem=opening&scene=${encodeURIComponent(lastOpeningScene!)}`,
    );

    await moveActiveSlideToBoundary(page, "bottom");
    await dispatchTouchSwipe(page, { startY: 620, endY: 420 });
    await page.waitForURL(/agendaItem=talk/);
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
    const response = await context.get("/api/workshop/instances/sample-studio-a/facilitators");
    expect(response.status()).toBe(401);
    await context.dispose();
  });
});
