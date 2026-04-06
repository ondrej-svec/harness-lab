/**
 * Mock of @neondatabase/auth/next/server for vitest.
 * The real module imports next/headers which doesn't exist in test context.
 * This provides a stub createNeonAuth that returns null-safe defaults.
 */
export function createNeonAuth() {
  return null;
}
