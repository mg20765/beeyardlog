import { test, expect } from "@playwright/test";

// A saved entry can be corrected: the typed fields (Hive ID, Yard #, Date,
// notes and the other typed boxes), not the ticks and choices.

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

async function saveEntry(page, { hive, yard }, extra = async () => {}) {
  await page.getByPlaceholder("e.g. Y2").fill(yard);
  await page.getByPlaceholder("e.g. H1").fill(hive);
  await extra();
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();
  await expect(page.locator(".hive-log-title", { hasText: hive })).toBeVisible();
}

const openEdit = async (page, hive) => {
  await page.locator(".hive-log-row", { hasText: hive }).click();
  await page.getByRole("button", { name: "Edit details" }).click();
};

test("Yard # comes before Hive ID on the form", async ({ page }) => {
  const yard = await page.getByPlaceholder("e.g. Y2").boundingBox();
  const hive = await page.getByPlaceholder("e.g. H1").boundingBox();
  expect(yard.x).toBeLessThan(hive.x);
});

test("a spelling mistake in a saved Hive ID can be fixed", async ({ page }) => {
  await saveEntry(page, { hive: "Hvie 1", yard: "Y2" });

  await openEdit(page, "Hvie 1");
  await page.locator("#edit-hiveId").fill("Hive 1");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.locator(".hive-log-title", { hasText: "Hive 1" })).toBeVisible();
  await expect(page.locator(".hive-log-title", { hasText: "Hvie 1" })).toHaveCount(0);
  await expect(page.locator(".hive-count-badge")).toHaveText("1"); // edited, not duplicated
});

test("the fix is still there after a reload", async ({ page }) => {
  await saveEntry(page, { hive: "H1", yard: "Y2" });
  await openEdit(page, "H1");
  await page.locator("#edit-yardNo").fill("Y9");
  await page.getByRole("button", { name: "Save changes" }).click();
  // Wait until the save has finished (the edit panel closes) before reloading,
  // otherwise the reload can beat the write to the database on a busy computer.
  await expect(page.locator(".hive-edit")).toHaveCount(0);

  await page.reload();
  await page.locator(".hive-log-row", { hasText: "H1" }).click();

  await expect(
    page.locator(".hive-log-detail-row", { hasText: "Yard #" }),
  ).toContainText("Y9");
});

test("Cancel leaves the entry as it was", async ({ page }) => {
  await saveEntry(page, { hive: "H1", yard: "Y2" });
  await openEdit(page, "H1");
  await page.locator("#edit-hiveId").fill("SOMETHING ELSE");

  await page.locator(".hive-edit").getByRole("button", { name: "Cancel" }).click();

  await expect(page.locator(".hive-log-title", { hasText: "H1" })).toBeVisible();
  await expect(page.getByText("SOMETHING ELSE")).toHaveCount(0);
});

test("an edit with no Hive ID isn't saved and says why", async ({ page }) => {
  await saveEntry(page, { hive: "H1", yard: "Y2" });
  await openEdit(page, "H1");
  await page.locator("#edit-hiveId").fill("");

  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.locator(".hive-edit")).toContainText("Hive ID is required");
  await page.locator(".hive-edit").getByRole("button", { name: "Cancel" }).click();
  await expect(page.locator(".hive-log-title", { hasText: "H1" })).toBeVisible();
});

test("a wrong number in an edit is caught the same way as when adding", async ({ page }) => {
  await saveEntry(page, { hive: "H1", yard: "Y2" }, async () => {
    await page.getByPlaceholder("0–100").fill("80");
  });
  await openEdit(page, "H1");
  await page.locator("#edit-broodPct").fill("150");

  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.locator(".hive-edit")).toContainText("Brood coverage %");
});

test("changing the mite counts in an edit works out mites per 100 again", async ({ page }) => {
  await saveEntry(page, { hive: "H1", yard: "Y2" }, async () => {
    await page.getByLabel("Alcohol wash").check();
    await page.getByPlaceholder("e.g. 300").fill("300");
    await page.getByPlaceholder("e.g. 5").fill("9");
  });
  await openEdit(page, "H1");
  await page.locator("#edit-miteCount").fill("3");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(
    page.locator(".hive-log-detail-row", { hasText: "Mites per 100 Bees" }),
  ).toContainText("1");
});
