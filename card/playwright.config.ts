import { defineConfig } from "@playwright/test";

const PORT = 8123;

export default defineConfig({
  testDir: "./test",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    launchOptions: {
      executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    },
  },
  webServer: {
    // Serve the repo root so the harness can load the card from its
    // integration path, matching how HA serves it.
    command: `python3 -m http.server ${PORT} --directory ..`,
    port: PORT,
    reuseExistingServer: true,
  },
});
