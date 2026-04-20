import type { ParticipantRecord } from "./runtime-contracts";

/**
 * Disambiguator surfaced next to a roster match when ≥2 entries share
 * the typed name. Tag is preferred because it's the lowest-information
 * signal that's still identifying (team, role). Masked email is the
 * fallback for name-only rosters. The id-suffix variant is ugly on
 * purpose — it nudges the facilitator to add a tag.
 */
export type ParticipantDisambiguator =
  | { kind: "tag"; value: string }
  | { kind: "masked_email"; value: string }
  | { kind: "order"; value: string };

/**
 * Mask an email for disambiguation. Keeps the first letter of the local
 * part and the full domain — enough to distinguish workmates without
 * leaking the rest of the address.
 */
export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const first = local[0] ?? "";
  return `${first}***${domain}`;
}

/**
 * Given the matches for a typed name, return the per-participant
 * disambiguator (null when the match is unambiguous). Groups by
 * case-insensitive display name — participants with unique names in
 * the result set get no disambiguator.
 */
export function computeDisambiguators(
  matches: ParticipantRecord[],
): Map<string, ParticipantDisambiguator | null> {
  const result = new Map<string, ParticipantDisambiguator | null>();
  const groups = new Map<string, ParticipantRecord[]>();

  for (const p of matches) {
    const key = p.displayName.toLocaleLowerCase();
    const group = groups.get(key);
    if (group) group.push(p);
    else groups.set(key, [p]);
  }

  for (const group of groups.values()) {
    if (group.length < 2) {
      for (const p of group) result.set(p.id, null);
      continue;
    }

    for (const p of group) {
      if (p.tag && p.tag.trim().length > 0) {
        result.set(p.id, { kind: "tag", value: p.tag.trim() });
      } else if (p.email) {
        result.set(p.id, { kind: "masked_email", value: maskEmail(p.email) });
      } else {
        result.set(p.id, { kind: "order", value: `#${p.id.slice(-4)}` });
      }
    }
  }

  return result;
}
