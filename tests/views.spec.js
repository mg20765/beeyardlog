import { test, expect } from "@playwright/test";

// The page shows one view at a time: Log (the form, the default), Hives (which
// hives are due) and Gear (expiry dates and the gear checklist). The expiry
// warning stays at the top whichever view is showing.

// "Today" is fixed so the number of days is the same on every run.
const TODAY = new Date("2026-11-09T12:00:00");

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(TODAY);
  await page.goto("/");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

const tab = (page, name) =>
  page.getByRole("button", typeof name === "string" ? { name, exact: true } : { name });
const logTab = (page) => tab(page, "Log");
const hivesTab = (page) => tab(page, /^Hives/);
const gearTab = (page) => tab(page, "Gear");

async function saveEntry(page, { yard, hive, date }) {
  await page.getByPlaceholder("e.g. Y2").fill(yard);
  await page.getByPlaceholder("e.g. H1").fill(hive);
  await page.locator("#field-date").fill(date);
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();
  await expect(page.locator(".hive-log-title", { hasText: hive }).first()).toBeVisible();
}

test("opens on the Log view, with the form first", async ({ page }) => {
  await expect(logTab(page)).toHaveAttribute("aria-pressed", "true");
  await expect(hivesTab(page)).toHaveAttribute("aria-pressed", "false");
  await expect(gearTab(page)).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByPlaceholder("e.g. H1")).toBeVisible();
  await expect(page.locator(".hive-status")).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: "Smoker", exact: true })).toHaveCount(0);
});

test("the form is near the top, not pushed down by the other views", async ({ page }) => {
  for (let i = 1; i <= 8; i++) {
    await saveEntry(page, { yard: "Y1", hive: `H${i}`, date: "2026-10-01" });
  }
  const hiveField = await page.getByPlaceholder("e.g. H1").boundingBox();
  expect(hiveField.y).toBeLessThan(500);
});

test("the Hives view shows the hive list and hides the form", async ({ page }) => {
  await saveEntry(page, { yard: "Y1", hive: "Old", date: "2026-10-01" });
  await hivesTab(page).click();
  await expect(hivesTab(page)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".hive-status-row")).toHaveCount(1);
  await expect(page.getByPlaceholder("e.g. H1")).toHaveCount(0);
});

test("the Hives view says so when nothing has been logged yet", async ({ page }) => {
  await hivesTab(page).click();
  await expect(page.getByText("No hives yet")).toBeVisible();
});

test("the Hives button shows how many hives are overdue", async ({ page }) => {
  await saveEntry(page, { yard: "Y1", hive: "Old", date: "2026-10-01" });
  await saveEntry(page, { yard: "Y1", hive: "Older", date: "2026-09-01" });
  await saveEntry(page, { yard: "Y1", hive: "Fresh", date: "2026-11-08" });
  await expect(hivesTab(page).locator(".hive-tab-badge")).toHaveText("2");
});

test("the Hives button has no number when nothing is overdue", async ({ page }) => {
  await saveEntry(page, { yard: "Y1", hive: "Fresh", date: "2026-11-08" });
  await expect(hivesTab(page).locator(".hive-tab-badge")).toHaveCount(0);
});

test("the Gear view shows the expiry dates and the gear checklist", async ({ page }) => {
  await gearTab(page).click();
  await expect(gearTab(page)).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("I carry an EpiPen")).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Smoker", exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("e.g. H1")).toHaveCount(0);
});

test("what you typed in the form is still there when you come back", async ({ page }) => {
  await page.getByPlaceholder("e.g. H1").fill("H42");
  await gearTab(page).click();
  await hivesTab(page).click();
  await logTab(page).click();
  await expect(page.getByPlaceholder("e.g. H1")).toHaveValue("H42");
});

test("the expiry warning stays at the top on every view", async ({ page }) => {
  await gearTab(page).click();
  await page.getByLabel("I carry an EpiPen").check();
  await page.getByLabel("EpiPen expiry date").fill("2026-11-01");

  for (const open of [logTab, hivesTab, gearTab]) {
    await open(page).click();
    await expect(page.locator(".hive-expiry-banner")).toContainText("EpiPen expired 8 days ago");
  }
});

test("the three buttons are big enough to tap", async ({ page }) => {
  for (const button of [logTab(page), hivesTab(page), gearTab(page)]) {
    expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(48);
  }
});

test("the view buttons sit above the form", async ({ page }) => {
  const buttons = await logTab(page).boundingBox();
  const form = await page.getByPlaceholder("e.g. Y2").boundingBox();
  expect(buttons.y).toBeLessThan(form.y);
});
