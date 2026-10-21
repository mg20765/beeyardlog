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

  it("finds nothing wrong with a normal or empty entry", () => {
    expect(getInputProblems(form({}))).toEqual([]);
    expect(
      getInputProblems(
        form({ broodPct: "80", broodFrames: "7", weatherTemp: "17", honeyKg: "12.5" }),
      ),
    ).toEqual([]);
  });

  it("requires a date", () => {
    expect(getInputProblems(form({ date: "" }))).toEqual(["Date is required."]);
  });

  it("keeps brood coverage between 0 and 100", () => {
    expect(getInputProblems(form({ broodPct: "150" }))[0]).toMatch(/Brood coverage %.*between 0 and 100/);
    expect(getInputProblems(form({ broodPct: "-5" }))[0]).toMatch(/Brood coverage %/);
    expect(getInputProblems(form({ broodPct: "0" }))).toEqual([]);
    expect(getInputProblems(form({ broodPct: "100" }))).toEqual([]);
  });

  it("doesn't allow negative counts, and wants whole numbers for counts", () => {
    expect(getInputProblems(form({ broodFrames: "-1" }))[0]).toMatch(/Brood frames.*negative/);
    expect(getInputProblems(form({ supersRemoved: "2.5" }))[0]).toMatch(/Supers removed.*whole number/);
    expect(getInputProblems(form({ honeyKg: "-3" }))[0]).toMatch(/Honey \(kg\).*negative/);
    expect(getInputProblems(form({ honeyKg: "3.4" }))).toEqual([]); // kg can have decimals
  });

  it("flags an implausible temperature", () => {
    expect(getInputProblems(form({ weatherTemp: "180" }))[0]).toMatch(/Temp/);
    expect(getInputProblems(form({ weatherTemp: "-2" }))).toEqual([]);
  });

  it("only checks the storage counts when 'Removed to storage' is ticked", () => {
    expect(getInputProblems(form({ storageFdBoxes: "-1" }))).toEqual([]);
    expect(
      getInputProblems(form({ removedToStorage: true, storageFdBoxes: "-1" }))[0],
    ).toMatch(/FD boxes/);
  });

  it("flags more mites than bees, and bad mite numbers", () => {
    expect(getInputProblems(form({ miteBees: "10", miteCount: "50" }))).toEqual([
      "Mites counted can't be more than bees sampled.",
    ]);
    expect(getInputProblems(form({ miteBees: "0", miteCount: "" }))[0]).toMatch(/Bees sampled/);
    expect(getInputProblems(form({ miteBees: "300", miteCount: "9" }))).toEqual([]);
  });

  it("ignores mite numbers when the check was marked not done", () => {
    expect(
      getInputProblems(form({ miteNotDone: true, miteBees: "10", miteCount: "50" })),
    ).toEqual([]);
  });

  it("lists every problem at once", () => {
    const problems = getInputProblems(form({ date: "", broodPct: "150", broodFrames: "-2" }));
    expect(problems).toHaveLength(3);
  });
});
