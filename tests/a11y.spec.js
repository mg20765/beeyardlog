import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

async function addEntry(page, hive) {
  await page.getByLabel("Hive ID", { exact: true }).fill(hive);
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();
  await expect(page.locator(".hive-log-title", { hasText: hive })).toBeVisible();
}

test("every box on the form has a label attached", async ({ page }) => {
  const unlabelled = await page.evaluate(() =>
    [...document.querySelectorAll("input:not([type=hidden]):not([type=file]), textarea")]
      .filter((e) => e.labels.length === 0 && !e.getAttribute("aria-label"))
      .map((e) => e.placeholder || e.id || e.type),
  );
  expect(unlabelled).toEqual([]);
});

test("a box can be found, and filled, by its label", async ({ page }) => {
  await page.getByLabel("Yard #").fill("Y2");
  await page.getByLabel("Hive ID", { exact: true }).fill("H1");
  await page.getByLabel("Temp (°C)").fill("17");
  await page.getByLabel("Brood coverage %").fill("80");
  await page.getByLabel("Notes").fill("calm");

  await expect(page.getByPlaceholder("e.g. Y2")).toHaveValue("Y2");
  await expect(page.locator("#field-broodPct")).toHaveValue("80");
  await expect(page.locator("textarea")).toHaveValue("calm");
});

test("tapping a label's text puts the cursor in its box", async ({ page }) => {
  await page.locator("label", { hasText: /^Yard #$/ }).click();
  await expect(page.getByPlaceholder("e.g. Y2")).toBeFocused();
});

test("the log row has no button inside another button", async ({ page }) => {
  await addEntry(page, "H1");
  await expect(page.locator('[role="button"] button, button button')).toHaveCount(0);
});

test("the log row's open/close control says whether it is open, and works from the keyboard", async ({ page }) => {
  await addEntry(page, "H1");
  const toggle = page.locator(".hive-log-toggle");

  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".hive-log-detail")).toBeVisible();

  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
});

test("the delete ✕ still works on its own and doesn't open the row", async ({ page }) => {
  await addEntry(page, "H1");
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Delete the entry for")).toBeVisible();
  await expect(page.locator(".hive-log-detail")).toHaveCount(0);
});

test("a round choice can be un-chosen by tapping it again", async ({ page }) => {
  const calm = page.getByLabel("Calm");
  await calm.check();
  await expect(calm).toBeChecked();

  await calm.click();
  await expect(calm).not.toBeChecked();
});

test("choosing a different round choice still switches to it", async ({ page }) => {
  await page.getByLabel("Calm").check();
  await page.getByLabel("Nervous").check();
  await expect(page.getByLabel("Nervous")).toBeChecked();
  await expect(page.getByLabel("Calm")).not.toBeChecked();
});

test("an un-chosen round choice is saved as blank", async ({ page }) => {
  await page.getByLabel("Calm").check();
  await page.getByLabel("Calm").click();
  await page.getByLabel("Hive ID", { exact: true }).fill("H1");
  await page.getByRole("button", { name: "+ Add to log" }).click();

  // Temperament is blank again, so the "save anyway?" prompt names it.
  await expect(page.locator(".hive-missing-warning")).toContainText("Temperament");
});
