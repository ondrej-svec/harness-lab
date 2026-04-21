import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET, PATCH } from "@/app/api/workshop/instances/[id]/reference/route";
import { setAuditLogRepositoryForTests, type AuditLogRepository } from "@/lib/audit-log-repository";
import {
  setFacilitatorAuthServiceForTests,
  type FacilitatorAuthService,
} from "@/lib/facilitator-auth-service";
import { sampleWorkshopInstances } from "@/lib/workshop-data";
import { setWorkshopInstanceRepositoryForTests } from "@/lib/workshop-instance-repository";
import type { AuditLogRecord, WorkshopInstanceRepository } from "@/lib/runtime-contracts";

class MemoryWorkshopInstanceRepository implements WorkshopInstanceRepository {
  constructor(private items = structuredClone(sampleWorkshopInstances)) {}
  async getDefaultInstanceId() {
    return this.items[0]?.id ?? "sample-studio-a";
  }
  async getInstance(instanceId: string) {
    return structuredClone(this.items.find((item) => item.id === instanceId) ?? null);
  }
  async listInstances(options?: { includeRemoved?: boolean }) {
    const items = options?.includeRemoved
      ? this.items
      : this.items.filter((item) => !item.removedAt && item.status !== "removed");
    return structuredClone(items);
  }
  async createInstance(instance: (typeof sampleWorkshopInstances)[number]) {
    this.items.push(structuredClone(instance));
    return instance;
  }
  async updateInstance(instanceId: string, instance: (typeof sampleWorkshopInstances)[number]) {
    this.items = this.items.map((item) =>
      item.id === instanceId ? structuredClone(instance) : item,
    );
    return instance;
  }
  async removeInstance(instanceId: string, removedAt: string) {
    this.items = this.items.map((item) =>
      item.id === instanceId ? { ...item, status: "removed" as const, removedAt } : item,
    );
  }
}

class CapturingAuditLogRepository implements AuditLogRepository {
  readonly records: AuditLogRecord[] = [];
  async append(record: AuditLogRecord) {
    this.records.push(record);
  }
  async deleteOlderThan() {}
}

class AllowFacilitatorAuthService implements FacilitatorAuthService {
  async hasValidRequestCredentials() {
    return true;
  }
  async hasValidSession() {
    return false;
  }
}

function buildPatchRequest(body: unknown) {
  return new Request("http://localhost/api/workshop/instances/sample-studio-a/reference", {
    method: "PATCH",
    headers: { "content-type": "application/json", origin: "http://localhost" },
    body: JSON.stringify(body),
  });
}

const validOverride = [
  {
    id: "defaults" as const,
    title: "Brno-specific materials",
    description: "Custom catalog for the Brno cohort.",
    items: [
      {
        id: "brno-kit",
        kind: "external" as const,
        href: "https://example.com/brno-kit",
        label: "Brno kit",
        description: "Only for this cohort.",
      },
    ],
  },
];

describe("workshop instance reference route", () => {
  let instanceRepository: MemoryWorkshopInstanceRepository;
  let auditLog: CapturingAuditLogRepository;

  beforeEach(() => {
    instanceRepository = new MemoryWorkshopInstanceRepository();
    auditLog = new CapturingAuditLogRepository();
    setWorkshopInstanceRepositoryForTests(instanceRepository);
    setAuditLogRepositoryForTests(auditLog);
    setFacilitatorAuthServiceForTests(new AllowFacilitatorAuthService());
  });

  afterEach(() => {
    setWorkshopInstanceRepositoryForTests(null);
    setAuditLogRepositoryForTests(null);
    setFacilitatorAuthServiceForTests(null);
  });

  describe("GET", () => {
    it("returns null when no override is set", async () => {
      const response = await GET(
        new Request("http://localhost/api/workshop/instances/sample-studio-a/reference"),
        { params: Promise.resolve({ id: "sample-studio-a" }) },
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ ok: true, referenceGroups: null });
    });

    it("404s for unknown instance", async () => {
      const response = await GET(
        new Request("http://localhost/api/workshop/instances/ghost/reference"),
        { params: Promise.resolve({ id: "ghost" }) },
      );
      expect(response.status).toBe(404);
    });
  });

  describe("PATCH", () => {
    it("stores a valid override and returns it back", async () => {
      const response = await PATCH(buildPatchRequest({ referenceGroups: validOverride }), {
        params: Promise.resolve({ id: "sample-studio-a" }),
      });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.referenceGroups).toEqual(validOverride);
    });

    it("GET round-trips the stored override", async () => {
      await PATCH(buildPatchRequest({ referenceGroups: validOverride }), {
        params: Promise.resolve({ id: "sample-studio-a" }),
      });
      const response = await GET(
        new Request("http://localhost/api/workshop/instances/sample-studio-a/reference"),
        { params: Promise.resolve({ id: "sample-studio-a" }) },
      );
      const body = await response.json();
      expect(body.referenceGroups).toEqual(validOverride);
    });

    it("null clears the override", async () => {
      await PATCH(buildPatchRequest({ referenceGroups: validOverride }), {
        params: Promise.resolve({ id: "sample-studio-a" }),
      });
      const reset = await PATCH(buildPatchRequest({ referenceGroups: null }), {
        params: Promise.resolve({ id: "sample-studio-a" }),
      });
      expect(reset.status).toBe(200);
      const body = await reset.json();
      expect(body.referenceGroups).toBeNull();
    });

    it("empty array is treated as null (clears override)", async () => {
      await PATCH(buildPatchRequest({ referenceGroups: validOverride }), {
        params: Promise.resolve({ id: "sample-studio-a" }),
      });
      const reset = await PATCH(buildPatchRequest({ referenceGroups: [] }), {
        params: Promise.resolve({ id: "sample-studio-a" }),
      });
      const body = await reset.json();
      expect(body.referenceGroups).toBeNull();
    });

    it("rejects javascript: hrefs", async () => {
      const response = await PATCH(
        buildPatchRequest({
          referenceGroups: [
            {
              id: "defaults",
              title: "t",
              description: "d",
              items: [
                {
                  id: "xss",
                  kind: "external",
                  href: "javascript:alert(1)",
                  label: "L",
                  description: "D",
                },
              ],
            },
          ],
        }),
        { params: Promise.resolve({ id: "sample-studio-a" }) },
      );
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toMatch(/http\(s\) or mailto/);
    });

    it("rejects unknown group ids", async () => {
      const response = await PATCH(
        buildPatchRequest({
          referenceGroups: [{ id: "custom", title: "t", description: "d", items: [] }],
        }),
        { params: Promise.resolve({ id: "sample-studio-a" }) },
      );
      expect(response.status).toBe(400);
    });

    it("rejects payload without a referenceGroups key", async () => {
      const response = await PATCH(buildPatchRequest({ other: "field" }), {
        params: Promise.resolve({ id: "sample-studio-a" }),
      });
      expect(response.status).toBe(400);
    });

    it("preserves state after a validation rejection", async () => {
      await PATCH(buildPatchRequest({ referenceGroups: validOverride }), {
        params: Promise.resolve({ id: "sample-studio-a" }),
      });
      const rejected = await PATCH(
        buildPatchRequest({
          referenceGroups: [{ id: "custom", title: "t", description: "d", items: [] }],
        }),
        { params: Promise.resolve({ id: "sample-studio-a" }) },
      );
      expect(rejected.status).toBe(400);
      const check = await GET(
        new Request("http://localhost/api/workshop/instances/sample-studio-a/reference"),
        { params: Promise.resolve({ id: "sample-studio-a" }) },
      );
      const body = await check.json();
      // The earlier successful override is intact.
      expect(body.referenceGroups).toEqual(validOverride);
    });

    it("writes an audit log entry on success", async () => {
      await PATCH(buildPatchRequest({ referenceGroups: validOverride }), {
        params: Promise.resolve({ id: "sample-studio-a" }),
      });
      expect(auditLog.records).toHaveLength(1);
      expect(auditLog.records[0]?.action).toBe("instance_reference_groups_updated");
      expect(auditLog.records[0]?.metadata).toMatchObject({ groupCount: 1, itemCount: 1 });
    });

    it("audit logs a clear action when override is cleared", async () => {
      await PATCH(buildPatchRequest({ referenceGroups: null }), {
        params: Promise.resolve({ id: "sample-studio-a" }),
      });
      expect(auditLog.records[0]?.action).toBe("instance_reference_groups_cleared");
    });

    it("404s for unknown instance", async () => {
      const response = await PATCH(buildPatchRequest({ referenceGroups: validOverride }), {
        params: Promise.resolve({ id: "ghost" }),
      });
      expect(response.status).toBe(404);
    });
  });
});
