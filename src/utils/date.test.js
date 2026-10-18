import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { todayLocal } from "./date.js";

// The bug: new Date().toISOString() is UTC, so in New Zealand (UTC+12/13)
// the morning shows yesterday's date. Pin the timezone to NZ so this test
// fails on the old behaviour no matter where it runs (including CI in UTC).
describe("todayLocal", () => {
  const originalTz = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = "Pacific/Auckland";
  });
  afterAll(() => {
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
  });

  it("uses the local calendar day, not the UTC day", () => {
    // 20:00 UTC on 16 Oct is 09:00 on 17 Oct in Auckland (NZDT, UTC+13).
    const d = new Date("2026-10-16T20:00:00Z");
    expect(d.toISOString().split("T")[0]).toBe("2026-10-16"); // the old, wrong answer
    expect(todayLocal(d)).toBe("2026-10-17");
  });

  it("zero-pads month and day", () => {
    expect(todayLocal(new Date(2026, 0, 5, 12, 0))).toBe("2026-01-05");
  });

  it("defaults to the current date in YYYY-MM-DD form", () => {
    expect(todayLocal()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
