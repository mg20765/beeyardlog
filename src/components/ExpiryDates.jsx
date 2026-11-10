import { useState } from "react";
import {
  setHasEpipen,
  setDate,
  addItem,
  removeItem,
  statuses,
  warnings,
  expiryText,
} from "../utils/expiry.js";
import { todayLocal } from "../utils/date.js";

// The warning at the top of the page: anything out of date or about to be.
// Nothing shows when everything is fine, or when no dates are set.
export function ExpiryBanner({ expiry }) {
  const due = warnings(statuses(expiry, todayLocal()));
  if (due.length === 0) return null;
  const anyExpired = due.some((i) => i.status === "expired");
  return (
    <div
      role="status"
      className={`hive-expiry-banner${anyExpired ? " hive-expiry-banner--expired" : ""}`}
    >
      <p className="hive-expiry-title">Check your expiry dates</p>
      <ul>
        {due.map((i) => (
          <li key={i.id}>
            {i.label} {expiryText(i)}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Where the dates are set. Not everyone carries an EpiPen, so it only appears
// once "I carry an EpiPen" is ticked.
export default function ExpiryDates({ expiry, onChange }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setNewDate] = useState("");

  const rows = statuses(expiry, todayLocal());

  const submit = (e) => {
    e.preventDefault();
    onChange(addItem(expiry, name, date));
    setName("");
    setNewDate("");
  };

  return (
    <div className="hive-gear">
      <button
        type="button"
        className="hive-btn-outline hive-gear-toggle"
        aria-expanded={open}
        aria-controls="expiry-panel"
        onClick={() => setOpen(!open)}
      >
        <span>Expiry dates</span>
        <span aria-hidden="true">{open ? "▲" : "▼"}</span>
      </button>

      <div id="expiry-panel" hidden={!open}>
        {open && (
          <>
            <label className="hive-chk-item">
              <input
                type="checkbox"
                checked={expiry.epipen.has}
                onChange={(e) =>
                  onChange(setHasEpipen(expiry, e.target.checked))
                }
              />
              I carry an EpiPen
            </label>

            {rows.map((row) => (
              <div
                key={row.id}
                className={`hive-expiry-row hive-expiry-row--${row.status}`}
              >
                <div className="hive-expiry-info">
                  <span className="hive-expiry-name">{row.label}</span>
                  <span className="hive-expiry-when">{expiryText(row)}</span>
                </div>
                <input
                  type="date"
                  className="hive-input"
                  aria-label={`${row.label} expiry date`}
                  value={row.date}
                  onChange={(e) =>
                    onChange(setDate(expiry, row.id, e.target.value))
                  }
                />
                {row.id !== "epipen" && (
                  <button
                    type="button"
                    className="hive-del-btn"
                    aria-label={`Remove ${row.label}`}
                    onClick={() => onChange(removeItem(expiry, row.id))}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            <form className="hive-gear-add" onSubmit={submit}>
              <label className="hive-label" htmlFor="expiry-name">
                Name of item
              </label>
              <input
                id="expiry-name"
                className="hive-input"
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apivar strips"
              />
              <label className="hive-label" htmlFor="expiry-new-date">
                Expiry date for new item
              </label>
              <input
                id="expiry-new-date"
                type="date"
                className="hive-input"
                value={date}
                onChange={(e) => setNewDate(e.target.value)}
              />
              <button type="submit" className="hive-btn-outline">
                Add to expiry list
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
