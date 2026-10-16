export default function BackupReminder({ visible, count, onBackup }) {
  if (!visible) return null;
  return (
    <div className="hive-backup-reminder">
      <p>
        📦 {count} inspection{count === 1 ? "" : "s"} logged since your last
        backup. If your phone is lost or replaced, this data goes with it.
      </p>
      <button type="button" className="hive-btn-outline" onClick={onBackup}>
        Backup now (JSON)
      </button>
    </div>
  );
}
