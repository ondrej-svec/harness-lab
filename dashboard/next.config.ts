import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

// Content-Security-Policy is applied as a single header so the browser
// treats it as one policy. `unsafe-inline` on scripts is a pragmatic
// bridge: Next.js App Router emits hydration scripts without nonces by
// default, and tightening to per-request nonces requires middleware
// plumbing that's out of scope for this phase. The rest of the policy
// still enforces boundaries on frames, fonts, connect, and images.
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.neon.tech https://*.vercel-storage.com https://vitals.vercel-insights.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: cspDirectives },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
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
