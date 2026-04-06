import { createNeonAuth } from "@neondatabase/auth/next/server";

/**
 * Neon Auth server instance for facilitator authentication.
 *
 * Created at module level (singleton) as required by the Neon Auth SDK.
 * The SDK needs a stable instance for cookie/session management to work
 * correctly across server actions, API routes, and middleware.
 *
 * When NEON_AUTH_BASE_URL is not set (file-mode local dev), auth is null
 * and the system falls back to Basic Auth.
 */

const baseUrl = process.env.NEON_AUTH_BASE_URL;
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

export const auth =
  baseUrl && cookieSecret
    ? createNeonAuth({
        baseUrl,
        cookies: {
          secret: cookieSecret,
          sessionDataTtl: 300,
        },
      })
    : null;
