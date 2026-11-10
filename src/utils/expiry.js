// Expiry dates for things that matter in the yard: an EpiPen if you carry one,
// then treatment strips or anything else you add. An item counts as in date
// through the end of its expiry day, warns for 30 days before, and is expired
// after.
//
// Not everyone carries an EpiPen, so it only appears once you say you do.
// Kept on the phone, apart from the inspection records, so it is not part of
// the backup file and can never touch the log. `storage` is passed in so this
// can be unit tested.

import { daysBetween } from "./hiveStatus.js";

export const EXPIRY_WARN_DAYS = 30;

const MAX_NAME = 40;
const EPIPEN_ID = "epipen";
const EPIPEN_LABEL = "EpiPen";

export const emptyExpiry = () => ({ epipen: { has: false, date: "" }, items: [] });

// "YYYY-MM-DD" that is a real day on the calendar (not 2027-02-30).
function validDate(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(text ?? ""));
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return (
    d.getUTCFullYear() === Number(m[1]) &&
    d.getUTCMonth() === Number(m[2]) - 1 &&
    d.getUTCDate() === Number(m[3])
  );
}

const cleanDate = (text) => (validDate(text) ? text : "");

export const setHasEpipen = (state, has) => ({
  ...state,
  epipen: { ...state.epipen, has: Boolean(has) },
});

// An empty date clears it; a date that is not a real day is ignored.
export function setDate(state, id, date) {
  if (date !== "" && !validDate(date)) return state;
  if (id === EPIPEN_ID) return { ...state, epipen: { ...state.epipen, date } };
  return { ...state, items: state.items.map((i) => (i.id === id ? { ...i, date } : i)) };
}

export function addItem(state, name, date = "") {
  const label = String(name ?? "").trim().slice(0, MAX_NAME).trim();
  if (!label) return state;
  const taken = [EPIPEN_LABEL, ...state.items.map((i) => i.label)];
  if (taken.some((t) => t.toLowerCase() === label.toLowerCase())) return state;
  const item = { id: `custom:${label.toLowerCase()}`, label, date: cleanDate(date) };
  return { ...state, items: [...state.items, item] };
}

// Only your own items are removed. The EpiPen is switched off instead.
export function removeItem(state, id) {
  if (id === EPIPEN_ID) return state;
  return { ...state, items: state.items.filter((i) => i.id !== id) };
}

export function expiryStatus(item, today) {
  const days = item.date ? daysBetween(today, item.date) : null;
  if (days === null) return { status: "unset", days: null };
  if (days < 0) return { status: "expired", days };
  return { status: days <= EXPIRY_WARN_DAYS ? "soon" : "ok", days };
}

const RANK = { expired: 0, soon: 1, ok: 2, unset: 3 };

// Most urgent first: expired, then soonest, then in date, then no date.
export function statuses(state, today) {
  const rows = state.epipen.has
    ? [{ id: EPIPEN_ID, label: EPIPEN_LABEL, date: state.epipen.date }, ...state.items]
    : state.items;
  return rows
    .map((i) => ({ ...i, ...expiryStatus(i, today) }))
    .sort((a, b) => RANK[a.status] - RANK[b.status] || (a.days ?? 0) - (b.days ?? 0));
}

export const warnings = (list) =>
  list.filter((i) => i.status === "expired" || i.status === "soon");

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function expiryText({ status, days }) {
  if (status === "expired") return `expired ${plural(-days, "day")} ago`;
  if (status === "soon") {
    if (days === 0) return "expires today";
    return days === 1 ? "expires tomorrow" : `expires in ${days} days`;
  }
  if (status === "ok") return `OK, ${days} days left`;
  return "no date set";
}

const KEY = "hive-expiry-dates";

const browserStorage = () => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

const isItem = (i) => i && typeof i.id === "string" && typeof i.label === "string";

export function loadExpiry(storage = browserStorage()) {
  try {
    const saved = JSON.parse(storage?.getItem(KEY) ?? "null");
    if (!saved || !Array.isArray(saved.items)) return emptyExpiry();
    return {
      epipen: {
        has: saved.epipen?.has === true,
        date: cleanDate(saved.epipen?.date),
      },
      items: saved.items
        .filter(isItem)
        .map((i) => ({ id: i.id, label: i.label.slice(0, MAX_NAME), date: cleanDate(i.date) })),
    };
  } catch {
    return emptyExpiry();
  }
}

export function saveExpiry(state, storage = browserStorage()) {
  try {
    storage?.setItem(KEY, JSON.stringify(state));
  } catch {
    // Not saved; the dates still work until the app is closed.
  }
}
