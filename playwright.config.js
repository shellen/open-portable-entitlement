// ABOUTME: Playwright configuration for visual and content testing.
// ABOUTME: Builds the site and runs a local server before tests.

import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  webServer: {
    command: "npx @11ty/eleventy --serve --port 8090",
    port: 8090,
    reuseExistingServer: true,
  },
  use: {
    baseURL: "http://localhost:8090",
  },
});
