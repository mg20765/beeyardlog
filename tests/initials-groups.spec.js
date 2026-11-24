import { test, expect } from "@playwright/test";

// Initials say who did an inspection (several people can share a site, each with
// their own hive numbers), and a group puts sites together, such as pollination,
// early sites or late sites. Both are saved on each entry.

// "Today" is fixed so the number of days is the same on every run.
const TODAY = new Date("2026-11-09T12:00:00");

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(TODAY);
  await page.goto("/");
  await expect(page.getByText("No inspections logged yet")).toBeVisible();
});

const initialsBox = (page) => page.locator("#field-initials");
const groupBox = (page) => page.locator("#field-group");
const hivesTab = (page) => page.getByRole("button", { name: /^Hives/ });
const row = (page, text) => page.locator(".hive-status-row", { hasText: text });

async function saveEntry(page, { yard, hive, date = "2026-11-01", initials, group }) {
  await page.getByPlaceholder("e.g. Y2").fill(yard);
  await page.getByPlaceholder("e.g. H1").fill(hive);
  await page.locator("#field-date").fill(date);
  if (initials !== undefined) await initialsBox(page).fill(initials);
  if (group !== undefined) await groupBox(page).fill(group);
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();
  await expect(page.locator(".hive-log-title", { hasText: hive }).first()).toBeVisible();
}

test.describe("initials", () => {
  test("the form has an Initials box, beside Yard # and Hive ID", async ({ page }) => {
    await expect(initialsBox(page)).toBeVisible();
    const yard = await page.getByPlaceholder("e.g. Y2").boundingBox();
    const initials = await initialsBox(page).boundingBox();
    expect(initials.y).toBeGreaterThan(yard.y - 5);
    expect(initials.y).toBeLessThan(yard.y + 400);
  });

  test("are remembered, in capitals, for the next entry and after a reload", async ({ page }) => {
    await saveEntry(page, { yard: "Y1", hive: "H1", initials: "mg" });
    await expect(initialsBox(page)).toHaveValue("MG");

    await page.reload();
    await expect(initialsBox(page)).toHaveValue("MG");
  });

  test("remembered initials alone do not make an unsaved draft", async ({ page }) => {
    await saveEntry(page, { yard: "Y1", hive: "H1", initials: "MG" });
    await page.reload();
    await expect(page.getByText("Restored your unsaved entry")).toHaveCount(0);
  });

  test("show on the log row and in the entry's details", async ({ page }) => {
    await saveEntry(page, { yard: "Y1", hive: "H1", initials: "MG", group: "Pollination" });
    await expect(page.locator(".hive-log-row").first()).toContainText("MG");
    await page.locator(".hive-log-row").first().click();
    const detail = page.locator(".hive-log-detail");
    await expect(detail).toContainText("Initials");
    await expect(detail).toContainText("MG");
    await expect(detail).toContainText("Pollination");
  });

  test("can be searched for in the log", async ({ page }) => {
    for (let i = 1; i <= 6; i++) {
      await saveEntry(page, { yard: "Y1", hive: `H${i}`, initials: i === 3 ? "JB" : "MG" });
    }
    await page.getByRole("searchbox", { name: /search/i }).fill("jb");
    await expect(page.locator(".hive-log-title")).toHaveCount(1);
    await expect(page.locator(".hive-log-title")).toContainText("H3");
  });

  test("keep two people's Hive 7 on the same site as two hives", async ({ page }) => {
    await saveEntry(page, { yard: "Amb", hive: "7", initials: "MG" });
    await saveEntry(page, { yard: "Amb", hive: "7", initials: "JB", date: "2026-10-01" });
    await hivesTab(page).click();
    await expect(page.locator(".hive-status-row")).toHaveCount(2);
    await expect(row(page, "(MG)")).toContainText("Amb · 7");
    await expect(row(page, "(JB)")).toContainText("Amb · 7");
  });

  test("with no initials, hives look exactly as they did", async ({ page }) => {
    await saveEntry(page, { yard: "Amb", hive: "7" });
    await hivesTab(page).click();
    await expect(page.locator(".hive-status-row")).toContainText("Amb · 7");
    await expect(page.locator(".hive-status-row")).not.toContainText("(");
    await expect(page.getByLabel("Whose hives")).toHaveCount(0);
  });

  test("a Whose hives choice narrows the list to one person", async ({ page }) => {
    await saveEntry(page, { yard: "Amb", hive: "1", initials: "MG" });
    await saveEntry(page, { yard: "Amb", hive: "2", initials: "JB" });
    await saveEntry(page, { yard: "Kokako", hive: "3", initials: "MG" });
    await hivesTab(page).click();

    await page.getByLabel("Whose hives").selectOption("MG");
    await expect(page.locator(".hive-status-row")).toHaveCount(2);
    await expect(page.locator(".hive-status-row", { hasText: "(JB)" })).toHaveCount(0);

    await page.getByLabel("Whose hives").selectOption("");
    await expect(page.locator(".hive-status-row")).toHaveCount(3);
  });

  test("initials can be added to an older entry from Edit details", async ({ page }) => {
    await page.locator("#field-initials").fill("");
    await saveEntry(page, { yard: "Amb", hive: "7", initials: "" });
    await page.locator(".hive-log-row").first().click();
    await page.getByRole("button", { name: "Edit details" }).click();
    await page.locator("#edit-initials").fill("jb");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.locator(".hive-log-row").first()).toContainText("JB");
  });
});

test.describe("groups", () => {
  test("the form has a Group box", async ({ page }) => {
    await expect(groupBox(page)).toBeVisible();
  });

  test("suggests the groups already used", async ({ page }) => {
    await saveEntry(page, { yard: "Amb", hive: "1", group: "Pollination" });
    await saveEntry(page, { yard: "Kokako", hive: "1", group: "Early sites" });
    const listId = await groupBox(page).getAttribute("list");
    expect(listId).toBeTruthy();
    const options = await page.locator(`datalist#${listId} option`).evaluateAll((els) => els.map((e) => e.value));
    expect(options).toEqual(["Early sites", "Pollination"]);
  });

  test("fills itself in from the yard's last group", async ({ page }) => {
    await saveEntry(page, { yard: "Amb", hive: "1", group: "Pollination" });
    await page.getByPlaceholder("e.g. Y2").fill("Amb");
    await expect(groupBox(page)).toHaveValue("Pollination");
  });

  test("follows the yard when it changes, and clears for a yard with no group", async ({ page }) => {
    await saveEntry(page, { yard: "Amb", hive: "1", group: "Pollination" });
    await saveEntry(page, { yard: "Kokako", hive: "1", group: "Late sites" });
    await page.getByPlaceholder("e.g. Y2").fill("Amb");
    await expect(groupBox(page)).toHaveValue("Pollination");
    await page.getByPlaceholder("e.g. Y2").fill("Kokako");
    await expect(groupBox(page)).toHaveValue("Late sites");
    await page.getByPlaceholder("e.g. Y2").fill("Wnd");
    await expect(groupBox(page)).toHaveValue("");
  });

  test("a group you typed yourself is not replaced when the yard changes", async ({ page }) => {
    await saveEntry(page, { yard: "Amb", hive: "1", group: "Pollination" });
    await groupBox(page).fill("Orchard");
    await page.getByPlaceholder("e.g. Y2").fill("Amb");
    await expect(groupBox(page)).toHaveValue("Orchard");
  });

  test("a group filled in for you does not make an unsaved draft", async ({ page }) => {
    await saveEntry(page, { yard: "Amb", hive: "1", group: "Pollination" });
    await page.getByPlaceholder("e.g. Y2").fill("Amb");
    await expect(groupBox(page)).toHaveValue("Pollination");
    await page.getByPlaceholder("e.g. Y2").fill("");
    await page.reload();
    await expect(page.getByText("Restored your unsaved entry")).toHaveCount(0);
  });

  test("a Group choice in Hives shows one group at a time", async ({ page }) => {
    await saveEntry(page, { yard: "Amb", hive: "1", group: "Pollination" });
    await saveEntry(page, { yard: "Amb", hive: "2", group: "Pollination" });
    await saveEntry(page, { yard: "Kokako", hive: "1", group: "Late sites" });
    await hivesTab(page).click();
    await expect(page.locator(".hive-status-row")).toHaveCount(3);

    await page.getByLabel("Group").selectOption("Pollination");
    await expect(page.locator(".hive-status-row")).toHaveCount(2);
    await expect(page.locator(".hive-status-row", { hasText: "Kokako" })).toHaveCount(0);
  });

  test("hives in an older entry take the yard's group", async ({ page }) => {
    await saveEntry(page, { yard: "Amb", hive: "1", date: "2026-10-01" });
    await saveEntry(page, { yard: "Amb", hive: "2", date: "2026-10-15", group: "Pollination" });
    await hivesTab(page).click();
    await page.getByLabel("Group").selectOption("Pollination");
    await expect(page.locator(".hive-status-row")).toHaveCount(2);
  });

  test("with no groups there is no Group choice in Hives", async ({ page }) => {
    await saveEntry(page, { yard: "Amb", hive: "1" });
    await hivesTab(page).click();
    await expect(page.getByLabel("Group")).toHaveCount(0);
  });

  test("the group is in the backup file", async ({ page }) => {
    await saveEntry(page, { yard: "Amb", hive: "1", initials: "MG", group: "Pollination" });
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Backup (JSON)" }).click(),
    ]);
    const text = await (await import("node:fs/promises")).readFile(await download.path(), "utf8");
    const entry = JSON.parse(text).inspections[0];
    expect(entry.Group).toBe("Pollination");
    expect(entry.Initials).toBe("MG");
  });
});
