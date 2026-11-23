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

// "YYYY-MM-DD" that is a real day on the calendar (not 2027-02-30).
export function isRealDate(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(text ?? ""));
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return (
    d.getUTCFullYear() === Number(m[1]) &&
    d.getUTCMonth() === Number(m[2]) - 1 &&
    d.getUTCDate() === Number(m[3])
  );
}
