import { test, expect } from "@playwright/test";

// Clearly wrong values are stopped at save with a plain message, instead of
// being stored and noticed later in Excel.

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
  await page.getByPlaceholder("e.g. H1").fill("H1");
});

const addToLog = (page) => page.getByRole("button", { name: "+ Add to log" }).click();
const problems = (page) => page.getByRole("alert");

test("a brood coverage over 100 isn't saved, and fixing it lets the entry through", async ({ page }) => {
  await page.getByPlaceholder("0–100").fill("150");
  await addToLog(page);

  await expect(problems(page)).toContainText("Brood coverage %");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();

  await page.getByPlaceholder("0–100").fill("80");
  await expect(problems(page)).toHaveCount(0); // clears as soon as you edit
  await addToLog(page);
  await page.getByRole("button", { name: "Add anyway" }).click();
  await expect(page.locator(".hive-count-badge")).toHaveText("1");
});

test("an entry with the date cleared isn't saved", async ({ page }) => {
  await page.locator('input[type="date"]').fill("");
  await addToLog(page);

  await expect(problems(page)).toContainText("Date is required");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

test("more mites than bees is stopped at save", async ({ page }) => {
  await page.getByPlaceholder("e.g. 300").fill("10");
  await page.getByPlaceholder("e.g. 5").fill("50");
  await addToLog(page);

  await expect(problems(page)).toContainText("Mites counted can't be more than bees sampled");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

test("every problem is listed together", async ({ page }) => {
  await page.getByPlaceholder("0–100").fill("150");
  await page.locator('input[type="date"]').fill("");
  await addToLog(page);

  await expect(problems(page)).toContainText("Brood coverage %");
  await expect(problems(page)).toContainText("Date is required");
});

test("'Add anyway' can't get a wrong value past the checks", async ({ page }) => {
  await addToLog(page); // blank optional fields -> the "save anyway?" prompt
  await expect(page.getByRole("button", { name: "Add anyway" })).toBeVisible();

  await page.getByPlaceholder("0–100").fill("150");
  await page.getByRole("button", { name: "Add anyway" }).click();

  await expect(problems(page)).toContainText("Brood coverage %");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});
