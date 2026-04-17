import { expect, test } from "@playwright/test";

// End-to-end coverage for the participant-management flows (Phase 0.5
// preview docs: docs/previews/2026-04-16-people-section-mockup.html and
// docs/previews/2026-04-16-participant-identify-flow.md). Uses the
// Playwright webServer configured by playwright.config.ts — file-mode
// storage with HARNESS_DATA_DIR pointed at a per-run temp dir that's
// seeded with an empty participant pool and two teams.

test.describe("admin · People section (file mode)", () => {
  test.use({
    extraHTTPHeaders: {
      Authorization: `Basic ${Buffer.from("facilitator:secret").toString("base64")}`,
    },
  });

  async function gotoPeople(page: import("@playwright/test").Page) {
    await page.goto("/admin/instances/sample-studio-a?section=people&lang=en");
    await expect(page.getByRole("heading", { name: "paste your roster" })).toBeVisible();
  }

  test("paste intake creates participants and shows them in the pool", async ({ page }) => {
    await gotoPeople(page);

    const textarea = page.locator("textarea[name='rawText']");
    await textarea.fill(
      [
        "Ada Lovelace",
        "Linus Torvalds, linus@example.com",
        "Grace Hopper, grace@example.com, senior",
      ].join("\n"),
    );
    await page.getByRole("button", { name: "Add to pool" }).click();

    // After the server action + revalidate, all three should be listed
    // in the unassigned pool. Tag pill renders for Grace; email for Linus.
    // The pool heading renders "N unassigned"; eyebrow label is "Pool".
    await expect(page.getByRole("heading", { name: /unassigned$/ })).toBeVisible();
    await expect(page.getByText("Ada Lovelace", { exact: true })).toBeVisible();
    await expect(page.getByText("Linus Torvalds", { exact: true })).toBeVisible();
    await expect(page.getByText("Grace Hopper", { exact: true })).toBeVisible();
    await expect(page.getByText("linus@example.com")).toBeVisible();
    await expect(page.getByText(/senior/).first()).toBeVisible();
  });

  test("click-to-assign moves a pool member onto a team and back", async ({ page }) => {
    await gotoPeople(page);

    // Seed a single participant via the paste form.
    await page.locator("textarea[name='rawText']").fill("Barbara Liskov, senior");
    await page.getByRole("button", { name: "Add to pool" }).click();
    await expect(page.getByText("Barbara Liskov")).toBeVisible();

    // Use the `+ add from pool` picker under Team Alfa.
    const teamAlfaCard = page.locator("[data-testid='team-card'][data-team-id='t1']");
    await teamAlfaCard.getByRole("button", { name: /add from pool/ }).click();
    await teamAlfaCard.getByRole("button", { name: /Barbara Liskov/ }).click();

    // Participant now renders inside the team's member area.
    await expect(teamAlfaCard.getByText("Barbara Liskov")).toBeVisible();

    // Remove via the × on the member chip — participant returns to pool.
    await teamAlfaCard.getByRole("button", { name: /remove from team/i }).click();
    const pool = page.getByTestId("pool-drop-zone");
    await expect(pool.getByText("Barbara Liskov")).toBeVisible();
  });

  test("drag-and-drop moves a participant from pool to team", async ({ page }) => {
    await gotoPeople(page);

    await page
      .locator("textarea[name='rawText']")
      .fill("Margaret Hamilton, margaret@example.com, senior");
    await page.getByRole("button", { name: "Add to pool" }).click();
    await expect(page.getByText("Margaret Hamilton")).toBeVisible();

    // Native HTML5 DnD: build the event sequence in-browser with a real
    // DataTransfer so the component's `onDrop` handler reads the right
    // payload. Using data-testid selectors so this doesn't depend on
    // brittle class-name matching.
    await page.evaluate(() => {
      const source = document.querySelector(
        "[data-testid='pool-row'][data-participant-name='Margaret Hamilton']",
      ) as HTMLElement;
      const target = document.querySelector(
        "[data-testid='team-drop-zone'][data-team-id='t1']",
      ) as HTMLElement;
      if (!source || !target) throw new Error("Drag source or target not found");

      const participantId = source.getAttribute("data-participant-id") ?? "";
      const dt = new DataTransfer();
      dt.setData("text/participant-id", participantId);
      dt.effectAllowed = "move";

      source.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer: dt }));
      const rect = target.getBoundingClientRect();
      const coords = {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        bubbles: true,
        cancelable: true,
        dataTransfer: dt,
      };
      target.dispatchEvent(new DragEvent("dragover", coords));
      target.dispatchEvent(new DragEvent("drop", coords));
      source.dispatchEvent(new DragEvent("dragend", { bubbles: true, dataTransfer: dt }));
    });

    const teamAlfaCard = page.locator("[data-testid='team-card'][data-team-id='t1']");
    await expect(teamAlfaCard.getByText("Margaret Hamilton")).toBeVisible({ timeout: 5_000 });
  });

  test("randomize preview returns a distribution and commit populates teams", async ({ page }) => {
    await gotoPeople(page);

    // Seed six participants across three tag groups.
    await page.locator("textarea[name='rawText']").fill(
      [
        "Ada Lovelace, senior",
        "Grace Hopper, senior",
        "Margaret Hamilton, mid",
        "Hedy Lamarr, mid",
        "Radia Perlman, junior",
        "Barbara Liskov, junior",
      ].join("\n"),
    );
    await page.getByRole("button", { name: "Add to pool" }).click();
    await expect(page.getByText("Ada Lovelace")).toBeVisible();

    // Click Preview — a distribution card should render with tag counts.
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    await expect(page.getByText(/proposed distribution/i)).toBeVisible();

    // Commit the preview.
    await page.getByRole("button", { name: "Commit", exact: true }).click();

    // After commit, at least one participant appears under each team.
    const teamAlfaCard = page.locator("[data-testid='team-card'][data-team-id='t1']");
    const teamBravoCard = page.locator("[data-testid='team-card'][data-team-id='t2']");
    await expect(teamAlfaCard.locator("span:has-text('×')")).not.toHaveCount(0);
    await expect(teamBravoCard.locator("span:has-text('×')")).not.toHaveCount(0);
  });
});

test.describe("participant · self-identify", () => {
  test("prompt appears after anonymous redeem and binds the session on submit", async ({ page }) => {
    // Redeem via the public form — sets the participant cookie without a
    // bound Participant entity, so the page should show the name prompt.
    await page.goto("/?lang=en");
    await page
      .getByRole("textbox")
      .first()
      .fill("lantern8-context4-handoff2");
    // The submit button on the public redeem form is labeled by the
    // public copy; find it by role or fall back to CSS if copy shifts.
    await page.locator("form").first().getByRole("button").first().click();

    // Land on /participant. The identify prompt is the one visible form.
    await expect(page).toHaveURL(/\/participant/);
    await expect(page.getByLabel("What's your name?")).toBeVisible();

    await page.getByLabel("What's your name?").fill("Test Participant");
    await page.getByRole("button", { name: "Continue" }).click();

    // After the server action, the page reloads without the prompt.
    await expect(page.getByLabel("What's your name?")).toBeHidden();
  });
});
