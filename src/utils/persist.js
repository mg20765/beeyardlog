// Asks the browser not to delete this site's saved data when the phone runs
// low on space. Without this, browser storage is "best effort": the browser
// may clear it under storage pressure, which for a logbook means losing
// inspections. The browser decides whether to say yes (Chrome looks at how
// much the site is used or installed), so the answer is reported, not assumed.
//
// Returns "granted", "already", "denied", "unsupported" or "error".
// `storage` is passed in so this can be unit tested without a browser.
export async function requestPersistentStorage(storage = globalThis.navigator?.storage) {
  if (!storage || typeof storage.persist !== "function") return "unsupported";
  try {
    if (typeof storage.persisted === "function" && (await storage.persisted())) {
      return "already";
    }
    return (await storage.persist()) ? "granted" : "denied";
  } catch {
    return "error";
  }
}
