import { useRef, useState } from "react";

export default function ActionButtons({
  onAdd,
  onExport,
  onClear,
  onBackup,
  onRestoreFile,
  exportDisabled,
  backupDisabled,
  importMessage,
  count,
}) {
  const fileInputRef = useRef(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onRestoreFile(file);
    e.target.value = "";
  };

  return (
    <>
      <button type="button" className="hive-btn-add" onClick={onAdd}>
        + Add to log
      </button>
      <button
        type="button"
        className="hive-btn-export"
        onClick={onExport}
        disabled={exportDisabled}
      >
        Export all to Excel
      </button>
      <p className="hive-btn-hint">
        Opens as a real spreadsheet in Excel or Google Sheets.
      </p>

      <div className="hive-row2" style={{ marginBottom: 4 }}>
        <button
          type="button"
          className="hive-btn-outline"
          onClick={onBackup}
          disabled={backupDisabled}
        >
          Backup (JSON)
        </button>
        <button
          type="button"
          className="hive-btn-outline"
          onClick={() => fileInputRef.current?.click()}
        >
          Restore backup
        </button>
      </div>
      <p className="hive-btn-hint">
        For saving/restoring your log on this or a new phone — not for
        viewing. Use "Export all to Excel" above to see your data.
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      {importMessage && <p className="hive-import-msg">{importMessage}</p>}

      {confirmingClear ? (
        <div className="hive-missing-warning">
          <p>
            Delete all {count} inspection{count === 1 ? "" : "s"} from this
            device? <strong>This can't be undone.</strong> Back up first if
            you might need them.
          </p>
          <div className="hive-row2">
            <button
              type="button"
              className="hive-btn-outline"
              onClick={() => setConfirmingClear(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="hive-btn-clear"
              onClick={() => {
                setConfirmingClear(false);
                onClear();
              }}
            >
              Yes, clear all
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="hive-btn-clear"
          onClick={() => (count > 0 ? setConfirmingClear(true) : onClear())}
        >
          Clear log
        </button>
      )}
    </>
  );
}
