import { expect, test } from "@playwright/test";

/**
 * Regression test for the participant name-prompt submit feedback.
 *
 * The historical bug: clicking Continue showed no visible pending state
 * while the server action resolved. On slow networks users re-clicked
 * or assumed it was broken. The fix is `SubmitButton` + `InlineSpinner`
 * which set `aria-busy="true"` and render a spinner synchronously on
 * click.
 *
 * We observe the transient pending state via an in-page
 * MutationObserver rather than Playwright's auto-polling, because
 * server-action submissions complete fast enough on localhost that
 * Playwright's retry loop can miss the pending frame.
 */

test.describe("participant submit feedback", () => {
  test("name prompt shows aria-busy while submission is pending", async ({ page }) => {
    await page.setViewportSize({ width: 834, height: 1194 });

    await page.goto("/?lang=en");
    const codeInput = page.getByRole("textbox", { name: /event code/i });
    await codeInput.fill("lantern8-context4-handoff2");
    await page.getByRole("button", { name: /open participant surface/i }).click();

    const nameInput = page.getByRole("textbox", { name: /what's your name\?/i });
    await expect(nameInput).toBeVisible();
    await nameInput.fill("Test Participant");

    // Wait for React hydration to complete — useFormStatus requires the
    // client component to be interactive before it can report pending.
    const continueButton = page.getByRole("button", { name: /continue/i });
    await expect(continueButton).toHaveAttribute("aria-busy", "false");

    // Observe the button via MutationObserver inside the page. This
    // catches the pending frame reliably regardless of how fast the
    // server action resolves.
    const observed = await page.evaluate(async () => {
      const button = document.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (!button) return { sawPending: false, reason: "no submit button" };

      const initialBusy = button.getAttribute("aria-busy");
      let sawPending = false;
      const observer = new MutationObserver(() => {
        if (button.getAttribute("aria-busy") === "true") {
          sawPending = true;
        }
        if (button.querySelector(".animate-spin")) {
          sawPending = true;
        }
      });
      observer.observe(button, { attributes: true, subtree: true, childList: true });

      button.click();

      // Give React a moment to render the pending state. 200ms is well
      // beyond the observed 4ms render time.
      await new Promise((resolve) => setTimeout(resolve, 200));
      observer.disconnect();

      return { sawPending, initialBusy };
    });

    expect(observed.initialBusy).toBe("false");
    expect(observed.sawPending, "expected aria-busy='true' or spinner after click").toBe(true);
  });
});
