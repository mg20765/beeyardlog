import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      // --host listens on IPv4 and IPv6. Without it the server can end up on IPv6
      // only, and the browser then gets "connection refused" whenever it tries
      // 127.0.0.1 first, which made tests fail at random on some computers.
      command: "npm run dev -- --port 5173 --strictPort --host",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
    },
    {
      // Production build, for the service worker / offline test.
      command: "npm run build && npm run preview -- --port 4173 --strictPort --host",
      url: "http://localhost:4173",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
