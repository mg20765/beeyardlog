import { describe, it, expect } from "vitest";
import { initialForm } from "./hiveForm.js";
import {
  DRAFT_KEY,
  isPristine,
  mergeDraft,
  loadDraft,
  saveDraft,
} from "./draft.js";

// Minimal stand-in for localStorage.
const fakeStorage = (initial = {}) => {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
};

describe("isPristine", () => {
  it("is true for a fresh form", () => {
    expect(isPristine(initialForm())).toBe(true);
  });

  it("ignores the date, which is pre-filled", () => {
    expect(isPristine({ ...initialForm(), date: "2020-01-01" })).toBe(true);
  });

  it("is false once any text is typed or box ticked", () => {
    expect(isPristine({ ...initialForm(), hiveId: "H1" })).toBe(false);
    expect(isPristine({ ...initialForm(), trtOxalic: true })).toBe(false);
  });
});

describe("mergeDraft", () => {
  it("lays saved values over the blank form", () => {
    const base = initialForm();
    const merged = mergeDraft({ hiveId: "H1", trtOxalic: true }, base);
    expect(merged.hiveId).toBe("H1");
    expect(merged.trtOxalic).toBe(true);
    expect(merged.yardNo).toBe("");
  });

  it("ignores keys the form no longer has", () => {
    const merged = mergeDraft({ hiveId: "H1", oldField: "x" }, initialForm());
    expect(merged).not.toHaveProperty("oldField");
  });

  it("ignores values of the wrong type", () => {
    const merged = mergeDraft({ hiveId: 42, trtOxalic: "yes" }, initialForm());
    expect(merged.hiveId).toBe("");
    expect(merged.trtOxalic).toBe(false);
  });

  it("returns the blank form when there is nothing usable", () => {
    const base = initialForm();
    expect(mergeDraft(null, base)).toEqual(base);
    expect(mergeDraft("junk", base)).toEqual(base);
    expect(mergeDraft([1, 2], base)).toEqual(base);
  });
});

describe("loadDraft", () => {
  it("returns null when no draft is saved", () => {
    expect(loadDraft(fakeStorage())).toBeNull();
  });

  it("returns the merged form when a draft is saved", () => {
    const s = fakeStorage({
      [DRAFT_KEY]: JSON.stringify({ hiveId: "H9", notes: "calm" }),
    });
    const form = loadDraft(s);
    expect(form.hiveId).toBe("H9");
    expect(form.notes).toBe("calm");
    expect(form.yardNo).toBe("");
  });

  it("returns null (not a crash) for a corrupt draft", () => {
    expect(loadDraft(fakeStorage({ [DRAFT_KEY]: "{not json" }))).toBeNull();
  });

  it("returns null if storage itself throws", () => {
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
    };
    expect(loadDraft(broken)).toBeNull();
  });
});

describe("saveDraft", () => {
  it("saves a form that has something typed in it", () => {
    const s = fakeStorage();
    saveDraft({ ...initialForm(), hiveId: "H1" }, s);
    expect(JSON.parse(s.data[DRAFT_KEY]).hiveId).toBe("H1");
  });

  it("removes the draft when the form is back to blank", () => {
    const s = fakeStorage({ [DRAFT_KEY]: "{}" });
    saveDraft(initialForm(), s);
    expect(s.data).not.toHaveProperty(DRAFT_KEY);
  });

  it("doesn't throw if storage is full or blocked", () => {
    const broken = {
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(() => saveDraft({ ...initialForm(), hiveId: "H1" }, broken)).not.toThrow();
    expect(() => saveDraft(initialForm(), broken)).not.toThrow();
  });
});
