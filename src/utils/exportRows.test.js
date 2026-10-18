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

  it("leaves text and number values untouched", () => {
    const [row] = rowsForExport([
      { "Hive ID": "H1", "Honey (kg)": "12", "Adjusted Entrance": "Yes", Notes: "" },
    ]);
    expect(row).toEqual({
      "Hive ID": "H1",
      "Honey (kg)": "12",
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
