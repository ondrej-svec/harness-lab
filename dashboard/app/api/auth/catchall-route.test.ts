import { describe, expect, it, vi } from "vitest";

const mockRequest = () => new Request("http://localhost/api/auth/callback");
const mockContext = () => ({ params: Promise.resolve({ path: [] as string[] }) });

describe("auth catchall route", () => {
  it("returns 503 handlers when Neon Auth is not configured", async () => {
    vi.resetModules();
    vi.doMock("@/lib/auth/server", () => ({
      auth: null,
    }));

    const routeModule = await import("./[...path]/route");
    const getResponse = await routeModule.GET(mockRequest(), mockContext());
    const postResponse = await routeModule.POST(mockRequest(), mockContext());

    expect(getResponse.status).toBe(503);
    expect(postResponse.status).toBe(503);
    await expect(getResponse.json()).resolves.toEqual({ error: "Neon Auth is not configured" });
    await expect(postResponse.json()).resolves.toEqual({ error: "Neon Auth is not configured" });
  });

  it("delegates GET and POST to the auth handler when configured", async () => {
    vi.resetModules();
    const getHandler = vi.fn(async () => new Response("get ok"));
    const postHandler = vi.fn(async () => new Response("post ok"));
    vi.doMock("@/lib/auth/server", () => ({
      auth: {
        handler: () => ({
          GET: getHandler,
          POST: postHandler,
        }),
      },
    }));

    const routeModule = await import("./[...path]/route");
    const getResponse = await routeModule.GET(mockRequest(), mockContext());
    const postResponse = await routeModule.POST(mockRequest(), mockContext());

    expect(getHandler).toHaveBeenCalledTimes(1);
    expect(postHandler).toHaveBeenCalledTimes(1);
    await expect(getResponse.text()).resolves.toBe("get ok");
    await expect(postResponse.text()).resolves.toBe("post ok");
  });
});
