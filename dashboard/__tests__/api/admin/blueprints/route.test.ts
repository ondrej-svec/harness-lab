import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET, POST } from "@/app/api/admin/blueprints/route";

import {
  jsonRequest,
  setupBlueprintTestEnv,
  teardownBlueprintTestEnv,
  type BlueprintTestEnv,
} from "./_helpers";

describe("GET /api/admin/blueprints", () => {
  let env: BlueprintTestEnv;
  beforeEach(() => {
    env = setupBlueprintTestEnv("bp-list");
  });
  afterEach(() => {
    teardownBlueprintTestEnv(env);
  });

  it("returns the seeded default blueprint", async () => {
    const response = await GET(
      jsonRequest("http://localhost/api/admin/blueprints", "GET"),
    );
    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      ok: boolean;
      blueprints: Array<{ id: string; language: string }>;
    };
    expect(data.ok).toBe(true);
    expect(data.blueprints.map((b) => b.id)).toContain("harness-lab-default");
  });
});

describe("POST /api/admin/blueprints", () => {
  let env: BlueprintTestEnv;
  beforeEach(() => {
    env = setupBlueprintTestEnv("bp-upsert");
  });
  afterEach(() => {
    teardownBlueprintTestEnv(env);
  });

  it("upserts a blueprint and emits an audit record", async () => {
    const response = await POST(
      jsonRequest("http://localhost/api/admin/blueprints", "POST", {
        id: "my-half-day",
        body: {
          schemaVersion: 1,
          name: "my-half-day",
          language: "en",
          teamMode: false,
          phases: [],
        },
      }),
    );
    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      ok: boolean;
      blueprint: { id: string; version: number; teamMode: boolean };
    };
    expect(data.blueprint.id).toBe("my-half-day");
    expect(data.blueprint.version).toBe(1);
    expect(data.blueprint.teamMode).toBe(false);
    expect(env.audit.records.map((r) => r.action)).toContain("blueprint_upsert");
  });

  it("returns 400 for invalid body", async () => {
    const response = await POST(
      jsonRequest("http://localhost/api/admin/blueprints", "POST", { id: 42 }),
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when body field missing", async () => {
    const response = await POST(
      jsonRequest("http://localhost/api/admin/blueprints", "POST", {
        id: "x",
      }),
    );
    expect(response.status).toBe(400);
  });

  it("returns 409 on expectedVersion mismatch", async () => {
    await POST(
      jsonRequest("http://localhost/api/admin/blueprints", "POST", {
        id: "x",
        body: { schemaVersion: 1, phases: [] },
      }),
    );
    const response = await POST(
      jsonRequest("http://localhost/api/admin/blueprints", "POST", {
        id: "x",
        body: { schemaVersion: 1, phases: [] },
        expectedVersion: 999,
      }),
    );
    expect(response.status).toBe(409);
  });
});
