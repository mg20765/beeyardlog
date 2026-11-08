import { useState } from "react";
import {
  groupsFor,
  loadGear,
  saveGear,
  toggleTick,
  addCustom,
  removeCustom,
  startNewTrip,
  progress,
} from "../utils/gearList.js";

const MODES = [
  ["yard", "Yard day"],
  ["extraction", "Extraction day"],
];

// What to pack, ticked off as it goes in the truck. Kept on the phone, apart
// from the inspection records.
export default function GearList() {
  const [gear, setGear] = useState(loadGear);
  const [mode, setMode] = useState("yard");
  const [draft, setDraft] = useState("");

  const change = (next) => {
    setGear(next);
    saveGear(next);
  };

  const { done, total } = progress(mode, gear);

  const submit = (e) => {
    e.preventDefault();
    change(addCustom(gear, mode, draft));
    setDraft("");
  };

  return (
    <details className="hive-gear">
      <summary className="hive-section__title hive-gear-summary">Gear checklist</summary>

      <div className="hive-row2">
        {MODES.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={key === mode ? "hive-btn-add" : "hive-btn-outline"}
            aria-pressed={key === mode}
            onClick={() => setMode(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="hive-btn-hint">
        {done} of {total} packed
      </p>

      {groupsFor(mode, gear).map((group) => (
        <div key={group.title} className="hive-gear-group">
          <p className="hive-label">{group.title}</p>
          {group.items.map((i) => (
            <div key={i.id} className="hive-gear-line">
              <label className="hive-chk-item">
                <input
                  type="checkbox"
                  checked={gear.ticked.includes(i.id)}
                  onChange={() => change(toggleTick(gear, i.id))}
                />
                {i.label}
              </label>
              {group.own && (
                <button
                  type="button"
                  className="hive-del-btn"
                  aria-label={`Remove ${i.label}`}
                  onClick={() => change(removeCustom(gear, mode, i.id))}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      ))}

      <form className="hive-gear-add" onSubmit={submit}>
        <label className="hive-label" htmlFor="gear-own">
          Add your own item
        </label>
        <div className="hive-row2">
          <input
            id="gear-own"
            className="hive-input"
            value={draft}
            maxLength={40}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Zip ties"
          />
          <button type="submit" className="hive-btn-outline">
            Add item
          </button>
        </div>
      </form>

      <button
        type="button"
        className="hive-btn-outline"
        onClick={() => change(startNewTrip(gear))}
      >
        Start a new trip
      </button>
    </details>
  );
}
