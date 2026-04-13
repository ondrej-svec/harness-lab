import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// NOTE: interaction behavior (click-to-edit, blur-saves, Enter/Escape,
// useOptimistic rollback on error) cannot be fully tested here — the
// dashboard's Vitest setup has no DOM environment (no jsdom / happy-dom
// / @testing-library/react). Adding a DOM test environment is a future
// infrastructure investment tracked as a follow-up on the One Canvas
// plan's Phase 3 checkboxes. Until then, the component's interaction
// behavior is verified in three ways:
//
// 1. TypeScript (compile-time contract for the props + action signature)
// 2. Playwright E2E (runs in a real browser, covers real interactions)
// 3. On-device Phase 1 + Phase 6 review on Ondrej's iPad
//
// These tests cover the subset that renderToStaticMarkup can verify:
// initial display rendering, placeholder behavior, accessible labels,
// and data attribute presence for E2E selectors.

import { InlineField } from "./inline-field";

describe("InlineField (display mode)", () => {
  it("renders the value as a display button", () => {
    const html = renderToStaticMarkup(
      <InlineField value="Opening" fieldName="title" label="název" action={vi.fn()} />,
    );
    expect(html).toContain("Opening");
    expect(html).toContain("data-inline-field=\"display\"");
  });

  it("renders the placeholder when value is empty", () => {
    const html = renderToStaticMarkup(
      <InlineField
        value=""
        fieldName="title"
        label="název"
        placeholder="bez názvu"
        action={vi.fn()}
      />,
    );
    expect(html).toContain("bez názvu");
  });

  it("keeps the display button's accessible name equal to its visible text content — no aria-label, no title", () => {
    const html = renderToStaticMarkup(
      <InlineField value="Rotace týmů" fieldName="f" label="custom-label" action={vi.fn()} />,
    );
    // Neither aria-label nor title on the button. Both would shadow the
    // visible text content as the button's accessible name, which in
    // turn would shadow the surrounding heading's accessible name for
    // Playwright getByRole and for screen readers.
    expect(html).not.toMatch(/<button[^>]*aria-label=/);
    expect(html).not.toMatch(/<button[^>]*title=/);
    expect(html).toContain("Rotace týmů");
  });

  it("preserves the value text verbatim when non-empty", () => {
    const html = renderToStaticMarkup(
      <InlineField
        value="Value with ‹special› chars · 2026"
        fieldName="title"
        label="název"
        action={vi.fn()}
      />,
    );
    expect(html).toContain("Value with ‹special› chars · 2026");
  });

  it("accepts a hiddenFields prop without throwing at render time", () => {
    expect(() =>
      renderToStaticMarkup(
        <InlineField
          value="x"
          fieldName="title"
          label="název"
          hiddenFields={{ agendaId: "abc", lang: "cs" }}
          action={vi.fn()}
        />,
      ),
    ).not.toThrow();
  });

  it("accepts textarea mode without throwing at render time", () => {
    expect(() =>
      renderToStaticMarkup(
        <InlineField
          value="multiline"
          fieldName="body"
          label="popis"
          mode="textarea"
          action={vi.fn()}
        />,
      ),
    ).not.toThrow();
  });
});
