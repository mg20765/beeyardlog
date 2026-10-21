import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

const bees = (page) => page.getByPlaceholder("e.g. 300");
const mites = (page) => page.getByPlaceholder("e.g. 5");

test("shows mites per 100 bees and flags a count at the threshold", async ({ page }) => {
  await bees(page).fill("300");
  await mites(page).fill("9");

  await expect(page.getByText("Mites per 100 bees: 3")).toBeVisible();
  await expect(page.getByText(/consider treating/i)).toBeVisible();
});

test("a low count shows the result without the treat flag", async ({ page }) => {
  await bees(page).fill("300");
  await mites(page).fill("3");

  await expect(page.getByText("Mites per 100 bees: 1")).toBeVisible();
  await expect(page.getByText(/below the 3 per 100/i)).toBeVisible();
  await expect(page.getByText(/consider treating/i)).toHaveCount(0);
});

test("more mites than bees is called out and gives no result", async ({ page }) => {
  await bees(page).fill("10");
  await mites(page).fill("50");

  await expect(page.getByText(/can't be more than the bees/i)).toBeVisible();
  await expect(page.getByText(/Mites per 100 bees:/)).toHaveCount(0);
});

test("nothing is shown until both numbers are entered", async ({ page }) => {
  await bees(page).fill("300");

  await expect(page.getByText(/Mites per 100 bees:/)).toHaveCount(0);
  await expect(page.getByText(/can't be more than/i)).toHaveCount(0);
});

test("the mite check is saved with the entry and shown in the log", async ({ page }) => {
  await page.getByPlaceholder("e.g. H1").fill("H1");
  await page.getByLabel("Alcohol wash").check();
  await bees(page).fill("300");
  await mites(page).fill("9");
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();

  await page.locator(".hive-log-row", { hasText: "H1" }).click();

  const detail = page.locator(".hive-log-detail");
  await expect(detail.getByText("Mite Method")).toBeVisible();
  await expect(detail.getByText("Alcohol wash")).toBeVisible();
  await expect(detail.getByText("Mites per 100 Bees")).toBeVisible();
  await expect(detail.locator(".hive-log-detail-row", { hasText: "Mites per 100 Bees" })).toContainText("3");
});

test("an entry with no mite check saves normally", async ({ page }) => {
  await page.getByPlaceholder("e.g. H1").fill("H2");
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();

  await page.locator(".hive-log-row", { hasText: "H2" }).click();

  await expect(page.locator(".hive-log-detail")).not.toContainText("Mite Method");
});

test("'Not done this visit' switches the mite fields off and is saved as 'Not done'", async ({ page }) => {
  await page.getByPlaceholder("e.g. H1").fill("H3");
  await page.getByLabel("Not done this visit").check();

  await expect(bees(page)).toBeDisabled();
  await expect(mites(page)).toBeDisabled();
  await expect(page.getByLabel("Alcohol wash")).toBeDisabled();

  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();
  await page.locator(".hive-log-row", { hasText: "H3" }).click();

  await expect(
    page.locator(".hive-log-detail-row", { hasText: "Mite Method" }),
  ).toContainText("Not done");
  await expect(page.locator(".hive-log-detail")).not.toContainText("Mites per 100 Bees");
});

test("numbers typed before ticking 'Not done' aren't shown or saved, but come back if untick", async ({ page }) => {
  await bees(page).fill("300");
  await mites(page).fill("9");
  await expect(page.getByText("Mites per 100 bees: 3")).toBeVisible();

  await page.getByLabel("Not done this visit").check();
  await expect(page.getByText(/Mites per 100 bees:/)).toHaveCount(0);

  await page.getByLabel("Not done this visit").uncheck();
  await expect(bees(page)).toHaveValue("300");
  await expect(mites(page)).toHaveValue("9");
  await expect(page.getByText("Mites per 100 bees: 3")).toBeVisible();
});

test("'Not done' comes back with a restored draft", async ({ page }) => {
  await page.getByLabel("Not done this visit").check();

  await page.reload();

  await expect(page.getByLabel("Not done this visit")).toBeChecked();
  await expect(bees(page)).toBeDisabled();
});

test("the mite fields come back with a restored draft", async ({ page }) => {
  await bees(page).fill("300");
  await mites(page).fill("4");

  await page.reload();

  await expect(bees(page)).toHaveValue("300");
  await expect(mites(page)).toHaveValue("4");
});
