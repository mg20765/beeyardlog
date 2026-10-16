export default function MissingFieldsWarning({ fields, onAddAnyway, onGoBack }) {
  if (!fields || fields.length === 0) return null;
  const labels = fields.map((f) => f.label).join(", ");
  return (
    <div className="hive-missing-warning">
      <p>
        You haven't filled in: <strong>{labels}</strong>. Save anyway?
      </p>
      <div className="hive-row2">
        <button
          type="button"
          className="hive-btn-outline"
          onClick={onGoBack}
        >
          Go back
        </button>
        <button type="button" className="hive-btn-add" onClick={onAddAnyway}>
          Add anyway
        </button>
      </div>
    </div>
  );
}
