import { test, expect } from "@playwright/test";

// Regression tests for data-safety bugs: no accidental wipes, no duplicate
// or ID-less entries, and visible errors when saving fails.

async function addInspection(page, hiveId) {
  await page.getByPlaceholder("e.g. H1").fill(hiveId);
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();
  await expect(
    page.locator(".hive-log-title", { hasText: hiveId }),
  ).toBeVisible();
}

const badge = (page) => page.locator(".hive-count-badge");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

test("clear log asks for confirmation and can be cancelled", async ({ page }) => {
  await addInspection(page, "H1");
  await addInspection(page, "H2");
  await expect(badge(page)).toHaveText("2");

  await page.getByRole("button", { name: "Clear log" }).click();
  await expect(page.getByText("This can't be undone")).toBeVisible();
  await expect(badge(page)).toHaveText("2");

  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(badge(page)).toHaveText("2");

  await page.getByRole("button", { name: "Clear log" }).click();
  await page.getByRole("button", { name: "Yes, clear all" }).click();
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

test("deleting one entry asks for confirmation and can be cancelled", async ({ page }) => {
  await addInspection(page, "H1");

  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(badge(page)).toHaveText("1");

  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(badge(page)).toHaveText("1");

  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

test("double-tapping 'Add anyway' saves the entry once", async ({ page }) => {
  await page.getByPlaceholder("e.g. H1").fill("H1");
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).dblclick();

  await expect(badge(page)).toHaveText("1");
  // Give a late second save time to land before asserting it didn't.
  await page.waitForTimeout(500);
  await expect(badge(page)).toHaveText("1");
});

test("'Add anyway' still requires a Hive ID", async ({ page }) => {
  const hiveId = page.getByPlaceholder("e.g. H1");
  await hiveId.fill("H1");
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await expect(page.getByRole("button", { name: "Add anyway" })).toBeVisible();

  await hiveId.fill("");
  await page.getByRole("button", { name: "Add anyway" }).click();

  await expect(page.getByText("Hive ID is required")).toBeVisible();
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

test("a failed save shows an error and keeps the form", async ({ page }) => {
  await page.evaluate(() => {
    IDBObjectStore.prototype.add = () => {
      throw new Error("simulated storage failure");
    };
  });

  await page.getByPlaceholder("e.g. H1").fill("H1");
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();

  await expect(page.getByText(/couldn't save/i)).toBeVisible();
  await expect(page.getByPlaceholder("e.g. H1")).toHaveValue("H1");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});
