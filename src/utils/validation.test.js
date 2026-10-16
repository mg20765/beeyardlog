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
