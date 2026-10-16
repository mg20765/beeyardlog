import { describe, it, expect } from "vitest";
import { omitId } from "./omitId.js";

describe("omitId", () => {
  it("strips the id field and leaves everything else untouched", () => {
    const row = { id: 42, "Hive ID": "H1", Notes: "calm" };
    expect(omitId(row)).toEqual({ "Hive ID": "H1", Notes: "calm" });
  });

  it("doesn't mutate the original object", () => {
    const row = { id: 1, "Hive ID": "H1" };
    omitId(row);
    expect(row).toEqual({ id: 1, "Hive ID": "H1" });
  });

  it("is a no-op (aside from copying) when there's no id field", () => {
    const row = { "Hive ID": "H2" };
    expect(omitId(row)).toEqual({ "Hive ID": "H2" });
  });
});
