import { getRuntimeStorageMode } from "./runtime-storage";

export function hasCompleteNeonAuthConfig() {
  return Boolean(process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET);
}

export function isNeonRuntimeMode() {
  return getRuntimeStorageMode() === "neon";
}

export function assertValidNeonAuthConfiguration() {
  if (!isNeonRuntimeMode()) {
    return;
  }

  if (!hasCompleteNeonAuthConfig()) {
    throw new Error(
      "NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET are required when HARNESS_STORAGE_MODE=neon",
    );
  }
}
