// The initials a person uses to mark their own inspections, remembered on the
// phone so they only have to be typed once. `storage` is passed in so this can
// be unit tested.

const KEY = "hive-initials";
const MAX_LENGTH = 6;

export const cleanInitials = (v) => String(v ?? "").trim().toUpperCase().slice(0, MAX_LENGTH);

const browserStorage = () => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

export function loadInitials(storage = browserStorage()) {
  try {
    return cleanInitials(storage?.getItem(KEY));
  } catch {
    return "";
  }
}

export function saveInitials(initials, storage = browserStorage()) {
  try {
    storage?.setItem(KEY, cleanInitials(initials));
  } catch {
    // Not remembered; they just have to be typed again next time.
  }
}
