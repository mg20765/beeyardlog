import FieldError from "./FieldError.jsx";

export default function ExtractionSection({ form, set }) {
  return (
    <div className="hive-section">
      <p className="hive-section__title">Extraction</p>
      <div className="hive-row2">
        <div className="hive-field">
          <label className="hive-label" htmlFor="field-supersRemoved">Supers removed</label>
          <input
            className="hive-input"
            type="number"
            min="0"
            id="field-supersRemoved"
            value={form.supersRemoved}
            onChange={set("supersRemoved")}
            placeholder="0"
          />
          <FieldError name="supersRemoved" />
        </div>
        <div className="hive-field">
          <label className="hive-label" htmlFor="field-honeyKg">Honey (kg)</label>
          <input
            className="hive-input"
            type="number"
            min="0"
            step="0.1"
            id="field-honeyKg"
            value={form.honeyKg}
            onChange={set("honeyKg")}
            placeholder="0.0"
          />
          <FieldError name="honeyKg" />
        </div>
      </div>
    </div>
  );
}
