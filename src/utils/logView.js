// How the log is shown: newest first, and narrowed by a search.

// Newest date first; the later-saved entry first when dates match; entries with
// no usable date last. Returns a new list.
export function sortNewestFirst(log) {
  return [...log].sort((a, b) => {
    const da = a.Date || "";
    const db = b.Date || "";
    if (da !== db) return da < db ? 1 : -1;
    return (b.id ?? 0) - (a.id ?? 0);
  });
}

const SEARCHED = ["Hive ID", "Yard #", "Notes", "Date"];

// Entries whose Hive ID, yard, notes or date contain the search, ignoring
// capitals and spaces around it. An empty search returns the whole log.
export function filterLog(log, query) {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return log;
  return log.filter((r) =>
    SEARCHED.some((field) => String(r[field] ?? "").toLowerCase().includes(q)),
  );
}
