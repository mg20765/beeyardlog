import { describe, it, expect } from "vitest";
import { initialForm, formToRow } from "./hiveForm.js";

describe("initialForm", () => {
  it("defaults every checkbox field to false and text field to empty string", () => {
    const f = initialForm();
    expect(f.hiveId).toBe("");
    expect(f.trtOxalic).toBe(false);
    expect(f.feedNutrition).toBe(false);
    expect(f.afbChecked).toBe(false);
    expect(f.afbSigns).toBe(false);
    expect(f.afbReported).toBe(false);
    expect(f.winteredDown).toBe(false);
  });

  it("defaults date to today in YYYY-MM-DD form", () => {
    const f = initialForm();
    expect(f.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("formToRow", () => {
  it("joins ticked treatment checkboxes into a comma-separated Treatments column", () => {
    const f = { ...initialForm(), hiveId: "H1", trtOxalic: true, trtFormic: true };
    const row = formToRow(f);
    expect(row.Treatments).toBe("Oxalic acid, Formic acid");
  });

  it("leaves Treatments empty when nothing is ticked", () => {
    const row = formToRow(initialForm());
    expect(row.Treatments).toBe("");
  });

  it("keeps Feeding separate from Treatments", () => {
    const f = {
      ...initialForm(),
      trtOxalic: true,
      feedSyrup: true,
      feedNutrition: true,
    };
    const row = formToRow(f);
    expect(row.Treatments).toBe("Oxalic acid");
    expect(row.Feeding).toBe("Syrup, Nutrition boost");
  });

  it("only reports AFB Reported when AFB signs were actually found", () => {
    const notFound = formToRow({ ...initialForm(), afbSigns: false, afbReported: false });
    expect(notFound["AFB Reported (7-day)"]).toBe("");

    const foundNotReported = formToRow({
      ...initialForm(),
      afbSigns: true,
      afbReported: false,
    });
    expect(foundNotReported["AFB Reported (7-day)"]).toBe("No");

    const foundAndReported = formToRow({
      ...initialForm(),
      afbSigns: true,
      afbReported: true,
    });
    expect(foundAndReported["AFB Reported (7-day)"]).toBe("Yes");
  });

  it("joins additions including Wintered down", () => {
    const f = { ...initialForm(), addBoxes: true, winteredDown: true };
    const row = formToRow(f);
    expect(row.Additions).toBe("Boxes added, Wintered down");
  });

  it("only fills New Apiary Location when the hive was actually moved", () => {
    const stayed = formToRow({ ...initialForm(), newApiaryLocation: "Riverside" });
    expect(stayed["New Apiary Location"]).toBe("");

    const moved = formToRow({
      ...initialForm(),
      movedApiary: true,
      newApiaryLocation: "Riverside",
    });
    expect(moved["New Apiary Location"]).toBe("Riverside");
    expect(moved.Additions).toBe("Moved to different apiary");
  });

  it("joins removed-to-storage into Additions", () => {
    const f = { ...initialForm(), removedToStorage: true };
    expect(formToRow(f).Additions).toBe("Removed to storage");
  });

  it("builds Storage Contents from the structured storage fields", () => {
    const f = {
      ...initialForm(),
      removedToStorage: true,
      storageFdBoxes: "2",
      storageThreeQuarterBoxes: "1",
      storageBase: true,
      storageExcluder: true,
      storageFeeder: true,
      storageStrap: true,
    };
    const row = formToRow(f);
    expect(row["Storage Contents"]).toBe(
      "2x FD box, 1x 3/4 box, Base, Queen excluder, Feeder, Strap",
    );
  });

  it("leaves Storage Contents empty when nothing was removed to storage", () => {
    const f = {
      ...initialForm(),
      storageFdBoxes: "2",
      storageBase: true,
    };
    expect(formToRow(f)["Storage Contents"]).toBe("");
  });

  it("includes storageOther text in Storage Contents", () => {
    const f = {
      ...initialForm(),
      removedToStorage: true,
      storageOther: "Spare lid, slightly cracked",
    };
    expect(formToRow(f)["Storage Contents"]).toBe(
      "Spare lid, slightly cracked",
    );
  });

  it("trims stray spaces from Hive ID, Yard # and New Hive ID", () => {
    const row = formToRow({
      ...initialForm(),
      hiveId: "  H1 ",
      yardNo: " Y2",
      newHiveId: "H3  ",
    });
    expect(row["Hive ID"]).toBe("H1");
    expect(row["Yard #"]).toBe("Y2");
    expect(row["New Hive ID"]).toBe("H3");
  });

  it("records the mite check and works out mites per 100 bees", () => {
    const row = formToRow({
      ...initialForm(),
      miteMethod: "Alcohol wash",
      miteBees: "300",
      miteCount: "9",
    });
    expect(row["Mite Method"]).toBe("Alcohol wash");
    expect(row["Bees Sampled"]).toBe("300");
    expect(row["Mites Counted"]).toBe("9");
    expect(row["Mites per 100 Bees"]).toBe(3);
  });

  it("leaves the mite columns empty when no mite check was done", () => {
    const row = formToRow(initialForm());
    expect(row["Mite Method"]).toBe("");
    expect(row["Bees Sampled"]).toBe("");
    expect(row["Mites Counted"]).toBe("");
    expect(row["Mites per 100 Bees"]).toBe("");
  });

  it("leaves mites per 100 empty (but keeps the counts) when the numbers don't add up", () => {
    const row = formToRow({ ...initialForm(), miteBees: "10", miteCount: "50" });
    expect(row["Mites Counted"]).toBe("50");
    expect(row["Mites per 100 Bees"]).toBe("");
  });

  it("records 'Not done' when the mite check was skipped, ignoring any numbers typed", () => {
    const row = formToRow({
      ...initialForm(),
      miteNotDone: true,
      miteMethod: "Alcohol wash",
      miteBees: "300",
      miteCount: "9",
    });
    expect(row["Mite Method"]).toBe("Not done");
    expect(row["Bees Sampled"]).toBe("");
    expect(row["Mites Counted"]).toBe("");
    expect(row["Mites per 100 Bees"]).toBe("");
  });

  it("defaults the mite check to not skipped", () => {
    expect(initialForm().miteNotDone).toBe(false);
  });

  it("passes plain fields through unchanged", () => {
    const f = { ...initialForm(), hiveId: "H7", yardNo: "3", notes: "calm hive" };
    const row = formToRow(f);
    expect(row["Hive ID"]).toBe("H7");
    expect(row["Yard #"]).toBe("3");
    expect(row.Notes).toBe("calm hive");
  });
});
