export default function NotesSection({ form, set }) {
  return (
    <div className="hive-section">
      <p className="hive-section__title">Notes</p>
      <textarea
        className="hive-textarea"
        value={form.notes}
        id="field-notes"
        aria-label="Notes"
        onChange={set("notes")}
        placeholder="General observations…"
      />
    </div>
  );
}
