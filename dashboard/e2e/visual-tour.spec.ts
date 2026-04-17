import { expect, test } from "@playwright/test";
import path from "node:path";

/**
 * Visual design-system tour — captures screenshots of the People section,
 * the self-identify prompt, and the participant room at both light and
 * dark themes. Saved to test-results/visual-tour/ for out-of-band review.
 * Not a regression test — always passes, the artefacts are the output.
 */

const SHOT_DIR = path.join("test-results", "visual-tour");

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 393, height: 852 },
];

async function prime(page: import("@playwright/test").Page, themeClass?: "light" | "dark") {
  if (!themeClass) return;
  await page.addInitScript((theme) => {
    try {
      localStorage.setItem("harness-theme", theme);
    } catch {}
  }, themeClass);
}

test.describe("visual tour", () => {
  for (const viewport of VIEWPORTS) {
    for (const theme of ["light", "dark"] as const) {
      test(`admin People section · ${viewport.name} · ${theme}`, async ({ page }) => {
        await prime(page, theme);
        await page.setViewportSize(viewport);

        await page.setExtraHTTPHeaders({
          Authorization: `Basic ${Buffer.from("facilitator:secret").toString("base64")}`,
        });

        // Force the theme class on html the same way next-themes does.
        await page.addInitScript((t) => {
          const apply = () => {
            document.documentElement.classList.remove("light", "dark");
            document.documentElement.classList.add(t);
            document.documentElement.style.colorScheme = t;
          };
          if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", apply);
          } else {
            apply();
          }
        }, theme);

        await page.goto("/admin/instances/sample-studio-a?section=people&lang=en");
        await expect(page.getByRole("heading", { name: "paste your roster" })).toBeVisible();

        // Seed a pool so the section is interesting.
        const textarea = page.locator("textarea[name='rawText']");
        await textarea.fill(
          [
            "Ada Lovelace, senior",
            "Linus Torvalds, linus@example.com, senior",
            "Grace Hopper, grace@example.com, mid",
            "Alan Kay, senior",
            "Hedy Lamarr, hedy@example.com, mid",
            "Radia Perlman, junior",
          ].join("\n"),
        );
        await page.getByRole("button", { name: "Add to pool" }).click();
        await expect(page.getByText("Ada Lovelace")).toBeVisible();

        await page.screenshot({
          path: path.join(SHOT_DIR, `admin-people-${viewport.name}-${theme}-empty.png`),
          fullPage: true,
        });

        // Assign two manually for a mixed state.
        const teamAlfaCard = page.locator("[data-testid='team-card'][data-team-id='t1']");
        await teamAlfaCard.getByRole("button", { name: /add from pool/ }).click();
        await teamAlfaCard.getByRole("button", { name: /Ada Lovelace/ }).click();
        await expect(teamAlfaCard.getByText("Ada Lovelace")).toBeVisible();

        await page.screenshot({
          path: path.join(SHOT_DIR, `admin-people-${viewport.name}-${theme}-partial.png`),
          fullPage: true,
        });

        // Open the randomize preview.
        await page.getByRole("button", { name: "Preview", exact: true }).click();
        await expect(page.getByText(/proposed distribution/i)).toBeVisible();

        await page.screenshot({
          path: path.join(SHOT_DIR, `admin-people-${viewport.name}-${theme}-preview.png`),
          fullPage: true,
        });

        // Clean up — commit or cancel before next iteration.
        await page.getByRole("button", { name: "Cancel" }).click();
      });
    }

    test(`participant identify prompt · ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/?lang=en");
      await page.getByLabel("event code").fill("lantern8-context4-handoff2");
      await page.getByRole("button", { name: "open participant surface" }).click();
      await expect(page.getByLabel("What's your name?")).toBeVisible();

      await page.screenshot({
        path: path.join(SHOT_DIR, `participant-identify-${viewport.name}.png`),
        fullPage: true,
      });
    });
  }
});
