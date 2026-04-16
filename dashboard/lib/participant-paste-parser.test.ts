import { describe, expect, it } from "vitest";
import { parseParticipantPaste } from "./participant-paste-parser";

describe("parseParticipantPaste", () => {
  it("parses name-only lines", () => {
    const result = parseParticipantPaste("Ada Lovelace\nLinus Torvalds");
    expect(result.entries).toEqual([
      { displayName: "Ada Lovelace", email: null, tag: null },
      { displayName: "Linus Torvalds", email: null, tag: null },
    ]);
    expect(result.skipped).toEqual([]);
  });

  it("parses name + email", () => {
    const result = parseParticipantPaste("Linus, linus@example.com");
    expect(result.entries).toEqual([
      { displayName: "Linus", email: "linus@example.com", tag: null },
    ]);
  });

  it("parses name + email + tag", () => {
    const result = parseParticipantPaste("Grace, grace@example.com, senior");
    expect(result.entries).toEqual([
      { displayName: "Grace", email: "grace@example.com", tag: "senior" },
    ]);
  });

  it("treats name + non-email as name + tag", () => {
    const result = parseParticipantPaste("Alan Kay, senior");
    expect(result.entries).toEqual([
      { displayName: "Alan Kay", email: null, tag: "senior" },
    ]);
  });

  it("accepts tab and semicolon separators", () => {
    const result = parseParticipantPaste("Ada\tada@example.com\tsenior\nLinus;linus@example.com;mid");
    expect(result.entries).toEqual([
      { displayName: "Ada", email: "ada@example.com", tag: "senior" },
      { displayName: "Linus", email: "linus@example.com", tag: "mid" },
    ]);
  });

  it("skips blank lines silently", () => {
    const result = parseParticipantPaste("Ada\n\n\nLinus");
    expect(result.entries).toHaveLength(2);
    expect(result.skipped).toEqual([]);
  });

  it("skips an English header row", () => {
    const result = parseParticipantPaste("Name, Email, Tag\nAda, ada@example.com, senior");
    expect(result.entries).toHaveLength(1);
    expect(result.skipped[0].reason).toBe("header_skipped");
  });

  it("skips a Czech header row", () => {
    const result = parseParticipantPaste("Jméno; E-mail; Seniorita\nAnna; anna@example.com; mid");
    expect(result.entries).toEqual([
      { displayName: "Anna", email: "anna@example.com", tag: "mid" },
    ]);
    expect(result.skipped[0].reason).toBe("header_skipped");
  });

  it("reports invalid emails per-line without stopping the rest", () => {
    // Two-column `Name, not-an-email` is ambiguous with `Name, tag` and
    // resolves to tag. But a three-column shape disambiguates: the second
    // cell is clearly meant as email, so a malformed value is flagged.
    const result = parseParticipantPaste(
      "Ada, ada@example.com, senior\nBad, not-an-email, mid\nLinus, linus@example.com, junior",
    );
    expect(result.entries.map((e) => e.displayName)).toEqual(["Ada", "Linus"]);
    expect(result.skipped).toEqual([
      { line: 2, raw: "Bad, not-an-email, mid", reason: "invalid_email" },
    ]);
  });

  it("also flags malformed emails in two-column shape when the @ is present", () => {
    const result = parseParticipantPaste("Ada, ada@broken");
    expect(result.entries).toEqual([]);
    expect(result.skipped[0].reason).toBe("invalid_email");
  });

  it("deduplicates within the input (case-insensitive)", () => {
    const result = parseParticipantPaste("Ada Lovelace\nADA LOVELACE\nLinus");
    expect(result.entries.map((e) => e.displayName)).toEqual(["Ada Lovelace", "Linus"]);
    expect(result.skipped[0]).toEqual(
      expect.objectContaining({ line: 2, reason: "duplicate_in_input" }),
    );
  });

  it("treats empty first column as missing_display_name", () => {
    const result = parseParticipantPaste(", email@example.com");
    expect(result.entries).toEqual([]);
    expect(result.skipped[0].reason).toBe("missing_display_name");
  });

  it("does not accept data with @ as a header", () => {
    // If a first-row line contains an email, it's data not a header.
    const result = parseParticipantPaste("Ada, ada@example.com\nLinus");
    expect(result.entries).toHaveLength(2);
    expect(result.skipped).toEqual([]);
  });
});
