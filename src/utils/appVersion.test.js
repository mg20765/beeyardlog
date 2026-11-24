import { describe, it, expect, vi } from "vitest";
import {
  assetFromHtml,
  isUpdateAvailable,
  checkForUpdate,
  VERSION_CHECK_PARAM,
} from "./appVersion.js";

const page = (asset) => `<!doctype html>
<html><head><title>BeeYardLog</title>
<script type="module" crossorigin src="${asset}"></script>
<link rel="stylesheet" crossorigin href="/assets/index-style.css">
</head><body><div id="root"></div></body></html>`;

describe("assetFromHtml", () => {
  it("finds the app's script, which changes with every new version", () => {
    expect(assetFromHtml(page("/assets/index-abc123.js"))).toBe("/assets/index-abc123.js");
  });

  it("ignores the stylesheet", () => {
    expect(assetFromHtml('<link href="/assets/index-style.css">')).toBeNull();
  });

  it("returns null for a page with no app script, such as an error page", () => {
    expect(assetFromHtml("<html>Not found</html>")).toBeNull();
    expect(assetFromHtml("")).toBeNull();
    expect(assetFromHtml(undefined)).toBeNull();
  });
});

describe("isUpdateAvailable", () => {
  it("is true when the live page points at a different script", () => {
    expect(isUpdateAvailable("/assets/index-old.js", page("/assets/index-new.js"))).toBe(true);
  });

  it("is false when it is the same script", () => {
    expect(isUpdateAvailable("/assets/index-a.js", page("/assets/index-a.js"))).toBe(false);
  });

  it("is false when either side cannot be read, so nobody sees a false alarm", () => {
    expect(isUpdateAvailable(null, page("/assets/index-a.js"))).toBe(false);
    expect(isUpdateAvailable("/assets/index-a.js", "<html>error</html>")).toBe(false);
  });
});

describe("checkForUpdate", () => {
  const ok = (html) => vi.fn().mockResolvedValue({ ok: true, text: async () => html });

  it("asks the network for the page and says whether a new version is out", async () => {
    const fetchFn = ok(page("/assets/index-new.js"));
    expect(await checkForUpdate(fetchFn, "/assets/index-old.js")).toBe(true);
    const [url, options] = fetchFn.mock.calls[0];
    expect(url).toContain(VERSION_CHECK_PARAM);
    expect(options.cache).toBe("no-store");
  });

  it("uses a different address each time so nothing is served from a saved copy", async () => {
    const fetchFn = ok(page("/assets/index-a.js"));
    await checkForUpdate(fetchFn, "/assets/index-a.js", 1);
    await checkForUpdate(fetchFn, "/assets/index-a.js", 2);
    expect(fetchFn.mock.calls[0][0]).not.toBe(fetchFn.mock.calls[1][0]);
  });

  it("says no when it is the same version", async () => {
    expect(await checkForUpdate(ok(page("/assets/index-a.js")), "/assets/index-a.js")).toBe(false);
  });

  it("says no when there is no signal or the server gives an error", async () => {
    const offline = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await checkForUpdate(offline, "/assets/index-a.js")).toBe(false);
    const broken = vi.fn().mockResolvedValue({ ok: false, text: async () => page("/assets/index-b.js") });
    expect(await checkForUpdate(broken, "/assets/index-a.js")).toBe(false);
  });
});
