import { test, expect } from "@playwright/test";

test("header shows the bee emoji next to the BeeYardLog title", async ({ page }) => {
  await page.goto("/");

  const title = page.getByRole("heading", { name: /BeeYardLog/ });
  await expect(title).toBeVisible();
  await expect(title).toContainText("🐝");
  // The emoji replaced the drawn bee image, so no image should be in the header.
  await expect(page.locator(".hive-header img")).toHaveCount(0);
});
