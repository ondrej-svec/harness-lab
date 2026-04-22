import { afterEach, describe, expect, it, vi } from "vitest";

import { parseFeedbackForm, FeedbackFormSchema } from "./feedback-form-schema";
import { getDefaultFeedbackTemplate } from "../workshop-data";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FeedbackFormSchema", () => {
  it("parses the shipping default template", () => {
    const template = getDefaultFeedbackTemplate();
    const result = FeedbackFormSchema.safeParse(template);
    expect(result.success).toBe(true);
  });

  it("parses all six question variants in one form", () => {
    const template = {
      version: 1,
      questions: [
        {
          id: "likert-1",
          type: "likert",
          scale: 4,
          prompt: { cs: "Otázka", en: "Question" },
          anchorMin: { cs: "Ne", en: "No" },
          anchorMax: { cs: "Ano", en: "Yes" },
        },
        {
          id: "stars-1",
          type: "stars",
          max: 5,
          prompt: { cs: "Hvězdy", en: "Stars" },
        },
        {
          id: "single-1",
          type: "single-choice",
          prompt: { cs: "Vyber jednu", en: "Pick one" },
          options: [{ id: "a", label: { cs: "A", en: "A" } }],
        },
        {
          id: "multi-1",
          type: "multi-choice",
          prompt: { cs: "Vyber více", en: "Pick many" },
          options: [{ id: "b", label: { cs: "B", en: "B" } }],
        },
        {
          id: "text-1",
          type: "open-text",
          prompt: { cs: "Napiš", en: "Write" },
          rows: 4,
        },
        {
          id: "quote-ok",
          type: "checkbox",
          prompt: { cs: "Souhlas", en: "Consent" },
          defaultChecked: false,
        },
      ],
    };
    const result = FeedbackFormSchema.safeParse(template);
    expect(result.success).toBe(true);
  });

  it("rejects a malformed variant discriminator", () => {
    const bad = {
      version: 1,
      questions: [{ id: "x", type: "unknown-type", prompt: { cs: "a", en: "a" } }],
    };
    expect(FeedbackFormSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a likert with an unsupported scale", () => {
    const bad = {
      version: 1,
      questions: [
        { id: "x", type: "likert", scale: 6, prompt: { cs: "a", en: "a" } },
      ],
    };
    expect(FeedbackFormSchema.safeParse(bad).success).toBe(false);
  });
});

describe("parseFeedbackForm", () => {
  it("returns null for null without alerting", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(parseFeedbackForm(null, { instanceId: "i-1" })).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it("returns parsed template for valid input", () => {
    const template = getDefaultFeedbackTemplate();
    const parsed = parseFeedbackForm(template, { instanceId: "i-1" });
    expect(parsed).toEqual(template);
  });

  it("emits a runtime alert and returns null on malformed input", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const bad = { version: 1, questions: [{ id: "x", type: "unknown" }] };
    expect(parseFeedbackForm(bad, { instanceId: "i-1" })).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
    const line = warn.mock.calls[0]?.[0];
    expect(typeof line).toBe("string");
    const parsed = JSON.parse(line as string);
    expect(parsed.signal).toBe("HARNESS_RUNTIME_ALERT");
    expect(parsed.category).toBe("jsonb_parse_failure");
    expect(parsed.instanceId).toBe("i-1");
    expect(parsed.metadata.column).toBe("feedback_form");
  });
});
