import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

import { SceneRail } from "./scene-rail";

const items = [
  { id: "scene-a", label: "Scene A", href: "/admin/instances/x/presenter?scene=scene-a" },
  { id: "scene-b", label: "Scene B", href: "/admin/instances/x/presenter?scene=scene-b" },
];

describe("SceneRail", () => {
  it("renders one dot per scene with the correct aria-label", () => {
    const html = renderToStaticMarkup(<SceneRail items={items} activeSceneId="scene-a" />);
    expect(html).toContain("aria-label=\"Scene A\"");
    expect(html).toContain("aria-label=\"Scene B\"");
  });

  it("marks the active scene with aria-current", () => {
    const html = renderToStaticMarkup(<SceneRail items={items} activeSceneId="scene-a" />);
    // aria-current is set only on the active item
    const occurrences = (html.match(/aria-current="true"/g) ?? []).length;
    expect(occurrences).toBe(1);
  });

  it("exposes the scene-rail view-transition-name for anchoring", () => {
    const html = renderToStaticMarkup(<SceneRail items={items} activeSceneId="scene-a" />);
    expect(html).toMatch(/view-transition-name:\s*scene-rail/);
  });
});
