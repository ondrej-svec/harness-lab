import {
  workshopTemplates,
  type OverridableParticipantCopy,
  type WorkshopContentLanguage,
} from "./workshop-data";
import type { GeneratedReferenceGroup, ReferenceGroupId } from "./types/bilingual-reference";

const KNOWN_REFERENCE_GROUP_IDS: ReferenceGroupId[] = ["defaults", "accelerators", "explore"];
const KNOWN_REFERENCE_ITEM_KINDS = [
  "external",
  "repo-blob",
  "repo-tree",
  "repo-root",
  "hosted",
] as const;

export type WorkshopInstanceCreateInput = {
  id: string;
  templateId?: string;
  contentLang?: WorkshopContentLanguage;
  eventTitle?: string;
  city?: string;
  dateRange?: string;
  venueName?: string;
  roomName?: string;
  addressLine?: string;
  locationDetails?: string;
  facilitatorLabel?: string;
};

export type WorkshopInstanceMetadataUpdateInput = Omit<WorkshopInstanceCreateInput, "id" | "templateId">;

type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const workshopInstanceIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function readOptionalContentLanguageField(body: Record<string, unknown>, key: "contentLang") {
  const value = body[key];
  return value === "en" || value === "cs" ? value : undefined;
}

function readOptionalStringField(body: Record<string, unknown>, key: keyof WorkshopInstanceCreateInput) {
  const value = body[key];
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isKnownTemplateId(templateId: string) {
  return workshopTemplates.some((template) => template.id === templateId);
}

export function parseWorkshopInstanceCreateBody(body: unknown): ValidationResult<WorkshopInstanceCreateInput> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "request body must be a JSON object" };
  }

  const record = body as Record<string, unknown>;
  const id = readOptionalStringField(record, "id");
  if (!id) {
    return { ok: false, error: "id is required" };
  }

  if (!workshopInstanceIdPattern.test(id)) {
    return {
      ok: false,
      error: "id must be a lowercase slug using only letters, numbers, and hyphens",
    };
  }

  const templateId = readOptionalStringField(record, "templateId");
  if (templateId && !isKnownTemplateId(templateId)) {
    return { ok: false, error: "templateId must reference a known workshop template" };
  }

  return {
    ok: true,
    value: {
      id,
      templateId,
      contentLang: readOptionalContentLanguageField(record, "contentLang"),
      eventTitle: readOptionalStringField(record, "eventTitle"),
      city: readOptionalStringField(record, "city"),
      dateRange: readOptionalStringField(record, "dateRange"),
      venueName: readOptionalStringField(record, "venueName"),
      roomName: readOptionalStringField(record, "roomName"),
      addressLine: readOptionalStringField(record, "addressLine"),
      locationDetails: readOptionalStringField(record, "locationDetails"),
      facilitatorLabel: readOptionalStringField(record, "facilitatorLabel"),
    },
  };
}

export function parseWorkshopInstanceMetadataUpdateBody(body: unknown): ValidationResult<WorkshopInstanceMetadataUpdateInput> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "request body must be a JSON object" };
  }

  const record = body as Record<string, unknown>;
  const value = {
    contentLang: readOptionalContentLanguageField(record, "contentLang"),
    eventTitle: readOptionalStringField(record, "eventTitle"),
    city: readOptionalStringField(record, "city"),
    dateRange: readOptionalStringField(record, "dateRange"),
    venueName: readOptionalStringField(record, "venueName"),
    roomName: readOptionalStringField(record, "roomName"),
    addressLine: readOptionalStringField(record, "addressLine"),
    locationDetails: readOptionalStringField(record, "locationDetails"),
    facilitatorLabel: readOptionalStringField(record, "facilitatorLabel"),
  } satisfies WorkshopInstanceMetadataUpdateInput;

  const hasChanges = Object.values(value).some((field) => typeof field === "string" && field.length > 0);
  if (!hasChanges) {
    return {
      ok: false,
      error:
        "at least one metadata field is required (contentLang, eventTitle, city, dateRange, venueName, roomName, addressLine, locationDetails, facilitatorLabel)",
    };
  }

  return { ok: true, value };
}

// ---------------------------------------------------------------------------
// Reference catalog override (Phase 1e of
// docs/plans/2026-04-21-feat-dynamic-participant-reference-content-plan.md)
// ---------------------------------------------------------------------------

export type WorkshopInstanceReferenceGroupsUpdateInput = {
  referenceGroups: GeneratedReferenceGroup[] | null;
};

function parseReferenceItem(raw: unknown, path: string): ValidationResult<GeneratedReferenceGroup["items"][number]> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: `${path} must be an object` };
  }
  const record = raw as Record<string, unknown>;
  const id = typeof record.id === "string" ? record.id.trim() : "";
  if (!id) return { ok: false, error: `${path}.id must be a non-empty string` };

  const label = typeof record.label === "string" ? record.label : "";
  if (!label) return { ok: false, error: `${path}.label must be a non-empty string` };

  const description = typeof record.description === "string" ? record.description : "";
  if (!description) return { ok: false, error: `${path}.description must be a non-empty string` };

  const kind = record.kind;
  if (typeof kind !== "string" || !(KNOWN_REFERENCE_ITEM_KINDS as readonly string[]).includes(kind)) {
    return {
      ok: false,
      error: `${path}.kind must be one of ${KNOWN_REFERENCE_ITEM_KINDS.join("|")}`,
    };
  }

  switch (kind) {
    case "external": {
      const href = typeof record.href === "string" ? record.href.trim() : "";
      if (!href) return { ok: false, error: `${path}.href required for external item` };
      if (!/^https?:/i.test(href) && !href.startsWith("mailto:")) {
        return { ok: false, error: `${path}.href must be http(s) or mailto` };
      }
      return { ok: true, value: { id, kind: "external", href, label, description } };
    }
    case "repo-blob":
    case "repo-tree": {
      const pathField = typeof record.path === "string" ? record.path.trim() : "";
      if (!pathField) return { ok: false, error: `${path}.path required for ${kind} item` };
      return { ok: true, value: { id, kind, path: pathField, label, description } };
    }
    case "repo-root":
      return { ok: true, value: { id, kind: "repo-root", label, description } };
    case "hosted": {
      // Bodies are managed through a separate sidecar endpoint — reject
      // body in the catalog PATCH to keep the two responsibilities split.
      if (record.body !== undefined) {
        return {
          ok: false,
          error: `${path}.body is not allowed on the catalog; use the /reference/<itemId>/body endpoint instead`,
        };
      }
      if (record.bodyPath !== undefined) {
        return {
          ok: false,
          error: `${path}.bodyPath is authoring-source-only; not accepted at the wire`,
        };
      }
      const sourceUrl = typeof record.sourceUrl === "string" ? record.sourceUrl.trim() : undefined;
      const base = { id, kind: "hosted" as const, label, description };
      return {
        ok: true,
        value: sourceUrl ? { ...base, sourceUrl } : base,
      };
    }
    default:
      return { ok: false, error: `${path}.kind unknown` };
  }
}

function parseReferenceGroup(raw: unknown, path: string): ValidationResult<GeneratedReferenceGroup> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: `${path} must be an object` };
  }
  const record = raw as Record<string, unknown>;
  const id = record.id;
  if (typeof id !== "string" || !(KNOWN_REFERENCE_GROUP_IDS as readonly string[]).includes(id)) {
    return { ok: false, error: `${path}.id must be one of ${KNOWN_REFERENCE_GROUP_IDS.join("|")}` };
  }
  const title = typeof record.title === "string" ? record.title : "";
  if (!title) return { ok: false, error: `${path}.title must be a non-empty string` };
  const description = typeof record.description === "string" ? record.description : "";
  if (!description) return { ok: false, error: `${path}.description must be a non-empty string` };
  if (!Array.isArray(record.items)) return { ok: false, error: `${path}.items must be an array` };

  const items: GeneratedReferenceGroup["items"] = [];
  const seenIds = new Set<string>();
  for (const [index, rawItem] of record.items.entries()) {
    const parsed = parseReferenceItem(rawItem, `${path}.items[${index}]`);
    if (!parsed.ok) return parsed;
    if (seenIds.has(parsed.value.id)) {
      return { ok: false, error: `${path}.items: duplicate id '${parsed.value.id}'` };
    }
    seenIds.add(parsed.value.id);
    items.push(parsed.value);
  }

  return {
    ok: true,
    value: { id: id as ReferenceGroupId, title, description, items },
  };
}

/**
 * Validate a reference-groups payload for PATCH
 * /api/workshop/instances/[id]/reference. Accepts `{ referenceGroups: null }`
 * (clears the override → fall back to compiled default) or
 * `{ referenceGroups: GeneratedReferenceGroup[] }` (verbatim override).
 * The whole array is validated strictly; partial updates are not supported —
 * surgical edits are built on top via CLI fetch-edit-write helpers.
 */
export function parseWorkshopInstanceReferenceGroupsBody(
  body: unknown,
): ValidationResult<WorkshopInstanceReferenceGroupsUpdateInput> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "request body must be a JSON object" };
  }
  const record = body as Record<string, unknown>;
  if (!("referenceGroups" in record)) {
    return { ok: false, error: "referenceGroups key is required (null to clear the override)" };
  }
  const raw = record.referenceGroups;
  if (raw === null) {
    return { ok: true, value: { referenceGroups: null } };
  }
  if (!Array.isArray(raw)) {
    return { ok: false, error: "referenceGroups must be an array or null" };
  }

  const groups: GeneratedReferenceGroup[] = [];
  const seenGroupIds = new Set<string>();
  for (const [index, rawGroup] of raw.entries()) {
    const parsed = parseReferenceGroup(rawGroup, `referenceGroups[${index}]`);
    if (!parsed.ok) return parsed;
    if (seenGroupIds.has(parsed.value.id)) {
      return { ok: false, error: `referenceGroups: duplicate group id '${parsed.value.id}'` };
    }
    seenGroupIds.add(parsed.value.id);
    groups.push(parsed.value);
  }

  return { ok: true, value: { referenceGroups: groups } };
}

// ---------------------------------------------------------------------------
// Participant copy override (Phase 3)
// ---------------------------------------------------------------------------

export type WorkshopInstanceParticipantCopyUpdateInput = {
  participantCopy: OverridableParticipantCopy | null;
};

const POST_WORKSHOP_KEYS = ["title", "body", "feedbackBody", "referenceBody"] as const;

function parseOptionalStringField(
  record: Record<string, unknown>,
  key: string,
  path: string,
): ValidationResult<string | undefined> {
  if (!(key in record)) return { ok: true, value: undefined };
  const raw = record[key];
  if (raw === null || raw === undefined) return { ok: true, value: undefined };
  if (typeof raw !== "string") {
    return { ok: false, error: `${path}.${key} must be a string or omitted` };
  }
  const trimmed = raw.trim();
  return { ok: true, value: trimmed.length > 0 ? trimmed : undefined };
}

/**
 * Validate the participant-copy PATCH body. Accepts `{ participantCopy: null }`
 * to clear, or `{ participantCopy: { postWorkshop: { ... } } }` where
 * postWorkshop's keys are a narrow whitelist. Unknown keys are rejected —
 * that's the guardrail against the "half a CMS" failure mode described
 * in the plan.
 */
export function parseWorkshopInstanceParticipantCopyBody(
  body: unknown,
): ValidationResult<WorkshopInstanceParticipantCopyUpdateInput> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "request body must be a JSON object" };
  }
  const record = body as Record<string, unknown>;
  if (!("participantCopy" in record)) {
    return {
      ok: false,
      error: "participantCopy key is required (null to clear the override)",
    };
  }
  const raw = record.participantCopy;
  if (raw === null) {
    return { ok: true, value: { participantCopy: null } };
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "participantCopy must be an object or null" };
  }

  const rawCopy = raw as Record<string, unknown>;
  // Guard against unknown top-level sections.
  for (const key of Object.keys(rawCopy)) {
    if (key !== "postWorkshop") {
      return { ok: false, error: `participantCopy.${key} is not an overridable section` };
    }
  }

  const rawPostWorkshop = rawCopy.postWorkshop;
  const result: OverridableParticipantCopy = {};

  if (rawPostWorkshop !== undefined) {
    if (!rawPostWorkshop || typeof rawPostWorkshop !== "object" || Array.isArray(rawPostWorkshop)) {
      return { ok: false, error: "participantCopy.postWorkshop must be an object" };
    }
    const postWorkshopRecord = rawPostWorkshop as Record<string, unknown>;
    // Reject unknown keys so typos surface at the API instead of
    // silently being stored and ignored at render.
    for (const key of Object.keys(postWorkshopRecord)) {
      if (!(POST_WORKSHOP_KEYS as readonly string[]).includes(key)) {
        return {
          ok: false,
          error: `participantCopy.postWorkshop.${key} is not an overridable key; allowed: ${POST_WORKSHOP_KEYS.join(", ")}`,
        };
      }
    }
    const postWorkshop: NonNullable<OverridableParticipantCopy["postWorkshop"]> = {};
    for (const key of POST_WORKSHOP_KEYS) {
      const parsed = parseOptionalStringField(postWorkshopRecord, key, "participantCopy.postWorkshop");
      if (!parsed.ok) return parsed;
      if (parsed.value !== undefined) {
        postWorkshop[key] = parsed.value;
      }
    }
    if (Object.keys(postWorkshop).length > 0) {
      result.postWorkshop = postWorkshop;
    }
  }

  // Empty override collapses to null so resolvers treat "empty" and
  // "no override" the same way (same as referenceGroups).
  if (Object.keys(result).length === 0) {
    return { ok: true, value: { participantCopy: null } };
  }
  return { ok: true, value: { participantCopy: result } };
}
