import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Vitest 5's resolve.tsconfigPaths can miss aliases depending on Vite
    // version; keep an explicit @ -> src mapping so unit tests resolve.
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    // Only test/**: the `*.test.ts` files under src/lib/utils predate Vitest —
    // they are plain `node:assert` scripts with no describe/it, so collecting
    // them would fail with "No test suite found".
    include: ["test/**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**"],
    testTimeout: 15_000,
  },
});
