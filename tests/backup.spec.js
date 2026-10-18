import { test, expect } from "@playwright/test";

// The safety net for the whole app: back up, lose the data, restore it.

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

async function addInspection(page, hiveId) {
  await page.getByPlaceholder("e.g. H1").fill(hiveId);
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();
  await expect(
    page.locator(".hive-log-title", { hasText: hiveId }),
  ).toBeVisible();
}

test("backup then restore brings the entries back", async ({ page }) => {
  await addInspection(page, "H1");
  await addInspection(page, "H2");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Backup (JSON)" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(
    /^hive_log_backup_\d{4}-\d{2}-\d{2}\.json$/,
  );
  const backupPath = await download.path();

  await page.getByRole("button", { name: "Clear log" }).click();
  await page.getByRole("button", { name: "Yes, clear all" }).click();
  await expect(page.getByText("No inspections logged yet")).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles(backupPath);

  await expect(page.getByText("Imported 2 inspections.")).toBeVisible();
  await expect(page.locator(".hive-log-title", { hasText: "H1" })).toBeVisible();
  await expect(page.locator(".hive-log-title", { hasText: "H2" })).toBeVisible();
  await expect(page.locator(".hive-count-badge")).toHaveText("2");
});

test("restoring a file that isn't a backup shows a message and changes nothing", async ({ page }) => {
  await addInspection(page, "H1");

  await page.locator('input[type="file"]').setInputFiles({
    name: "notes.json",
    mimeType: "application/json",
    buffer: Buffer.from("this is not a backup"),
  });

  await expect(
    page.getByText("doesn't look like a Yardbook backup"),
  ).toBeVisible();
  await expect(page.locator(".hive-count-badge")).toHaveText("1");
});
