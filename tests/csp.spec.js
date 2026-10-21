import { test, expect } from "@playwright/test";

// Runs on the production build (the content policy is only added there, because
// the dev server needs inline scripts). Every feature that could trip the
// policy is used, and any violation fails the test.
test.use({ baseURL: "http://localhost:4173" });

test("the production page has a content policy and nothing in the app breaks it", async ({ page }) => {
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      window.__cspViolations.push(`${e.violatedDirective} blocked ${e.blockedURI}`);
    });
  });
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (/content security policy/i.test(msg.text())) consoleErrors.push(msg.text());
  });

  await page.goto("/");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();

  const policy = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content");
  expect(policy).toContain("default-src 'self'");
  expect(policy).toContain("object-src 'none'");
  expect(policy).not.toMatch(/script-src[^;]*unsafe-inline/);

  // The service worker, a saved entry, the mite check, and both downloads.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.getByPlaceholder("e.g. H1").fill("H1");
  await page.getByLabel("Alcohol wash").check();
  await page.getByPlaceholder("e.g. 300").fill("300");
  await page.getByPlaceholder("e.g. 5").fill("9");
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();
  await expect(page.locator(".hive-count-badge")).toHaveText("1");

  await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export all to Excel" }).click(),
  ]);
  await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Backup (JSON)" }).click(),
  ]);

  expect(await page.evaluate(() => window.__cspViolations)).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
