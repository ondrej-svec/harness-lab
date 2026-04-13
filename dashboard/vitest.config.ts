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
    // Default environment is `node`. Files that need a DOM (for
    // @testing-library/react interaction tests) opt in per file via
    //     // @vitest-environment happy-dom
    // at the top of the test file. Global happy-dom breaks tests that
    // depend on node-only APIs (fetch behavior, response objects, etc.).
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "./coverage",
      thresholds: {
        statements: 80,
        lines: 80,
        functions: 80,
        branches: 60,
      },
      include: ["app/**/*.ts", "app/**/*.tsx", "lib/**/*.ts"],
      exclude: [
        "e2e/**",
        "lib/auth/__mocks__/**",
        "lib/runtime-contracts.ts",
        "next-env.d.ts",
      ],
    },
  },
});
