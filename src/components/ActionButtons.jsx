import { useRef, useState } from "react";

export default function ActionButtons({
  onAdd,
  onClear,
  onRestoreFile,
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
        className="hive-btn-outline"
        onClick={() => fileInputRef.current?.click()}
      >
        Restore backup
      </button>
      <p className="hive-btn-hint">
        Loads a backup file into this app. Restoring adds to what is already
        here, so do it once. The Save your records box above makes the backup
        and the Excel file.
      </p>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      {importMessage && <p className="hive-import-msg">{importMessage}</p>}

      {confirmingClear ? (
        <div className="hive-missing-warning">
          <p>
            Delete all {count} inspection{count === 1 ? "" : "s"} from this
            device? <strong>This can't be undone.</strong> Back up first if you
            might need them.
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
