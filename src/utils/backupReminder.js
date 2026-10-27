// Backup-reminder maths, kept pure so it can be unit tested.
//
// The reminder used to compare the log's length with "how many entries
// existed at the last backup". That drifts: restoring a backup adds entries
// that count as "new", and deleting entries shrinks the log so real new
// entries go uncounted. Instead we remember the newest entry id that was
// backed up (the "watermark"). Ids only ever go up, so "unbacked" simply
// means "id above the watermark", whatever has been deleted or restored.

export function maxId(log) {
  return log.reduce((max, r) => (r.id > max ? r.id : max), 0);
}

export function entriesSinceBackup(log, watermark) {
  return log.filter((r) => r.id > watermark).length;
}

// New entries plus entries corrected since the last backup. A correction keeps
// the entry's id, so it can't be seen from the ids alone; it is counted
// separately, because the backup file still holds the old version.
export function changesSinceBackup(log, watermark, corrections = 0) {
  const fixes = Number.isFinite(corrections) && corrections > 0 ? Math.floor(corrections) : 0;
  return entriesSinceBackup(log, watermark) + fixes;
}

// Converts the old saved value ("N entries existed at the last backup") to a
// watermark, so people who already have a backup history keep it.
export function watermarkFromLegacyCount(log, count) {
  if (!(count > 0) || log.length === 0) return 0;
  const ids = log.map((r) => r.id).sort((a, b) => a - b);
  return count >= ids.length ? ids[ids.length - 1] : ids[count - 1];
}

// Entries that arrive by restoring a backup file are already backed up, but
// only say so if nothing was waiting for a backup beforehand - otherwise the
// watermark would silently cover entries that have never been backed up.
export function watermarkAfterRestore(prevLog, prevWatermark, newLog) {
  return entriesSinceBackup(prevLog, prevWatermark) === 0
    ? maxId(newLog)
    : prevWatermark;
}
