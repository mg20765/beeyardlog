import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

// The installed app and a browser tab are two copies of the same log. They
// must not drift apart, or one can make an incomplete backup or bring back an
// entry that was deleted in the other.

const badge = (p) => p.locator(".hive-count-badge");

async function addEntry(page, hive) {
  await page.getByPlaceholder("e.g. H1").fill(hive);
  await page.getByRole("button", { name: "+ Add to log" }).click();
  await page.getByRole("button", { name: "Add anyway" }).click();
  await expect(page.locator(".hive-log-title", { hasText: hive })).toBeVisible();
}

const stored = (page) =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        const open = indexedDB.open("hive-logbook-db");
        open.onsuccess = () => {
          const all = open.result.transaction("inspections").objectStore("inspections").getAll();
          all.onsuccess = () => resolve(all.result.map((r) => r["Hive ID"]));
        };
      }),
  );

async function twoCopies(context, { copy2WithoutSync = false } = {}) {
  const p1 = await context.newPage();
  await p1.goto("/");
  await expect(p1.getByText("No inspections logged yet")).toBeVisible();
  const p2 = await context.newPage();
  if (copy2WithoutSync) {
    await p2.addInitScript(() => {
      delete window.BroadcastChannel;
    });
  }
  await p2.goto("/");
  await expect(p2.getByText("No inspections logged yet")).toBeVisible();
  return [p1, p2];
}

test("an entry added in one open copy appears in the other without reloading", async ({ context }) => {
  const [p1, p2] = await twoCopies(context);

  await addEntry(p1, "H1");

  await expect(badge(p2)).toHaveText("1");
  await expect(p2.locator(".hive-log-title", { hasText: "H1" })).toBeVisible();
});

test("deleting in one copy removes it from the other", async ({ context }) => {
  const [p1, p2] = await twoCopies(context);
  await addEntry(p1, "H1");
  await expect(badge(p2)).toHaveText("1");

  await p1.getByRole("button", { name: "Delete", exact: true }).click();
  await p1.getByRole("button", { name: "Yes, delete" }).click();

  await expect(badge(p2)).toHaveText("0");
});

test("a backup made in the second copy includes entries added in the first", async ({ context }) => {
  const [p1, p2] = await twoCopies(context);
  await addEntry(p1, "H1");
  await addEntry(p2, "H2"); // would be the only entry if copy 2 never heard about H1

  const [download] = await Promise.all([
    p2.waitForEvent("download"),
    p2.getByRole("button", { name: "Backup (JSON)" }).click(),
  ]);
  const backup = JSON.parse(readFileSync(await download.path(), "utf8"));

  expect(backup.inspections.map((r) => r["Hive ID"]).sort()).toEqual(["H1", "H2"]);
});

test("coming back to the app refreshes the log, even if the other copy couldn't tell it", async ({ context }) => {
  const [p1, p2] = await twoCopies(context, { copy2WithoutSync: true });

  await addEntry(p1, "H1");
  await expect(badge(p2)).toHaveText("0"); // no live updates in this copy

  await p2.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));

  await expect(badge(p2)).toHaveText("1");
});

test("a deleted entry can't be brought back by editing it in a copy that missed the news", async ({ context }) => {
  const p1 = await context.newPage();
  await p1.goto("/");
  await addEntry(p1, "H1");

  const p2 = await context.newPage();
  await p2.addInitScript(() => {
    delete window.BroadcastChannel;
  });
  await p2.goto("/");
  await expect(p2.locator(".hive-log-title", { hasText: "H1" })).toBeVisible();

  await p1.getByRole("button", { name: "Delete", exact: true }).click();
  await p1.getByRole("button", { name: "Yes, delete" }).click();
  await expect(p1.getByText("No inspections logged yet")).toBeVisible();

  await p2.locator(".hive-log-row", { hasText: "H1" }).click();
  await p2.getByRole("button", { name: "Edit details" }).click();
  await p2.locator("#edit-yardNo").fill("Y9");
  await p2.getByRole("button", { name: "Save changes" }).click();

  // The entry leaves the list, and a message says why (it can't stay in the
  // edit panel, because that goes away with the entry).
  await expect(p2.getByText(/deleted in another window/)).toBeVisible();
  await expect(badge(p2)).toHaveText("0");
  expect(await stored(p1)).toEqual([]); // still gone
});
