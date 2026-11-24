// Noticing that a newer version of the app has been put online.
//
// Every build gives the app's script a new name (for example
// /assets/index-AbC123.js), and the page that loads it names the current one. So
// asking the server for the page and comparing the script name shows whether the
// copy running now is the newest.

export const VERSION_CHECK_PARAM = "version-check";

// The app's script path in a page, or null when there isn't one (an error page,
// for example).
export function assetFromHtml(html) {
  const m = /<script[^>]+src="(\/assets\/[^"]+\.js)"/.exec(String(html ?? ""));
  return m ? m[1] : null;
}

// The script this page is running now.
export function currentAsset(doc = globalThis.document) {
  const el = doc?.querySelector?.('script[src*="/assets/"]');
  if (!el) return null;
  try {
    return new URL(el.src, doc.baseURI).pathname;
  } catch {
    return null;
  }
}

// True only when both are known and different, so a failed check never shows a
// false alarm.
export function isUpdateAvailable(current, html) {
  const latest = assetFromHtml(html);
  return Boolean(current && latest && latest !== current);
}

// Asks the network for the page. The address changes each time and the service
// worker lets this kind of request through, so the answer is never a saved copy.
export async function checkForUpdate(fetchFn, current, stamp = Date.now()) {
  try {
    const res = await fetchFn(`/index.html?${VERSION_CHECK_PARAM}=${stamp}`, {
      cache: "no-store",
    });
    if (!res.ok) return false;
    return isUpdateAvailable(current, await res.text());
  } catch {
    return false;
  }
}
