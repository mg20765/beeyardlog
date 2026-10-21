// JSON backup/restore helpers. Unlike the Excel export, a JSON backup can be
// read back into the app - this is what protects a beekeeper's log if a
// phone is lost, replaced, or the app data gets cleared.

import { todayLocal } from "./date.js";

export function downloadBackup(log) {
  const payload = {
    app: "hive-logbook",
    exportedAt: new Date().toISOString(),
    count: log.length,
    inspections: log,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hive_log_backup_${todayLocal()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Reads a backup File, returns the array of inspection rows it contains.
// Accepts either the { inspections: [...] } wrapper this app writes, or a
// bare array, so a plain exported array still imports fine.
const NOT_A_BACKUP = "That file doesn't look like a BeeYardLog backup.";

const isPlainRow = (r) => r !== null && typeof r === "object" && !Array.isArray(r);

export async function readBackupFile(file) {
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error(NOT_A_BACKUP);
  }
  const rows = Array.isArray(parsed) ? parsed : parsed?.inspections;
  if (!Array.isArray(rows)) throw new Error(NOT_A_BACKUP);
  if (rows.length === 0) throw new Error("That backup has no inspections in it.");
  // All or nothing: a half-readable file is a sign something went wrong, and
  // importing part of it would leave the log in a state nobody asked for.
  if (!rows.every(isPlainRow)) {
    throw new Error(
      "That backup file looks damaged (some entries can't be read), so nothing was imported.",
    );
  }
  return rows;
}
