import { test, expect } from "@playwright/test";

// A corrected entry changes what a backup should hold, so corrections count
// toward the "time to back up" reminder along with new entries.

const EDITS_KEY = "hive_edits_since_backup";
const edits = (page) => page.evaluate((k) => localStorage.getItem(k), EDITS_KEY);

async function addEntry(page, hive) {
  await page.getByPlaceholder("e.g. H1").fill(hive);
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();
  await expect(page.locator(".hive-log-title", { hasText: hive })).toBeVisible();
}

test("correcting an entry is counted, and a backup resets the count", async ({ page }) => {
  await page.goto("/");
  await addEntry(page, "H1");
  await page.getByRole("button", { name: "Backup (JSON)" }).click();
  expect(await edits(page)).toBe("0");

  await page.locator(".hive-log-row", { hasText: "H1" }).click();
  await page.getByRole("button", { name: "Edit details" }).click();
  await page.locator("#edit-yardNo").fill("Y9");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator(".hive-edit")).toHaveCount(0);

  expect(await edits(page)).toBe("1");
});

test("a save that doesn't change anything isn't counted as a correction", async ({ page }) => {
  await page.goto("/");
  await addEntry(page, "H1");
  await page.getByRole("button", { name: "Backup (JSON)" }).click();

  await page.locator(".hive-log-row", { hasText: "H1" }).click();
  await page.getByRole("button", { name: "Edit details" }).click();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator(".hive-edit")).toHaveCount(0);

  expect(await edits(page)).toBe("0");
});

test("new entries and corrections together bring up the backup reminder", async ({ page }) => {
  await page.addInitScript((k) => localStorage.setItem(k, "9"), EDITS_KEY);
  await page.goto("/");
  await expect(page.locator(".hive-backup-reminder")).toHaveCount(0); // 9 corrections alone: not yet

  await addEntry(page, "H1"); // 1 new + 9 corrected = 10

  await expect(page.locator(".hive-backup-reminder")).toContainText("1 new and 9 corrected");
});

test("backing up from the reminder clears it", async ({ page }) => {
  await page.addInitScript((k) => localStorage.setItem(k, "10"), EDITS_KEY);
  await page.goto("/");
  await addEntry(page, "H1");
  await expect(page.locator(".hive-backup-reminder")).toBeVisible();

  await page.getByRole("button", { name: "Backup now (JSON)" }).click();

  await expect(page.locator(".hive-backup-reminder")).toHaveCount(0);
  expect(await edits(page)).toBe("0");
});

test("the reminder keeps its plain wording when nothing was corrected", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("hive_last_backup_id", "0"));
  await page.goto("/");
  // Ten new entries, restored without moving the "backed up" mark: add them directly.
  const rows = Array.from({ length: 10 }, (_, i) => ({ Date: "2026-10-01", "Hive ID": `H${i}` }));
  await page.evaluate(async (rs) => {
    await new Promise((resolve) => {
      const open = indexedDB.open("hive-logbook-db");
      open.onsuccess = () => {
        const tx = open.result.transaction("inspections", "readwrite");
        rs.forEach((r) => tx.objectStore("inspections").add(r));
        tx.oncomplete = resolve;
      };
    });
  }, rows);
  await page.reload();

  await expect(page.locator(".hive-backup-reminder")).toContainText("10 inspections logged since your last backup");
});
