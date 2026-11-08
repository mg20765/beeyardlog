import { test, expect } from "@playwright/test";

// A list of every hive with when it was last checked, and a warning for the
// ones not checked for a while (4 weeks unless the beekeeper changes it).

// "Today" is fixed so the number of days is the same on every run.
const TODAY = new Date("2026-11-09T12:00:00");

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(TODAY);
  await page.goto("/");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

async function saveEntry(page, { yard, hive, date }) {
  await page.getByPlaceholder("e.g. Y2").fill(yard);
  await page.getByPlaceholder("e.g. H1").fill(hive);
  await page.locator("#field-date").fill(date);
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();
  await expect(page.locator(".hive-log-title", { hasText: hive }).first()).toBeVisible();
}

test("there is no hive list until something has been logged", async ({ page }) => {
  await expect(page.locator(".hive-status")).toHaveCount(0);
});

test("lists each hive with its last check, longest unchecked first", async ({ page }) => {
  await saveEntry(page, { yard: "Y1", hive: "Recent", date: "2026-11-05" });
  await saveEntry(page, { yard: "Y1", hive: "Old", date: "2026-10-01" });
  await saveEntry(page, { yard: "Y1", hive: "Old", date: "2026-09-01" }); // earlier, so ignored

  const rows = page.locator(".hive-status-row");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("Old");
  await expect(rows.nth(0)).toContainText("39 days ago");
  await expect(rows.nth(1)).toContainText("Recent");
  await expect(rows.nth(1)).toContainText("4 days ago");
});

test("warns about hives not checked for 4 weeks", async ({ page }) => {
  await saveEntry(page, { yard: "Y1", hive: "Overdue", date: "2026-10-01" });
  await saveEntry(page, { yard: "Y1", hive: "Fine", date: "2026-11-05" });

  await expect(page.getByRole("status")).toContainText("1 hive not checked in 4+ weeks");
  await expect(page.locator(".hive-status-row", { hasText: "Overdue" })).toContainText(
    "Due for a check",
  );
  await expect(page.locator(".hive-status-row", { hasText: "Fine" })).not.toContainText(
    "Due for a check",
  );
});

test("says so when every hive is up to date", async ({ page }) => {
  await saveEntry(page, { yard: "Y1", hive: "Fine", date: "2026-11-05" });
  await expect(page.getByRole("status")).toContainText("All hives checked in the last 4 weeks");
});

test("the same hive name in two yards is two hives", async ({ page }) => {
  await saveEntry(page, { yard: "Y1", hive: "H1", date: "2026-11-05" });
  await saveEntry(page, { yard: "Y2", hive: "H1", date: "2026-10-01" });
  await expect(page.locator(".hive-status-row")).toHaveCount(2);
  await expect(page.getByRole("status")).toContainText("1 hive not checked");
});

test("the limit can be changed, and is remembered", async ({ page }) => {
  await saveEntry(page, { yard: "Y1", hive: "Middle", date: "2026-10-20" }); // 20 days
  await expect(page.getByRole("status")).toContainText("All hives checked in the last 4 weeks");

  await page.getByLabel("Warn me after").selectOption("14");
  await expect(page.getByRole("status")).toContainText("1 hive not checked in 2+ weeks");

  await page.reload();
  await expect(page.getByLabel("Warn me after")).toHaveValue("14");
  await expect(page.getByRole("status")).toContainText("1 hive not checked in 2+ weeks");
});
