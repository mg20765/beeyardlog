import {
  hiveStatuses,
  overdueCount,
  LIMIT_CHOICES_DAYS,
} from "../utils/hiveStatus.js";
import { todayLocal } from "../utils/date.js";

const weeks = (days) => days / 7;
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function daysAgo(days) {
  if (days === 0) return "today";
  return `${plural(days, "day")} ago`;
}

// Every hive with when it was last checked, longest unchecked first, and a
// warning for any past the limit. The app can't ring while it is closed, so
// the warning shows whenever it is opened. The limit is chosen here but kept
// by the page, so the Hives button can show how many are overdue.
export default function HiveStatusList({ log, limit, onLimitChange }) {
  const statuses = hiveStatuses(log, todayLocal(), limit);

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

  const overdue = overdueCount(statuses);
  const limitText = `${weeks(limit)}+ weeks`;

  return (
    <div className="hive-status">
      <p className="hive-section__title" style={{ marginBottom: 8 }}>
        Hives to check
      </p>
      <p
        role="status"
        className={`hive-status-banner${overdue > 0 ? " hive-status-banner--due" : ""}`}
      >
        {overdue > 0
          ? `${plural(overdue, "hive")} not checked in ${limitText}`
          : `All hives checked in the last ${weeks(limit)} weeks`}
      </p>
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
      <ul className="hive-status-list">
        {statuses.map((h) => (
          <li
            key={`${h.yard}|${h.hiveId}`}
            className={`hive-status-row${h.overdue ? " hive-status-row--due" : ""}`}
          >
            <span className="hive-status-name">
              {h.yard ? `${h.yard} · ` : ""}
              {h.hiveId}
            </span>
            <span className="hive-status-when">
              Last checked {h.lastDate} · {daysAgo(h.daysSince)}
            </span>
            {h.overdue && <span className="hive-status-flag">Due for a check</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
