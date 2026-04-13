import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ViewTransitionCard } from "./view-transition-card";

// The ViewTransition component resolves at Next.js build time via the
// bundler alias to react-experimental. In the Vitest / Node environment
// we just confirm children render through — the morph behavior itself
// is a runtime browser feature and is verified by Playwright.
describe("ViewTransitionCard", () => {
  it("renders children through the ViewTransition wrapper", () => {
    const html = renderToStaticMarkup(
      <ViewTransitionCard name="test-name">
        <span data-testid="inside">morph target</span>
      </ViewTransitionCard>
    );
    expect(html).toContain("morph target");
  });
});
