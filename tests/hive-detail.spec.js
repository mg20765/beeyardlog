import { test, expect } from "@playwright/test";

// Tap a hive in the Hives view to see its entries, fix them there (with a button
// for entries saved with Yard # and Hive ID the wrong way round) and come back
// with a Back button. A hive can also be set aside as a call-out so it never
// counts as overdue.

// "Today" is fixed so the number of days is the same on every run.
const TODAY = new Date("2026-11-09T12:00:00");

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(TODAY);
  await page.goto("/");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

const hivesTab = (page) => page.getByRole("button", { name: /^Hives/ });
const row = (page, text) => page.locator(".hive-status-row", { hasText: text });
const back = (page) => page.getByRole("button", { name: "Back to hives" });

async function saveEntry(page, { yard, hive, date }) {
  await page.getByPlaceholder("e.g. Y2").fill(yard);
  await page.getByPlaceholder("e.g. H1").fill(hive);
  await page.locator("#field-date").fill(date);
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();
  await expect(page.locator(".hive-log-title", { hasText: hive }).first()).toBeVisible();
}

async function openHive(page, text) {
  await hivesTab(page).click();
  await row(page, text).getByRole("button").click();
}

test("tapping a hive shows its entries, and Back returns to the list", async ({ page }) => {
  await saveEntry(page, { yard: "Y1", hive: "H1", date: "2026-10-01" });
  await saveEntry(page, { yard: "Y1", hive: "H1", date: "2026-10-15" });
  await saveEntry(page, { yard: "Y1", hive: "H2", date: "2026-10-20" });

  await openHive(page, "H1");
  await expect(page.locator(".hive-detail")).toContainText("H1");
  await expect(page.locator(".hive-log-title")).toHaveCount(2); // only this hive's entries
  await expect(page.locator(".hive-log-title").first()).toContainText("2026-10-15"); // newest first
  await expect(page.locator(".hive-status-row")).toHaveCount(0);

  await back(page).click();
  await expect(page.locator(".hive-status-row")).toHaveCount(2);
  await expect(page.locator(".hive-detail")).toHaveCount(0);
});

test("an entry can be edited from the hive view", async ({ page }) => {
  await saveEntry(page, { yard: "Y1", hive: "H1", date: "2026-10-01" });
  await openHive(page, "H1");

  await page.locator(".hive-log-row").first().click();
  await page.getByRole("button", { name: "Edit details" }).click();
  await page.locator("#edit-notes").fill("queen seen");
  await page.getByRole("button", { name: "Save changes" }).click();

  // The entry stays open after saving, now showing the new note.
  await expect(page.locator(".hive-log-detail")).toContainText("queen seen");
});

test("Swap Yard # and Hive ID fixes an entry saved the wrong way round", async ({ page }) => {
  await saveEntry(page, { yard: "1", hive: "Wnd", date: "2026-10-19" });
  await openHive(page, "Wnd");

  await page.locator(".hive-log-row").first().click();
  await page.getByRole("button", { name: "Edit details" }).click();
  await page.getByRole("button", { name: "Swap Yard # and Hive ID" }).click();
  await expect(page.locator("#edit-yardNo")).toHaveValue("Wnd");
  await expect(page.locator("#edit-hiveId")).toHaveValue("1");
  await page.getByRole("button", { name: "Save changes" }).click();

  // It no longer belongs to the hive called "1 · Wnd", so the view says so.
  await expect(page.getByText("No entries for this hive any more")).toBeVisible();
  await back(page).click();
  await expect(row(page, "Wnd · 1")).toHaveCount(1);
  await expect(row(page, "1 · Wnd")).toHaveCount(0);
});

test("the swap button is on the edit screen in the Log view too, and can be undone before saving", async ({ page }) => {
  await saveEntry(page, { yard: "1", hive: "Wnd", date: "2026-10-19" });
  await page.locator(".hive-log-row").first().click();
  await page.getByRole("button", { name: "Edit details" }).click();

  const swap = page.getByRole("button", { name: "Swap Yard # and Hive ID" });
  await swap.click();
  await swap.click();
  await expect(page.locator("#edit-yardNo")).toHaveValue("1");
  await expect(page.locator("#edit-hiveId")).toHaveValue("Wnd");
});

test("a call-out can be set aside so it never counts as overdue", async ({ page }) => {
  await saveEntry(page, { yard: "1", hive: "Topito rd", date: "2026-09-01" });
  await saveEntry(page, { yard: "Amb", hive: "Dino", date: "2026-09-01" });
  await expect(hivesTab(page).locator(".hive-tab-badge")).toHaveText("2");

  await openHive(page, "Topito rd");
  await page.getByRole("button", { name: "Call-out, don't track" }).click();
  await expect(page.getByRole("button", { name: "Track this hive again" })).toBeVisible();
  await back(page).click();

  await expect(hivesTab(page).locator(".hive-tab-badge")).toHaveText("1");
  await expect(page.getByRole("status").first()).toContainText("1 hive not checked in 4+ weeks");
  await expect(page.getByText("Not tracked (call-outs)")).toBeVisible();
  await expect(row(page, "Topito rd")).not.toContainText("Due for a check");
  await expect(row(page, "Dino")).toContainText("Due for a check");
});

test("a call-out is remembered, and can be tracked again", async ({ page }) => {
  await saveEntry(page, { yard: "1", hive: "Topito rd", date: "2026-09-01" });
  await openHive(page, "Topito rd");
  await page.getByRole("button", { name: "Call-out, don't track" }).click();

  await page.reload();
  await expect(hivesTab(page).locator(".hive-tab-badge")).toHaveCount(0);
  await openHive(page, "Topito rd");
  await page.getByRole("button", { name: "Track this hive again" }).click();
  await back(page).click();
  await expect(hivesTab(page).locator(".hive-tab-badge")).toHaveText("1");
  await expect(page.getByText("Not tracked (call-outs)")).toHaveCount(0);
});

test("the Back button is big enough to tap", async ({ page }) => {
  await saveEntry(page, { yard: "Y1", hive: "H1", date: "2026-10-01" });
  await openHive(page, "H1");
  expect((await back(page).boundingBox()).height).toBeGreaterThanOrEqual(48);
});

test("going back to the Log view and returning to Hives shows the list again", async ({ page }) => {
  await saveEntry(page, { yard: "Y1", hive: "H1", date: "2026-10-01" });
  await openHive(page, "H1");
  await page.getByRole("button", { name: "Log", exact: true }).click();
  await hivesTab(page).click();
  await expect(page.locator(".hive-status-row")).toHaveCount(1);
});
