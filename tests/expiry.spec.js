import { test, expect } from "@playwright/test";

// Expiry dates for an EpiPen (only if you carry one) and anything else you add,
// with a warning at the top when something is out of date or close to it.

// "Today" is fixed so the number of days is the same on every run.
const TODAY = new Date("2026-11-09T12:00:00");

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(TODAY);
  await page.goto("/");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

const banner = (page) => page.locator(".hive-expiry-banner");
// The expiry dates and the gear checklist share the Gear view.
const openGear = async (page) => {
  await page.getByRole("button", { name: "Gear", exact: true }).click();
};
const openExpiry = openGear;
const carryPen = (page) => page.getByLabel("I carry an EpiPen");
const penDate = (page) => page.getByLabel("EpiPen expiry date");

test("nothing about an EpiPen shows until you say you carry one", async ({ page }) => {
  await expect(banner(page)).toHaveCount(0);
  await openExpiry(page);
  await expect(carryPen(page)).not.toBeChecked();
  await expect(penDate(page)).toHaveCount(0);

  await openGear(page);
  await expect(page.getByRole("checkbox", { name: "EpiPen (check the expiry date)" })).toHaveCount(0);
});

test("carrying an EpiPen adds it to the expiry list and the yard day gear list", async ({ page }) => {
  await openExpiry(page);
  await carryPen(page).check();
  await expect(penDate(page)).toBeVisible();
  await expect(page.locator(".hive-expiry-row", { hasText: "EpiPen" })).toContainText("no date set");

  await openGear(page);
  await expect(page.getByRole("checkbox", { name: "EpiPen (check the expiry date)" })).toBeVisible();

  await page.getByRole("button", { name: "Extraction day" }).click();
  await expect(page.getByRole("checkbox", { name: "EpiPen (check the expiry date)" })).toHaveCount(0);
});

test("warns when the EpiPen is close to expiring", async ({ page }) => {
  await openExpiry(page);
  await carryPen(page).check();
  await penDate(page).fill("2026-11-20");
  await expect(banner(page)).toContainText("EpiPen expires in 11 days");
});

test("warns when the EpiPen has expired", async ({ page }) => {
  await openExpiry(page);
  await carryPen(page).check();
  await penDate(page).fill("2026-11-01");
  await expect(banner(page)).toContainText("EpiPen expired 8 days ago");
});

test("gives no warning when the date is well ahead", async ({ page }) => {
  await openExpiry(page);
  await carryPen(page).check();
  await penDate(page).fill("2027-06-01");
  await expect(banner(page)).toHaveCount(0);
  await expect(page.locator(".hive-expiry-row", { hasText: "EpiPen" })).toContainText("OK");
});

test("you can add your own item, such as treatment strips, and take it away", async ({ page }) => {
  await openExpiry(page);
  await page.getByLabel("Name of item").fill("Apivar strips");
  await page.getByLabel("Expiry date for new item").fill("2026-12-01");
  await page.getByRole("button", { name: "Add to expiry list" }).click();

  await expect(page.locator(".hive-expiry-row", { hasText: "Apivar strips" })).toBeVisible();
  await expect(banner(page)).toContainText("Apivar strips expires in 22 days");
  await expect(page.getByLabel("Name of item")).toHaveValue("");

  await page.getByRole("button", { name: "Remove Apivar strips" }).click();
  await expect(page.locator(".hive-expiry-row", { hasText: "Apivar strips" })).toHaveCount(0);
  await expect(banner(page)).toHaveCount(0);
});

test("the choices and dates are remembered", async ({ page }) => {
  await openExpiry(page);
  await carryPen(page).check();
  await penDate(page).fill("2026-11-20");

  await page.reload();
  await expect(banner(page)).toContainText("EpiPen expires in 11 days");
  await openExpiry(page);
  await expect(carryPen(page)).toBeChecked();
  await expect(penDate(page)).toHaveValue("2026-11-20");
});

test("the expiry list does not touch the inspection log", async ({ page }) => {
  await openExpiry(page);
  await carryPen(page).check();
  await penDate(page).fill("2026-11-01");
  await page.getByRole("button", { name: "Log", exact: true }).click();
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});
