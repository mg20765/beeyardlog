export default function BackupReminder({ visible, count, corrections = 0, onBackup }) {
  if (!visible) return null;
  const total = count + corrections;
  const what =
    corrections > 0
      ? `${count} new and ${corrections} corrected inspection${total === 1 ? "" : "s"}`
      : `${count} inspection${count === 1 ? "" : "s"} logged`;
  return (
    <div className="hive-backup-reminder">
      <p>
        📦 {what} since your last backup. If your phone is lost or replaced,
        this data goes with it.
      </p>
      <button type="button" className="hive-btn-outline" onClick={onBackup}>
        Backup now (JSON)
      </button>
    </div>
  );
}
