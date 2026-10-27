import { describe, it, expect } from "vitest";
import {
  maxId,
  entriesSinceBackup,
  watermarkFromLegacyCount,
  watermarkAfterRestore,
} from "./backupReminder.js";

const rows = (...ids) => ids.map((id) => ({ id }));

describe("maxId", () => {
  it("returns the highest id, or 0 for an empty log", () => {
    expect(maxId(rows(3, 9, 5))).toBe(9);
    expect(maxId([])).toBe(0);
  });
});

describe("entriesSinceBackup", () => {
  it("counts every entry when nothing has been backed up yet", () => {
    expect(entriesSinceBackup(rows(1, 2, 3), 0)).toBe(3);
  });

  it("counts only entries added after the backup", () => {
    expect(entriesSinceBackup(rows(1, 2, 3, 4, 5), 3)).toBe(2);
  });

  it("is not thrown off by deleting entries that were already backed up", () => {
    // Backed up at 20 entries (ids 1-20), then deleted 15 of them and added
    // 10 new ones. The log is now 15 long, so the old "length minus count at
    // last backup" formula gave 15 - 20 = 0 and never reminded. Ten entries
    // really are unbacked.
    const log = [...rows(16, 17, 18, 19, 20), ...rows(21, 22, 23, 24, 25, 26, 27, 28, 29, 30)];
    expect(entriesSinceBackup(log, 20)).toBe(10);
  });

  it("drops the count when an unbacked entry is deleted", () => {
    expect(entriesSinceBackup(rows(1, 2, 4), 2)).toBe(1);
  });

  it("is 0 for an empty log", () => {
    expect(entriesSinceBackup([], 5)).toBe(0);
  });
});

describe("watermarkFromLegacyCount", () => {
  it("maps the old 'entries at last backup' count to the id of that entry", () => {
    expect(watermarkFromLegacyCount(rows(1, 2, 3, 4, 5), 3)).toBe(3);
  });

  it("works when ids have gaps and arrive out of order", () => {
    expect(watermarkFromLegacyCount(rows(9, 2, 5, 7), 2)).toBe(5);
  });

  it("falls back to the newest id when the old count exceeds the log", () => {
    expect(watermarkFromLegacyCount(rows(1, 2), 10)).toBe(2);
  });

  it("is 0 when there was no backup or the log is empty", () => {
    expect(watermarkFromLegacyCount(rows(1, 2), 0)).toBe(0);
    expect(watermarkFromLegacyCount([], 5)).toBe(0);
  });
});

describe("watermarkAfterRestore", () => {
  it("treats restored entries as backed up when everything was backed up before", () => {
    const before = rows(1, 2, 3);
    const after = rows(1, 2, 3, 4, 5);
    expect(watermarkAfterRestore(before, 3, after)).toBe(5);
    expect(entriesSinceBackup(after, 5)).toBe(0);
  });

  it("keeps the old watermark when there were unbacked entries, so they still get a reminder", () => {
    const before = rows(1, 2, 3, 4);
    const after = rows(1, 2, 3, 4, 5, 6);
    expect(watermarkAfterRestore(before, 2, after)).toBe(2);
  });

  it("works for a restore into an empty log", () => {
    expect(watermarkAfterRestore([], 0, rows(1, 2))).toBe(2);
  });
});

import { changesSinceBackup } from "./backupReminder.js";

describe("changesSinceBackup", () => {
  it("adds corrected entries to new ones, because the backup file holds the old version", () => {
    expect(changesSinceBackup(rows(1, 2, 3, 4), 2, 0)).toBe(2);
    expect(changesSinceBackup(rows(1, 2, 3, 4), 2, 3)).toBe(5);
  });

  it("counts corrections even when nothing new was added", () => {
    expect(changesSinceBackup(rows(1, 2), 2, 4)).toBe(4);
  });

  it("is 0 when everything is backed up and nothing was corrected", () => {
    expect(changesSinceBackup(rows(1, 2), 2, 0)).toBe(0);
  });

  it("ignores a missing, negative or non-number corrections value", () => {
    expect(changesSinceBackup(rows(1, 2, 3), 1)).toBe(2);
    expect(changesSinceBackup(rows(1, 2, 3), 1, -5)).toBe(2);
    expect(changesSinceBackup(rows(1, 2, 3), 1, "x")).toBe(2);
  });
});
