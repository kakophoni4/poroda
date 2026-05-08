import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Vitest 4: вместо environmentMatchGlobs — отдельные test.projects (node по умолчанию, jsdom для *.dom.test.ts).
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    projects: [
      {
        resolve: {
          alias: { "@": path.resolve(__dirname, "src") },
        },
        test: {
          name: "node",
          environment: "node",
          include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
          exclude: ["**/*.dom.test.ts", "**/*.dom.test.tsx"],
        },
      },
      {
        resolve: {
          alias: { "@": path.resolve(__dirname, "src") },
        },
        test: {
          name: "jsdom",
          environment: "jsdom",
          include: ["**/*.dom.test.ts", "**/*.dom.test.tsx"],
        },
      },
    ],
  },
});
