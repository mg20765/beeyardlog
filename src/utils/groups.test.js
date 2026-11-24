import { describe, it, expect } from "vitest";
import { groupForYard, groupSuggestions, nextGroup } from "./groups.js";

const row = (id, date, yard, group) => ({ id, Date: date, "Yard #": yard, "Hive ID": "H", Group: group });

const log = [
  row(1, "2026-10-01", "Amb", "Pollination"),
  row(2, "2026-10-10", "Amb", "Early sites"), // the latest for Amb
  row(3, "2026-10-05", "Kokako", "Late sites"),
  row(4, "2026-10-06", "Wnd", ""),
];

describe("groupForYard", () => {
  it("gives the group on the latest entry for that yard", () => {
    expect(groupForYard(log, "Amb")).toBe("Early sites");
    expect(groupForYard(log, "Kokako")).toBe("Late sites");
  });

  it("ignores capitals and spaces in the yard name", () => {
    expect(groupForYard(log, "  amb ")).toBe("Early sites");
  });

  it("skips entries with no group", () => {
    expect(groupForYard([...log, row(5, "2026-10-20", "Amb", "")], "Amb")).toBe("Early sites");
  });

  it("is empty for a yard with no group, or no yard", () => {
    expect(groupForYard(log, "Wnd")).toBe("");
    expect(groupForYard(log, "Unknown")).toBe("");
    expect(groupForYard(log, "")).toBe("");
  });
});

describe("groupSuggestions", () => {
  it("lists each group once, in order, ignoring capitals", () => {
    const more = [...log, row(5, "2026-10-12", "Wnd", "pollination")];
    expect(groupSuggestions(more)).toEqual(["Early sites", "Late sites", "pollination"]);
  });

  it("is empty when no entry has a group", () => {
    expect(groupSuggestions([row(1, "2026-10-01", "A", "")])).toEqual([]);
  });
});

describe("nextGroup", () => {
  it("fills in the yard's group when nothing has been chosen", () => {
    expect(nextGroup({ prevGroup: "", prevYard: "", newYard: "Kokako", log })).toBe("Late sites");
  });

  it("moves to the new yard's group when the old one was filled in for you", () => {
    expect(nextGroup({ prevGroup: "Early sites", prevYard: "Amb", newYard: "Kokako", log })).toBe("Late sites");
  });

  it("clears a group that was filled in for you when the new yard has none", () => {
    expect(nextGroup({ prevGroup: "Early sites", prevYard: "Amb", newYard: "Wnd", log })).toBe("");
  });

  it("keeps a group you typed yourself", () => {
    expect(nextGroup({ prevGroup: "Orchard", prevYard: "Amb", newYard: "Kokako", log })).toBe("Orchard");
  });
});
