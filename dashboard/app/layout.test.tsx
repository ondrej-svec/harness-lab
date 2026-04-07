import { beforeEach, describe, expect, it, vi } from "vitest";

const headers = vi.fn();

vi.mock("next/headers", () => ({
  headers,
}));

vi.mock("next/font/google", () => ({
  Manrope: () => ({ variable: "font-body" }),
  Space_Grotesk: () => ({ variable: "font-display" }),
}));

vi.mock("./components/theme-provider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const layoutModulePromise = import("./layout");

describe("layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports the expected dashboard metadata", async () => {
    const { metadata } = await layoutModulePromise;

    expect(metadata.title).toBe("Harness Lab Dashboard");
    expect(metadata.description).toBe("Mobilní dashboard pro workshop Harness Lab.");
    expect(metadata.icons).toMatchObject({
      apple: "/apple-touch-icon.png",
    });
  });

  it("uses the request language header for the html lang attribute", async () => {
    const { default: RootLayout } = await layoutModulePromise;
    headers.mockResolvedValue(new Headers([["x-harness-ui-lang", "en"]]));

    const view = await RootLayout({
      children: "child",
    });

    expect(view.props.lang).toBe("en");
    expect(view.props.children.props.className).toContain("font-body");
    expect(view.props.children.props.className).toContain("font-display");
  });

  it("falls back to czech when the request language is unsupported", async () => {
    const { default: RootLayout } = await layoutModulePromise;
    headers.mockResolvedValue(new Headers([["x-harness-ui-lang", "de"]]));

    const view = await RootLayout({
      children: "child",
    });

    expect(view.props.lang).toBe("cs");
  });
});
