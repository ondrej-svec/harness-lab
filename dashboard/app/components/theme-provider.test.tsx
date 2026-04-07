import { describe, expect, it, vi } from "vitest";
import React from "react";

const nextThemesProvider = vi.fn(({ children }: { children: React.ReactNode }) => children);

vi.mock("next-themes", () => ({
  ThemeProvider: nextThemesProvider,
}));

describe("theme provider", () => {
  it("exports the shared provider config", async () => {
    const { themeProviderConfig } = await import("./theme-provider");

    expect(themeProviderConfig).toEqual({
      attribute: "class",
      defaultTheme: "system",
      enableSystem: true,
    });
  });

  it("passes the shared config into next-themes", async () => {
    const { ThemeProvider, themeProviderConfig } = await import("./theme-provider");
    const child = React.createElement("span", null, "child");

    const view = ThemeProvider({
      children: child,
    });

    expect(view).toBeTruthy();
    expect(view.type).toBe(nextThemesProvider);
    expect(view.props).toMatchObject(themeProviderConfig);
    expect(view.props.children).toBe(child);
  });
});
