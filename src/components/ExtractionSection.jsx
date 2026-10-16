export default function ExtractionSection({ form, set }) {
  return (
    <div className="hive-section">
      <p className="hive-section__title">Extraction</p>
      <div className="hive-row2">
        <div className="hive-field">
          <label className="hive-label">Supers removed</label>
          <input
            className="hive-input"
            type="number"
            min="0"
            value={form.supersRemoved}
            onChange={set("supersRemoved")}
            placeholder="0"
          />
        </div>
        <div className="hive-field">
          <label className="hive-label">Honey (kg)</label>
          <input
            className="hive-input"
            type="number"
            min="0"
            step="0.1"
            value={form.honeyKg}
            onChange={set("honeyKg")}
            placeholder="0.0"
          />
        </div>
      </div>
    </div>
  );
}
