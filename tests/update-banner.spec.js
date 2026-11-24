import { test, expect } from "@playwright/test";

// When a newer version of the app has been put online, a banner offers to load
// it, so people are not left on an old copy without knowing.
//
// Runs against the production build (vite preview), where the check is on. The
// service worker is blocked so the test can stand in for the server.
test.use({ baseURL: "http://localhost:4173", serviceWorkers: "block" });

const banner = (page) => page.locator(".hive-update-banner");
const newerPage = (asset) =>
  `<!doctype html><html><head><script type="module" src="${asset}"></script></head><body></body></html>`;

// Answers the app's "is there a newer version?" request.
async function serveVersion(page, asset) {
  await page.route(
    (url) => url.searchParams.has("version-check"),
    (route) => route.fulfill({ contentType: "text/html", body: newerPage(asset) }),
  );
}

// What the page is running now, so "the same version" can be served back.
const runningAsset = (page) =>
  page.evaluate(() => new URL(document.querySelector('script[src*="/assets/"]').src).pathname);

// People come back to the app by switching to it, which is when it checks.
const comeBack = (page) => page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

test("shows nothing when this is the newest version", async ({ page }) => {
  await serveVersion(page, await runningAsset(page));
  await comeBack(page);
  await page.waitForTimeout(500);
  await expect(banner(page)).toHaveCount(0);
});

test("offers an update when a newer version is online", async ({ page }) => {
  await serveVersion(page, "/assets/index-NEWER123.js");
  await comeBack(page);
  await expect(banner(page)).toContainText("A new version of BeeYardLog is ready");
  await expect(banner(page)).toContainText("records stay");
  await expect(banner(page).getByRole("button", { name: "Update now" })).toBeVisible();
});

test("shows nothing when the check cannot reach the server", async ({ page }) => {
  await page.route(
    (url) => url.searchParams.has("version-check"),
    (route) => route.abort(),
  );
  await comeBack(page);
  await page.waitForTimeout(500);
  await expect(banner(page)).toHaveCount(0);
});

test("Update now reloads the page", async ({ page }) => {
  await serveVersion(page, "/assets/index-NEWER123.js");
  await comeBack(page);
  await page.evaluate(() => {
    window.__notReloaded = true;
  });
  await banner(page).getByRole("button", { name: "Update now" }).click();
  await page.waitForFunction(() => window.__notReloaded === undefined);
});

test("a half-filled form is still there after updating", async ({ page }) => {
  await page.getByPlaceholder("e.g. H1").fill("H77");
  await serveVersion(page, "/assets/index-NEWER123.js");
  await comeBack(page);
  await banner(page).getByRole("button", { name: "Update now" }).click();
  await expect(page.getByPlaceholder("e.g. H1")).toHaveValue("H77");
});

test("the banner shows on every view", async ({ page }) => {
  await serveVersion(page, "/assets/index-NEWER123.js");
  await comeBack(page);
  await expect(banner(page)).toBeVisible();
  for (const name of [/^Hives/, "Gear", "Log"]) {
    await page.getByRole("button", { name, exact: typeof name === "string" }).click();
    await expect(banner(page)).toBeVisible();
  }
});

test("the Update now button is big enough to tap", async ({ page }) => {
  await serveVersion(page, "/assets/index-NEWER123.js");
  await comeBack(page);
  const button = banner(page).getByRole("button", { name: "Update now" });
  expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(48);
});
