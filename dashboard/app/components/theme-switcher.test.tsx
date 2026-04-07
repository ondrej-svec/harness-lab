import { describe, expect, it, vi } from "vitest";

vi.mock("next-themes", () => ({
  useTheme: vi.fn(),
}));

describe("theme switcher", () => {
  it("exports the available theme options", async () => {
    const { themeOptions } = await import("./theme-switcher");

    expect(themeOptions).toEqual([
      { value: "system", label: "auto" },
      { value: "light", label: "☀" },
      { value: "dark", label: "☾" },
    ]);
  });

  it("renders a placeholder before the client mounts", async () => {
    const { renderThemeSwitcherContent } = await import("./theme-switcher");

    const view = renderThemeSwitcherContent({
      mounted: false,
      theme: "system",
      setTheme: vi.fn(),
    });

    expect(view.type).toBe("div");
    expect(view.props["aria-hidden"]).toBe(true);
    expect(view.props.children).toBe("auto");
  });

  it("renders buttons and marks the active theme when mounted", async () => {
    const setTheme = vi.fn();
    const { renderThemeSwitcherContent } = await import("./theme-switcher");

    const view = renderThemeSwitcherContent({
      mounted: true,
      theme: "light",
      setTheme,
    });

    expect(view.type).toBe("div");
    expect(view.props.children).toHaveLength(3);
    expect(view.props.children[1].props.className).toContain("text-[var(--text-primary)]");
    view.props.children[2].props.onClick();
    expect(setTheme).toHaveBeenCalledWith("dark");
  });
});
