import { test, expect } from "@playwright/test";

// A phone app can stay open overnight. When it comes back into view the next
// morning, the pre-filled date must be today's, not yesterday's.

const date = (page) => page.locator("#field-date");

async function openAt6pmThen(page, nextDayAction) {
  await page.clock.install({ time: new Date(2026, 9, 27, 18, 0, 0) }); // 27 Oct, 6pm
  await page.goto("/");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
  await expect(date(page)).toHaveValue("2026-10-27");
  await nextDayAction?.();
  await page.clock.fastForward("18:00:00"); // now it is noon on the 28th
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
}

test("the pre-filled date moves on to the new day when the app comes back", async ({ page }) => {
  await openAt6pmThen(page);
  await expect(date(page)).toHaveValue("2026-10-28");
});

test("a form someone has started keeps what they typed, and its date", async ({ page }) => {
  await openAt6pmThen(page, async () => {
    await page.getByPlaceholder("e.g. H1").fill("H1");
  });
  await expect(page.getByPlaceholder("e.g. H1")).toHaveValue("H1");
  await expect(date(page)).toHaveValue("2026-10-27");
});

test("a date picked on purpose is not overwritten", async ({ page }) => {
  await openAt6pmThen(page, async () => {
    await date(page).fill("2026-10-15"); // catching up on an earlier inspection
  });
  await expect(date(page)).toHaveValue("2026-10-15");
});

test("a saved entry uses the new day's date, not the old one", async ({ page }) => {
  await openAt6pmThen(page);
  await page.getByPlaceholder("e.g. H1").fill("H1");
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();

  await page.locator(".hive-log-row", { hasText: "H1" }).click();
  await expect(
    page.locator(".hive-log-title", { hasText: "H1" }).locator(".hive-badge"),
  ).toHaveText("2026-10-28");
});
