import { useState } from "react";
import { editableFields, rowToEdits, getEditProblems } from "../utils/editEntry.js";

// Lets a saved entry's typed fields be corrected, for example a spelling
// mistake in a Hive ID. Ticks and choices can't be changed here.
export default function EntryEditor({ row, onSave, onCancel }) {
  const fields = editableFields(row);
  const [edits, setEdits] = useState(() => rowToEdits(row));
  const [problems, setProblems] = useState([]);

  const change = (name) => (e) => {
    setEdits((prev) => ({ ...prev, [name]: e.target.value }));
    setProblems([]);
  };

  const save = async () => {
    const found = getEditProblems(edits, row);
    if (found.length > 0) {
      setProblems(found);
      return;
    }
    await onSave(edits);
  };

  return (
    <div className="hive-edit">
      <p className="hive-label">
        Fix the details of this entry. To change a tick or a choice, delete the
        entry and add it again.
      </p>
      {fields.map((f) => (
        <div className="hive-field" key={f.name}>
          <label className="hive-label" htmlFor={`edit-${f.name}`}>
            {f.label}
          </label>
          {f.type === "textarea" ? (
            <textarea
              id={`edit-${f.name}`}
              className="hive-textarea"
              value={edits[f.name]}
              onChange={change(f.name)}
            />
          ) : (
            <input
              id={`edit-${f.name}`}
              className="hive-input"
              type={f.type}
              inputMode={f.type === "number" ? "decimal" : undefined}
              value={edits[f.name]}
              onChange={change(f.name)}
            />
          )}
        </div>
      ))}

      {problems.length > 0 && (
        <div className="hive-problems" role="alert">
          <ul>
            {problems.map((p) => (
              <li key={p.message}>{p.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="hive-row2">
        <button type="button" className="hive-btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="hive-btn-add" onClick={save}>
          Save changes
        </button>
      </div>
    </div>
  );
}
