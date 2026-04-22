import { afterEach, describe, expect, it, vi } from "vitest";

import {
  parseReferenceGroups,
  ReferenceGroupsSchema,
} from "./reference-groups-schema";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ReferenceGroupsSchema", () => {
  it("parses a minimal empty groups array", () => {
    expect(ReferenceGroupsSchema.safeParse([]).success).toBe(true);
  });

  it("parses all six item kinds in one group", () => {
    const groups = [
      {
        id: "defaults",
        title: "Defaults",
        description: "",
        items: [
          {
            id: "ext-1",
            kind: "external",
            href: "https://example.test",
            label: "L",
            description: "D",
          },
          {
            id: "rb-1",
            kind: "repo-blob",
            path: "README.md",
            label: "L",
            description: "D",
          },
          {
            id: "rt-1",
            kind: "repo-tree",
            path: "docs",
            label: "L",
            description: "D",
          },
          {
            id: "rr-1",
            kind: "repo-root",
            label: "L",
            description: "D",
          },
          {
            id: "h-1",
            kind: "hosted",
            bodyPath: "docs/guide.md",
            label: "L",
            description: "D",
            body: "inline markdown",
          },
          {
            id: "a-1",
            kind: "artifact",
            artifactId: "art-1",
            label: "L",
            description: "D",
          },
        ],
      },
    ];
    expect(ReferenceGroupsSchema.safeParse(groups).success).toBe(true);
  });

  it("rejects an unknown group id", () => {
    const groups = [{ id: "unknown", title: "x", description: "", items: [] }];
    expect(ReferenceGroupsSchema.safeParse(groups).success).toBe(false);
  });

  it("rejects an unknown item kind", () => {
    const groups = [
      {
        id: "defaults",
        title: "x",
        description: "",
        items: [{ id: "x", kind: "mystery", label: "L", description: "D" }],
      },
    ];
    expect(ReferenceGroupsSchema.safeParse(groups).success).toBe(false);
  });
});

describe("parseReferenceGroups", () => {
  it("returns null for null without alerting", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(parseReferenceGroups(null, { instanceId: "i-1" })).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it("emits a runtime alert and returns null on malformed input", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const bad = [{ id: "oops", title: "x", description: "", items: [] }];
    expect(parseReferenceGroups(bad, { instanceId: "i-1" })).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
    const line = warn.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(line);
    expect(parsed.category).toBe("jsonb_parse_failure");
    expect(parsed.metadata.column).toBe("reference_groups");
  });
});
