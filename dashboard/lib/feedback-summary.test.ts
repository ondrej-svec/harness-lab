import { describe, expect, it } from "vitest";
import type {
  FeedbackFormTemplate,
  FeedbackSubmissionRecord,
} from "./runtime-contracts";
import { buildFeedbackSummaryAggregate } from "./feedback-summary";

const template: FeedbackFormTemplate = {
  version: 1,
  questions: [
    {
      id: "overall",
      type: "likert",
      scale: 5,
      prompt: { cs: "Jak to dopadlo?", en: "Overall?" },
    },
    {
      id: "stars-q",
      type: "stars",
      max: 5,
      prompt: { cs: "Hvězdičky", en: "Stars" },
    },
    {
      id: "recommend",
      type: "single-choice",
      prompt: { cs: "Doporučíte?", en: "Recommend?" },
      options: [
        { id: "yes", label: { cs: "ano", en: "yes" } },
        { id: "maybe", label: { cs: "možná", en: "maybe" } },
        { id: "no", label: { cs: "ne", en: "no" } },
      ],
    },
    {
      id: "themes",
      type: "multi-choice",
      prompt: { cs: "Co rezonovalo?", en: "Which themes resonated?" },
      options: [
        { id: "a", label: { cs: "A", en: "A" } },
        { id: "b", label: { cs: "B", en: "B" } },
        { id: "c", label: { cs: "C", en: "C" } },
      ],
    },
    {
      id: "testimonial",
      type: "open-text",
      optional: true,
      prompt: { cs: "Citát?", en: "Quote?" },
    },
    {
      id: "quote-ok",
      type: "checkbox",
      prompt: { cs: "Souhlas s citací?", en: "Quote consent?" },
    },
  ],
};

function makeSubmission(overrides: Partial<FeedbackSubmissionRecord>): FeedbackSubmissionRecord {
  return {
    id: "fs-1",
    instanceId: "instance-a",
    participantId: null,
    sessionKey: "p-1",
    answers: [],
    allowQuoteByName: false,
    submittedAt: "2026-04-21T10:00:00.000Z",
    ...overrides,
  };
}

describe("buildFeedbackSummaryAggregate", () => {
  it("returns empty-but-shaped aggregates when no submissions exist", () => {
    const result = buildFeedbackSummaryAggregate(template, []);
    expect(result.totalResponses).toBe(0);
    expect(result.perQuestion).toHaveLength(template.questions.length);
    const likert = result.perQuestion[0];
    if (likert.type === "likert") {
      expect(likert.counts).toEqual([0, 0, 0, 0, 0]);
      expect(likert.average).toBeNull();
    }
  });

  it("surfaces likert endpoint anchors on the aggregate so the renderer can label the scale", () => {
    const templateWithAnchors: FeedbackFormTemplate = {
      version: 1,
      questions: [
        {
          id: "anchored",
          type: "likert",
          scale: 4,
          prompt: { cs: "Jak?", en: "How?" },
          anchorMin: { cs: "vůbec", en: "not at all" },
          anchorMax: { cs: "úplně", en: "completely" },
        },
        {
          id: "unanchored",
          type: "likert",
          scale: 5,
          prompt: { cs: "Jiná?", en: "Other?" },
        },
        { id: "stars-q", type: "stars", max: 5, prompt: { cs: "Hvězdy", en: "Stars" } },
      ],
    };
    const result = buildFeedbackSummaryAggregate(templateWithAnchors, []);
    const [anchored, unanchored, stars] = result.perQuestion;
    if (anchored.type !== "likert") throw new Error("expected likert");
    if (unanchored.type !== "likert") throw new Error("expected likert");
    if (stars.type !== "stars") throw new Error("expected stars");
    expect(anchored.anchorMin).toEqual({ cs: "vůbec", en: "not at all" });
    expect(anchored.anchorMax).toEqual({ cs: "úplně", en: "completely" });
    // Likert without anchors surfaces null so the renderer can gate on it.
    expect(unanchored.anchorMin).toBeNull();
    expect(unanchored.anchorMax).toBeNull();
    // Stars never carries anchors in the template, so the aggregate shape
    // is always null for stars — this keeps the discriminated union total.
    expect(stars.anchorMin).toBeNull();
    expect(stars.anchorMax).toBeNull();
  });

  it("counts Likert values per bucket and computes average", () => {
    const submissions = [
      makeSubmission({
        id: "fs-a",
        sessionKey: "p-a",
        answers: [{ questionId: "overall", type: "likert", value: 5 }],
      }),
      makeSubmission({
        id: "fs-b",
        sessionKey: "p-b",
        answers: [{ questionId: "overall", type: "likert", value: 3 }],
      }),
      makeSubmission({
        id: "fs-c",
        sessionKey: "p-c",
        answers: [{ questionId: "overall", type: "likert", value: 5 }],
      }),
    ];
    const result = buildFeedbackSummaryAggregate(template, submissions);
    const likert = result.perQuestion[0];
    if (likert.type !== "likert") throw new Error("expected likert");
    expect(likert.counts).toEqual([0, 0, 1, 0, 2]);
    expect(likert.totalAnswered).toBe(3);
    expect(likert.average).toBeCloseTo((5 + 3 + 5) / 3);
  });

  it("counts single-choice options correctly", () => {
    const submissions = [
      makeSubmission({
        id: "fs-a",
        sessionKey: "p-a",
        answers: [{ questionId: "recommend", type: "single-choice", optionId: "yes" }],
      }),
      makeSubmission({
        id: "fs-b",
        sessionKey: "p-b",
        answers: [{ questionId: "recommend", type: "single-choice", optionId: "yes" }],
      }),
      makeSubmission({
        id: "fs-c",
        sessionKey: "p-c",
        answers: [{ questionId: "recommend", type: "single-choice", optionId: "no" }],
      }),
    ];
    const result = buildFeedbackSummaryAggregate(template, submissions);
    const recommend = result.perQuestion[2];
    if (recommend.type !== "single-choice") throw new Error("expected single-choice");
    const byId = new Map(recommend.options.map((o) => [o.id, o.count]));
    expect(byId.get("yes")).toBe(2);
    expect(byId.get("maybe")).toBe(0);
    expect(byId.get("no")).toBe(1);
    expect(recommend.totalAnswered).toBe(3);
  });

  it("counts multi-choice options per pick; totalAnswered is number of submitters that picked at least one", () => {
    const submissions = [
      makeSubmission({
        id: "fs-a",
        sessionKey: "p-a",
        answers: [{ questionId: "themes", type: "multi-choice", optionIds: ["a", "b"] }],
      }),
      makeSubmission({
        id: "fs-b",
        sessionKey: "p-b",
        answers: [{ questionId: "themes", type: "multi-choice", optionIds: ["b", "c"] }],
      }),
      makeSubmission({
        id: "fs-c",
        sessionKey: "p-c",
        answers: [{ questionId: "themes", type: "multi-choice", optionIds: [] }],
      }),
    ];
    const result = buildFeedbackSummaryAggregate(template, submissions);
    const themes = result.perQuestion[3];
    if (themes.type !== "multi-choice") throw new Error("expected multi-choice");
    const byId = new Map(themes.options.map((o) => [o.id, o.count]));
    expect(byId.get("a")).toBe(1);
    expect(byId.get("b")).toBe(2);
    expect(byId.get("c")).toBe(1);
    expect(themes.totalAnswered).toBe(2);
  });

  it("open-text aggregate carries allowQuoteByName on each response (consent data is preserved)", () => {
    const submissions = [
      makeSubmission({
        id: "fs-a",
        sessionKey: "p-a",
        allowQuoteByName: true,
        answers: [{ questionId: "testimonial", type: "open-text", text: "It changed how I work." }],
      }),
      makeSubmission({
        id: "fs-b",
        sessionKey: "p-b",
        allowQuoteByName: false,
        answers: [{ questionId: "testimonial", type: "open-text", text: "Good." }],
      }),
      makeSubmission({
        id: "fs-c",
        sessionKey: "p-c",
        allowQuoteByName: false,
        answers: [{ questionId: "testimonial", type: "open-text", text: "   " }],
      }),
    ];
    const result = buildFeedbackSummaryAggregate(template, submissions);
    const openText = result.perQuestion[4];
    if (openText.type !== "open-text") throw new Error("expected open-text");
    // The blank response is filtered out by trim().
    expect(openText.responses).toHaveLength(2);
    const consentFlags = openText.responses.map((r) => r.allowQuoteByName).sort();
    expect(consentFlags).toEqual([false, true]);
  });

  it("open-text aggregate never includes participant names (privacy-v1)", () => {
    const submissions = [
      makeSubmission({
        id: "fs-named",
        sessionKey: "p-alice",
        participantId: "p-alice",
        allowQuoteByName: true,
        answers: [{ questionId: "testimonial", type: "open-text", text: "yes" }],
      }),
    ];
    const result = buildFeedbackSummaryAggregate(template, submissions);
    const openText = result.perQuestion[4];
    if (openText.type !== "open-text") throw new Error("expected open-text");
    const keys = Object.keys(openText.responses[0]);
    expect(keys.sort()).toEqual(["allowQuoteByName", "submittedAt", "text"].sort());
    // No name-like field leaked into the aggregate.
    expect("participantId" in openText.responses[0]).toBe(false);
    expect("displayName" in openText.responses[0]).toBe(false);
    expect("participantName" in openText.responses[0]).toBe(false);
  });

  it("checkbox aggregates count checked vs total answered", () => {
    const submissions = [
      makeSubmission({
        id: "fs-a",
        sessionKey: "p-a",
        answers: [{ questionId: "quote-ok", type: "checkbox", checked: true }],
      }),
      makeSubmission({
        id: "fs-b",
        sessionKey: "p-b",
        answers: [{ questionId: "quote-ok", type: "checkbox", checked: false }],
      }),
      makeSubmission({
        id: "fs-c",
        sessionKey: "p-c",
        answers: [{ questionId: "quote-ok", type: "checkbox", checked: true }],
      }),
    ];
    const result = buildFeedbackSummaryAggregate(template, submissions);
    const checkbox = result.perQuestion[5];
    if (checkbox.type !== "checkbox") throw new Error("expected checkbox");
    expect(checkbox.checkedCount).toBe(2);
    expect(checkbox.totalAnswered).toBe(3);
  });
});
