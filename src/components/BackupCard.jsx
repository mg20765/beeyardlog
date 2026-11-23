const PROTECTION = {
  on: "Storage protection: on. Your phone has agreed to keep this app's data.",
  off: "Storage protection: off. Your phone may clear this app's data if space runs low or a cleaner app runs. Keep backups, and add this app to your Home Screen.",
  unknown:
    "Storage protection: can't be checked on this browser. Keep backups.",
};

// Where to save the records, at the top of the Log view so it is hard to miss.
// The records are stored only on this phone, so a backup file is the protection.
export default function BackupCard({ status, protection, onBackup, onExport }) {
  const disabled = status.level === "none";
  return (
    <div className="hive-save-card">
      <p className="hive-section__title">Save your records</p>
      <p className={`hive-save-status hive-save-status--${status.level}`}>
        {status.text}
      </p>
      <button
        type="button"
        className="hive-btn-add"
        onClick={onBackup}
        disabled={disabled}
      >
        Save backup (JSON)
      </button>
      <button
        type="button"
        className="hive-btn-export"
        onClick={onExport}
        disabled={disabled}
      >
        Export all to Excel
      </button>
      <p className="hive-btn-hint">
        Your records are stored only on this phone. Save a backup often and keep
        a copy somewhere else, such as Dropbox or email. The backup file is what
        you restore from; Excel is for viewing.
      </p>
      <p className="hive-btn-hint">
        {PROTECTION[protection] ?? PROTECTION.unknown}
      </p>
    </div>
  );
}
