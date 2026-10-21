import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { initialForm, formToRow } from "../utils/hiveForm.js";
import { omitId } from "../utils/omitId.js";
import { rowsForExport } from "../utils/exportRows.js";
import { todayLocal } from "../utils/date.js";
import {
  isHiveIdMissing,
  getMissingNudgeFields,
  getInputProblems,
} from "../utils/validation.js";
import {
  getAllInspections,
  addInspection,
  deleteInspection,
  clearInspections,
  importInspections,
} from "../db/hiveDb.js";
import { downloadBackup, readBackupFile } from "../utils/backup.js";
import { loadDraft, saveDraft, clearDraft } from "../utils/draft.js";
import { requestPersistentStorage } from "../utils/persist.js";
import {
  maxId,
  entriesSinceBackup as countSinceBackup,
  watermarkFromLegacyCount,
  watermarkAfterRestore,
} from "../utils/backupReminder.js";

// Small on-device checkpoint (not the log itself, just a nudge tracker) for
// reminding beekeepers to back up every N new inspections. We store the id
// of the newest entry that was backed up (see utils/backupReminder.js).
// The older key held "how many entries existed at the last backup"; it is
// read once and converted so existing backup history isn't lost.
const LAST_BACKUP_ID_KEY = "hive_last_backup_id";
const LEGACY_BACKUP_COUNT_KEY = "hive_last_backup_count";
const BACKUP_REMINDER_THRESHOLD = 10;

// Returns the stored number, or null when the key is missing or unreadable.
function readSavedNumber(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}

function saveLastBackupId(n) {
  try {
    localStorage.setItem(LAST_BACKUP_ID_KEY, String(n));
  } catch {
    // ignore
  }
}

// Owns the inspection form state, the saved log (backed by IndexedDB via
// idb), and the add/delete/clear/export/backup actions used by the app.
export default function useHiveLog() {
  // A half-filled form saved before the page reloaded (see utils/draft.js).
  const [savedDraft] = useState(() => loadDraft());
  const [form, setForm] = useState(() => savedDraft ?? initialForm());
  const [draftRestored, setDraftRestored] = useState(savedDraft !== null);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [justSaved, setJustSaved] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [lastBackupId, setLastBackupId] = useState(
    () => readSavedNumber(LAST_BACKUP_ID_KEY) ?? 0,
  );
  const [hiveIdError, setHiveIdError] = useState(false);
  const [inputProblems, setInputProblems] = useState(null); // array of messages or null
  const [missingFields, setMissingFields] = useState(null); // array of {key,label} or null
  const savedTimeoutRef = useRef(null);
  const messageTimeoutRef = useRef(null);
  const savingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getAllInspections()
      .then((rows) => {
        if (cancelled) return;
        setLog(rows);
        // Existing data is worth protecting as soon as the app opens.
        if (rows.length > 0) requestPersistentStorage();
        // One-off upgrade from the old "count at last backup" value.
        if (readSavedNumber(LAST_BACKUP_ID_KEY) === null) {
          const legacy = readSavedNumber(LEGACY_BACKUP_COUNT_KEY);
          if (legacy) {
            const id = watermarkFromLegacyCount(rows, legacy);
            setLastBackupId(id);
            saveLastBackupId(id);
          }
        }
      })
      .catch((err) => console.warn("Could not load inspections:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the draft in step with the form on every change. A blank form (for
  // example right after saving an entry) removes the draft.
  useEffect(() => {
    saveDraft(form);
  }, [form]);

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
    setInputProblems(null);
    setForm((f) => ({
      ...f,
      [key]: e && e.target !== undefined ? e.target.value : e,
    }));
  };

  const setCheck = (key) => (e) => {
    setInputProblems(null);
    setForm((f) => ({ ...f, [key]: e.target.checked }));
  };

  // The ref (not state) guards against a double-tap: state updates are
  // async, so two quick taps would both see "not saving" and add twice.
  const commitAddToLog = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      const saved = await addInspection(formToRow(form));
      setLog((prev) => [...prev, saved]);
      setForm(initialForm());
      setDraftRestored(false);
      setMissingFields(null);
      flashSaved();
      // The first saved entry is the moment there is something to protect.
      requestPersistentStorage();
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } catch (err) {
      console.warn("Could not save inspection:", err);
      flashMessage("Couldn't save this entry. Your form is kept - try again.");
    } finally {
      savingRef.current = false;
    }
  };

  const requireHiveId = () => {
    if (!isHiveIdMissing(form)) return true;
    setMissingFields(null);
    setHiveIdError(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return false;
  };

  // Values that are clearly wrong (a brood coverage of 150, a cleared date)
  // are stopped at save, with a list of what to fix.
  const passesInputChecks = () => {
    const problems = getInputProblems(form);
    if (problems.length === 0) return true;
    setMissingFields(null);
    setInputProblems(problems);
    // Take the person straight to the first problem instead of leaving them
    // to scroll back up and find it.
    goToField(problems[0].field);
    return false;
  };

  // Scrolls a form field to the middle of the screen and puts the cursor in it.
  const goToField = (field) => {
    const el = document.getElementById(`field-${field}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus({ preventScroll: true });
  };

  // Called by the "+ Add to log" button. Blocks on a missing Hive ID
  // (an entry with no ID isn't useful data), and surfaces a dismissible
  // warning for the handful of other fields worth double-checking before
  // saving, rather than only noticing they're blank later in Excel.
  const addToLog = async () => {
    if (!requireHiveId()) return;
    if (!passesInputChecks()) return;
    const missing = getMissingNudgeFields(form);
    if (missing.length > 0) {
      setMissingFields(missing);
      return;
    }
    await commitAddToLog();
  };

  // The Hive ID could have been cleared while the warning was showing, so
  // the hard requirement is checked again here.
  const confirmAddAnyway = async () => {
    if (!requireHiveId()) return;
    if (!passesInputChecks()) return;
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

  const discardDraft = () => {
    setForm(initialForm());
    setDraftRestored(false);
    setHiveIdError(false);
    setInputProblems(null);
    setMissingFields(null);
    clearDraft();
  };

  const deleteEntry = async (id) => {
    try {
      await deleteInspection(id);
      setLog((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.warn("Could not delete inspection:", err);
      flashMessage("Couldn't delete that entry. Please try again.");
    }
  };

  const clearLog = async () => {
    try {
      await clearInspections();
      setLog([]);
      setLastBackupId(0);
      saveLastBackupId(0);
    } catch (err) {
      console.warn("Could not clear log:", err);
      flashMessage("Couldn't clear the log. Please try again.");
    }
  };

  const exportAll = () => {
    if (log.length === 0) return;
    const rows = rowsForExport(log);
    const ws = XLSX.utils.json_to_sheet(rows);
    const keys = Object.keys(rows[0]);
    ws["!cols"] = keys.map((k) => ({
      wch:
        Math.max(k.length, ...rows.map((r) => String(r[k] || "").length)) + 2,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inspections");
    XLSX.writeFile(wb, `hive_log_${todayLocal()}.xlsx`);
  };

  const backupToFile = () => {
    if (log.length === 0) return;
    downloadBackup(log.map(omitId));
    const id = maxId(log);
    setLastBackupId(id);
    saveLastBackupId(id);
  };

  const restoreFromFile = async (file) => {
    try {
      const rows = await readBackupFile(file);
      const updated = await importInspections(rows);
      setLog(updated);
      const id = watermarkAfterRestore(log, lastBackupId, updated);
      if (id !== lastBackupId) {
        setLastBackupId(id);
        saveLastBackupId(id);
      }
      flashMessage(
        `Imported ${rows.length} inspection${rows.length === 1 ? "" : "s"}.`,
      );
    } catch (err) {
      flashMessage(err.message || "Could not read that backup file.");
    }
  };

  const entriesSinceBackup = countSinceBackup(log, lastBackupId);

  return {
    form,
    log,
    loading,
    justSaved,
    importMessage,
    hiveIdError,
    missingFields,
    inputProblems,
    goToField,
    needsBackupReminder:
      !loading && entriesSinceBackup >= BACKUP_REMINDER_THRESHOLD,
    entriesSinceBackup,
    set,
    setCheck,
    addToLog,
    confirmAddAnyway,
    dismissMissingFields,
    draftRestored,
    discardDraft,
    deleteEntry,
    clearLog,
    exportAll,
    backupToFile,
    restoreFromFile,
  };
}
