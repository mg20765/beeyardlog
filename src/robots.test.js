// @vitest-environment node
import { readFileSync, existsSync } from "node:fs";
import { describe, it, expect } from "vitest";

// Surge serves its own robots.txt that blocks every crawler when the app has
// none. That stopped LinkedIn (and search engines) from reading the share card.
// Shipping our own file that allows crawling keeps link previews working.
const file = new URL("../public/robots.txt", import.meta.url);

describe("robots.txt", () => {
  it("is shipped with the app", () => {
    expect(existsSync(file)).toBe(true);
  });

  it("lets crawlers read the site so link previews can load", () => {
    const lines = readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim().toLowerCase());
    expect(lines).toContain("user-agent: *");
    expect(lines).toContain("allow: /");
    expect(lines).not.toContain("disallow: /");
  });
});
