import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { buildWorkbook, excelDateSerial } from "./excel.js";

describe("excelDateSerial", () => {
  it("gives Excel's day number for a date (no timezone involved)", () => {
    expect(excelDateSerial("2000-01-01")).toBe(36526);
    expect(excelDateSerial("1900-03-01")).toBe(61);
    expect(excelDateSerial("2026-10-20")).toBe(46315);
  });

  it("returns null for anything that isn't a real YYYY-MM-DD date", () => {
    for (const bad of ["", "nope", "2026-13-40", "2026-02-30", "26-10-20", null, undefined, 20261020]) {
      expect(excelDateSerial(bad)).toBeNull();
    }
  });
});

describe("buildWorkbook", () => {
  const log = [
    {
      id: 1,
      Date: "2026-10-20",
      "Hive ID": "007",
      "Yard #": "4",
      "Temp (°C)": "17",
      "Honey (kg)": "12.5",
      "AFB Checked": true,
      "Mites per 100 Bees": 3,
    },
    {
      id: 2,
      Date: "not a date",
      "Hive ID": "H2",
      "Yard #": "",
      "Temp (°C)": "warm",
      "Honey (kg)": "",
      "AFB Checked": false,
      "Mites per 100 Bees": "",
    },
  ];

  const sheet = () => buildWorkbook(log).Sheets.Inspections;
  const cell = (row, column) => {
    const s = sheet();
    const headers = XLSX.utils.sheet_to_json(s, { header: 1 })[0];
    return s[XLSX.utils.encode_cell({ r: row, c: headers.indexOf(column) })];
  };

  it("has one sheet called Inspections", () => {
    expect(buildWorkbook(log).SheetNames).toEqual(["Inspections"]);
  });

  it("writes dates as real dates, shown as yyyy-mm-dd", () => {
    expect(cell(1, "Date")).toMatchObject({ t: "n", v: 46315, z: "yyyy-mm-dd" });
  });

  it("writes numbers as numbers, so Excel can add them up", () => {
    expect(cell(1, "Temp (°C)")).toMatchObject({ t: "n", v: 17 });
    expect(cell(1, "Honey (kg)")).toMatchObject({ t: "n", v: 12.5 });
    expect(cell(1, "Mites per 100 Bees")).toMatchObject({ t: "n", v: 3 });
  });

  it("keeps IDs as text, so 007 doesn't become 7", () => {
    expect(cell(1, "Hive ID")).toMatchObject({ t: "s", v: "007" });
    expect(cell(1, "Yard #")).toMatchObject({ t: "s", v: "4" });
  });

  it("writes Yes/No for ticks", () => {
    expect(cell(1, "AFB Checked").v).toBe("Yes");
    expect(cell(2, "AFB Checked").v).toBe("No");
  });

  it("leaves a date or number it can't understand as text, instead of losing it", () => {
    expect(cell(2, "Date")).toMatchObject({ t: "s", v: "not a date" });
    expect(cell(2, "Temp (°C)")).toMatchObject({ t: "s", v: "warm" });
  });

  it("leaves blanks blank", () => {
    const blank = cell(2, "Honey (kg)");
    expect(blank === undefined || blank.v === "").toBe(true);
  });
});

describe("buildWorkbook: more cases", () => {
  it("includes a column that only a later row has", () => {
    const wb = buildWorkbook([{ id: 1, "Hive ID": "A" }, { id: 2, "Hive ID": "B", Notes: "later column" }]);
    const headers = XLSX.utils.sheet_to_json(wb.Sheets.Inspections, { header: 1 })[0];
    expect(headers).toEqual(["Hive ID", "Notes"]);
  });

  it("gives every column a width", () => {
    const wb = buildWorkbook([{ id: 1, "Hive ID": "A very long hive name indeed", Notes: "" }]);
    const cols = wb.Sheets.Inspections["!cols"];
    expect(cols).toHaveLength(2);
    expect(cols[0].wch).toBeGreaterThan(20);
  });

  it("changes nothing in the log it was given", () => {
    const log = [{ id: 1, Date: "2026-10-20", "Temp (°C)": "17", "AFB Checked": true }];
    buildWorkbook(log);
    expect(log).toEqual([{ id: 1, Date: "2026-10-20", "Temp (°C)": "17", "AFB Checked": true }]);
  });
});
