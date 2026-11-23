// What to tell the beekeeper about their backup: when the last one was made,
// whether anything has changed since, and whether the phone is protecting the
// app's data. The records live only on the phone, so a backup file is the only
// protection if the phone, the browser or a cleaner app wipes them.

import { daysBetween } from "./hiveStatus.js";
import { isRealDate } from "./date.js";

export const BACKUP_STALE_DAYS = 7;

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// level: "none" (nothing to back up), "ok", "warn" (changes waiting) or "alert"
// (no backup, or an old one).
export function backupStatus({ lastBackupDate, today, changesSince, hasEntries, backedUpBefore }) {
  if (!hasEntries) return { level: "none", text: "Nothing to back up yet." };

  if (!lastBackupDate) {
    return backedUpBefore
      ? {
          level: "warn",
          text: "You've backed up before, but the date isn't recorded. Save a new backup.",
        }
      : { level: "alert", text: "No backup yet. Your records are only on this phone." };
  }

  // A date in the future counts as today.
  const days = Math.max(0, daysBetween(lastBackupDate, today) ?? 0);
  const when = days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;

  if (days >= BACKUP_STALE_DAYS) {
    return { level: "alert", text: `Last backup: ${when}. Save a new one.` };
  }
  if (changesSince > 0) {
    return {
      level: "warn",
      text: `Last backup: ${when} · ${plural(changesSince, "change")} not backed up yet`,
    };
  }
  return { level: "ok", text: `Last backup: ${when}` };
}

// "on" when the phone has agreed to keep this app's data, "off" when it hasn't,
// "unknown" when the browser can't say. `storage` is passed in for testing.
export async function storageProtection(storage = globalThis.navigator?.storage) {
  try {
    if (typeof storage?.persisted !== "function") return "unknown";
    return (await storage.persisted()) ? "on" : "off";
  } catch {
    return "unknown";
  }
}

const KEY = "hive_last_backup_date";

const browserStorage = () => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

export function loadLastBackupDate(storage = browserStorage()) {
  try {
    const saved = storage?.getItem(KEY);
    return isRealDate(saved) ? saved : null;
  } catch {
    return null;
  }
}

export function saveLastBackupDate(date, storage = browserStorage()) {
  try {
    storage?.setItem(KEY, date);
  } catch {
    // Not saved; the line just won't know the date next time.
  }
}
