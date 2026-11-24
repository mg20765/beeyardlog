import { useState } from "react";
import LogEntries from "./LogEntries.jsx";
import {
  hiveStatuses,
  hiveKey,
  dueOnly,
  overdueCount,
  LIMIT_CHOICES_DAYS,
} from "../utils/hiveStatus.js";
import { sortNewestFirst } from "../utils/logView.js";
import { todayLocal } from "../utils/date.js";

const weeks = (days) => days / 7;
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function daysAgo(days) {
  if (days === 0) return "today";
  return `${plural(days, "day")} ago`;
}

const hiveLabel = (h) => `${h.yard ? `${h.yard} · ` : ""}${h.hiveId}`;

function HiveRow({ hive, onOpen }) {
  return (
    <li
      className={`hive-status-row${hive.overdue ? " hive-status-row--due" : ""}`}
    >
      <button
        type="button"
        className="hive-status-open"
        onClick={() => onOpen(hive)}
      >
        <span className="hive-status-name">{hiveLabel(hive)}</span>
        <span className="hive-status-when">
          Last checked {hive.lastDate} · {daysAgo(hive.daysSince)}
        </span>
        {hive.overdue && (
          <span className="hive-status-flag">Due for a check</span>
        )}
      </button>
    </li>
  );
}

// One hive: all its entries, which can be opened, edited or deleted right here,
// and a button to set it aside as a call-out so it never counts as overdue.
function HiveDetail({
  open,
  log,
  tracked,
  onBack,
  onToggleTracked,
  deleteEntry,
  updateEntry,
}) {
  const rows = sortNewestFirst(
    log.filter((r) => hiveKey(r["Yard #"], r["Hive ID"]) === open.key),
  );
  return (
    <div className="hive-detail">
      <button type="button" className="hive-btn-outline" onClick={onBack}>
        <span aria-hidden="true">← </span>Back to hives
      </button>
      <p className="hive-section__title" style={{ marginTop: 12 }}>
        {open.label}
      </p>
      {rows.length === 0 ? (
        <p className="hive-empty-state">
          No entries for this hive any more. Go back to see the list.
        </p>
      ) : (
        <>
          <LogEntries
            rows={rows}
            deleteEntry={deleteEntry}
            updateEntry={updateEntry}
          />
          <button
            type="button"
            className="hive-btn-outline hive-detail-track"
            onClick={() => onToggleTracked(open.key)}
          >
            {tracked
              ? "Don't track (call-out or on hold)"
              : "Track this hive again"}
          </button>
          {tracked ? (
            <p className="hive-btn-hint">
              A call-out is a one-off visit, and a hive on hold is one you are
              not sure about yet. It stays in the list but never counts as
              overdue.
            </p>
          ) : (
            <p className="hive-btn-hint">
              This hive is not being tracked, so it is never called overdue.
            </p>
          )}
        </>
      )}
    </div>
  );
}

// Every hive with when it was last checked, longest unchecked first, and a
// warning for any past the limit. The app can't ring while it is closed, so
// the warning shows whenever it is opened. The limit and the call-outs are kept
// by the page, so the Hives button can show how many are overdue.
export default function HiveStatusList({
  log,
  limit,
  onLimitChange,
  untracked,
  onToggleUntracked,
  onlyDue,
  onOnlyDueChange,
  deleteEntry,
  updateEntry,
}) {
  const [open, setOpen] = useState(null); // { key, label } of the hive being looked at
  const statuses = hiveStatuses(log, todayLocal(), limit, untracked);

  if (open) {
    return (
      <HiveDetail
        open={open}
        log={log}
        tracked={!untracked.includes(open.key)}
        onBack={() => setOpen(null)}
        onToggleTracked={onToggleUntracked}
        deleteEntry={deleteEntry}
        updateEntry={updateEntry}
      />
    );
  }

  if (statuses.length === 0) {
    return (
      <div className="hive-status">
        <p className="hive-section__title">Hives to check</p>
        <p className="hive-empty-state">
          No hives yet. Log an inspection and your hives will be listed here.
        </p>
      </div>
    );
  }

  const tracked = statuses.filter((h) => h.tracked);
  const setAside = statuses.filter((h) => !h.tracked);
  const overdue = overdueCount(statuses);
  const limitText = `${weeks(limit)}+ weeks`;
  const openHive = (h) => setOpen({ key: h.key, label: hiveLabel(h) });

  return (
    <div className="hive-status">
      <p className="hive-section__title" style={{ marginBottom: 8 }}>
        Hives to check
      </p>
      {tracked.length > 0 && (
        <p
          role="status"
          className={`hive-status-banner${overdue > 0 ? " hive-status-banner--due" : ""}`}
        >
          {overdue > 0
            ? `${plural(overdue, "hive")} not checked in ${limitText}`
            : `All hives checked in the last ${weeks(limit)} weeks`}
        </p>
      )}
      <div className="hive-field">
        <label className="hive-label" htmlFor="status-limit">
          Warn me after
        </label>
        <select
          id="status-limit"
          className="hive-input"
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
        >
          {LIMIT_CHOICES_DAYS.map((d) => (
            <option key={d} value={d}>
              {weeks(d)} weeks
            </option>
          ))}
        </select>
      </div>
      <label className="hive-chk-item">
        <input
          type="checkbox"
          checked={onlyDue}
          onChange={(e) => onOnlyDueChange(e.target.checked)}
        />
        Show only hives that are due
      </label>
      <p className="hive-btn-hint">
        Tap a hive to see its entries and edit them.
      </p>
      {onlyDue && overdue === 0 ? (
        <p className="hive-empty-state">
          Nothing is due. Every tracked hive was checked in the last{" "}
          {weeks(limit)} weeks.
        </p>
      ) : (
        <ul className="hive-status-list">
          {(onlyDue ? dueOnly(tracked) : tracked).map((h) => (
            <HiveRow key={h.key} hive={h} onOpen={openHive} />
          ))}
        </ul>
      )}
      {!onlyDue && setAside.length > 0 && (
        <>
          <p className="hive-label" style={{ marginTop: 12 }}>
            Not tracked (call-outs and on hold)
          </p>
          <ul className="hive-status-list">
            {setAside.map((h) => (
              <HiveRow key={h.key} hive={h} onOpen={openHive} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
