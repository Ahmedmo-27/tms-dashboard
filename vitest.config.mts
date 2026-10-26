import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Resolves the "@/*" -> "./src/*" alias straight from tsconfig.json, so the
  // alias is declared in exactly one place.
  resolve: { tsconfigPaths: true },
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
