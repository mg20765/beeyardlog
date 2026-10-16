import { test, expect } from "@playwright/test";

// Runs against the production build (vite preview), because the service
// worker is only registered in production builds.
test.use({ baseURL: "http://localhost:4173" });

test("app loads with no network after the first visit", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();

  // Wait for the service worker to install and take control.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  await context.setOffline(true);
  await page.reload();

  await expect(page.getByText("Hive details")).toBeVisible();
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});
