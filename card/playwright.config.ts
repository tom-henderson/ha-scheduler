import { existsSync } from "node:fs";

import { defineConfig } from "@playwright/test";

const PORT = 8123;

// Use a preinstalled Chromium if one is provided (this sandbox) or found on
// disk; otherwise fall back to Playwright's own managed browser (CI).
const SANDBOX_CHROMIUM = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const executablePath =
  process.env.PW_CHROMIUM ??
  (existsSync(SANDBOX_CHROMIUM) ? SANDBOX_CHROMIUM : undefined);

export default defineConfig({
  testDir: "./test",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    launchOptions: { executablePath },
  },
  webServer: {
    // Serve the repo root so the harness can load the card from its
    // integration path, matching how HA serves it.
    command: `python3 -m http.server ${PORT} --directory ..`,
    port: PORT,
    reuseExistingServer: true,
  },
});
