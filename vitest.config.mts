import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Resolves the "@/*" -> "./src/*" alias straight from tsconfig.json, so the
  // alias is declared in exactly one place. (Vite 8 does this natively; the
  // vite-tsconfig-paths plugin is no longer needed.)
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    exclude: [
      "node_modules/**",
      ".next/**",
      // These three predate Vitest: they are plain `node:assert` scripts with
      // top-level assertions and no describe/it, so Vitest collects them and
      // then fails with "No test suite found". They still run in CI, via
      // `npm run test:assert-scripts` (tsx), so nothing is lost by skipping
      // them here. Convert them to describe/it and delete these lines.
      "src/lib/utils/daily-sheet-csv.test.ts",
      "src/lib/utils/package-form-payload.test.ts",
      "src/lib/utils/sheet-row-fault.test.ts",
    ],
    testTimeout: 15_000,
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      // Scoped to the logic the suite actually exercises. Including every
      // page and component would report a misleading 3% and tell nobody
      // anything; these are the modules under test.
      include: ["src/lib/**", "src/hooks/**", "src/core/**", "middleware.ts"],
      exclude: ["**/*.d.ts", "**/*.test.*", "src/lib/types/**"],
    },
    reporters: process.env.CI ? ["default", "junit"] : ["default"],
    outputFile: { junit: "./reports/vitest-junit.xml" },
  },
});
