/**
 * Shared smart-parse for facilitator paste intake.
 *
 * Accepts raw multi-line text and produces structured entries. Used by
 * the UI paste panel (`POST /api/admin/participants`) and by the CLI
 * (`harness workshop participants import --stdin|--file`), so both paths
 * produce byte-identical parse results from the same input.
 *
 * Supported per-line shapes (separators: `,`, tab, `;`):
 *   - `Ada Lovelace`                      → name only
 *   - `Linus, linus@example.com`          → name + email
 *   - `Grace, grace@example.com, senior`  → name + email + tag
 *   - `Alan, senior`                      → name + tag  (the second column
 *                                             has no `@`, so treat as tag)
 *   - `Name,Email,Tag` (first row)        → skipped as header if all three
 *                                             cells look header-ish
 *
 * See docs/previews/2026-04-16-participant-api-sketch.md for the contract.
 */

export type ParsedEntry = {
  displayName: string;
  email: string | null;
  tag: string | null;
};

export type ParseError = {
  line: number; // 1-indexed for user-facing diagnostics
  raw: string;
  reason:
    | "empty_line"
    | "missing_display_name"
    | "invalid_email"
    | "duplicate_in_input"
    | "header_skipped";
};

export type ParseResult = {
  entries: ParsedEntry[];
  skipped: ParseError[];
};

const SEPARATORS = /[,\t;]/;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEADER_NAME_WORDS = new Set(["name", "jméno", "jmeno", "participant", "účastník", "ucastnik"]);
const HEADER_EMAIL_WORDS = new Set(["email", "e-mail", "mail"]);
const HEADER_TAG_WORDS = new Set(["tag", "level", "seniority", "seniorita", "role"]);

export function parseParticipantPaste(raw: string): ParseResult {
  const entries: ParsedEntry[] = [];
  const skipped: ParseError[] = [];
  const seenLowercase = new Set<string>();

  const lines = raw.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    const lineNumber = i + 1;

    if (trimmed.length === 0) {
      continue; // silent skip — blank lines are layout, not errors
    }

    // Preserve empty cells in their original positions so an empty first
    // column surfaces as `missing_display_name` rather than silently
    // promoting the second column.
    const cells = trimmed.split(SEPARATORS).map((cell) => cell.trim());
    const nonEmptyCells = cells.filter((cell) => cell.length > 0);

    // Header detection: only on the very first non-blank row, and only if
    // ALL non-empty cells look header-like. Anything else is data.
    if (
      entries.length === 0 &&
      skipped.length === 0 &&
      looksLikeHeader(nonEmptyCells)
    ) {
      skipped.push({ line: lineNumber, raw: rawLine, reason: "header_skipped" });
      continue;
    }

    if (cells.length === 0 || cells[0].length === 0) {
      skipped.push({ line: lineNumber, raw: rawLine, reason: "missing_display_name" });
      continue;
    }

    const displayName = cells[0];
    let email: string | null = null;
    let tag: string | null = null;

    const second = cells[1] ?? "";
    const third = cells[2] ?? "";

    if (second.length > 0) {
      if (second.includes("@")) {
        if (!EMAIL_SHAPE.test(second)) {
          skipped.push({ line: lineNumber, raw: rawLine, reason: "invalid_email" });
          continue;
        }
        email = second;
        if (third.length > 0) {
          tag = third;
        }
      } else if (third.length > 0) {
        // Three-column shape with a malformed second column that was meant
        // to be an email: "Bad, not-an-email, senior". The presence of a
        // third cell disambiguates — the second was meant as email.
        skipped.push({ line: lineNumber, raw: rawLine, reason: "invalid_email" });
        continue;
      } else {
        // Two-column "Name, tag" — no `@` and no third cell.
        tag = second;
      }
    }

    const key = displayName.trim().toLocaleLowerCase();
    if (seenLowercase.has(key)) {
      skipped.push({ line: lineNumber, raw: rawLine, reason: "duplicate_in_input" });
      continue;
    }
    seenLowercase.add(key);

    entries.push({ displayName, email, tag });
  }

  return { entries, skipped };
}

function looksLikeHeader(cells: string[]): boolean {
  if (cells.length === 0) return false;
  const normalized = cells.map((cell) => cell.toLocaleLowerCase());

  // Any cell containing `@` is data, not a header.
  if (normalized.some((cell) => cell.includes("@"))) return false;

  // First cell should look like "name" or an equivalent.
  if (!HEADER_NAME_WORDS.has(normalized[0])) return false;

  // Remaining cells should match known header vocabulary.
  return normalized.slice(1).every(
    (cell) => HEADER_EMAIL_WORDS.has(cell) || HEADER_TAG_WORDS.has(cell),
  );
}
