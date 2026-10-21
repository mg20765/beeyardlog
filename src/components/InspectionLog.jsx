import { useState } from "react";

// Every column formToRow() can produce, in the order we want it displayed
// when a log entry is expanded. Empty/false values are skipped at render
// time, so this list can be longer than what actually shows for any row.
const DETAIL_FIELDS = [
  "Yard #",
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

export default function InspectionLog({ log, loading, deleteEntry }) {
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  return (
    <div className="hive-log-section">
      <p className="hive-section__title" style={{ marginBottom: 8 }}>
        Inspection log
        <span className="hive-count-badge">{log.length}</span>
        {log.length > 0 && (
          <span className="hive-badge">✓ Saved to device</span>
        )}
      </p>
      {loading ? (
        <p className="hive-empty-state">Loading your log…</p>
      ) : log.length === 0 ? (
        <p className="hive-empty-state">No inspections logged yet</p>
      ) : (
        log.map((r, i) => {
          const isOpen = expandedId === r.id;
          const details = DETAIL_FIELDS.filter((k) => hasValue(r[k]));
          return (
            <div key={r.id}>
              <div
                className="hive-log-row"
                role="button"
                tabIndex={0}
                onClick={() => setExpandedId(isOpen ? null : r.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setExpandedId(isOpen ? null : r.id);
                  }
                }}
              >
                <div>
                  <p className="hive-log-title">
                    {r["Hive ID"] || "Unnamed hive"}
                    <span className="hive-badge">{r["Date"] || "–"}</span>
                  </p>
                  <p className="hive-log-sub">
                    Pop: {r["Population"] || "–"} · Queen:{" "}
                    {r["Queen Sighted"] || "–"} · Honey:{" "}
                    {r["Honey Level"] || "–"}
                    <span className="hive-log-expand-hint">
                      {isOpen ? " · Hide details ▲" : " · Tap for all fields ▼"}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  className="hive-del-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDeleteId(r.id);
                  }}
                  aria-label="Delete"
                >
                  ✕
                </button>
              </div>
              {confirmDeleteId === r.id && (
                <div className="hive-missing-warning">
                  <p>
                    Delete the entry for{" "}
                    <strong>{r["Hive ID"] || "Unnamed hive"}</strong>? This
                    can't be undone.
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
              {isOpen && (
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
                </div>
              )}
              {i < log.length - 1 && <div className="hive-divider" />}
            </div>
          );
        })
      )}
    </div>
  );
}
