// Groups of sites, such as pollination, early sites or late sites. A group is
// saved on each entry, so it is in the backup file and the Excel export. These
// helpers fill it in for you from what the yard was last given.

const clean = (v) => String(v ?? "").trim();

// The group on the latest entry for that yard that has one, or "".
export function groupForYard(log, yard) {
  const wanted = clean(yard).toLowerCase();
  if (!wanted) return "";
  let best = null;
  for (const r of log) {
    if (clean(r["Yard #"]).toLowerCase() !== wanted) continue;
    const group = clean(r.Group);
    if (!group) continue;
    const date = clean(r.Date);
    const id = r.id ?? 0;
    if (!best || date > best.date || (date === best.date && id >= best.id)) {
      best = { date, id, group };
    }
  }
  return best ? best.group : "";
}

// Each group used so far, once, as it was last written, in alphabetical order.
export function groupSuggestions(log) {
  const byName = new Map();
  const ordered = [...log].sort(
    (a, b) => clean(a.Date).localeCompare(clean(b.Date)) || (a.id ?? 0) - (b.id ?? 0),
  );
  for (const r of ordered) {
    const group = clean(r.Group);
    if (group) byName.set(group.toLowerCase(), group);
  }
  return [...byName.values()].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

// What the Group box should say after the Yard # changes. A group filled in for
// you follows the yard; one you typed yourself stays.
export function nextGroup({ prevGroup, prevYard, newYard, log }) {
  const filledInForYou = prevGroup === "" || prevGroup === groupForYard(log, prevYard);
  return filledInForYou ? groupForYard(log, newYard) : prevGroup;
}
