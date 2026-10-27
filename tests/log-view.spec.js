import { test, expect } from "@playwright/test";

// The log lists newest first, can be searched once it gets long, and flags a
// mite count that has reached the treatment line.

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

const rowFor = (hive, date, extra = {}) => ({
  Date: date,
  "Hive ID": hive,
  "Yard #": "",
  Notes: "",
  ...extra,
});

async function restoreRows(page, rows) {
  await page.locator('input[type="file"]').setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ app: "hive-logbook", inspections: rows })),
  });
  await expect(page.locator(".hive-count-badge")).toHaveText(String(rows.length));
}

// The Hive ID is the title's own text; the date badge inside it is separate.
const titles = (page) =>
  page
    .locator(".hive-log-title")
    .evaluateAll((els) => els.map((e) => e.firstChild.textContent.trim()));
const search = (page) => page.getByRole("searchbox", { name: /search/i });

test("the newest entry is at the top of the log", async ({ page }) => {
  await restoreRows(page, [
    rowFor("OLD", "2026-09-01"),
    rowFor("NEW", "2026-10-20"),
    rowFor("MIDDLE", "2026-10-01"),
  ]);
  const order = await titles(page);
  expect(order).toEqual(["NEW", "MIDDLE", "OLD"]);
});

test("a newly added entry shows at the top and is scrolled into view", async ({ page }) => {
  await restoreRows(page, [rowFor("OLD", "2026-09-01")]);
  await page.getByPlaceholder("e.g. H1").fill("FRESH");
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();

  const first = page.locator(".hive-log-title").first();
  await expect(first).toContainText("FRESH");
  await expect(first).toBeInViewport();
});

test("the search box only appears once the log is long enough to need it", async ({ page }) => {
  await restoreRows(page, Array.from({ length: 5 }, (_, i) => rowFor(`H${i}`, "2026-10-01")));
  await expect(search(page)).toHaveCount(0);

  await page.locator('input[type="file"]').setInputFiles({
    name: "more.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ inspections: [rowFor("H9", "2026-10-02")] })),
  });
  await expect(page.locator(".hive-count-badge")).toHaveText("6");
  await expect(search(page)).toBeVisible();
});

const longLog = () => [
  rowFor("Kokako", "2026-10-13", { "Yard #": "Am", Notes: "Strong colony" }),
  rowFor("Hunst", "2026-09-25", { "Yard #": "1" }),
  rowFor("Moustache", "2026-10-13", { "Yard #": "Amb" }),
  rowFor("Dino", "2026-10-21"),
  rowFor("Tovy", "2026-10-21", { Notes: "Queen cells" }),
  rowFor("Union", "2026-10-24"),
];

test("searching narrows the log and says how many match", async ({ page }) => {
  await restoreRows(page, longLog());

  await search(page).fill("kokako");

  await expect(page.locator(".hive-log-title")).toHaveCount(1);
  await expect(page.getByText("Showing 1 of 6")).toBeVisible();
});

test("searching also looks at the yard, notes and date", async ({ page }) => {
  await restoreRows(page, longLog());

  await search(page).fill("amb");
  await expect(page.locator(".hive-log-title")).toHaveCount(1);
  await search(page).fill("queen");
  await expect(page.locator(".hive-log-title")).toHaveCount(1);
  await search(page).fill("2026-10-21");
  await expect(page.locator(".hive-log-title")).toHaveCount(2);
});

test("clearing the search shows everything again", async ({ page }) => {
  await restoreRows(page, longLog());
  await search(page).fill("kokako");
  await expect(page.locator(".hive-log-title")).toHaveCount(1);

  await search(page).fill("");

  await expect(page.locator(".hive-log-title")).toHaveCount(6);
  await expect(page.getByText(/Showing \d+ of/)).toHaveCount(0);
});

test("a search with no match says so, and the count badge still shows the real total", async ({ page }) => {
  await restoreRows(page, longLog());

  await search(page).fill("zzzz");

  await expect(page.getByText("No entries match")).toBeVisible();
  await expect(page.locator(".hive-count-badge")).toHaveText("6");
});

test("a mite count at or above the line is flagged on the log row", async ({ page }) => {
  await restoreRows(page, [
    rowFor("HIGH", "2026-10-03", { "Mites per 100 Bees": 3 }),
    rowFor("LOW", "2026-10-02", { "Mites per 100 Bees": 1.2 }),
    rowFor("NONE", "2026-10-01"),
  ]);

  await expect(page.locator(".hive-mite-chip")).toHaveCount(2);
  await expect(page.locator(".hive-mite-chip--high")).toHaveCount(1);
  await expect(page.locator(".hive-log-row", { hasText: "HIGH" }).locator(".hive-mite-chip--high")).toContainText("Mites 3 per 100");
  await expect(page.locator(".hive-log-row", { hasText: "LOW" }).locator(".hive-mite-chip")).toContainText("Mites 1.2 per 100");
  await expect(page.locator(".hive-log-row", { hasText: "NONE" }).locator(".hive-mite-chip")).toHaveCount(0);
});

test("a mite check made in the app shows on the row straight away", async ({ page }) => {
  await page.getByPlaceholder("e.g. H1").fill("H1");
  await page.getByPlaceholder("e.g. 300").fill("300");
  await page.getByPlaceholder("e.g. 5").fill("9");
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();

  await expect(page.locator(".hive-mite-chip--high")).toContainText("Mites 3 per 100");
});
