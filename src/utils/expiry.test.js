import { describe, it, expect } from "vitest";
import {
  EXPIRY_WARN_DAYS,
  emptyExpiry,
  setHasEpipen,
  setDate,
  addItem,
  removeItem,
  expiryStatus,
  statuses,
  warnings,
  expiryText,
  loadExpiry,
  saveExpiry,
} from "./expiry.js";

const today = "2026-11-09";

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

const withEpipen = () => setHasEpipen(emptyExpiry(), true);

describe("the starting list", () => {
  it("is empty, because not everyone carries an EpiPen", () => {
    const state = emptyExpiry();
    expect(state.epipen).toEqual({ has: false, date: "" });
    expect(state.items).toEqual([]);
    expect(statuses(state, today)).toEqual([]);
  });

  it("warns 30 days ahead", () => {
    expect(EXPIRY_WARN_DAYS).toBe(30);
  });
});

describe("expiryStatus", () => {
  const at = (date) => expiryStatus({ id: "x", label: "X", date }, today);

  it("is unset when there is no date", () => {
    expect(at("").status).toBe("unset");
  });

  it("is expired the day after the date, not on it", () => {
    expect(at("2026-11-08")).toEqual({ status: "expired", days: -1 });
    expect(at("2026-11-09")).toEqual({ status: "soon", days: 0 });
  });

  it("is soon up to 30 days ahead, and ok after that", () => {
    expect(at("2026-12-09")).toEqual({ status: "soon", days: 30 });
    expect(at("2026-12-10")).toEqual({ status: "ok", days: 31 });
  });

  it("treats an unreadable date as unset", () => {
    expect(at("soon").status).toBe("unset");
  });
});

describe("carrying an EpiPen", () => {
  it("shows the EpiPen only when you say you carry one", () => {
    const off = emptyExpiry();
    const on = setHasEpipen(off, true);
    expect(statuses(off, today).map((i) => i.label)).toEqual([]);
    expect(statuses(on, today).map((i) => i.label)).toEqual(["EpiPen"]);
    expect(statuses(on, today)[0].status).toBe("unset");
  });

  it("keeps the date if you switch it off and on again", () => {
    let state = setDate(withEpipen(), "epipen", "2027-03-01");
    state = setHasEpipen(setHasEpipen(state, false), true);
    expect(state.epipen.date).toBe("2027-03-01");
  });

  it("gives no warning for an EpiPen you do not carry, even with an old date", () => {
    let state = setDate(emptyExpiry(), "epipen", "2020-01-01");
    expect(warnings(statuses(state, today))).toEqual([]);
    state = setHasEpipen(state, true);
    expect(warnings(statuses(state, today)).map((i) => i.label)).toEqual(["EpiPen"]);
  });
});

describe("setDate", () => {
  it("sets a valid date", () => {
    expect(setDate(withEpipen(), "epipen", "2027-03-01").epipen.date).toBe("2027-03-01");
  });

  it("sets a date on one of your own items", () => {
    let state = addItem(emptyExpiry(), "Apivar strips", "");
    state = setDate(state, state.items[0].id, "2027-01-31");
    expect(state.items[0].date).toBe("2027-01-31");
  });

  it("ignores a date that is not a real day", () => {
    expect(setDate(withEpipen(), "epipen", "2027-13-45").epipen.date).toBe("");
    expect(setDate(withEpipen(), "epipen", "2027-02-30").epipen.date).toBe("");
  });

  it("clears a date when given an empty one", () => {
    let state = setDate(withEpipen(), "epipen", "2027-03-01");
    state = setDate(state, "epipen", "");
    expect(state.epipen.date).toBe("");
  });

  it("does not change the state it was given", () => {
    const state = withEpipen();
    setDate(state, "epipen", "2027-03-01");
    expect(state.epipen.date).toBe("");
  });
});

describe("your own items", () => {
  it("adds an item with a date", () => {
    const state = addItem(emptyExpiry(), "Apivar strips", "2027-01-31");
    expect(state.items.map((i) => i.label)).toEqual(["Apivar strips"]);
    expect(state.items[0].date).toBe("2027-01-31");
  });

  it("trims the name, ignores blanks and keeps names short", () => {
    expect(addItem(emptyExpiry(), "   ", "").items).toHaveLength(0);
    expect(addItem(emptyExpiry(), "  Oxalic  ", "").items[0].label).toBe("Oxalic");
    expect(addItem(emptyExpiry(), "x".repeat(200), "").items[0].label.length).toBeLessThanOrEqual(40);
  });

  it("will not add the same name twice, or the EpiPen by hand", () => {
    let state = addItem(emptyExpiry(), "Apivar strips", "");
    state = addItem(state, "apivar STRIPS", "");
    state = addItem(state, "epipen", "");
    expect(state.items).toHaveLength(1);
  });

  it("removes your own item", () => {
    let state = addItem(emptyExpiry(), "Apivar strips", "");
    state = removeItem(state, state.items[0].id);
    expect(state.items).toEqual([]);
  });

  it("leaves the EpiPen choice alone when removing", () => {
    const state = withEpipen();
    expect(removeItem(state, "epipen")).toEqual(state);
  });
});

describe("statuses and warnings", () => {
  const build = () => {
    let s = setDate(withEpipen(), "epipen", "2026-11-20"); // soon
    s = addItem(s, "Old strips", "2026-10-01"); // expired
    s = addItem(s, "Fresh strips", "2027-06-01"); // ok
    s = addItem(s, "No date yet", "");
    return s;
  };

  it("lists the most urgent first, and unset last", () => {
    expect(statuses(build(), today).map((i) => i.label)).toEqual([
      "Old strips",
      "EpiPen",
      "Fresh strips",
      "No date yet",
    ]);
  });

  it("warns about expired and soon, not ok or unset", () => {
    const w = warnings(statuses(build(), today));
    expect(w.map((i) => i.label)).toEqual(["Old strips", "EpiPen"]);
  });

  it("has no warnings when everything is fine", () => {
    const s = setDate(withEpipen(), "epipen", "2027-06-01");
    expect(warnings(statuses(s, today))).toEqual([]);
  });
});

describe("expiryText", () => {
  it("says it in plain words", () => {
    expect(expiryText({ status: "expired", days: -8 })).toBe("expired 8 days ago");
    expect(expiryText({ status: "expired", days: -1 })).toBe("expired 1 day ago");
    expect(expiryText({ status: "soon", days: 0 })).toBe("expires today");
    expect(expiryText({ status: "soon", days: 1 })).toBe("expires tomorrow");
    expect(expiryText({ status: "soon", days: 11 })).toBe("expires in 11 days");
    expect(expiryText({ status: "ok", days: 90 })).toBe("OK, 90 days left");
    expect(expiryText({ status: "unset", days: null })).toBe("no date set");
  });
});

describe("saving", () => {
  it("remembers the EpiPen choice, dates and your own items", () => {
    const store = fakeStorage();
    let s = setDate(withEpipen(), "epipen", "2027-03-01");
    s = addItem(s, "Apivar strips", "2027-01-31");
    saveExpiry(s, store);
    expect(loadExpiry(store)).toEqual(s);
  });

  it("starts empty when nothing is saved", () => {
    expect(loadExpiry(fakeStorage())).toEqual(emptyExpiry());
  });

  it("keeps your items when the saved text has no EpiPen part", () => {
    const saved = JSON.stringify({ items: [{ id: "custom:a", label: "A", date: "" }] });
    const state = loadExpiry(fakeStorage({ "hive-expiry-dates": saved }));
    expect(state.epipen).toEqual({ has: false, date: "" });
    expect(state.items.map((i) => i.id)).toEqual(["custom:a"]);
  });

  it("starts fresh when the saved text is damaged", () => {
    expect(loadExpiry(fakeStorage({ "hive-expiry-dates": "{nope" }))).toEqual(emptyExpiry());
    expect(loadExpiry(fakeStorage({ "hive-expiry-dates": '{"items":5}' }))).toEqual(emptyExpiry());
  });

  it("clears a saved date that is not a real day", () => {
    const saved = JSON.stringify({
      epipen: { has: true, date: "garbage" },
      items: [{ id: "custom:a", label: "A", date: "2027-02-30" }],
    });
    const state = loadExpiry(fakeStorage({ "hive-expiry-dates": saved }));
    expect(state.epipen).toEqual({ has: true, date: "" });
    expect(state.items[0].date).toBe("");
  });

  it("falls back when storage is blocked", () => {
    const blocked = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    };
    expect(loadExpiry(blocked)).toEqual(emptyExpiry());
    expect(() => saveExpiry(emptyExpiry(), blocked)).not.toThrow();
  });
});
