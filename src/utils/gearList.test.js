import { describe, it, expect } from "vitest";
import {
  GEAR,
  allItems,
  emptyGear,
  loadGear,
  saveGear,
  toggleTick,
  addCustom,
  removeCustom,
  startNewTrip,
  progress,
} from "./gearList.js";

// A tiny stand-in for localStorage, so these run without a browser.
const fakeStorage = (start = {}) => {
  const data = { ...start };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
  };
};

const labels = (mode) => allItems(mode, emptyGear()).map((i) => i.label);

describe("the built-in lists", () => {
  it("keeps containers out of the yard day list", () => {
    const yard = labels("yard").join(" | ").toLowerCase();
    expect(yard).not.toMatch(/container|bucket|extractor|strainer/);
  });

  it("puts containers on the extraction day list", () => {
    const extraction = labels("extraction").join(" | ").toLowerCase();
    expect(extraction).toMatch(/container/);
    expect(extraction).toMatch(/extractor/);
  });

  it("covers the yard basics, supers, treatments and gloves", () => {
    const yard = labels("yard").join(" | ").toLowerCase();
    for (const word of ["smoker", "hive tool", "gloves", "supers", "treatment", "water"]) {
      expect(yard, word).toContain(word);
    }
  });

  it("gives every item its own id", () => {
    for (const mode of Object.keys(GEAR)) {
      const ids = allItems(mode, emptyGear()).map((i) => i.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe("ticking items", () => {
  it("ticks and unticks an item", () => {
    let g = emptyGear();
    g = toggleTick(g, "smoker");
    expect(g.ticked).toContain("smoker");
    g = toggleTick(g, "smoker");
    expect(g.ticked).not.toContain("smoker");
  });

  it("does not change the list it was given", () => {
    const g = emptyGear();
    toggleTick(g, "smoker");
    expect(g.ticked).toEqual([]);
  });
});

describe("your own items", () => {
  it("adds an item to the chosen list", () => {
    const g = addCustom(emptyGear(), "yard", "Spare queen cage");
    expect(labels2(g, "yard")).toContain("Spare queen cage");
    expect(labels2(g, "extraction")).not.toContain("Spare queen cage");
  });

  it("trims the name and ignores blanks", () => {
    expect(addCustom(emptyGear(), "yard", "   ").custom.yard).toEqual([]);
    const g = addCustom(emptyGear(), "yard", "  Zip ties  ");
    expect(g.custom.yard.map((i) => i.label)).toEqual(["Zip ties"]);
  });

  it("will not add the same name twice, or a built-in one", () => {
    let g = addCustom(emptyGear(), "yard", "Zip ties");
    g = addCustom(g, "yard", "zip TIES");
    expect(g.custom.yard).toHaveLength(1);
    g = addCustom(g, "yard", "Smoker");
    expect(g.custom.yard).toHaveLength(1);
  });

  it("keeps names to a sensible length", () => {
    const g = addCustom(emptyGear(), "yard", "x".repeat(200));
    expect(g.custom.yard[0].label.length).toBeLessThanOrEqual(40);
  });

  it("removes an item and its tick", () => {
    let g = addCustom(emptyGear(), "yard", "Zip ties");
    const id = g.custom.yard[0].id;
    g = toggleTick(g, id);
    g = removeCustom(g, "yard", id);
    expect(g.custom.yard).toEqual([]);
    expect(g.ticked).not.toContain(id);
  });
});

function labels2(g, mode) {
  return allItems(mode, g).map((i) => i.label);
}

describe("starting a new trip", () => {
  it("unticks everything but keeps your own items", () => {
    let g = addCustom(emptyGear(), "yard", "Zip ties");
    g = toggleTick(g, "smoker");
    g = toggleTick(g, g.custom.yard[0].id);
    g = startNewTrip(g);
    expect(g.ticked).toEqual([]);
    expect(g.custom.yard).toHaveLength(1);
  });
});

describe("progress", () => {
  it("counts ticked items in the chosen list only", () => {
    let g = emptyGear();
    const total = allItems("yard", g).length;
    g = toggleTick(g, "smoker");
    g = toggleTick(g, "extractor"); // an extraction day item
    expect(progress("yard", g)).toEqual({ done: 1, total });
  });
});

describe("saving", () => {
  it("remembers ticks and your own items", () => {
    const store = fakeStorage();
    let g = addCustom(emptyGear(), "extraction", "Honey gate");
    g = toggleTick(g, "smoker");
    saveGear(g, store);
    expect(loadGear(store)).toEqual(g);
  });

  it("starts empty when nothing is saved", () => {
    expect(loadGear(fakeStorage())).toEqual(emptyGear());
  });

  it("starts empty when the saved text is damaged", () => {
    expect(loadGear(fakeStorage({ "hive-gear-list": "{not json" }))).toEqual(emptyGear());
    expect(loadGear(fakeStorage({ "hive-gear-list": '{"ticked":5,"custom":7}' }))).toEqual(
      emptyGear(),
    );
  });

  it("falls back to empty when storage is blocked", () => {
    const blocked = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    };
    expect(loadGear(blocked)).toEqual(emptyGear());
    expect(() => saveGear(emptyGear(), blocked)).not.toThrow();
  });
});
