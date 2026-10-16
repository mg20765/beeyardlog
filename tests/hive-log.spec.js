import { test, expect } from "@playwright/test";

// Each test gets a fresh browser context, so IndexedDB starts empty.
async function addInspection(page, hiveId) {
  await page.getByPlaceholder("e.g. H1").fill(hiveId);
  await page.getByRole("button", { name: "+ Add to log" }).click();
  // Temperament, population etc. are only nudged, so confirm to save.
  await page.getByRole("button", { name: "Add anyway" }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

test("add an inspection", async ({ page }) => {
  await addInspection(page, "H1");

  await expect(page.getByText("No inspections logged yet")).toHaveCount(0);
  await expect(page.locator(".hive-log-title", { hasText: "H1" })).toBeVisible();
  await expect(page.locator(".hive-count-badge")).toHaveText("1");
});

test("Hive ID is required", async ({ page }) => {
  await page.getByRole("button", { name: "+ Add to log" }).click();

  await expect(page.getByText("Hive ID is required")).toBeVisible();
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

test("storage fields show when 'Removed to storage' is ticked", async ({ page }) => {
  await expect(page.getByText("What's going to storage?")).toHaveCount(0);

  await page.getByLabel("Removed to storage").check();

  await expect(page.getByText("What's going to storage?")).toBeVisible();
  await expect(page.locator(".hive-field", { hasText: "FD boxes" }).locator("input")).toBeVisible();
  await expect(page.locator(".hive-field", { hasText: "3/4 boxes" }).locator("input")).toBeVisible();
  await expect(page.getByLabel("Strap")).toBeVisible();
});

test("delete entry", async ({ page }) => {
  await addInspection(page, "H2");
  await expect(page.locator(".hive-log-title", { hasText: "H2" })).toBeVisible();

  await page.getByRole("button", { name: "Delete", exact: true }).click();

  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

test("data survives reload", async ({ page }) => {
  await addInspection(page, "H3");
  await expect(page.locator(".hive-log-title", { hasText: "H3" })).toBeVisible();

  await page.reload();

  await expect(page.locator(".hive-log-title", { hasText: "H3" })).toBeVisible();
  await expect(page.locator(".hive-count-badge")).toHaveText("1");
});
