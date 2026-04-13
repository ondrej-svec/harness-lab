import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MotionProvider } from "./motion-provider";

// Sample test proving the Motion + Vitest integration works per plan A14.
// This is the foundational smoke check — if Motion can't even render a
// LayoutGroup through server rendering, the rest of the _components/ test
// suite won't compile.
describe("MotionProvider", () => {
  it("renders children inside a LayoutGroup without throwing", () => {
    const html = renderToStaticMarkup(
      <MotionProvider>
        <span data-testid="inner">hello</span>
      </MotionProvider>
    );

    expect(html).toContain("hello");
    expect(html).toContain("data-testid=\"inner\"");
  });
});
