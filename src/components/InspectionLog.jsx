import { useState } from "react";
import LogEntries from "./LogEntries.jsx";
import { sortNewestFirst, filterLog } from "../utils/logView.js";

// A search box only helps once the log is long enough to need one.
const SEARCH_FROM = 6;

export default function InspectionLog({
  log,
  loading,
  deleteEntry,
  updateEntry,
}) {
  const [query, setQuery] = useState("");

  const searching = query.trim() !== "";
  const shown = filterLog(sortNewestFirst(log), query);

  return (
    <div className="hive-log-section">
      <p className="hive-section__title" style={{ marginBottom: 8 }}>
        Inspection log
        <span className="hive-count-badge">{log.length}</span>
        {log.length > 0 && (
          <span className="hive-badge">✓ Saved to device</span>
        )}
      </p>
      {log.length >= SEARCH_FROM && (
        <>
          <input
            type="search"
            className="hive-input hive-log-search"
            aria-label="Search the log"
            placeholder="Search hive, yard, notes or date"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {searching && (
            <p className="hive-btn-hint">
              Showing {shown.length} of {log.length}
            </p>
          )}
        </>
      )}
      {loading ? (
        <p className="hive-empty-state">Loading your log…</p>
      ) : log.length === 0 ? (
        <p className="hive-empty-state">No inspections logged yet</p>
      ) : shown.length === 0 ? (
        <p className="hive-empty-state">No entries match your search</p>
      ) : (
        <LogEntries
          rows={shown}
          deleteEntry={deleteEntry}
          updateEntry={updateEntry}
        />
      )}
    </div>
  );
}
