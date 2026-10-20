import { test, expect } from "@playwright/test";

// A half-filled form must survive the page reloading (an ad, a phone call,
// the browser reclaiming memory), and must not linger after it is saved.

const hiveId = (page) => page.getByPlaceholder("e.g. H1");
const yardNo = (page) => page.getByPlaceholder("e.g. Y2");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

test("what you've typed comes back after a reload", async ({ page }) => {
  await hiveId(page).fill("H7");
  await yardNo(page).fill("Y3");
  await page.getByLabel("Oxalic acid").check();

  await page.reload();

  await expect(hiveId(page)).toHaveValue("H7");
  await expect(yardNo(page)).toHaveValue("Y3");
  await expect(page.getByLabel("Oxalic acid")).toBeChecked();
  await expect(page.getByText(/restored your unsaved entry/i)).toBeVisible();
});

test("saving the entry clears the draft", async ({ page }) => {
  await hiveId(page).fill("H1");
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();
  await expect(page.locator(".hive-count-badge")).toHaveText("1");

  await page.reload();

  await expect(hiveId(page)).toHaveValue("");
  await expect(page.getByText(/restored your unsaved entry/i)).toHaveCount(0);
  await expect(page.locator(".hive-count-badge")).toHaveText("1");
});

test("'Discard draft' starts a fresh form, and stays discarded after a reload", async ({ page }) => {
  await hiveId(page).fill("H5");
  await page.reload();
  await expect(hiveId(page)).toHaveValue("H5");

  await page.getByRole("button", { name: "Discard draft" }).click();
  await expect(hiveId(page)).toHaveValue("");
  await expect(page.getByText(/restored your unsaved entry/i)).toHaveCount(0);

  await page.reload();
  await expect(hiveId(page)).toHaveValue("");
});

test("a blank form leaves no draft behind", async ({ page }) => {
  await hiveId(page).fill("H1");
  await hiveId(page).fill("");

  await page.reload();

  await expect(page.getByText(/restored your unsaved entry/i)).toHaveCount(0);
});
