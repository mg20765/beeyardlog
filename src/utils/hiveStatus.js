// Which hives have been looked at, and which are due.
//
// A hive is one Yard # + Hive ID pair, so "A1" in yard 1 and "A1" in yard 2 are
// two hives. Only saved inspections count; a half-filled draft lives outside
// the log, so it never makes a hive look checked.

export const DEFAULT_LIMIT_DAYS = 28;

const DAY_MS = 24 * 60 * 60 * 1000;

// Reads "YYYY-MM-DD" as a calendar day. Returns null for anything else.
function dayNumber(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(text ?? ""));
  if (!m) return null;
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(ms) ? null : Math.round(ms / DAY_MS);
}

// Whole days from one date to another. Built from calendar days in UTC, so
// clock changes and timezones cannot make a day too long or too short.
export function daysBetween(from, to) {
  const a = dayNumber(from);
  const b = dayNumber(to);
  return a === null || b === null ? null : b - a;
}

const clean = (v) => String(v ?? "").trim();

// A hive's identity: Yard # and Hive ID together, ignoring capitals and spaces.
export const hiveKey = (yard, hiveId) =>
  `${clean(yard).toLowerCase()}|${clean(hiveId).toLowerCase()}`;

// One entry per hive: its latest inspection date, days since, and whether it is
// at or past the limit. Longest-unchecked first. Entries with no hive name or
// no usable date are left out, as there is nothing to track.
//
// `untracked` is a list of hive keys the beekeeper has chosen not to track, such
// as a one-off call-out. They stay on the list, last, but are never overdue.
export function hiveStatuses(log, today, limitDays = DEFAULT_LIMIT_DAYS, untracked = []) {
  const latest = new Map();
  for (const r of log) {
    const hiveId = clean(r["Hive ID"]);
    const date = clean(r.Date);
    if (!hiveId || dayNumber(date) === null) continue;
    const yard = clean(r["Yard #"]);
    const key = hiveKey(yard, hiveId);
    const seen = latest.get(key);
    if (!seen || date > seen.lastDate) latest.set(key, { key, yard, hiveId, lastDate: date });
  }
  return [...latest.values()]
    .map((h) => {
      // A date in the future counts as today rather than a negative number.
      const daysSince = Math.max(0, daysBetween(h.lastDate, today) ?? 0);
      const tracked = !untracked.includes(h.key);
      return { ...h, daysSince, tracked, overdue: tracked && daysSince >= limitDays };
    })
    .sort((a, b) => Number(b.tracked) - Number(a.tracked) || b.daysSince - a.daysSince);
}

export function overdueCount(statuses) {
  return statuses.filter((h) => h.overdue).length;
}

// The limit is a choice the beekeeper can change (2, 3, 4 or 6 weeks), kept on
// the phone. `storage` is passed in so this can be unit tested, and a blocked or
// full store just means the default is used.
export const LIMIT_CHOICES_DAYS = [14, 21, 28, 42];
const LIMIT_KEY = "hive-limit-days";

const browserStorage = () => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

export function loadLimitDays(storage = browserStorage()) {
  try {
    const saved = Number(storage?.getItem(LIMIT_KEY));
    return LIMIT_CHOICES_DAYS.includes(saved) ? saved : DEFAULT_LIMIT_DAYS;
  } catch {
    return DEFAULT_LIMIT_DAYS;
  }
}

export function saveLimitDays(days, storage = browserStorage()) {
  try {
    storage?.setItem(LIMIT_KEY, String(days));
  } catch {
    // Not saved; the choice still applies until the app is closed.
  }
}

// Hives left out of the overdue warning, for example a one-off call-out. Kept on
// the phone, apart from the inspection records.
const UNTRACKED_KEY = "hive-untracked";

export const toggleUntracked = (list, key) =>
  list.includes(key) ? list.filter((k) => k !== key) : [...list, key];

export function loadUntracked(storage = browserStorage()) {
  try {
    const saved = JSON.parse(storage?.getItem(UNTRACKED_KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter((k) => typeof k === "string") : [];
  } catch {
    return [];
  }
}

export function saveUntracked(list, storage = browserStorage()) {
  try {
    storage?.setItem(UNTRACKED_KEY, JSON.stringify(list));
  } catch {
    // Not saved; the choice still applies until the app is closed.
  }
}
