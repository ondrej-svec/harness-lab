import { describe, expect, it, vi } from "vitest";

describe("theme switcher component wiring", () => {
  it("passes hook state through to the shared render helper", async () => {
    vi.resetModules();
    const setTheme = vi.fn();

    vi.doMock("react", async () => {
      const actual = await vi.importActual<typeof import("react")>("react");
      return {
        ...actual,
        useEffect: (effect: () => void) => effect(),
        useState: () => [true, vi.fn()] as const,
      };
    });
    vi.doMock("next-themes", () => ({
      useTheme: () => ({
        theme: "dark",
        setTheme,
      }),
    }));

    const { ThemeSwitcher } = await import("./theme-switcher");
    const view = ThemeSwitcher();

    expect(view.type).toBe("div");
    expect(view.props.children[2].props.className).toContain("text-[var(--text-primary)]");
    view.props.children[0].props.onClick();
    expect(setTheme).toHaveBeenCalledWith("system");
  });
});
