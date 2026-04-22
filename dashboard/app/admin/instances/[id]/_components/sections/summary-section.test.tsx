import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { adminCopy } from "@/lib/ui-language";
import type { FeedbackSummaryAggregate } from "@/lib/feedback-summary";
import { SummarySection } from "./summary-section";

/**
 * Covers the redesigned feedback summary: average hero, anchor labels,
 * modal-row emphasis, zero-row muting, and option-bar behavior. These are
 * render-layer assertions — the aggregate/data shape is locked by
 * lib/feedback-summary.test.ts.
 */

function renderSummary(aggregate: FeedbackSummaryAggregate) {
  return renderToStaticMarkup(
    <SummarySection
      lang="cs"
      copy={adminCopy.cs}
      instanceStatus="ended"
      aggregate={aggregate}
      participantsWithAccessCount={5}
    />,
  );
}

describe("SummarySection — scale questions", () => {
  it("surfaces the average as a hero ('4.0 z 4') and labels the scale endpoints with likert anchors", () => {
    const aggregate: FeedbackSummaryAggregate = {
      totalResponses: 2,
      perQuestion: [
        {
          id: "theme",
          type: "likert",
          prompt: { cs: "Jak vám sedlo téma?", en: "How well did the theme land?" },
          anchorMin: { cs: "vůbec", en: "not at all" },
          anchorMax: { cs: "úplně", en: "completely" },
          max: 4,
          counts: [0, 0, 0, 2],
          totalAnswered: 2,
          average: 4,
        },
      ],
    };
    const html = renderSummary(aggregate);
    expect(html).toContain("4.0");
    expect(html).toContain("z 4"); // summaryOfLabel + scale max
    expect(html).toContain(adminCopy.cs.summaryAverageLabel); // "průměr"
    // Anchors appear under the hero and as endpoint row labels.
    expect(html).toContain("vůbec");
    expect(html).toContain("úplně");
  });

  it("emphasizes the modal row with full ink and fades non-modal rows to /40", () => {
    const aggregate: FeedbackSummaryAggregate = {
      totalResponses: 3,
      perQuestion: [
        {
          id: "split",
          type: "likert",
          prompt: { cs: "?", en: "?" },
          anchorMin: null,
          anchorMax: null,
          max: 4,
          counts: [0, 1, 2, 0], // value=3 is the modal row (count=2)
          totalAnswered: 3,
          average: 2.67,
        },
      ],
    };
    const html = renderSummary(aggregate);
    // Non-modal row uses the softer /40 fill.
    expect(html).toContain("bg-[var(--text-primary)]/40");
    // Modal row uses the full ink class without the /40 suffix — assert by
    // locating at least one instance of the full-ink class not followed by /.
    expect(html).toMatch(/bg-\[var\(--text-primary\)\](?!\/)/);
  });

  it("mutes zero-count rows so empty scale values don't compete for attention", () => {
    const aggregate: FeedbackSummaryAggregate = {
      totalResponses: 2,
      perQuestion: [
        {
          id: "all-high",
          type: "likert",
          prompt: { cs: "?", en: "?" },
          anchorMin: null,
          anchorMax: null,
          max: 4,
          counts: [0, 0, 0, 2],
          totalAnswered: 2,
          average: 4,
        },
      ],
    };
    const html = renderSummary(aggregate);
    // Muted text class present (used for zero rows and anchor captions).
    expect(html).toContain("text-[var(--text-muted)]");
  });

  it("does not render the average hero for scale questions with no responses yet", () => {
    const aggregate: FeedbackSummaryAggregate = {
      totalResponses: 0,
      perQuestion: [
        {
          id: "silent",
          type: "likert",
          prompt: { cs: "?", en: "?" },
          anchorMin: null,
          anchorMax: null,
          max: 4,
          counts: [0, 0, 0, 0],
          totalAnswered: 0,
          average: null,
        },
      ],
    };
    const html = renderSummary(aggregate);
    // No hero => the "průměr" caption must not appear in the rendered card.
    expect(html).not.toContain(adminCopy.cs.summaryAverageLabel);
    // Empty-state copy ("Zatím žádné odpovědi.") is shown instead.
    expect(html).toContain(adminCopy.cs.summaryOpenTextEmpty);
  });

  it("omits anchor captions for stars (stars never carries anchors in the template)", () => {
    const aggregate: FeedbackSummaryAggregate = {
      totalResponses: 1,
      perQuestion: [
        {
          id: "stars-q",
          type: "stars",
          prompt: { cs: "Hvězdy", en: "Stars" },
          anchorMin: null,
          anchorMax: null,
          max: 5,
          counts: [0, 0, 0, 0, 1],
          totalAnswered: 1,
          average: 5,
        },
      ],
    };
    const html = renderSummary(aggregate);
    // The hero still renders — the question prompt is the card title.
    expect(html).toContain("Hvězdy");
    expect(html).toContain("5.0");
    // No anchor captions present when none were provided.
    expect(html).not.toContain("vůbec");
    expect(html).not.toContain("úplně");
  });
});

describe("SummarySection — option questions", () => {
  it("emphasizes the winning option and mutes options with zero picks", () => {
    const aggregate: FeedbackSummaryAggregate = {
      totalResponses: 3,
      perQuestion: [
        {
          id: "recommend",
          type: "single-choice",
          prompt: { cs: "Doporučili byste?", en: "Recommend?" },
          options: [
            { id: "yes", label: { cs: "ano", en: "yes" }, count: 2 },
            { id: "maybe", label: { cs: "možná", en: "maybe" }, count: 1 },
            { id: "no", label: { cs: "ne", en: "no" }, count: 0 },
          ],
          totalAnswered: 3,
        },
      ],
    };
    const html = renderSummary(aggregate);
    expect(html).toContain("ano");
    expect(html).toContain("možná");
    expect(html).toContain("ne");
    // Modal option ("ano") gets full ink; non-modal and zero rows use /40.
    expect(html).toContain("bg-[var(--text-primary)]/40");
    expect(html).toMatch(/bg-\[var\(--text-primary\)\](?!\/)/);
  });
});

describe("SummarySection — empty state", () => {
  it("shows the 'not ended yet' panel when the instance is still running", () => {
    const html = renderToStaticMarkup(
      <SummarySection
        lang="cs"
        copy={adminCopy.cs}
        instanceStatus="running"
        aggregate={{ totalResponses: 0, perQuestion: [] }}
        participantsWithAccessCount={5}
      />,
    );
    expect(html).toContain(adminCopy.cs.summaryEmptyTitle);
    expect(html).toContain(adminCopy.cs.summaryEmptyBody);
  });
});
