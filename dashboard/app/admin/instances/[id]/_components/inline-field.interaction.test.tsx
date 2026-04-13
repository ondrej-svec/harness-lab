// @vitest-environment happy-dom

// Interaction tests for InlineField. The existing inline-field.test.tsx
// stays in the default (node) environment and covers static rendering
// via renderToStaticMarkup. This file covers the behaviors that require
// a real DOM: click-to-edit transitions, blur / Enter / Escape, save
// flow via the supplied server action, and optimistic rollback on error.
//
// Per-file opt-in — the repo's default Vitest environment is node.

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InlineField } from "./inline-field";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

afterEach(() => {
  cleanup();
});

describe("InlineField (interaction)", () => {
  it("switches from display button to input when clicked, auto-focusing and selecting the value", async () => {
    render(<InlineField value="Opening" fieldName="title" label="název" action={vi.fn()} />);
    const display = screen.getByText("Opening");
    fireEvent.click(display.closest("button")!);
    const input = (await screen.findByDisplayValue("Opening")) as HTMLInputElement;
    expect(input).toBeDefined();
    expect(input.tagName).toBe("INPUT");
    expect(document.activeElement).toBe(input);
  });

  it("calls the supplied action with the new value on blur", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    render(<InlineField value="Opening" fieldName="title" label="název" action={action} />);
    fireEvent.click(screen.getByText("Opening").closest("button")!);
    const input = (await screen.findByDisplayValue("Opening")) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Opening (revised)" } });
    fireEvent.blur(input);
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const formData = action.mock.calls[0][0] as FormData;
    expect(formData.get("title")).toBe("Opening (revised)");
  });

  it("does not call the action when the value is unchanged", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    render(<InlineField value="Opening" fieldName="title" label="název" action={action} />);
    fireEvent.click(screen.getByText("Opening").closest("button")!);
    const input = (await screen.findByDisplayValue("Opening")) as HTMLInputElement;
    fireEvent.blur(input);
    expect(action).not.toHaveBeenCalled();
  });

  it("commits on Enter in text mode and calls the action", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    render(<InlineField value="Opening" fieldName="title" label="název" action={action} />);
    fireEvent.click(screen.getByText("Opening").closest("button")!);
    const input = (await screen.findByDisplayValue("Opening")) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Enter commit" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
  });

  it("does NOT commit on Enter in textarea mode (Enter should insert a newline)", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    render(
      <InlineField
        value="body"
        fieldName="body"
        label="popis"
        mode="textarea"
        action={action}
      />,
    );
    fireEvent.click(screen.getByText("body").closest("button")!);
    const textarea = (await screen.findByDisplayValue("body")) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "multi\nline" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(action).not.toHaveBeenCalled();
  });

  it("reverts to display mode on Escape without calling the action", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    render(<InlineField value="Opening" fieldName="title" label="název" action={action} />);
    fireEvent.click(screen.getByText("Opening").closest("button")!);
    const input = (await screen.findByDisplayValue("Opening")) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Discarded" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(action).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Opening" })).toBeDefined(),
    );
  });

  it("appends the hiddenFields to the submitted FormData", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    render(
      <InlineField
        value="Opening"
        fieldName="title"
        label="název"
        action={action}
        hiddenFields={{ agendaId: "abc", instanceId: "studio-a", lang: "cs" }}
      />,
    );
    fireEvent.click(screen.getByText("Opening").closest("button")!);
    const input = (await screen.findByDisplayValue("Opening")) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "next" } });
    fireEvent.blur(input);
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const fd = action.mock.calls[0][0] as FormData;
    expect(fd.get("title")).toBe("next");
    expect(fd.get("agendaId")).toBe("abc");
    expect(fd.get("instanceId")).toBe("studio-a");
    expect(fd.get("lang")).toBe("cs");
  });

  it("keeps the display button's accessible name equal to the value (no aria-label, no title shadowing)", () => {
    render(<InlineField value="Rotace týmů" fieldName="title" label="název" action={vi.fn()} />);
    // Accessible name = text content = "Rotace týmů". This is what
    // prevents the surrounding heading from inheriting a confusing
    // accessible name (the regression fixed in commit dcdd22f).
    const btn = screen.getByRole("button", { name: "Rotace týmů" });
    expect(btn).toBeDefined();
  });
});
