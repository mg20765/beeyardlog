// @vitest-environment node
import { readFileSync, existsSync } from "node:fs";
import { describe, it, expect } from "vitest";

// When someone pastes the app's address into WhatsApp, Messenger, a text or
// LinkedIn, these tags decide whether they see a plain link or a picture card.
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const SITE = "https://beeyardlog.surge.sh";

const meta = (key) => {
  const re = new RegExp(
    `<meta\\s+(?:property|name)="${key}"\\s+content="([^"]*)"`,
    "i",
  );
  return html.match(re)?.[1];
};

describe("share card tags in index.html", () => {
  it("describes the page as a website called BeeYardLog", () => {
    expect(meta("og:type")).toBe("website");
    expect(meta("og:site_name")).toBe("BeeYardLog");
    expect(meta("og:title")).toBe("BeeYardLog: free hive logbook");
  });

  it("has a description that says it works with no signal and no account", () => {
    for (const key of ["description", "og:description"]) {
      const text = meta(key);
      expect(text, key).toMatch(/no signal/i);
      expect(text, key).toMatch(/no account/i);
      expect(text, key).toMatch(/Add to Home Screen/);
      expect(text.length, key).toBeLessThanOrEqual(200);
    }
  });

  it("gives the address the app is published on", () => {
    expect(meta("og:url")).toBe(`${SITE}/`);
  });

  it("points at a full web address for the picture, not a relative path", () => {
    expect(meta("og:image")).toBe(`${SITE}/og-card.png`);
  });

  it("describes the picture for people who can't see it", () => {
    expect(meta("og:image:alt")).toMatch(/.{40,}/);
  });

  it("asks for the large picture card on LinkedIn, X and similar", () => {
    expect(meta("twitter:card")).toBe("summary_large_image");
  });

  it("declares the picture's size, and the size is true", () => {
    const file = new URL("../public/og-card.png", import.meta.url);
    expect(existsSync(file)).toBe(true);
    const bytes = readFileSync(file);
    // A PNG stores its width and height at fixed places near the start.
    expect(bytes.subarray(1, 4).toString()).toBe("PNG");
    expect(bytes.readUInt32BE(16)).toBe(Number(meta("og:image:width")));
    expect(bytes.readUInt32BE(20)).toBe(Number(meta("og:image:height")));
  });

  it("keeps the picture small enough to load quickly on a phone", () => {
    const bytes = readFileSync(new URL("../public/og-card.png", import.meta.url));
    expect(bytes.length).toBeLessThan(250 * 1024);
  });

  it("keeps the tags the Home Screen install relies on", () => {
    expect(html).toContain('rel="manifest"');
    expect(html).toContain('name="theme-color"');
    expect(html).toContain('name="apple-mobile-web-app-title"');
  });
});
