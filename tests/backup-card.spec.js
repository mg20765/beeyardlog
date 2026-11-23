import { test, expect } from "@playwright/test";

// A "Save your records" card at the top of the Log view: two big buttons, when
// the last backup was made, and whether the phone is protecting the app's data.

// "Today" is fixed so the number of days is the same on every run.
const TODAY = new Date("2026-11-24T12:00:00");

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(TODAY);
  await page.goto("/");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

const card = (page) => page.locator(".hive-save-card");
const saveButton = (page) => page.getByRole("button", { name: "Backup (JSON)" });
const excelButton = (page) => page.getByRole("button", { name: "Export all to Excel" });

async function saveEntry(page, hive = "H1") {
  await page.getByPlaceholder("e.g. Y2").fill("Y1");
  await page.getByPlaceholder("e.g. H1").fill(hive);
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();
  await expect(page.locator(".hive-log-title", { hasText: hive }).first()).toBeVisible();
}

test("the card is at the top, with the two buttons easy to see", async ({ page }) => {
  await expect(card(page)).toContainText("Save your records");
  const box = await card(page).boundingBox();
  expect(box.y).toBeLessThan(250);
  const form = await page.getByPlaceholder("e.g. Y2").boundingBox();
  expect(box.y).toBeLessThan(form.y);
  await expect(saveButton(page)).toBeVisible();
  await expect(excelButton(page)).toBeVisible();
  expect((await saveButton(page).boundingBox()).height).toBeGreaterThanOrEqual(48);
});

test("there is only one backup button and one Excel button on the page", async ({ page }) => {
  await expect(saveButton(page)).toHaveCount(1);
  await expect(excelButton(page)).toHaveCount(1);
});

test("with nothing logged it says there is nothing to back up", async ({ page }) => {
  await expect(card(page)).toContainText("Nothing to back up yet.");
  await expect(saveButton(page)).toBeDisabled();
  await expect(excelButton(page)).toBeDisabled();
});

test("with entries and no backup it warns in red", async ({ page }) => {
  await saveEntry(page);
  await expect(card(page)).toContainText("No backup yet");
  await expect(card(page).locator(".hive-save-status--alert")).toHaveCount(1);
});

test("saving a backup makes the line say today", async ({ page }) => {
  await saveEntry(page);
  await Promise.all([page.waitForEvent("download"), saveButton(page).click()]);
  await expect(card(page)).toContainText("Last backup: today");
  await expect(card(page).locator(".hive-save-status--ok")).toHaveCount(1);
});

test("a change after the backup shows as not backed up yet", async ({ page }) => {
  await saveEntry(page, "H1");
  await Promise.all([page.waitForEvent("download"), saveButton(page).click()]);
  await saveEntry(page, "H2");
  await expect(card(page)).toContainText("1 change not backed up yet");
  await expect(card(page).locator(".hive-save-status--warn")).toHaveCount(1);
});

test("a backup older than a week turns the line red", async ({ page }) => {
  await saveEntry(page);
  await Promise.all([page.waitForEvent("download"), saveButton(page).click()]);
  await page.evaluate(() => localStorage.setItem("hive_last_backup_date", "2026-11-10"));
  await page.reload();
  await expect(card(page)).toContainText("Last backup: 14 days ago");
  await expect(card(page).locator(".hive-save-status--alert")).toHaveCount(1);
});

test("the card says whether the phone is protecting the app's data", async ({ page }) => {
  await expect(card(page)).toContainText(/Storage protection: (on|off|can't be checked)/);
});

test("the card says records are only stored on this phone", async ({ page }) => {
  await expect(card(page)).toContainText("only on this phone");
});

test("the file picker does not hide backups from other apps such as Dropbox", async ({ page }) => {
  const accept = await page.locator('input[type="file"]').getAttribute("accept");
  expect(accept === null || accept.includes("*/*")).toBe(true);
});

test("restoring still turns away a file that is not a backup", async ({ page }) => {
  await page.locator('input[type="file"]').setInputFiles({
    name: "holiday.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not a backup"),
  });
  await expect(page.locator(".hive-import-msg")).toBeVisible();
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});
