import { workshopTemplates } from "./workshop-data";

export type WorkshopInstanceCreateInput = {
  id: string;
  templateId?: string;
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
        "at least one metadata field is required (eventTitle, city, dateRange, venueName, roomName, addressLine, locationDetails, facilitatorLabel)",
    };
  }

  return { ok: true, value };
}
