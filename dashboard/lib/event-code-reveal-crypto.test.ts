import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomBytes } from "node:crypto";

function makeBase64UrlKey() {
  return randomBytes(32).toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

describe("event-code-reveal-crypto", () => {
  const originalKey = process.env.HARNESS_EVENT_CODE_REVEAL_KEY;
  const originalStorageMode = process.env.HARNESS_STORAGE_MODE;

  beforeEach(() => {
    vi.resetModules();
    delete process.env.HARNESS_EVENT_CODE_REVEAL_KEY;
    delete process.env.HARNESS_STORAGE_MODE;
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.HARNESS_EVENT_CODE_REVEAL_KEY;
    } else {
      process.env.HARNESS_EVENT_CODE_REVEAL_KEY = originalKey;
    }
    if (originalStorageMode === undefined) {
      delete process.env.HARNESS_STORAGE_MODE;
    } else {
      process.env.HARNESS_STORAGE_MODE = originalStorageMode;
    }
  });

  it("round-trips encrypt and decrypt with a v1 prefix", async () => {
    process.env.HARNESS_EVENT_CODE_REVEAL_KEY = makeBase64UrlKey();
    const mod = await import("./event-code-reveal-crypto");

    const plaintext = "lantern8-context4-handoff2";
    const payload = mod.encryptEventCodeForReveal(plaintext);
    expect(payload.startsWith("v1:")).toBe(true);
    expect(mod.decryptEventCodeForReveal(payload)).toBe(plaintext);
    expect(mod.isEventCodeRevealConfigured()).toBe(true);
  });

  it("produces a new nonce per encryption (distinct ciphertexts for the same plaintext)", async () => {
    process.env.HARNESS_EVENT_CODE_REVEAL_KEY = makeBase64UrlKey();
    const mod = await import("./event-code-reveal-crypto");

    const a = mod.encryptEventCodeForReveal("same-input");
    const b = mod.encryptEventCodeForReveal("same-input");
    expect(a).not.toBe(b);
    expect(mod.decryptEventCodeForReveal(a)).toBe("same-input");
    expect(mod.decryptEventCodeForReveal(b)).toBe("same-input");
  });

  it("returns null when decrypting with the wrong key", async () => {
    process.env.HARNESS_EVENT_CODE_REVEAL_KEY = makeBase64UrlKey();
    const first = await import("./event-code-reveal-crypto");
    const payload = first.encryptEventCodeForReveal("secret");

    vi.resetModules();
    process.env.HARNESS_EVENT_CODE_REVEAL_KEY = makeBase64UrlKey();
    const second = await import("./event-code-reveal-crypto");
    expect(second.decryptEventCodeForReveal(payload)).toBeNull();
  });

  it("returns null when ciphertext is tampered", async () => {
    process.env.HARNESS_EVENT_CODE_REVEAL_KEY = makeBase64UrlKey();
    const mod = await import("./event-code-reveal-crypto");

    const payload = mod.encryptEventCodeForReveal("integrity-matters");
    // Flip a byte inside the base64url ciphertext segment.
    const [prefix, body] = payload.split(":", 2);
    const parts = body.split(".");
    const ciphertext = parts[1];
    const tampered = [
      prefix,
      [parts[0], ciphertext.slice(0, -1) + (ciphertext.endsWith("A") ? "B" : "A"), parts[2]].join("."),
    ].join(":");
    expect(mod.decryptEventCodeForReveal(tampered)).toBeNull();
  });

  it("returns null for payloads missing the v1 prefix", async () => {
    process.env.HARNESS_EVENT_CODE_REVEAL_KEY = makeBase64UrlKey();
    const mod = await import("./event-code-reveal-crypto");

    expect(mod.decryptEventCodeForReveal("")).toBeNull();
    expect(mod.decryptEventCodeForReveal("v2:anything")).toBeNull();
    expect(mod.decryptEventCodeForReveal("not-a-payload")).toBeNull();
  });

  it("reports not configured and throws on encrypt when key is missing in file-mode", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const mod = await import("./event-code-reveal-crypto");

    expect(mod.isEventCodeRevealConfigured()).toBe(false);
    expect(() => mod.encryptEventCodeForReveal("x")).toThrow(
      /HARNESS_EVENT_CODE_REVEAL_KEY is not configured/,
    );
    expect(mod.decryptEventCodeForReveal("v1:abc.def.ghi")).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("throws in neon mode when key is missing or malformed", async () => {
    process.env.HARNESS_STORAGE_MODE = "neon";
    const mod = await import("./event-code-reveal-crypto");

    expect(() => mod.isEventCodeRevealConfigured()).toThrow(
      /HARNESS_EVENT_CODE_REVEAL_KEY must be set/,
    );
  });

  it("throws in neon mode when key does not decode to 32 bytes", async () => {
    process.env.HARNESS_STORAGE_MODE = "neon";
    process.env.HARNESS_EVENT_CODE_REVEAL_KEY = "too-short";
    const mod = await import("./event-code-reveal-crypto");

    expect(() => mod.isEventCodeRevealConfigured()).toThrow(
      /HARNESS_EVENT_CODE_REVEAL_KEY must decode to exactly 32 bytes/,
    );
  });
});
