import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";

// Runs the real public/sw.js against stand-ins for the service worker globals,
// so the offline logic can be tested without a browser.
function loadServiceWorker({ fetchImpl }) {
  const handlers = {};
  const put = vi.fn().mockResolvedValue(undefined);
  const caches = {
    open: vi.fn().mockResolvedValue({ put, addAll: vi.fn() }),
    match: vi.fn().mockResolvedValue(undefined),
    keys: vi.fn().mockResolvedValue([]),
    delete: vi.fn(),
  };
  const self = {
    addEventListener: (type, fn) => {
      handlers[type] = fn;
    },
    location: { origin: "https://app.test" },
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn() },
  };
  const code = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
  new Function("self", "caches", "fetch", code)(self, caches, fetchImpl);
  return { handlers, put, caches };
}

async function navigate(sw, url = "https://app.test/") {
  let response;
  sw.handlers.fetch({
    request: { method: "GET", url, mode: "navigate" },
    respondWith: (p) => {
      response = p;
    },
  });
  const result = await response;
  // Let the (unawaited) cache write run.
  await new Promise((r) => setTimeout(r, 0));
  return result;
}

describe("service worker page navigation", () => {
  it("keeps a good page as the offline start page", async () => {
    const sw = loadServiceWorker({
      fetchImpl: async () => new Response("<html>app</html>", { status: 200 }),
    });
    await navigate(sw);
    expect(sw.put).toHaveBeenCalledTimes(1);
    expect(sw.put.mock.calls[0][0]).toBe("/index.html");
  });

  it("does not replace the offline start page with an error page", async () => {
    const sw = loadServiceWorker({
      fetchImpl: async () => new Response("Not found", { status: 404 }),
    });
    const res = await navigate(sw, "https://app.test/wrong-address");
    expect(res.status).toBe(404); // the person still sees the error online
    expect(sw.put).not.toHaveBeenCalled();
  });

  it("does not cache a server error either", async () => {
    const sw = loadServiceWorker({
      fetchImpl: async () => new Response("oops", { status: 500 }),
    });
    await navigate(sw);
    expect(sw.put).not.toHaveBeenCalled();
  });
});
