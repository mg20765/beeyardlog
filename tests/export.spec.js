import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";

// The Excel export had no test. This pins down what comes out so the spreadsheet
// library can be swapped or upgraded without changing the file people get.

test("Export all to Excel makes a spreadsheet with the logged inspections", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();

  // Entry 1: a mite check and the AFB check ticked.
  await page.getByPlaceholder("e.g. H1").fill("H1");
  await page.getByLabel("Alcohol wash").check();
  await page.getByPlaceholder("e.g. 300").fill("300");
  await page.getByPlaceholder("e.g. 5").fill("9");
  await page.getByLabel("AFB check performed").check();
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();
  await expect(page.locator(".hive-count-badge")).toHaveText("1");

  // Entry 2: nothing but a Hive ID, with spaces that should be trimmed.
  await page.getByPlaceholder("e.g. H1").fill("  H2 ");
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();
  await expect(page.locator(".hive-count-badge")).toHaveText("2");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export all to Excel" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^hive_log_\d{4}-\d{2}-\d{2}\.xlsx$/);

  const workbook = XLSX.read(readFileSync(await download.path()));
  expect(workbook.SheetNames).toEqual(["Inspections"]);
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets.Inspections);
  expect(rows).toHaveLength(2);

  const [first, second] = rows;
  expect(first["Hive ID"]).toBe("H1");
  expect(first["Mite Method"]).toBe("Alcohol wash");
  expect(first["Bees Sampled"]).toBe(300); // a real number, so Excel can add it up
  expect(typeof first.Date).toBe("number"); // a real date, not text
  expect(first["Mites per 100 Bees"]).toBe(3);
  // Checkbox columns read Yes/No, not TRUE/FALSE.
  expect(first["AFB Checked"]).toBe("Yes");
  expect(first["AFB Signs Found"]).toBe("No");
  expect(second["Hive ID"]).toBe("H2");
  expect(second["AFB Checked"]).toBe("No");
  // The internal id isn't exported.
  expect(first).not.toHaveProperty("id");
});
