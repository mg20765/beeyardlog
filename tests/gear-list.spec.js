import { test, expect } from "@playwright/test";

// A tick-off gear list with a yard day view and an extraction day view.
// Containers only appear on extraction day.

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

const openGear = async (page) => {
  await page.getByText("Gear checklist", { exact: true }).click();
};
// Exact for plain names, so "Smoker" does not also match "Smoker fuel".
const item = (page, name) =>
  page.getByRole("checkbox", typeof name === "string" ? { name, exact: true } : { name });

test("the gear list is closed until it is wanted", async ({ page }) => {
  await expect(item(page, "Smoker")).toBeHidden();
  await openGear(page);
  await expect(item(page, "Smoker")).toBeVisible();
});

test("yard day has no containers, extraction day does", async ({ page }) => {
  await openGear(page);
  await expect(item(page, "Gloves")).toBeVisible();
  await expect(item(page, /container/i)).toHaveCount(0);

  await page.getByRole("button", { name: "Extraction day" }).click();
  await expect(item(page, /containers or buckets/i)).toBeVisible();
  await expect(item(page, "Smoker")).toHaveCount(0);

  await page.getByRole("button", { name: "Yard day" }).click();
  await expect(item(page, "Smoker")).toBeVisible();
});

test("ticks are counted and remembered", async ({ page }) => {
  await openGear(page);
  await expect(page.getByText(/^0 of \d+ packed$/)).toBeVisible();

  await item(page, "Smoker").check();
  await item(page, "Gloves").check();
  await expect(page.getByText(/^2 of \d+ packed$/)).toBeVisible();

  await page.reload();
  await openGear(page);
  await expect(item(page, "Smoker")).toBeChecked();
  await expect(item(page, "Hive tool")).not.toBeChecked();
});

test("you can add your own item and take it away again", async ({ page }) => {
  await openGear(page);
  await page.getByLabel("Add your own item").fill("Zip ties");
  await page.getByRole("button", { name: "Add item" }).click();

  await expect(item(page, "Zip ties")).toBeVisible();
  await expect(page.getByLabel("Add your own item")).toHaveValue("");

  await page.getByRole("button", { name: "Remove Zip ties" }).click();
  await expect(item(page, "Zip ties")).toHaveCount(0);
});

test("a new trip unticks everything but keeps your own items", async ({ page }) => {
  await openGear(page);
  await page.getByLabel("Add your own item").fill("Zip ties");
  await page.getByRole("button", { name: "Add item" }).click();
  await item(page, "Smoker").check();
  await item(page, "Zip ties").check();

  await page.getByRole("button", { name: "Start a new trip" }).click();

  await expect(item(page, "Smoker")).not.toBeChecked();
  await expect(item(page, "Zip ties")).toBeVisible();
  await expect(item(page, "Zip ties")).not.toBeChecked();
});

test("the gear list does not touch the inspection log", async ({ page }) => {
  await openGear(page);
  await item(page, "Smoker").check();
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
  await expect(page.getByRole("button", { name: /backup/i }).first()).toBeDisabled();
});

test("the gear list sits above the inspection form, so it can be used before a trip", async ({ page }) => {
  const gear = await page.getByText("Gear checklist", { exact: true }).boundingBox();
  const form = await page.getByPlaceholder("e.g. Y2").boundingBox();
  expect(gear.y).toBeLessThan(form.y);
});
