import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { POST } from "@/app/api/admin/blueprints/[id]/fork/route";
import { POST as POST_UPSERT } from "@/app/api/admin/blueprints/route";

import {
  jsonRequest,
  setupBlueprintTestEnv,
  teardownBlueprintTestEnv,
  type BlueprintTestEnv,
} from "../../_helpers";

describe("POST /api/admin/blueprints/[id]/fork", () => {
  let env: BlueprintTestEnv;
  beforeEach(() => {
    env = setupBlueprintTestEnv("bp-fork");
  });
  afterEach(() => {
    teardownBlueprintTestEnv(env);
  });

  it("forks an existing blueprint into a new id", async () => {
    const response = await POST(
      jsonRequest(
        "http://localhost/api/admin/blueprints/harness-lab-default/fork",
        "POST",
        { newId: "cs-default", newName: "Czech default" },
      ),
      { params: Promise.resolve({ id: "harness-lab-default" }) },
    );
    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      ok: boolean;
      blueprint: { id: string; name: string };
    };
    expect(data.blueprint.id).toBe("cs-default");
    expect(data.blueprint.name).toBe("Czech default");
    expect(env.audit.records.map((r) => r.action)).toContain("blueprint_fork");
  });

  it("returns 404 when source is missing", async () => {
    const response = await POST(
      jsonRequest("http://localhost/api/admin/blueprints/nope/fork", "POST", {
        newId: "anything",
      }),
      { params: Promise.resolve({ id: "nope" }) },
    );
    expect(response.status).toBe(404);
  });

  it("returns 409 when target already exists", async () => {
    await POST_UPSERT(
      jsonRequest("http://localhost/api/admin/blueprints", "POST", {
        id: "taken",
        body: { schemaVersion: 1, phases: [] },
      }),
    );
    const response = await POST(
      jsonRequest(
        "http://localhost/api/admin/blueprints/harness-lab-default/fork",
        "POST",
        { newId: "taken" },
      ),
      { params: Promise.resolve({ id: "harness-lab-default" }) },
    );
    expect(response.status).toBe(409);
  });

  it("returns 400 on invalid body", async () => {
    const response = await POST(
      jsonRequest(
        "http://localhost/api/admin/blueprints/harness-lab-default/fork",
        "POST",
        { newId: 42 },
      ),
      { params: Promise.resolve({ id: "harness-lab-default" }) },
    );
    expect(response.status).toBe(400);
  });
});
