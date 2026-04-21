import { describe, expect, it } from "vitest";
import { parseWorkshopInstanceReferenceGroupsBody } from "./workshop-instance-api";

describe("parseWorkshopInstanceReferenceGroupsBody", () => {
  it("rejects non-object bodies", () => {
    expect(parseWorkshopInstanceReferenceGroupsBody(null).ok).toBe(false);
    expect(parseWorkshopInstanceReferenceGroupsBody("oops").ok).toBe(false);
    expect(parseWorkshopInstanceReferenceGroupsBody([]).ok).toBe(false);
  });

  it("rejects bodies without a referenceGroups key", () => {
    const result = parseWorkshopInstanceReferenceGroupsBody({});
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/referenceGroups key is required/);
  });

  it("accepts null as a clear-override signal", () => {
    expect(parseWorkshopInstanceReferenceGroupsBody({ referenceGroups: null })).toEqual({
      ok: true,
      value: { referenceGroups: null },
    });
  });

  it("accepts an empty array (semantically identical to null at the store layer)", () => {
    expect(parseWorkshopInstanceReferenceGroupsBody({ referenceGroups: [] })).toEqual({
      ok: true,
      value: { referenceGroups: [] },
    });
  });

  it("accepts a valid full catalog", () => {
    const body = {
      referenceGroups: [
        {
          id: "defaults",
          title: "Workshop materials",
          description: "Per-event curation for Brno.",
          items: [
            {
              id: "brno-kit",
              kind: "external",
              href: "https://example.com/brno-kit",
              label: "Brno kit",
              description: "Only for this cohort.",
            },
          ],
        },
      ],
    };
    const result = parseWorkshopInstanceReferenceGroupsBody(body);
    expect(result.ok).toBe(true);
    expect(result.ok === true && result.value.referenceGroups?.[0]?.items[0]?.kind).toBe("external");
  });

  it("rejects unknown group ids", () => {
    const result = parseWorkshopInstanceReferenceGroupsBody({
      referenceGroups: [{ id: "custom", title: "x", description: "y", items: [] }],
    });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/referenceGroups\[0\]\.id/);
  });

  it("rejects unknown item kinds", () => {
    const result = parseWorkshopInstanceReferenceGroupsBody({
      referenceGroups: [
        {
          id: "defaults",
          title: "t",
          description: "d",
          items: [{ id: "x", kind: "iframe", label: "L", description: "D" }],
        },
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/kind must be one of/);
  });

  it("rejects external items with unsafe hrefs", () => {
    const result = parseWorkshopInstanceReferenceGroupsBody({
      referenceGroups: [
        {
          id: "explore",
          title: "t",
          description: "d",
          items: [
            { id: "x", kind: "external", href: "javascript:alert(1)", label: "L", description: "D" },
          ],
        },
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/http\(s\) or mailto/);
  });

  it("rejects duplicate item ids inside a group", () => {
    const result = parseWorkshopInstanceReferenceGroupsBody({
      referenceGroups: [
        {
          id: "defaults",
          title: "t",
          description: "d",
          items: [
            { id: "dup", kind: "repo-blob", path: "a.md", label: "L1", description: "D" },
            { id: "dup", kind: "repo-blob", path: "b.md", label: "L2", description: "D" },
          ],
        },
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/duplicate id/);
  });

  it("rejects repo-blob without a path", () => {
    const result = parseWorkshopInstanceReferenceGroupsBody({
      referenceGroups: [
        {
          id: "defaults",
          title: "t",
          description: "d",
          items: [{ id: "x", kind: "repo-blob", label: "L", description: "D" }],
        },
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/path required for repo-blob/);
  });

  it("accepts the currently-compiled reference catalog as a self-round-trip (without bodies)", async () => {
    const { default: view } = await import("./generated/reference-en.json");
    // Compiled-default hosted items carry an inlined `body` field that is
    // not part of the wire contract — the CLI import flow reads the file,
    // drops bodies per `hosted` items, and pushes only the structural
    // catalog. Mirror that here so the round-trip is a fair check.
    const groupsWithoutBody = view.groups.map((group) => ({
      ...group,
      items: group.items.map((item) => {
        if (item.kind !== "hosted") return item;
        const rest: Record<string, unknown> = { ...(item as Record<string, unknown>) };
        delete rest.body;
        return rest;
      }),
    }));
    const result = parseWorkshopInstanceReferenceGroupsBody({ referenceGroups: groupsWithoutBody });
    expect(result.ok).toBe(true);
  });

  it("rejects a hosted item with body at the wire (body belongs to sidecar)", () => {
    const result = parseWorkshopInstanceReferenceGroupsBody({
      referenceGroups: [
        {
          id: "defaults",
          title: "t",
          description: "d",
          items: [
            { id: "kit", kind: "hosted", label: "Kit", description: "D", body: "# Hi" },
          ],
        },
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/body is not allowed on the catalog/);
  });

  it("accepts a hosted item without body or sourceUrl", () => {
    const result = parseWorkshopInstanceReferenceGroupsBody({
      referenceGroups: [
        {
          id: "defaults",
          title: "t",
          description: "d",
          items: [{ id: "kit", kind: "hosted", label: "Kit", description: "D" }],
        },
      ],
    });
    expect(result.ok).toBe(true);
  });

  it("accepts a hosted item with sourceUrl", () => {
    const result = parseWorkshopInstanceReferenceGroupsBody({
      referenceGroups: [
        {
          id: "defaults",
          title: "t",
          description: "d",
          items: [
            {
              id: "kit",
              kind: "hosted",
              label: "Kit",
              description: "D",
              sourceUrl: "materials/brno-kit.md",
            },
          ],
        },
      ],
    });
    expect(result.ok).toBe(true);
  });
});
