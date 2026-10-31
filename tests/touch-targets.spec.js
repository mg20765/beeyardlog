import { test, expect } from "@playwright/test";

// Controls must be big enough for a gloved finger. These measure the real page
// at phone width, so a style change that shrinks a control fails here.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

const sizesOf = (page, selector) =>
  page.locator(selector).evaluateAll((els) =>
    els
      .filter((e) => e.offsetParent !== null)
      .map((e) => {
        const r = e.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      }),
  );

const smallest = (sizes, key) => Math.min(...sizes.map((s) => s[key]));

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

test("checkbox rows are at least 48px tall, with a tick box of at least 26px", async ({ page }) => {
  const rows = await sizesOf(page, ".hive-chk-item");
  expect(rows.length).toBeGreaterThan(5);
  expect(smallest(rows, "h")).toBeGreaterThanOrEqual(48);

  const ticks = await sizesOf(page, ".hive-chk-item input[type=checkbox]");
  expect(smallest(ticks, "w")).toBeGreaterThanOrEqual(26);
  expect(smallest(ticks, "h")).toBeGreaterThanOrEqual(26);
});

test("round choices are at least 48px tall, with a circle of at least 26px", async ({ page }) => {
  const rows = await sizesOf(page, ".hive-radio-item");
  expect(rows.length).toBeGreaterThan(10);
  expect(smallest(rows, "h")).toBeGreaterThanOrEqual(48);

  const circles = await sizesOf(page, ".hive-radio-item input[type=radio]");
  expect(smallest(circles, "w")).toBeGreaterThanOrEqual(26);
  expect(smallest(circles, "h")).toBeGreaterThanOrEqual(26);
});

test("High / Average / Low buttons are at least 48px tall", async ({ page }) => {
  const buttons = await sizesOf(page, ".hive-lvl-btn");
  expect(buttons.length).toBe(6);
  expect(smallest(buttons, "h")).toBeGreaterThanOrEqual(48);
});

test("number, text and date boxes are at least 46px tall", async ({ page }) => {
  const boxes = await sizesOf(page, ".hive-input");
  expect(boxes.length).toBeGreaterThan(8);
  expect(smallest(boxes, "h")).toBeGreaterThanOrEqual(46);
});

test("the main buttons are at least 48px tall", async ({ page }) => {
  const buttons = await sizesOf(
    page,
    ".hive-btn-add, .hive-btn-export, .hive-btn-outline, .hive-btn-clear",
  );
  expect(buttons.length).toBeGreaterThan(3);
  expect(smallest(buttons, "h")).toBeGreaterThanOrEqual(48);
});

test("the delete ✕ in the log is at least 48 x 48px", async ({ page }) => {
  await page.getByPlaceholder("e.g. H1").fill("H1");
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();
  await expect(page.locator(".hive-del-btn")).toBeVisible();

  const [x] = await sizesOf(page, ".hive-del-btn");
  expect(x.w).toBeGreaterThanOrEqual(48);
  expect(x.h).toBeGreaterThanOrEqual(48);
});

test("the bigger controls don't push the page sideways", async ({ page }) => {
  for (const width of [360, 390, 412]) {
    await page.setViewportSize({ width, height: 844 });
    const sideways = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(sideways, `sideways scroll at ${width}px wide`).toBe(false);
  }
});

test("Calm / Nervous / Aggressive stay on one line", async ({ page }) => {
  const tops = await page
    .locator("#hive-field-temperament .hive-radio-item")
    .evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  expect(tops).toHaveLength(3);
  expect(new Set(tops).size).toBe(1);
});

// ── Tablets ──────────────────────────────────────────────────────────────────
// A big touch screen gets the bigger sizing the tablet tester preferred. Phones
// (even turned sideways), small tablets and a desktop with a mouse keep the
// medium sizing above.

async function measureControls(page) {
  const rows = [
    ...(await sizesOf(page, ".hive-chk-item")),
    ...(await sizesOf(page, ".hive-radio-item")),
  ];
  const ticks = [
    ...(await sizesOf(page, ".hive-chk-item input[type=checkbox]")),
    ...(await sizesOf(page, ".hive-radio-item input[type=radio]")),
  ];
  const inputs = await sizesOf(page, ".hive-input");
  const levels = await sizesOf(page, ".hive-lvl-btn");
  const buttons = await sizesOf(
    page,
    ".hive-btn-add, .hive-btn-export, .hive-btn-outline, .hive-btn-clear",
  );
  return {
    row: smallest(rows, "h"),
    tick: Math.min(smallest(ticks, "w"), smallest(ticks, "h")),
    input: smallest(inputs, "h"),
    level: smallest(levels, "h"),
    button: smallest(buttons, "h"),
  };
}

const BIG_SCREENS = [
  { name: "tablet upright", width: 800, height: 1280 },
  { name: "tablet sideways", width: 1280, height: 800 },
];

for (const screen of BIG_SCREENS) {
  test.describe(`${screen.name} (${screen.width} x ${screen.height}, touch)`, () => {
    test.use({
      viewport: { width: screen.width, height: screen.height },
      hasTouch: true,
      isMobile: true,
    });

    test("every control uses the bigger tablet size", async ({ page }) => {
      const m = await measureControls(page);
      expect(m.row).toBeGreaterThanOrEqual(60);
      expect(m.tick).toBeGreaterThanOrEqual(32);
      expect(m.input).toBeGreaterThanOrEqual(54);
      expect(m.level).toBeGreaterThanOrEqual(60);
      expect(m.button).toBeGreaterThanOrEqual(60);
    });

    test("the delete ✕ in the log is at least 60 x 60px", async ({ page }) => {
      await page.getByPlaceholder("e.g. H1").fill("H1");
      await page.getByRole("button", { name: "+ Add to log" }).click();
      await page.getByRole("button", { name: "Add anyway" }).click();
      await expect(page.locator(".hive-del-btn")).toBeVisible();
      const [x] = await sizesOf(page, ".hive-del-btn");
      expect(x.w).toBeGreaterThanOrEqual(60);
      expect(x.h).toBeGreaterThanOrEqual(60);
    });

    test("the lines in the Please check box are easy to tap", async ({ page }) => {
      await page.getByPlaceholder("e.g. H1").fill("H1");
      await page.getByPlaceholder("e.g. 18").fill("99");
      await page.getByRole("button", { name: "+ Add to log" }).click();
      const links = await sizesOf(page, ".hive-problem-link");
      expect(links.length).toBeGreaterThan(0);
      expect(smallest(links, "h")).toBeGreaterThanOrEqual(52);
    });
  });
}

test.describe("tablet widths don't push the page sideways", () => {
  test.use({ viewport: { width: 800, height: 1280 }, hasTouch: true, isMobile: true });
  test("at 768, 800, 1024 and 1280 wide", async ({ page }) => {
    for (const [width, height] of [[768, 1024], [800, 1280], [1024, 768], [1280, 800]]) {
      await page.setViewportSize({ width, height });
      const sideways = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(sideways, `sideways scroll at ${width}px wide`).toBe(false);
    }
  });
});

const MEDIUM_SCREENS = [
  { name: "phone upright", width: 390, height: 844, touch: true },
  { name: "phone sideways", width: 844, height: 390, touch: true },
  { name: "small tablet", width: 600, height: 960, touch: true },
  { name: "desktop with a mouse", width: 1280, height: 800, touch: false },
];

for (const screen of MEDIUM_SCREENS) {
  test.describe(`${screen.name} keeps the medium size (${screen.width} x ${screen.height})`, () => {
    test.use({
      viewport: { width: screen.width, height: screen.height },
      hasTouch: screen.touch,
      isMobile: screen.touch,
    });

    test("controls stay at the medium size", async ({ page }) => {
      const m = await measureControls(page);
      expect(m.row).toBeGreaterThanOrEqual(48);
      expect(m.row).toBeLessThan(56);
      expect(m.tick).toBeLessThan(30);
      expect(m.input).toBeLessThan(50);
      expect(m.level).toBeLessThan(56);
      expect(m.button).toBeLessThan(56);
    });
  });
}
