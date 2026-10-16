import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { initialForm, formToRow } from "../utils/hiveForm.js";
import { omitId } from "../utils/omitId.js";
import { isHiveIdMissing, getMissingNudgeFields } from "../utils/validation.js";
import {
  getAllInspections,
  addInspection,
  deleteInspection,
  clearInspections,
  importInspections,
} from "../db/hiveDb.js";
import { downloadBackup, readBackupFile } from "../utils/backup.js";

// Small on-device checkpoint (not the log itself, just a nudge tracker) for
// reminding beekeepers to back up every N new inspections. We store how
// many entries existed at the last backup and diff against the live log
// size - that way it's correct even for logs that already had entries
// before this reminder existed, instead of counting forward from 0.
const LAST_BACKUP_COUNT_KEY = "hive_last_backup_count";
const BACKUP_REMINDER_THRESHOLD = 10;

function loadLastBackupCount() {
  try {
    const saved = Number(localStorage.getItem(LAST_BACKUP_COUNT_KEY));
    return Number.isFinite(saved) && saved > 0 ? saved : 0;
  } catch {
    return 0;
  }
}

function saveLastBackupCount(n) {
  try {
    localStorage.setItem(LAST_BACKUP_COUNT_KEY, String(n));
  } catch {
    // ignore
  }
}

// Owns the inspection form state, the saved log (backed by IndexedDB via
// idb), and the add/delete/clear/export/backup actions used by the app.
export default function useHiveLog() {
  const [form, setForm] = useState(initialForm());
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [justSaved, setJustSaved] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [lastBackupCount, setLastBackupCount] = useState(loadLastBackupCount);
  const [hiveIdError, setHiveIdError] = useState(false);
  const [missingFields, setMissingFields] = useState(null); // array of {key,label} or null
  const savedTimeoutRef = useRef(null);
  const messageTimeoutRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getAllInspections()
      .then((rows) => {
        if (!cancelled) setLog(rows);
      })
      .catch((err) => console.warn("Could not load inspections:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () => () => {
      clearTimeout(savedTimeoutRef.current);
      clearTimeout(messageTimeoutRef.current);
    },
    [],
  );

  const flashSaved = () => {
    setJustSaved(true);
    clearTimeout(savedTimeoutRef.current);
    savedTimeoutRef.current = setTimeout(() => setJustSaved(false), 2000);
  };

  const flashMessage = (msg) => {
    setImportMessage(msg);
    clearTimeout(messageTimeoutRef.current);
    messageTimeoutRef.current = setTimeout(() => setImportMessage(""), 4000);
  };

  const set = (key) => (e) => {
    if (key === "hiveId") setHiveIdError(false);
    setForm((f) => ({
      ...f,
      [key]: e && e.target !== undefined ? e.target.value : e,
    }));
  };

  const setCheck = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.checked }));

  const commitAddToLog = async () => {
    const saved = await addInspection(formToRow(form));
    setLog((prev) => [...prev, saved]);
    setForm(initialForm());
    setMissingFields(null);
    flashSaved();
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  // Called by the "+ Add to log" button. Blocks on a missing Hive ID
  // (an entry with no ID isn't useful data), and surfaces a dismissible
  // warning for the handful of other fields worth double-checking before
  // saving, rather than only noticing they're blank later in Excel.
  const addToLog = async () => {
    if (isHiveIdMissing(form)) {
      setHiveIdError(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const missing = getMissingNudgeFields(form);
    if (missing.length > 0) {
      setMissingFields(missing);
      return;
    }
    await commitAddToLog();
  };

  const confirmAddAnyway = async () => {
    await commitAddToLog();
  };

  // Jumps to the first still-blank field instead of just closing the
  // banner and leaving the beekeeper to hunt for it themselves.
  const dismissMissingFields = () => {
    const first = missingFields && missingFields[0];
    setMissingFields(null);
    if (first) {
      const el = document.getElementById(`hive-field-${first.key}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const deleteEntry = async (id) => {
    await deleteInspection(id);
    setLog((prev) => prev.filter((r) => r.id !== id));
  };

  const clearLog = async () => {
    await clearInspections();
    setLog([]);
    setLastBackupCount(0);
    saveLastBackupCount(0);
  };

  const exportAll = () => {
    if (log.length === 0) return;
    const rows = log.map(omitId);
    const ws = XLSX.utils.json_to_sheet(rows);
    const keys = Object.keys(rows[0]);
    ws["!cols"] = keys.map((k) => ({
      wch:
        Math.max(k.length, ...rows.map((r) => String(r[k] || "").length)) + 2,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inspections");
    XLSX.writeFile(
      wb,
      `hive_log_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  const backupToFile = () => {
    if (log.length === 0) return;
    downloadBackup(log.map(omitId));
    setLastBackupCount(log.length);
    saveLastBackupCount(log.length);
  };

  const restoreFromFile = async (file) => {
    try {
      const rows = await readBackupFile(file);
      const updated = await importInspections(rows);
      setLog(updated);
      flashMessage(
        `Imported ${rows.length} inspection${rows.length === 1 ? "" : "s"}.`,
      );
    } catch (err) {
      flashMessage(err.message || "Could not read that backup file.");
    }
  };

  const entriesSinceBackup = Math.max(0, log.length - lastBackupCount);

  return {
    form,
    log,
    loading,
    justSaved,
    importMessage,
    hiveIdError,
    missingFields,
    needsBackupReminder:
      !loading && entriesSinceBackup >= BACKUP_REMINDER_THRESHOLD,
    entriesSinceBackup,
    set,
    setCheck,
    addToLog,
    confirmAddAnyway,
    dismissMissingFields,
    deleteEntry,
    clearLog,
    exportAll,
    backupToFile,
    restoreFromFile,
  };
}
