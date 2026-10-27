import { describe, it, expect } from "vitest";
import { sortNewestFirst, filterLog } from "./logView.js";

const row = (id, date, hive, extra = {}) => ({ id, Date: date, "Hive ID": hive, ...extra });

describe("sortNewestFirst", () => {
  it("puts the most recent date first", () => {
    const log = [row(1, "2026-10-01", "A"), row(2, "2026-10-20", "B"), row(3, "2026-10-10", "C")];
    expect(sortNewestFirst(log).map((r) => r["Hive ID"])).toEqual(["B", "C", "A"]);
  });

  it("puts the later-saved entry first when the date is the same", () => {
    const log = [row(1, "2026-10-20", "first"), row(2, "2026-10-20", "second")];
    expect(sortNewestFirst(log).map((r) => r["Hive ID"])).toEqual(["second", "first"]);
  });

  it("puts entries with no usable date last", () => {
    const log = [row(1, "", "none"), row(2, "2026-10-20", "dated"), row(3, undefined, "missing")];
    expect(sortNewestFirst(log).map((r) => r["Hive ID"])).toEqual(["dated", "missing", "none"]);
  });

  it("doesn't change the original list", () => {
    const log = [row(1, "2026-10-01", "A"), row(2, "2026-10-20", "B")];
    sortNewestFirst(log);
    expect(log.map((r) => r.id)).toEqual([1, 2]);
  });

  it("copes with an empty list", () => {
    expect(sortNewestFirst([])).toEqual([]);
  });
});

describe("filterLog", () => {
  const log = [
    row(1, "2026-10-13", "Kokako", { "Yard #": "Am", Notes: "Strong colony" }),
    row(2, "2026-09-25", "Hunst", { "Yard #": "1", Notes: "" }),
    row(3, "2026-10-21", 42, { "Yard #": "Amb", Notes: "Queen cells" }),
  ];
  const ids = (query) => filterLog(log, query).map((r) => r.id);

  it("returns everything for an empty or blank search", () => {
    expect(ids("")).toEqual([1, 2, 3]);
    expect(ids("   ")).toEqual([1, 2, 3]);
  });

  it("finds a Hive ID, ignoring capitals", () => {
    expect(ids("kokako")).toEqual([1]);
    expect(ids("HUN")).toEqual([2]);
  });

  it("finds by yard, notes, or part of a date", () => {
    expect(ids("amb")).toEqual([3]);
    expect(ids("queen")).toEqual([3]);
    expect(ids("2026-09")).toEqual([2]);
  });

  it("finds a Hive ID that was saved as a number", () => {
    expect(ids("42")).toEqual([3]);
  });

  it("ignores spaces around the search", () => {
    expect(ids("  kokako ")).toEqual([1]);
  });

  it("returns nothing when nothing matches", () => {
    expect(ids("zzz")).toEqual([]);
  });

  it("copes with entries that are missing fields", () => {
    expect(filterLog([{ id: 9 }], "x")).toEqual([]);
    expect(filterLog([{ id: 9 }], "")).toEqual([{ id: 9 }]);
  });
});
