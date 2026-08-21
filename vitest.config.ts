import { defineConfig } from "vitest/config";

export default defineConfig({
  // tsconfig.json sets `jsx: "preserve"` because Next.js's own compiler does
  // the JSX transform; esbuild has no such compiler here, so it must be told
  // explicitly to use the automatic runtime instead of leaving JSX untouched.
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
});
