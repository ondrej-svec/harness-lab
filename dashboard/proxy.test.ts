import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { fileModeAuthCookieName, getExpectedFileModeAuthToken } from "./lib/admin-auth";
import { proxy } from "./proxy";

describe("proxy file-mode admin auth", () => {
  const originalStorageMode = process.env.HARNESS_STORAGE_MODE;

  beforeEach(() => {
    process.env.HARNESS_STORAGE_MODE = "file";
  });

  afterEach(() => {
    process.env.HARNESS_STORAGE_MODE = originalStorageMode;
  });

  it("mints the file-mode auth cookie from a valid basic auth header", async () => {
    const authorization = `Basic ${Buffer.from("facilitator:secret").toString("base64")}`;
    const response = await proxy(
      new NextRequest("http://localhost/admin/instances/sample-studio-a?lang=en", {
        headers: {
          authorization,
        },
      }),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/admin/instances/sample-studio-a?lang=en");
    expect(response.headers.get("set-cookie")).toContain(fileModeAuthCookieName);
    expect(response.headers.get("set-cookie")).toContain(await getExpectedFileModeAuthToken());
    expect(response.headers.get("set-cookie")).toContain("harness_ui_lang=en");
  });

  it("passes through when the file-mode auth cookie is already present", async () => {
    const authToken = await getExpectedFileModeAuthToken();
    const response = await proxy(
      new NextRequest("http://localhost/admin/instances/sample-studio-a", {
        headers: {
          cookie: `${fileModeAuthCookieName}=${authToken}`,
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
