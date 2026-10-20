import { test, expect } from "@playwright/test";

// Chromium decides on its own whether to grant persistent storage, so these
// tests replace navigator.storage with a stub and count the requests.

async function stubStorage(page, { already, grant }) {
  await page.addInitScript(
    (opts) => {
      window.__persistCalls = 0;
      Object.defineProperty(navigator, "storage", {
        configurable: true,
        value: {
          persisted: async () => opts.already,
          persist: async () => {
            window.__persistCalls++;
            return opts.grant;
          },
        },
      });
    },
    { already, grant },
  );
}

async function saveEntry(page, hiveId) {
  await page.getByPlaceholder("e.g. H1").fill(hiveId);
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();
  await expect(
    page.locator(".hive-log-title", { hasText: hiveId }),
  ).toBeVisible();
}

const calls = (page) => page.evaluate(() => window.__persistCalls);

test("asks the browser to protect storage after the first save", async ({ page }) => {
  await stubStorage(page, { already: false, grant: true });
  await page.goto("/");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
  expect(await calls(page)).toBe(0); // nothing to protect yet

  await saveEntry(page, "H1");

  await expect.poll(() => calls(page)).toBe(1);
});

test("asks again on load when entries already exist", async ({ page }) => {
  await stubStorage(page, { already: false, grant: true });
  await page.goto("/");
  await saveEntry(page, "H1");
  await expect.poll(() => calls(page)).toBe(1);

  await page.reload();

  await expect(page.locator(".hive-count-badge")).toHaveText("1");
  await expect.poll(() => calls(page)).toBe(1); // a fresh page, a fresh request
});

test("doesn't ask when storage is already protected", async ({ page }) => {
  await stubStorage(page, { already: true, grant: true });
  await page.goto("/");

  await saveEntry(page, "H1");
  await page.waitForTimeout(300);

  expect(await calls(page)).toBe(0);
});

test("when the browser refuses, saving still works", async ({ page }) => {
  await stubStorage(page, { already: false, grant: false });
  await page.goto("/");

  await saveEntry(page, "H1");

  await expect(page.locator(".hive-count-badge")).toHaveText("1");
});

test("a browser with no storage API doesn't break the app", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "storage", {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto("/");

  await saveEntry(page, "H1");

  await expect(page.locator(".hive-count-badge")).toHaveText("1");
});
