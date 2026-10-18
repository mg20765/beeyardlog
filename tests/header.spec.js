import { test, expect } from "@playwright/test";

test("header shows the Yardbook title with the bee image loaded", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Yardbook" })).toBeVisible();

  const bee = page.locator(".hive-header__bee");
  await expect(bee).toBeVisible();
  // A broken image is "visible" but has no pixels, so check it really loaded.
  const loaded = await bee.evaluate((img) => img.complete && img.naturalWidth > 0);
  expect(loaded).toBe(true);
});
