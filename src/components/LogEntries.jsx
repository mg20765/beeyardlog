import { useState } from "react";
import EntryEditor from "./EntryEditor.jsx";
import { isAtOrAboveThreshold } from "../utils/mites.js";

// Every column formToRow() can produce, in the order we want it displayed
// when a log entry is expanded. Empty/false values are skipped at render
// time, so this list can be longer than what actually shows for any row.
const DETAIL_FIELDS = [
  "Yard #",
  "Initials",
  "Group",
  "Temp (°C)",
  "Weather",
  "Temperament",
  "Brood Coverage %",
  "Brood Frames",
  "Population",
  "Queen Cells",
  "Queen Sighted",
  "Mite Method",
  "Bees Sampled",
  "Mites Counted",
  "Mites per 100 Bees",
  "Treatments",
  "Other Treatment",
  "AFB Checked",
  "AFB Signs Found",
  "AFB Reported (7-day)",
  "Feeding",
  "Other Feed",
  "Additions",
  "Storage Contents",
  "New Apiary Location",
  "New Hive ID",
  "Adjusted Entrance",
  "Honey Level",
  "Pollen Level",
  "Supers Removed",
  "Honey (kg)",
  "Wintered Down",
  "Notes",
];

function hasValue(v) {
  return v !== "" && v !== false && v !== undefined && v !== null;
}

// "Mites 3 per 100", red once it reaches the treatment line. Nothing for an
// entry with no mite result.
function MiteChip({ value }) {
  const rate = typeof value === "number" ? value : Number.parseFloat(value);
  if (!hasValue(value) || !Number.isFinite(rate)) return null;
  return (
    <span
      className={`hive-mite-chip${isAtOrAboveThreshold(rate) ? " hive-mite-chip--high" : ""}`}
    >
      Mites {rate} per 100
    </span>
  );
}

// The saved entries as a list: tap one to see every field, edit it or delete it.
// Used by the Log view and by a single hive's view.
export default function LogEntries({ rows, deleteEntry, updateEntry }) {
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  return (
    <>
      {rows.map((r, i) => {
        const isOpen = expandedId === r.id;
        const details = DETAIL_FIELDS.filter((k) => hasValue(r[k]));
        return (
          <div key={r.id}>
            <div className="hive-log-row">
              <button
                type="button"
                className="hive-log-toggle"
                aria-expanded={isOpen}
                onClick={() => setExpandedId(isOpen ? null : r.id)}
              >
                <span className="hive-log-title">
                  {r["Hive ID"] || "Unnamed hive"}
                  <span className="hive-badge">{r["Date"] || "–"}</span>
                  {r["Initials"] && (
                    <span className="hive-badge">{r["Initials"]}</span>
                  )}
                </span>
                <span className="hive-log-sub">
                  Pop: {r["Population"] || "–"} · Queen:{" "}
                  {r["Queen Sighted"] || "–"} · Honey: {r["Honey Level"] || "–"}
                  <MiteChip value={r["Mites per 100 Bees"]} />
                  <span className="hive-log-expand-hint">
                    {isOpen ? " · Hide details ▲" : " · Tap for all fields ▼"}
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="hive-del-btn"
                onClick={() => setConfirmDeleteId(r.id)}
                aria-label="Delete"
              >
                ✕
              </button>
            </div>
            {confirmDeleteId === r.id && (
              <div className="hive-missing-warning">
                <p>
                  Delete the entry for{" "}
                  <strong>{r["Hive ID"] || "Unnamed hive"}</strong>? This can't
                  be undone.
                </p>
                <div className="hive-row2">
                  <button
                    type="button"
                    className="hive-btn-outline"
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="hive-btn-clear"
                    onClick={() => {
                      setConfirmDeleteId(null);
                      deleteEntry(r.id);
                    }}
                  >
                    Yes, delete
                  </button>
                </div>
              </div>
            )}
            {isOpen && editingId === r.id && (
              <EntryEditor
                row={r}
                onCancel={() => setEditingId(null)}
                onSave={async (edits) => {
                  const problem = await updateEntry(r.id, edits);
                  if (!problem) setEditingId(null);
                  return problem;
                }}
              />
            )}
            {isOpen && editingId !== r.id && (
              <div className="hive-log-detail">
                {details.length === 0 ? (
                  <p className="hive-log-detail-empty">
                    No other fields recorded for this entry.
                  </p>
                ) : (
                  details.map((k) => (
                    <div key={k} className="hive-log-detail-row">
                      <span className="hive-log-detail-key">{k}</span>
                      <span className="hive-log-detail-val">
                        {r[k] === true ? "Yes" : r[k]}
                      </span>
                    </div>
                  ))
                )}
                <button
                  type="button"
                  className="hive-btn-outline hive-edit-open"
                  onClick={() => setEditingId(r.id)}
                >
                  Edit details
                </button>
              </div>
            )}
            {i < rows.length - 1 && <div className="hive-divider" />}
          </div>
        );
      })}
    </>
  );
}
