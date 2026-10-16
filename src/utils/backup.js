// JSON backup/restore helpers. Unlike the Excel export, a JSON backup can be
// read back into the app - this is what protects a beekeeper's log if a
// phone is lost, replaced, or the app data gets cleared.

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
  a.download = `hive_log_backup_${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Reads a backup File, returns the array of inspection rows it contains.
// Accepts either the { inspections: [...] } wrapper this app writes, or a
// bare array, so a plain exported array still imports fine.
export async function readBackupFile(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const rows = Array.isArray(parsed) ? parsed : parsed.inspections;
  if (!Array.isArray(rows)) {
    throw new Error("That file doesn't look like a Yardbook backup.");
  }
  return rows;
}
