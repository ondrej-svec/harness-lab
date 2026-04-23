import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { isNeonRuntimeMode } from "./runtime-auth-configuration";

// AES-256-GCM with a 12-byte random nonce and 16-byte auth tag.
// Payload is the `v1:` prefixed concatenation of base64url(nonce), base64url(ciphertext),
// and base64url(authTag). The `v1:` prefix leaves room to rotate the algorithm or
// key scheme later without an on-disk migration.
const payloadVersion = "v1";
const nonceBytes = 12;
const keyBytes = 32;

let warnedAboutMissingKey = false;
let warnedAboutInvalidKey = false;

function decodeBase64Url(value: string): Buffer {
  const pad = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function encodeBase64Url(buffer: Buffer): string {
  return buffer.toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function tryResolveKey(): Buffer | null {
  const raw = process.env.HARNESS_EVENT_CODE_REVEAL_KEY;
  if (!raw) {
    if (isNeonRuntimeMode()) {
      throw new Error(
        "HARNESS_EVENT_CODE_REVEAL_KEY must be set when HARNESS_STORAGE_MODE=neon",
      );
    }
    if (!warnedAboutMissingKey) {
      warnedAboutMissingKey = true;
      console.warn(
        "HARNESS_EVENT_CODE_REVEAL_KEY not set — facilitator reveal is disabled. Issue flow continues without ciphertext.",
      );
    }
    return null;
  }

  let decoded: Buffer;
  try {
    decoded = decodeBase64Url(raw.trim());
  } catch {
    if (isNeonRuntimeMode()) {
      throw new Error("HARNESS_EVENT_CODE_REVEAL_KEY is not valid base64url");
    }
    if (!warnedAboutInvalidKey) {
      warnedAboutInvalidKey = true;
      console.warn("HARNESS_EVENT_CODE_REVEAL_KEY is not valid base64url — reveal disabled");
    }
    return null;
  }

  if (decoded.length !== keyBytes) {
    if (isNeonRuntimeMode()) {
      throw new Error(
        `HARNESS_EVENT_CODE_REVEAL_KEY must decode to exactly ${keyBytes} bytes (got ${decoded.length})`,
      );
    }
    if (!warnedAboutInvalidKey) {
      warnedAboutInvalidKey = true;
      console.warn(
        `HARNESS_EVENT_CODE_REVEAL_KEY must decode to exactly ${keyBytes} bytes — reveal disabled`,
      );
    }
    return null;
  }

  return decoded;
}

export function isEventCodeRevealConfigured(): boolean {
  // In neon mode tryResolveKey throws on missing/malformed keys so the
  // server fails fast at first reveal attempt rather than silently
  // returning "not revealable". Callers in file-mode get a clean false.
  return tryResolveKey() !== null;
}

export function encryptEventCodeForReveal(plaintext: string): string {
  const key = tryResolveKey();
  if (!key) {
    throw new Error("HARNESS_EVENT_CODE_REVEAL_KEY is not configured");
  }
  const nonce = randomBytes(nonceBytes);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [
    payloadVersion,
    `${encodeBase64Url(nonce)}.${encodeBase64Url(ciphertext)}.${encodeBase64Url(authTag)}`,
  ].join(":");
}

export function decryptEventCodeForReveal(payload: string): string | null {
  const key = tryResolveKey();
  if (!key) {
    return null;
  }
  const [version, body] = payload.split(":", 2);
  if (version !== payloadVersion || !body) {
    return null;
  }
  const parts = body.split(".");
  if (parts.length !== 3) {
    return null;
  }
  const [nonceRaw, ciphertextRaw, authTagRaw] = parts;
  try {
    const nonce = decodeBase64Url(nonceRaw);
    const ciphertext = decodeBase64Url(ciphertextRaw);
    const authTag = decodeBase64Url(authTagRaw);
    if (nonce.length !== nonceBytes || authTag.length !== 16) {
      return null;
    }
    const decipher = createDecipheriv("aes-256-gcm", key, nonce);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString("utf8");
  } catch {
    return null;
  }
}

// Test-only helper: reset the "warned once" state so a test's expected
// console.warn fires again. Not exported from the production surface.
export function resetEventCodeRevealWarningsForTests() {
  warnedAboutMissingKey = false;
  warnedAboutInvalidKey = false;
}
