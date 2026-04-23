import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DELETE, GET } from "@/app/api/admin/blueprints/[id]/route";
import { POST as POST_UPSERT } from "@/app/api/admin/blueprints/route";

import {
  jsonRequest,
  setupBlueprintTestEnv,
  teardownBlueprintTestEnv,
  type BlueprintTestEnv,
} from "../_helpers";

describe("GET /api/admin/blueprints/[id]", () => {
  let env: BlueprintTestEnv;
  beforeEach(() => {
    env = setupBlueprintTestEnv("bp-get");
  });
  afterEach(() => {
    teardownBlueprintTestEnv(env);
  });

  it("returns the requested blueprint", async () => {
    const response = await GET(
      jsonRequest("http://localhost/api/admin/blueprints/harness-lab-default", "GET"),
      { params: Promise.resolve({ id: "harness-lab-default" }) },
    );
    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      ok: boolean;
      blueprint: { id: string };
    };
    expect(data.blueprint.id).toBe("harness-lab-default");
  });

  it("returns 404 when missing", async () => {
    const response = await GET(
      jsonRequest("http://localhost/api/admin/blueprints/nope", "GET"),
      { params: Promise.resolve({ id: "nope" }) },
    );
    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/admin/blueprints/[id]", () => {
  let env: BlueprintTestEnv;
  beforeEach(() => {
    env = setupBlueprintTestEnv("bp-delete");
  });
  afterEach(() => {
    teardownBlueprintTestEnv(env);
  });

  it("refuses to remove the default blueprint", async () => {
    const response = await DELETE(
      jsonRequest(
        "http://localhost/api/admin/blueprints/harness-lab-default",
        "DELETE",
      ),
      { params: Promise.resolve({ id: "harness-lab-default" }) },
    );
    expect(response.status).toBe(400);
  });

  it("removes non-default blueprints idempotently", async () => {
    await POST_UPSERT(
      jsonRequest("http://localhost/api/admin/blueprints", "POST", {
        id: "rm-me",
        body: { schemaVersion: 1, phases: [] },
      }),
    );
    const first = await DELETE(
      jsonRequest("http://localhost/api/admin/blueprints/rm-me", "DELETE"),
      { params: Promise.resolve({ id: "rm-me" }) },
    );
    expect(first.status).toBe(200);
    const second = await DELETE(
      jsonRequest("http://localhost/api/admin/blueprints/rm-me", "DELETE"),
      { params: Promise.resolve({ id: "rm-me" }) },
    );
    expect(second.status).toBe(200);
    expect(env.audit.records.map((r) => r.action)).toContain("blueprint_delete");
  });
});
