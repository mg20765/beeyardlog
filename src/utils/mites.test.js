import { describe, it, expect } from "vitest";
import { TREAT_AT_PER_100, mitesPer100, isAtOrAboveThreshold } from "./mites.js";

describe("mitesPer100", () => {
  it("works out mites per 100 bees", () => {
    expect(mitesPer100(300, 9)).toBe(3);
    expect(mitesPer100(300, 0)).toBe(0);
    expect(mitesPer100(100, 5)).toBe(5);
  });

  it("rounds to one decimal place", () => {
    expect(mitesPer100(300, 1)).toBe(0.3);
    expect(mitesPer100(300, 4)).toBe(1.3);
    expect(mitesPer100(250, 2)).toBe(0.8);
  });

  it("accepts the strings a form gives you", () => {
    expect(mitesPer100("300", "9")).toBe(3);
  });

  it("returns null when the numbers can't give a sensible answer", () => {
    expect(mitesPer100("", "")).toBeNull();
    expect(mitesPer100(300, "")).toBeNull();
    expect(mitesPer100("", 5)).toBeNull();
    expect(mitesPer100(0, 3)).toBeNull(); // no bees sampled
    expect(mitesPer100(-300, 3)).toBeNull();
    expect(mitesPer100(300, -1)).toBeNull();
    expect(mitesPer100("abc", 3)).toBeNull();
    expect(mitesPer100(300.5, 3)).toBeNull(); // counts are whole numbers
    expect(mitesPer100(300, 2.5)).toBeNull();
  });

  it("returns null when there are more mites than bees", () => {
    expect(mitesPer100(10, 11)).toBeNull();
    expect(mitesPer100(10, 10)).toBe(100);
  });
});

describe("isAtOrAboveThreshold", () => {
  it("uses 3 mites per 100 bees as the line", () => {
    expect(TREAT_AT_PER_100).toBe(3);
  });

  it("flags a rate at or above the threshold", () => {
    expect(isAtOrAboveThreshold(3)).toBe(true);
    expect(isAtOrAboveThreshold(7.5)).toBe(true);
  });

  it("doesn't flag a rate below the threshold", () => {
    expect(isAtOrAboveThreshold(2.9)).toBe(false);
    expect(isAtOrAboveThreshold(0)).toBe(false);
  });

  it("doesn't flag when there is no result", () => {
    expect(isAtOrAboveThreshold(null)).toBe(false);
  });
});
