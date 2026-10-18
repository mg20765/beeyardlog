// Today's date as YYYY-MM-DD in the user's own timezone.
//
// new Date().toISOString() is always UTC, so for someone in New Zealand
// (UTC+12/13) it returns yesterday's date until about midday. Building the
// string from the local getters gives the date on their own calendar.
export function todayLocal(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
