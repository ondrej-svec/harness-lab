import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true,
    // View Transitions API integration — enables `<ViewTransition>` from `react`
    // via Next's bundled react-experimental. See
    // docs/plans/2026-04-13-one-canvas-research-notes.md §2.
    // WARNING: do not also enable `cacheComponents` — see Next.js issue #85693.
    viewTransition: true,
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: securityHeaders,
    },
  ],
};

export default withBotId(nextConfig);
