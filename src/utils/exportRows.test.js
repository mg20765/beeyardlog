import { describe, it, expect } from "vitest";
import { rowsForExport } from "./exportRows.js";

describe("rowsForExport", () => {
  it("turns true/false into Yes/No so every column reads the same in Excel", () => {
    const [row] = rowsForExport([
      { id: 1, "Hive ID": "H1", "AFB Checked": true, "AFB Signs Found": false },
    ]);
    expect(row["AFB Checked"]).toBe("Yes");
    expect(row["AFB Signs Found"]).toBe("No");
  });

  it("drops the internal id", () => {
    const [row] = rowsForExport([{ id: 7, "Hive ID": "H1" }]);
    expect(row).not.toHaveProperty("id");
  });

  it("leaves text untouched, and turns a typed number into a real number", () => {
    const [row] = rowsForExport([
      { "Hive ID": "H1", "Honey (kg)": "12", "Adjusted Entrance": "Yes", Notes: "" },
    ]);
    expect(row).toEqual({
      "Hive ID": "H1",
      "Honey (kg)": 12,
      "Adjusted Entrance": "Yes",
      Notes: "",
    });
  });

  it("doesn't mutate the stored rows", () => {
    const stored = [{ id: 1, "AFB Checked": true }];
    rowsForExport(stored);
    expect(stored).toEqual([{ id: 1, "AFB Checked": true }]);
  });
});

describe("rowsForExport: numbers", () => {
  it("turns typed numbers into real numbers, so Excel can add them up", () => {
    const [row] = rowsForExport([
      { "Temp (°C)": "17", "Honey (kg)": "12.5", "Bees Sampled": "300", "Supers Removed": "2" },
    ]);
    expect(row).toMatchObject({ "Temp (°C)": 17, "Honey (kg)": 12.5, "Bees Sampled": 300, "Supers Removed": 2 });
  });

  it("keeps IDs and names as text, even when they look like numbers", () => {
    const [row] = rowsForExport([{ "Hive ID": "007", "Yard #": "4", "New Hive ID": "12", Notes: "5" }]);
    expect(row).toMatchObject({ "Hive ID": "007", "Yard #": "4", "New Hive ID": "12", Notes: "5" });
  });

  it("leaves a blank as blank and a non-number as text, instead of losing it", () => {
    const [row] = rowsForExport([{ "Temp (°C)": "", "Honey (kg)": "lots", "Brood Frames": "  " }]);
    expect(row).toMatchObject({ "Temp (°C)": "", "Honey (kg)": "lots", "Brood Frames": "  " });
  });

  it("leaves a value that is already a number alone", () => {
    const [row] = rowsForExport([{ "Mites per 100 Bees": 3, "Brood Frames": 7 }]);
    expect(row).toMatchObject({ "Mites per 100 Bees": 3, "Brood Frames": 7 });
  });
});

describe("rowsForExport: edge cases", () => {
  it("handles negative and leading-dot numbers", () => {
    const [row] = rowsForExport([{ "Temp (°C)": "-3", "Honey (kg)": ".5" }]);
    expect(row).toMatchObject({ "Temp (°C)": -3, "Honey (kg)": 0.5 });
  });

  it("leaves oddly written numbers as text instead of guessing", () => {
    const [row] = rowsForExport([{ "Brood Frames": "1e3", "Temp (°C)": "5.", "Honey (kg)": "0x10" }]);
    expect(row).toMatchObject({ "Brood Frames": "1e3", "Temp (°C)": "5.", "Honey (kg)": "0x10" });
  });

  it("copes with an empty log and with rows missing columns", () => {
    expect(rowsForExport([])).toEqual([]);
    expect(rowsForExport([{ id: 1 }])).toEqual([{}]);
  });
});
