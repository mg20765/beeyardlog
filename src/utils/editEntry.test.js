import { describe, it, expect } from "vitest";
import { editableFields, rowToEdits, applyEdits, getEditProblems } from "./editEntry.js";

const row = (over = {}) => ({
  id: 7,
  Date: "2026-10-20",
  "Hive ID": "H1",
  "Yard #": "Y2",
  Notes: "",
  "Honey Level": "High",
  Treatments: "Oxalic acid",
  "Mite Method": "",
  "Bees Sampled": "",
  "Mites Counted": "",
  "Mites per 100 Bees": "",
  ...over,
});

describe("editableFields", () => {
  const names = (r) => editableFields(r).map((f) => f.name);

  it("always offers Yard #, Hive ID, Date and Notes", () => {
    expect(names(row())).toEqual(["yardNo", "hiveId", "date", "notes"]);
  });

  it("offers the other typed fields only when the entry has a value for them", () => {
    expect(names(row({ "Temp (°C)": "17", "Brood Coverage %": "80" }))).toEqual([
      "yardNo",
      "hiveId",
      "date",
      "weatherTemp",
      "broodPct",
      "notes",
    ]);
  });

  it("offers the mite counts when a mite check was recorded, but not when it was skipped", () => {
    const done = row({ "Mite Method": "Alcohol wash", "Bees Sampled": "300", "Mites Counted": "9" });
    expect(names(done)).toEqual(expect.arrayContaining(["miteBees", "miteCount"]));
    const skipped = row({ "Mite Method": "Not done" });
    expect(names(skipped)).not.toContain("miteBees");
  });
});

describe("rowToEdits", () => {
  it("turns the saved columns into strings to put in the edit boxes", () => {
    const edits = rowToEdits(row({ "Temp (°C)": 17, Notes: "calm" }));
    expect(edits).toMatchObject({ hiveId: "H1", yardNo: "Y2", date: "2026-10-20", notes: "calm", weatherTemp: "17" });
  });
});

describe("applyEdits", () => {
  it("fixes a typo and leaves every other column alone", () => {
    const before = row();
    const after = applyEdits(before, { ...rowToEdits(before), hiveId: "H1B" });
    expect(after["Hive ID"]).toBe("H1B");
    expect(after.id).toBe(7);
    expect(after["Honey Level"]).toBe("High");
    expect(after.Treatments).toBe("Oxalic acid");
  });

  it("trims stray spaces from IDs", () => {
    const before = row();
    const after = applyEdits(before, { ...rowToEdits(before), hiveId: "  H9 ", yardNo: " Y4" });
    expect(after["Hive ID"]).toBe("H9");
    expect(after["Yard #"]).toBe("Y4");
  });

  it("doesn't change the original row", () => {
    const before = row();
    applyEdits(before, { ...rowToEdits(before), hiveId: "Z" });
    expect(before["Hive ID"]).toBe("H1");
  });

  it("works out mites per 100 again when the counts are changed", () => {
    const before = row({
      "Mite Method": "Alcohol wash",
      "Bees Sampled": "300",
      "Mites Counted": "9",
      "Mites per 100 Bees": 3,
    });
    const after = applyEdits(before, { ...rowToEdits(before), miteCount: "3" });
    expect(after["Mites Counted"]).toBe("3");
    expect(after["Mites per 100 Bees"]).toBe(1);
  });

  it("keeps a skipped mite check skipped", () => {
    const before = row({ "Mite Method": "Not done" });
    const after = applyEdits(before, rowToEdits(before));
    expect(after["Mite Method"]).toBe("Not done");
    expect(after["Mites per 100 Bees"]).toBe("");
  });
});

describe("getEditProblems", () => {
  const problemsFor = (over, r = row()) =>
    getEditProblems({ ...rowToEdits(r), ...over }, r);

  it("finds nothing wrong with an unchanged entry", () => {
    expect(problemsFor({})).toEqual([]);
  });

  it("requires a Hive ID", () => {
    expect(problemsFor({ hiveId: "  " })).toEqual([
      { field: "hiveId", message: "Hive ID is required." },
    ]);
  });

  it("requires a date and sensible numbers, naming the field", () => {
    expect(problemsFor({ date: "" })[0].field).toBe("date");
    const withBrood = row({ "Brood Coverage %": "80" });
    expect(problemsFor({ broodPct: "150" }, withBrood)[0].field).toBe("broodPct");
  });

  it("checks mites against bees when a mite check was recorded", () => {
    const r = row({ "Mite Method": "Sugar roll", "Bees Sampled": "300", "Mites Counted": "9" });
    expect(problemsFor({ miteCount: "999" }, r)[0].field).toBe("miteCount");
  });
});

describe("applyEdits: more cases", () => {
  it("lets Notes be added to an entry that had none", () => {
    const before = row();
    const after = applyEdits(before, { ...rowToEdits(before), notes: "  strong colony " });
    expect(after.Notes).toBe("strong colony");
  });

  it("changes the date, and nothing else about the entry", () => {
    const before = row();
    const after = applyEdits(before, { ...rowToEdits(before), date: "2026-10-18" });
    expect(after.Date).toBe("2026-10-18");
    expect(after["Hive ID"]).toBe("H1");
  });

  it("ignores edits to a field that isn't offered for this entry", () => {
    const before = row(); // no Temp recorded, so Temp isn't editable
    const after = applyEdits(before, { ...rowToEdits(before), weatherTemp: "30" });
    expect(after).not.toHaveProperty("Temp (°C)");
  });

  it("leaves mites per 100 blank when the counts are cleared", () => {
    const before = row({
      "Mite Method": "Alcohol wash",
      "Bees Sampled": "300",
      "Mites Counted": "9",
      "Mites per 100 Bees": 3,
    });
    const after = applyEdits(before, { ...rowToEdits(before), miteCount: "" });
    expect(after["Mites per 100 Bees"]).toBe("");
  });
});

describe("getEditProblems: more cases", () => {
  const problemsFor = (over, r = row()) => getEditProblems({ ...rowToEdits(r), ...over }, r);

  it("rejects a date in the future or from long ago", () => {
    expect(problemsFor({ date: "2099-01-01" })[0]).toMatchObject({ field: "date" });
    expect(problemsFor({ date: "1999-01-01" })[0]).toMatchObject({ field: "date" });
  });

  it("rejects an oddly written number", () => {
    const r = row({ "Brood Frames": "7" });
    expect(problemsFor({ broodFrames: "1e3" }, r)[0]).toMatchObject({ field: "broodFrames" });
    expect(problemsFor({ broodFrames: "8" }, r)).toEqual([]);
  });

  it("lists the Hive ID problem first, then the others", () => {
    const r = row({ "Brood Coverage %": "80" });
    const fields = problemsFor({ hiveId: "", broodPct: "150" }, r).map((p) => p.field);
    expect(fields[0]).toBe("hiveId");
    expect(fields).toContain("broodPct");
  });
});

describe("editableFields: which pad a number box should open", () => {
  const byName = (r) => Object.fromEntries(editableFields(r).map((f) => [f.name, f.inputMode]));

  it("asks for the whole-number pad for counts, and the decimal pad where a point is needed", () => {
    const r = row({
      "Temp (°C)": "17",
      "Brood Coverage %": "80",
      "Brood Frames": "7",
      "Honey (kg)": "12.5",
      "Supers Removed": "2",
    });
    expect(byName(r)).toMatchObject({
      weatherTemp: "decimal",
      broodPct: "decimal",
      broodFrames: "numeric",
      honeyKg: "decimal",
      supersRemoved: "numeric",
    });
  });

  it("leaves text boxes on the normal keyboard", () => {
    const names = byName(row());
    expect(names.hiveId).toBeUndefined();
    expect(names.yardNo).toBeUndefined();
    expect(names.notes).toBeUndefined();
  });

  it("asks for the whole-number pad for the mite counts", () => {
    const r = row({ "Mite Method": "Alcohol wash", "Bees Sampled": "300", "Mites Counted": "9" });
    expect(byName(r)).toMatchObject({ miteBees: "numeric", miteCount: "numeric" });
  });
});
