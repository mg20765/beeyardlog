import { describe, it, expect } from "vitest";
import { cleanInitials, loadInitials, saveInitials } from "./initials.js";

const fakeStorage = (start = {}) => {
  const data = { ...start };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
  };
};

describe("cleanInitials", () => {
  it("trims, uses capitals and keeps it short", () => {
    expect(cleanInitials("  mg ")).toBe("MG");
    expect(cleanInitials("abcdefghij")).toBe("ABCDEF");
    expect(cleanInitials(undefined)).toBe("");
  });
});

describe("remembered initials", () => {
  it("are remembered on the phone", () => {
    const store = fakeStorage();
    saveInitials("mg", store);
    expect(loadInitials(store)).toBe("MG");
  });

  it("start empty, and an empty save forgets them", () => {
    const store = fakeStorage();
    expect(loadInitials(store)).toBe("");
    saveInitials("MG", store);
    saveInitials("", store);
    expect(loadInitials(store)).toBe("");
  });

  it("fall back to empty when storage is blocked", () => {
    const blocked = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    };
    expect(loadInitials(blocked)).toBe("");
    expect(() => saveInitials("MG", blocked)).not.toThrow();
  });
});
