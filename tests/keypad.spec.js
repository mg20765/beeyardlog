import { test, expect } from "@playwright/test";

// On a phone, a number box should open the number pad, not the full keyboard.
// That is chosen by the box's inputmode: "numeric" for whole numbers, "decimal"
// where a decimal point is needed. (A real phone is needed to see the pad; this
// checks the box asks for it.)

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

const WHOLE = ["broodFrames", "miteBees", "miteCount", "supersRemoved"];
const DECIMAL = ["weatherTemp", "broodPct", "honeyKg"];

test("whole-number boxes ask for the whole-number pad", async ({ page }) => {
  for (const name of WHOLE) {
    await expect(page.locator(`#field-${name}`), name).toHaveAttribute("inputmode", "numeric");
  }
});

test("boxes that need a decimal point ask for the decimal pad", async ({ page }) => {
  for (const name of DECIMAL) {
    await expect(page.locator(`#field-${name}`), name).toHaveAttribute("inputmode", "decimal");
  }
});

test("the storage box counts ask for the whole-number pad once they are shown", async ({ page }) => {
  await page.getByLabel("Removed to storage").check();
  await expect(page.locator("#field-storageFdBoxes")).toHaveAttribute("inputmode", "numeric");
  await expect(page.locator("#field-storageThreeQuarterBoxes")).toHaveAttribute("inputmode", "numeric");
});

test("every number box on the form has an input mode", async ({ page }) => {
  await page.getByLabel("Removed to storage").check();
  const missing = await page.evaluate(() =>
    [...document.querySelectorAll('input[type="number"]')]
      .filter((e) => !e.getAttribute("inputmode"))
      .map((e) => e.id || e.placeholder),
  );
  expect(missing).toEqual([]);
});

test("the Edit details panel asks for the right pad too", async ({ page }) => {
  await page.getByLabel("Hive ID", { exact: true }).fill("H1");
  await page.getByLabel("Brood coverage %").fill("80");
  await page.locator("#field-broodFrames").fill("7");
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();
  await page.locator(".hive-log-row", { hasText: "H1" }).locator(".hive-log-toggle").click();
  await page.getByRole("button", { name: "Edit details" }).click();

  await expect(page.locator("#edit-broodPct")).toHaveAttribute("inputmode", "decimal");
  await expect(page.locator("#edit-broodFrames")).toHaveAttribute("inputmode", "numeric");
  // Text boxes keep the normal keyboard.
  await expect(page.locator("#edit-hiveId")).not.toHaveAttribute("inputmode", /.+/);
});
