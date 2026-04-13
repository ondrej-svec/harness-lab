import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

import { SceneSwiper } from "./scene-swiper";

describe("SceneSwiper", () => {
  it("renders children and applies overscroll-behavior-x: contain for iPad gesture safety", () => {
    const html = renderToStaticMarkup(
      <SceneSwiper previousHref="/prev" nextHref="/next">
        <span data-testid="content">slide</span>
      </SceneSwiper>
    );
    expect(html).toContain("slide");
    expect(html).toMatch(/overscroll-behavior-x:\s*contain/);
  });

  it("still renders when one endpoint is null", () => {
    const html = renderToStaticMarkup(
      <SceneSwiper previousHref={null} nextHref="/next">
        <span>first scene</span>
      </SceneSwiper>
    );
    expect(html).toContain("first scene");
  });
});
