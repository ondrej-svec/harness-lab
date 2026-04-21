import { describe, expect, it } from "vitest";
import { buildParticipantReferenceGroups } from "./public-page-view-model";
import type { GeneratedReferenceGroup } from "./types/bilingual-reference";

describe("buildParticipantReferenceGroups — artifact items", () => {
  it("resolves a kind:'artifact' item to the participant-side href + download href", () => {
    const override: GeneratedReferenceGroup[] = [
      {
        id: "defaults",
        title: "Workshop materials",
        description: "Cohort-specific downloads.",
        items: [
          {
            id: "case-study-link",
            kind: "artifact",
            artifactId: "abc123",
            label: "16-day harness case study",
            description: "Stacked charts + timeline for this cohort.",
          },
        ],
      },
    ];

    const result = buildParticipantReferenceGroups({
      lang: "en",
      setupPaths: [],
      referenceGroups: override,
    });

    expect(result).toHaveLength(1);
    const entry = result[0]!.items[0]!;
    expect(entry.id).toBe("case-study-link");
    expect(entry.label).toBe("16-day harness case study");
    expect(entry.href).toBe("/participant/artifact/abc123");
    expect(entry.downloadHref).toBe("/participant/artifact/abc123?download=1");
    // Artifacts open in a new tab (they're self-contained HTML/PDF/image).
    expect(entry.external).toBe(true);
  });

  it("does not set downloadHref for non-artifact kinds", () => {
    const override: GeneratedReferenceGroup[] = [
      {
        id: "defaults",
        title: "t",
        description: "d",
        items: [
          {
            id: "external-item",
            kind: "external",
            href: "https://example.com",
            label: "L",
            description: "D",
          },
          {
            id: "hosted-item",
            kind: "hosted",
            label: "H",
            description: "H",
          },
        ],
      },
    ];

    const result = buildParticipantReferenceGroups({
      lang: "en",
      setupPaths: [],
      referenceGroups: override,
    });

    expect(result[0]!.items[0]!.downloadHref).toBeUndefined();
    expect(result[0]!.items[1]!.downloadHref).toBeUndefined();
  });

  it("url-encodes artifactId safely", () => {
    const override: GeneratedReferenceGroup[] = [
      {
        id: "defaults",
        title: "t",
        description: "d",
        items: [
          {
            id: "weird",
            kind: "artifact",
            // Artifact ids are generated base64url so real ones don't
            // need escaping, but the builder must not trust that.
            artifactId: "id/with?weird&chars",
            label: "L",
            description: "D",
          },
        ],
      },
    ];

    const result = buildParticipantReferenceGroups({
      lang: "en",
      setupPaths: [],
      referenceGroups: override,
    });

    const entry = result[0]!.items[0]!;
    expect(entry.href).toBe("/participant/artifact/id%2Fwith%3Fweird%26chars");
    expect(entry.downloadHref).toBe(
      "/participant/artifact/id%2Fwith%3Fweird%26chars?download=1",
    );
  });
});
