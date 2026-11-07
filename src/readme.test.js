// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";

// The README is the first thing a visitor reads, and its link is how a friend
// starts using the app. These checks keep that link pointing at the address the
// app is published on.
const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
const NEW_ADDRESS = "https://beeyardlog.surge.sh";

describe("README live address", () => {
  it("points the Live app line at the app's own address", () => {
    const line = readme.split("\n").find((l) => l.startsWith("**Live app:**"));
    expect(line).toBeDefined();
    expect(line).toContain(NEW_ADDRESS);
  });

  it("tells a new user to open that same address first, with signal", () => {
    const step = readme.split("\n").find((l) => /^1\.\s+Open\s+https?:\/\//.test(l));
    expect(step).toBeDefined();
    expect(step).toContain(NEW_ADDRESS);
    expect(step).toMatch(/with signal/);
  });

  it("no longer mentions the old address that carried a personal name", () => {
    expect(readme).not.toContain("hive-logbook-maria");
  });

  it("still explains how to add the app to the Home Screen", () => {
    expect(readme).toMatch(/Add to Home Screen/);
  });
});
