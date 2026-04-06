import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      // Mock the Neon Auth server SDK in unit tests — it imports next/headers
      // which doesn't exist outside of Next.js runtime.
      "@neondatabase/auth/next/server": path.resolve(__dirname, "lib/auth/__mocks__/neon-auth-server.ts"),
    },
  },
  test: {
    exclude: ["e2e/**", "node_modules/**"],
  },
});
