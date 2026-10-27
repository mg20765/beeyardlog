import { useEffect, useRef, useState } from "react";
import { initialForm, formToRow } from "../utils/hiveForm.js";
import { omitId } from "../utils/omitId.js";
import { writeExcel } from "../utils/excel.js";
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
  updateInspection,
  EntryGoneError,
} from "../db/hiveDb.js";
import { applyEdits } from "../utils/editEntry.js";
import { downloadBackup, readBackupFile } from "../utils/backup.js";
import { loadDraft, saveDraft, clearDraft, isPristine } from "../utils/draft.js";
import { requestPersistentStorage } from "../utils/persist.js";
import { createSync } from "../utils/sync.js";
import {
  maxId,
  entriesSinceBackup as countSinceBackup,
  changesSinceBackup,
  watermarkFromLegacyCount,
  watermarkAfterRestore,
} from "../utils/backupReminder.js";

// Small on-device checkpoints (not the log itself, just nudge trackers) for
// reminding beekeepers to back up every N changes. We store the id of the
// newest entry that was backed up, and how many already-backed-up entries have
// been corrected since (see utils/backupReminder.js).
// The older key held "how many entries existed at the last backup"; it is
// read once and converted so existing backup history isn't lost.
const LAST_BACKUP_ID_KEY = "hive_last_backup_id";
const EDITS_SINCE_BACKUP_KEY = "hive_edits_since_backup";
const LEGACY_BACKUP_COUNT_KEY = "hive_last_backup_count";
const BACKUP_REMINDER_THRESHOLD = 10;

const ENTRY_GONE =
  "That entry was deleted in another window, so it can't be changed.";

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

function writeSavedNumber(key, n) {
  try {
    localStorage.setItem(key, String(n));
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
  const [editsSinceBackup, setEditsSinceBackup] = useState(
    () => readSavedNumber(EDITS_SINCE_BACKUP_KEY) ?? 0,
  );
  const [hiveIdError, setHiveIdError] = useState(false);
  const [inputProblems, setInputProblems] = useState(null); // array of {field, message} or null
  const [missingFields, setMissingFields] = useState(null); // array of {key,label} or null
  const savedTimeoutRef = useRef(null);
  const messageTimeoutRef = useRef(null);
  const savingRef = useRef(false);
  const formRef = useRef(form); // the latest form, for listeners set up once
  const defaultDateRef = useRef(todayLocal()); // the date the blank form was given
  const syncRef = useRef(null); // tells other open copies of the app about changes
  const refreshRef = useRef(null); // re-reads the log from the database

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    let cancelled = false;

    const refreshLog = async () => {
      try {
        const rows = await getAllInspections();
        if (!cancelled) setLog(rows);
      } catch (err) {
        console.warn("Could not refresh inspections:", err);
      }
    };
    refreshRef.current = refreshLog;

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
            writeSavedNumber(LAST_BACKUP_ID_KEY, id);
          }
        }
      })
      .catch((err) => console.warn("Could not load inspections:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Another open copy (the installed app and a browser tab, say) changed the
    // log: show what is really stored, so nothing stale is shown or backed up.
    const sync = createSync(refreshLog);
    syncRef.current = sync;

    // The app comes back into view (a phone resumed next morning): re-read the
    // log, and move a still-blank form's date on to today.
    const onShown = () => {
      if (document.visibilityState !== "visible") return;
      refreshLog();
      const f = formRef.current;
      const today = todayLocal();
      if (isPristine(f) && f.date === defaultDateRef.current && f.date !== today) {
        defaultDateRef.current = today;
        setForm((prev) => ({ ...prev, date: today }));
      }
    };
    document.addEventListener("visibilitychange", onShown);
    window.addEventListener("focus", onShown);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onShown);
      window.removeEventListener("focus", onShown);
      sync.close();
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

  const tellOtherCopies = () => syncRef.current?.notify();

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

  // A blank form, dated today.
  const resetForm = () => {
    const fresh = initialForm();
    defaultDateRef.current = fresh.date;
    setForm(fresh);
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
      resetForm();
      setDraftRestored(false);
      setMissingFields(null);
      flashSaved();
      tellOtherCopies();
      // The first saved entry is the moment there is something to protect.
      requestPersistentStorage();
      // The log lists newest first, so bring the new entry into view.
      document
        .querySelector(".hive-log-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  // Scrolls a form field to the middle of the screen and puts the cursor in it.
  const goToField = (field) => {
    const el = document.getElementById(`field-${field}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus({ preventScroll: true });
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
    resetForm();
    setDraftRestored(false);
    setHiveIdError(false);
    setInputProblems(null);
    setMissingFields(null);
    clearDraft();
  };

  // Saves corrections to a saved entry's typed fields. Returns null if it
  // worked, or a message saying why not.
  const updateEntry = async (id, edits) => {
    const current = log.find((r) => r.id === id);
    if (!current) {
      flashMessage(ENTRY_GONE);
      refreshRef.current?.();
      return ENTRY_GONE;
    }
    const next = applyEdits(current, edits);
    if (JSON.stringify(next) === JSON.stringify(current)) return null; // nothing changed
    try {
      await updateInspection(next);
    } catch (err) {
      if (err instanceof EntryGoneError) {
        flashMessage(ENTRY_GONE);
        refreshRef.current?.();
        return ENTRY_GONE;
      }
      console.warn("Could not update inspection:", err);
      return "Couldn't save that change. Please try again.";
    }
    setLog((prev) => prev.map((r) => (r.id === id ? next : r)));
    tellOtherCopies();
    // The backup file still holds the old version of an entry it already has.
    if (current.id <= lastBackupId) {
      const count = editsSinceBackup + 1;
      setEditsSinceBackup(count);
      writeSavedNumber(EDITS_SINCE_BACKUP_KEY, count);
    }
    return null;
  };

  const deleteEntry = async (id) => {
    try {
      await deleteInspection(id);
      setLog((prev) => prev.filter((r) => r.id !== id));
      tellOtherCopies();
    } catch (err) {
      console.warn("Could not delete inspection:", err);
      flashMessage("Couldn't delete that entry. Please try again.");
    }
  };

  // Everything is backed up (or gone) after these, so the trackers start over.
  const resetBackupTrackers = (watermark) => {
    setLastBackupId(watermark);
    writeSavedNumber(LAST_BACKUP_ID_KEY, watermark);
    setEditsSinceBackup(0);
    writeSavedNumber(EDITS_SINCE_BACKUP_KEY, 0);
  };

  const clearLog = async () => {
    try {
      await clearInspections();
      setLog([]);
      resetBackupTrackers(0);
      tellOtherCopies();
    } catch (err) {
      console.warn("Could not clear log:", err);
      flashMessage("Couldn't clear the log. Please try again.");
    }
  };

  const exportAll = () => writeExcel(log);

  const backupToFile = () => {
    if (log.length === 0) return;
    downloadBackup(log.map(omitId));
    resetBackupTrackers(maxId(log));
  };

  const restoreFromFile = async (file) => {
    try {
      const rows = await readBackupFile(file);
      const updated = await importInspections(rows);
      setLog(updated);
      tellOtherCopies();
      const id = watermarkAfterRestore(log, lastBackupId, updated);
      if (id !== lastBackupId) {
        setLastBackupId(id);
        writeSavedNumber(LAST_BACKUP_ID_KEY, id);
      }
      flashMessage(
        `Imported ${rows.length} inspection${rows.length === 1 ? "" : "s"}.`,
      );
    } catch (err) {
      flashMessage(err.message || "Could not read that backup file.");
    }
  };

  const entriesSinceBackup = countSinceBackup(log, lastBackupId);
  const changesTotal = changesSinceBackup(log, lastBackupId, editsSinceBackup);

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
    needsBackupReminder: !loading && changesTotal >= BACKUP_REMINDER_THRESHOLD,
    entriesSinceBackup,
    correctionsSinceBackup: editsSinceBackup,
    set,
    setCheck,
    addToLog,
    confirmAddAnyway,
    dismissMissingFields,
    draftRestored,
    discardDraft,
    deleteEntry,
    updateEntry,
    clearLog,
    exportAll,
    backupToFile,
    restoreFromFile,
  };
}
