import { describe, it, expect } from "vitest";
import {
  daysBetween,
  hiveStatuses,
  overdueCount,
  loadLimitDays,
  saveLimitDays,
  LIMIT_CHOICES_DAYS,
  hiveKey,
  toggleUntracked,
  loadUntracked,
  saveUntracked,
  dueOnly,
  loadOnlyDue,
  saveOnlyDue,
} from "./hiveStatus.js";

const row = (yard, hive, date, id = 1) => ({
  id,
  "Yard #": yard,
  "Hive ID": hive,
  Date: date,
});

describe("daysBetween", () => {
  it("counts whole calendar days", () => {
    expect(daysBetween("2026-10-01", "2026-10-29")).toBe(28);
    expect(daysBetween("2026-10-29", "2026-10-29")).toBe(0);
  });

  it("crosses month and year ends", () => {
    expect(daysBetween("2026-12-30", "2027-01-02")).toBe(3);
  });

  it("is not thrown off by daylight saving changes", () => {
    // New Zealand's clocks go forward on the last Sunday of September.
    expect(daysBetween("2026-09-26", "2026-09-28")).toBe(2);
  });
});

describe("hiveStatuses", () => {
  const today = "2026-11-09";

  it("gives one line per hive using its latest inspection", () => {
    const log = [
      row("1", "A1", "2026-09-01", 1),
      row("1", "A1", "2026-10-30", 2),
      row("1", "A2", "2026-10-01", 3),
    ];
    const list = hiveStatuses(log, today);
    expect(list).toHaveLength(2);
    const a1 = list.find((h) => h.hiveId === "A1");
    expect(a1.lastDate).toBe("2026-10-30");
    expect(a1.daysSince).toBe(10);
  });

  it("treats the same Hive ID in two yards as two hives", () => {
    const log = [row("1", "A1", "2026-11-01"), row("2", "A1", "2026-08-01")];
    const list = hiveStatuses(log, today);
    expect(list).toHaveLength(2);
    expect(list.map((h) => h.yard).sort()).toEqual(["1", "2"]);
  });

  it("ignores capitals and stray spaces when matching a hive", () => {
    const log = [row("Amb", "hive 7", "2026-10-20"), row(" amb ", " HIVE 7", "2026-11-05")];
    const list = hiveStatuses(log, today);
    expect(list).toHaveLength(1);
    expect(list[0].lastDate).toBe("2026-11-05");
  });

  it("marks a hive overdue at 28 days and not before", () => {
    const log = [
      row("1", "on-the-line", "2026-10-12"), // 28 days
      row("1", "just-ok", "2026-10-13"), // 27 days
    ];
    const list = hiveStatuses(log, today);
    expect(list.find((h) => h.hiveId === "on-the-line").overdue).toBe(true);
    expect(list.find((h) => h.hiveId === "just-ok").overdue).toBe(false);
  });

  it("uses the limit it is given", () => {
    const log = [row("1", "A1", "2026-10-26")]; // 14 days
    expect(hiveStatuses(log, today, 28)[0].overdue).toBe(false);
    expect(hiveStatuses(log, today, 14)[0].overdue).toBe(true);
  });

  it("lists the longest unchecked hives first", () => {
    const log = [
      row("1", "recent", "2026-11-08"),
      row("1", "oldest", "2026-08-01"),
      row("1", "middle", "2026-10-01"),
    ];
    expect(hiveStatuses(log, today).map((h) => h.hiveId)).toEqual([
      "oldest",
      "middle",
      "recent",
    ]);
  });

  it("skips entries with no hive name or no usable date", () => {
    const log = [
      row("1", "", "2026-10-01"),
      row("1", "A1", ""),
      row("1", "A2", "not a date"),
      row("1", "A3", "2026-10-01"),
    ];
    expect(hiveStatuses(log, today).map((h) => h.hiveId)).toEqual(["A3"]);
  });

  it("does not call a hive overdue for a date in the future", () => {
    const list = hiveStatuses([row("1", "A1", "2026-12-01")], today);
    expect(list[0].daysSince).toBe(0);
    expect(list[0].overdue).toBe(false);
  });

  it("returns an empty list for an empty log", () => {
    expect(hiveStatuses([], today)).toEqual([]);
  });
});

describe("overdueCount", () => {
  it("counts the hives past the limit", () => {
    const log = [
      row("1", "A1", "2026-08-01"),
      row("1", "A2", "2026-09-01"),
      row("1", "A3", "2026-11-08"),
    ];
    expect(overdueCount(hiveStatuses(log, "2026-11-09"))).toBe(2);
  });
});

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

describe("the saved limit", () => {
  it("offers 2, 3, 4 and 6 weeks", () => {
    expect(LIMIT_CHOICES_DAYS).toEqual([14, 21, 28, 42]);
  });

  it("starts at 4 weeks when nothing is saved", () => {
    expect(loadLimitDays(fakeStorage())).toBe(28);
  });

  it("remembers a choice", () => {
    const store = fakeStorage();
    saveLimitDays(14, store);
    expect(loadLimitDays(store)).toBe(14);
  });

  it("ignores a saved value that is not one of the choices", () => {
    expect(loadLimitDays(fakeStorage({ "hive-limit-days": "9999" }))).toBe(28);
    expect(loadLimitDays(fakeStorage({ "hive-limit-days": "abc" }))).toBe(28);
  });

  it("falls back to 4 weeks when storage is blocked", () => {
    const blocked = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    };
    expect(loadLimitDays(blocked)).toBe(28);
    expect(() => saveLimitDays(14, blocked)).not.toThrow();
  });
});

describe("hiveKey", () => {
  it("ignores capitals and stray spaces, and keeps yard and hive apart", () => {
    expect(hiveKey(" Amb ", "DINO")).toBe(hiveKey("amb", "dino"));
    expect(hiveKey("1", "Wnd")).not.toBe(hiveKey("Wnd", "1"));
  });
});

describe("hives you have chosen not to track (call-outs)", () => {
  const today = "2026-11-09";
  const log = [
    row("1", "Topito rd", "2026-09-01", 1), // a call-out, long ago
    row("Amb", "Dino", "2026-09-01", 2),
    row("Amb", "Tovy", "2026-11-08", 3),
  ];
  const untracked = [hiveKey("1", "Topito rd")];

  it("marks an untracked hive and never calls it overdue", () => {
    const list = hiveStatuses(log, today, 28, untracked);
    const topito = list.find((h) => h.hiveId === "Topito rd");
    expect(topito.tracked).toBe(false);
    expect(topito.overdue).toBe(false);
    expect(list.find((h) => h.hiveId === "Dino").tracked).toBe(true);
  });

  it("leaves it out of the overdue count", () => {
    expect(overdueCount(hiveStatuses(log, today, 28, []))).toBe(2);
    expect(overdueCount(hiveStatuses(log, today, 28, untracked))).toBe(1);
  });

  it("lists tracked hives first and untracked ones last", () => {
    const names = hiveStatuses(log, today, 28, untracked).map((h) => h.hiveId);
    expect(names).toEqual(["Dino", "Tovy", "Topito rd"]);
  });

  it("gives every hive its key", () => {
    expect(hiveStatuses(log, today)[0].key).toMatch(/\|/);
  });

  it("works the same with no list given", () => {
    expect(hiveStatuses(log, today).every((h) => h.tracked)).toBe(true);
  });
});

describe("toggleUntracked", () => {
  it("adds a hive, then takes it off again", () => {
    const key = hiveKey("1", "Topito rd");
    const added = toggleUntracked([], key);
    expect(added).toEqual([key]);
    expect(toggleUntracked(added, key)).toEqual([]);
  });

  it("does not change the list it was given", () => {
    const list = [];
    toggleUntracked(list, "x|y");
    expect(list).toEqual([]);
  });
});

describe("saving the untracked list", () => {
  it("remembers it", () => {
    const store = fakeStorage();
    saveUntracked(["1|topito rd"], store);
    expect(loadUntracked(store)).toEqual(["1|topito rd"]);
  });

  it("starts empty, and ignores damaged text or things that are not names", () => {
    expect(loadUntracked(fakeStorage())).toEqual([]);
    expect(loadUntracked(fakeStorage({ "hive-untracked": "{nope" }))).toEqual([]);
    expect(loadUntracked(fakeStorage({ "hive-untracked": '[1,"a|b",null]' }))).toEqual(["a|b"]);
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
    expect(loadUntracked(blocked)).toEqual([]);
    expect(() => saveUntracked(["a|b"], blocked)).not.toThrow();
  });
});

describe("showing only the hives that are due", () => {
  const today = "2026-11-09";
  const log = [
    row("1", "Old", "2026-09-01", 1),
    row("1", "Fresh", "2026-11-08", 2),
    row("1", "Call-out", "2026-09-01", 3),
  ];

  it("keeps only the overdue hives", () => {
    const list = hiveStatuses(log, today, 28, []);
    expect(dueOnly(list).map((h) => h.hiveId).sort()).toEqual(["Call-out", "Old"]);
  });

  it("leaves out hives set aside as call-outs or on hold", () => {
    const list = hiveStatuses(log, today, 28, [hiveKey("1", "Call-out")]);
    expect(dueOnly(list).map((h) => h.hiveId)).toEqual(["Old"]);
  });

  it("is empty when nothing is due", () => {
    expect(dueOnly(hiveStatuses([row("1", "Fresh", "2026-11-08")], today))).toEqual([]);
  });

  it("does not change the list it was given", () => {
    const list = hiveStatuses(log, today);
    dueOnly(list);
    expect(list).toHaveLength(3);
  });
});

describe("remembering the only-due choice", () => {
  it("remembers on and off", () => {
    const store = fakeStorage();
    expect(loadOnlyDue(store)).toBe(false);
    saveOnlyDue(true, store);
    expect(loadOnlyDue(store)).toBe(true);
    saveOnlyDue(false, store);
    expect(loadOnlyDue(store)).toBe(false);
  });

  it("starts off, and falls back to off when storage is blocked", () => {
    const blocked = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    };
    expect(loadOnlyDue(blocked)).toBe(false);
    expect(() => saveOnlyDue(true, blocked)).not.toThrow();
  });
});
