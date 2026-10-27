import { describe, it, expect } from "vitest";
import { initialForm } from "./hiveForm.js";
import { isHiveIdMissing, getMissingNudgeFields } from "./validation.js";

describe("isHiveIdMissing", () => {
  it("is true for an empty Hive ID", () => {
    expect(isHiveIdMissing({ hiveId: "" })).toBe(true);
  });

  it("is true for a Hive ID that's only whitespace", () => {
    expect(isHiveIdMissing({ hiveId: "   " })).toBe(true);
  });

  it("is false once a real Hive ID is entered", () => {
    expect(isHiveIdMissing({ hiveId: "H1" })).toBe(false);
  });
});

describe("getMissingNudgeFields", () => {
  it("flags all four nudge fields when the form is untouched", () => {
    const missing = getMissingNudgeFields(initialForm());
    const keys = missing.map((m) => m.key);
    expect(keys).toEqual([
      "temperament",
      "population",
      "queenSighted",
      "honeyLevel",
    ]);
  });

  it("returns an empty list once all nudge fields are filled in", () => {
    const f = {
      ...initialForm(),
      temperament: "Calm",
      population: "Medium",
      queenSighted: "Yes",
      honeyLevel: "Average",
    };
    expect(getMissingNudgeFields(f)).toEqual([]);
  });

  it("only reports the fields that are actually still blank", () => {
    const f = { ...initialForm(), temperament: "Calm", honeyLevel: "Low" };
    const missing = getMissingNudgeFields(f).map((m) => m.key);
    expect(missing).toEqual(["population", "queenSighted"]);
  });
});

import { getInputProblems } from "./validation.js";

describe("getInputProblems", () => {
  const form = (over) => ({ ...initialForm(), hiveId: "H1", ...over });
  const messagesFor = (over) => getInputProblems(form(over)).map((p) => p.message);
  const fieldsFor = (over) => getInputProblems(form(over)).map((p) => p.field);

  it("finds nothing wrong with a normal or empty entry", () => {
    expect(getInputProblems(form({}))).toEqual([]);
    expect(
      getInputProblems(
        form({ broodPct: "80", broodFrames: "7", weatherTemp: "17", honeyKg: "12.5" }),
      ),
    ).toEqual([]);
  });

  it("requires a date, and says which field it is", () => {
    expect(getInputProblems(form({ date: "" }))).toEqual([
      { field: "date", message: "Date is required." },
    ]);
  });

  it("names the field each problem belongs to, so the screen can jump to it", () => {
    expect(fieldsFor({ broodPct: "150" })).toEqual(["broodPct"]);
    expect(fieldsFor({ broodFrames: "-1" })).toEqual(["broodFrames"]);
    expect(fieldsFor({ supersRemoved: "2.5" })).toEqual(["supersRemoved"]);
    expect(fieldsFor({ honeyKg: "-3" })).toEqual(["honeyKg"]);
    expect(fieldsFor({ weatherTemp: "180" })).toEqual(["weatherTemp"]);
    expect(fieldsFor({ removedToStorage: true, storageFdBoxes: "-1" })).toEqual(["storageFdBoxes"]);
    expect(fieldsFor({ miteBees: "0" })).toEqual(["miteBees"]);
    expect(fieldsFor({ miteBees: "10", miteCount: "50" })).toEqual(["miteCount"]);
  });

  it("lists problems in the order the fields appear on the form", () => {
    expect(fieldsFor({ honeyKg: "-1", date: "", broodPct: "150" })).toEqual([
      "date",
      "broodPct",
      "honeyKg",
    ]);
  });

  it("keeps brood coverage between 0 and 100", () => {
    expect(messagesFor({ broodPct: "150" })[0]).toMatch(/Brood coverage %.*between 0 and 100/);
    expect(messagesFor({ broodPct: "-5" })[0]).toMatch(/Brood coverage %/);
    expect(messagesFor({ broodPct: "0" })).toEqual([]);
    expect(messagesFor({ broodPct: "100" })).toEqual([]);
  });

  it("doesn't allow negative counts, and wants whole numbers for counts", () => {
    expect(messagesFor({ broodFrames: "-1" })[0]).toMatch(/Brood frames.*negative/);
    expect(messagesFor({ supersRemoved: "2.5" })[0]).toMatch(/Supers removed.*whole number/);
    expect(messagesFor({ honeyKg: "-3" })[0]).toMatch(/Honey \(kg\).*negative/);
    expect(messagesFor({ honeyKg: "3.4" })).toEqual([]); // kg can have decimals
  });

  it("flags an implausible temperature", () => {
    expect(messagesFor({ weatherTemp: "180" })[0]).toMatch(/Temp/);
    expect(messagesFor({ weatherTemp: "-2" })).toEqual([]);
  });

  it("only checks the storage counts when 'Removed to storage' is ticked", () => {
    expect(messagesFor({ storageFdBoxes: "-1" })).toEqual([]);
    expect(messagesFor({ removedToStorage: true, storageFdBoxes: "-1" })[0]).toMatch(/FD boxes/);
  });

  it("flags more mites than bees, and bad mite numbers", () => {
    expect(messagesFor({ miteBees: "10", miteCount: "50" })).toEqual([
      "Mites counted can't be more than bees sampled.",
    ]);
    expect(messagesFor({ miteBees: "0", miteCount: "" })[0]).toMatch(/Bees sampled/);
    expect(messagesFor({ miteBees: "300", miteCount: "9" })).toEqual([]);
  });

  it("ignores mite numbers when the check was marked not done", () => {
    expect(messagesFor({ miteNotDone: true, miteBees: "10", miteCount: "50" })).toEqual([]);
  });

  it("lists every problem at once", () => {
    expect(messagesFor({ date: "", broodPct: "150", broodFrames: "-2" })).toHaveLength(3);
  });
});

describe("getInputProblems: plain numbers only", () => {
  const f = (over) => ({ ...initialForm(), hiveId: "H1", ...over });
  const msgs = (over) => getInputProblems(f(over)).map((p) => p.message);

  it("rejects number formats that look odd when saved", () => {
    for (const bad of ["1e3", "0x10", "1_0", "1,5", "abc", "--2", "5."]) {
      expect(msgs({ broodFrames: bad })[0], `"${bad}"`).toMatch(/Brood frames/);
    }
  });

  it("accepts ordinary numbers, with or without a decimal point", () => {
    for (const ok of ["7", "0", "12", " 7 "]) expect(msgs({ broodFrames: ok }), ok).toEqual([]);
    for (const ok of ["0.5", ".5", "12.25", "-3"]) expect(msgs({ weatherTemp: ok }), ok).toEqual([]);
  });

  it("holds the mite counts to whole numbers written plainly", () => {
    expect(msgs({ miteBees: "1e3" })[0]).toMatch(/Bees sampled/);
    expect(msgs({ miteBees: "300", miteCount: "9e0" })[0]).toMatch(/Mites counted/);
    expect(msgs({ miteBees: "300", miteCount: "9" })).toEqual([]);
  });
});

describe("getInputProblems: dates", () => {
  const TODAY = "2026-10-28";
  const dateMsgs = (date) => getInputProblems({ ...initialForm(), hiveId: "H1", date }, TODAY).map((p) => p.message);

  it("accepts today and earlier dates", () => {
    expect(dateMsgs("2026-10-28")).toEqual([]);
    expect(dateMsgs("2026-10-13")).toEqual([]);
    expect(dateMsgs("2000-01-01")).toEqual([]);
  });

  it("rejects a date in the future", () => {
    expect(dateMsgs("2026-10-29")[0]).toMatch(/future/);
    expect(dateMsgs("2099-01-01")[0]).toMatch(/future/);
  });

  it("rejects a date that is far too old to be right", () => {
    expect(dateMsgs("1999-12-31")[0]).toMatch(/looks wrong/);
    expect(dateMsgs("0001-01-01")[0]).toMatch(/looks wrong/);
  });

  it("rejects a date that doesn't exist", () => {
    expect(dateMsgs("2026-02-30")[0]).toMatch(/real date/);
    expect(dateMsgs("2026-13-01")[0]).toMatch(/real date/);
    expect(dateMsgs("hello")[0]).toMatch(/real date/);
  });

  it("still asks for a date when it is blank, and names the field", () => {
    expect(getInputProblems({ ...initialForm(), hiveId: "H1", date: "" }, TODAY)).toEqual([
      { field: "date", message: "Date is required." },
    ]);
  });
});

describe("getInputProblems: limits", () => {
  const f = (over) => ({ ...initialForm(), hiveId: "H1", ...over });
  const msgs = (over) => getInputProblems(f(over)).map((p) => p.message);

  it("allows temperatures right up to the limits, and refuses just beyond them", () => {
    expect(msgs({ weatherTemp: "-30" })).toEqual([]);
    expect(msgs({ weatherTemp: "50" })).toEqual([]);
    expect(msgs({ weatherTemp: "-31" })[0]).toMatch(/Temp/);
    expect(msgs({ weatherTemp: "51" })[0]).toMatch(/Temp/);
  });

  it("allows brood coverage of exactly 0 and 100, and refuses just beyond", () => {
    expect(msgs({ broodPct: "0" })).toEqual([]);
    expect(msgs({ broodPct: "100" })).toEqual([]);
    expect(msgs({ broodPct: "100.1" })[0]).toMatch(/between 0 and 100/);
    expect(msgs({ broodPct: "-0.1" })[0]).toMatch(/between 0 and 100/);
  });

  it("accepts a blank box as 'not filled in', but not a box of only spaces for a required field", () => {
    expect(msgs({ broodFrames: "" })).toEqual([]);
    expect(msgs({ broodFrames: "   " })).toEqual([]);
    expect(getInputProblems({ ...f({}), date: "   " }, "2026-10-28")[0].message).toMatch(/real date/);
  });
});
