import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;
/** Test-only secrets for the signed results links and the admin table (never used outside tests). */
export const TEST_ENV = {
  ANALYTICS_SECRET: "test-secret-not-for-production",
  ADMIN_KEY: "test-admin-key",
  ANALYTICS_STORE: "json",
  ANALYTICS_FILE: "data/analytics.test.json",
};

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    // Locally you can point at an installed Chrome: PW_CHROMIUM_PATH=/usr/bin/google-chrome
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // Tests run against the production build (run `npm run build` first).
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: TEST_ENV,
  },
});
