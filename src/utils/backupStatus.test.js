import { describe, it, expect } from "vitest";
import {
  BACKUP_STALE_DAYS,
  backupStatus,
  storageProtection,
  loadLastBackupDate,
  saveLastBackupDate,
} from "./backupStatus.js";

const today = "2026-11-24";

// A tiny stand-in for localStorage, so these run without a browser.
const fakeStorage = (start = {}) => {
  const data = { ...start };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
  };
};

const status = (over = {}) =>
  backupStatus({
    lastBackupDate: null,
    today,
    changesSince: 0,
    hasEntries: true,
    backedUpBefore: false,
    ...over,
  });

describe("backupStatus", () => {
  it("goes quiet when there is nothing to back up", () => {
    expect(status({ hasEntries: false })).toEqual({
      level: "none",
      text: "Nothing to back up yet.",
    });
  });

  it("is red when there are entries and no backup has ever been made", () => {
    const s = status();
    expect(s.level).toBe("alert");
    expect(s.text).toMatch(/no backup yet/i);
    expect(s.text).toMatch(/only on this phone/i);
  });

  it("asks for a new backup when one was made but its date was not recorded", () => {
    const s = status({ backedUpBefore: true });
    expect(s.level).toBe("warn");
    expect(s.text).toMatch(/date isn't recorded/i);
  });

  it("is green for a backup made today, yesterday or a few days ago", () => {
    expect(status({ lastBackupDate: "2026-11-24" })).toEqual({
      level: "ok",
      text: "Last backup: today",
    });
    expect(status({ lastBackupDate: "2026-11-23" }).text).toBe("Last backup: yesterday");
    expect(status({ lastBackupDate: "2026-11-20" })).toEqual({
      level: "ok",
      text: "Last backup: 4 days ago",
    });
  });

  it("turns red at 7 days, and not before", () => {
    expect(BACKUP_STALE_DAYS).toBe(7);
    expect(status({ lastBackupDate: "2026-11-18" }).level).toBe("ok"); // 6 days
    const stale = status({ lastBackupDate: "2026-11-17" }); // 7 days
    expect(stale.level).toBe("alert");
    expect(stale.text).toBe("Last backup: 7 days ago. Save a new one.");
  });

  it("is amber when there are changes not in the backup", () => {
    const one = status({ lastBackupDate: "2026-11-24", changesSince: 1 });
    expect(one.level).toBe("warn");
    expect(one.text).toBe("Last backup: today · 1 change not backed up yet");
    expect(status({ lastBackupDate: "2026-11-23", changesSince: 5 }).text).toBe(
      "Last backup: yesterday · 5 changes not backed up yet",
    );
  });

  it("stays red when the backup is old, even with changes waiting", () => {
    const s = status({ lastBackupDate: "2026-11-01", changesSince: 3 });
    expect(s.level).toBe("alert");
    expect(s.text).toMatch(/23 days ago/);
  });

  it("treats a backup dated in the future as today", () => {
    expect(status({ lastBackupDate: "2026-12-30" }).text).toBe("Last backup: today");
  });
});

describe("storageProtection", () => {
  it("says on when the phone has agreed to keep the data", async () => {
    expect(await storageProtection({ persisted: async () => true })).toBe("on");
  });

  it("says off when it has not", async () => {
    expect(await storageProtection({ persisted: async () => false })).toBe("off");
  });

  it("says unknown when the browser cannot say", async () => {
    expect(await storageProtection(undefined)).toBe("unknown");
    expect(await storageProtection({})).toBe("unknown");
    expect(
      await storageProtection({
        persisted: async () => {
          throw new Error("no");
        },
      }),
    ).toBe("unknown");
  });
});

describe("the saved backup date", () => {
  it("remembers a date", () => {
    const store = fakeStorage();
    saveLastBackupDate("2026-11-24", store);
    expect(loadLastBackupDate(store)).toBe("2026-11-24");
  });

  it("starts empty, and ignores anything that is not a real date", () => {
    expect(loadLastBackupDate(fakeStorage())).toBeNull();
    expect(loadLastBackupDate(fakeStorage({ hive_last_backup_date: "yesterday" }))).toBeNull();
    expect(loadLastBackupDate(fakeStorage({ hive_last_backup_date: "2026-13-45" }))).toBeNull();
  });

  it("falls back to empty when storage is blocked", () => {
    const blocked = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    };
    expect(loadLastBackupDate(blocked)).toBeNull();
    expect(() => saveLastBackupDate("2026-11-24", blocked)).not.toThrow();
  });
});
