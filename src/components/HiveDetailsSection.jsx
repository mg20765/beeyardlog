import FieldError from "./FieldError.jsx";

export default function HiveDetailsSection({ form, set, hiveIdError }) {
  return (
    <div className="hive-section">
      <p className="hive-section__title">Hive details</p>
      <div className="hive-row2">
        <div className="hive-field">
          <label className="hive-label" htmlFor="field-yardNo">Yard #</label>
          <input
            className="hive-input"
            value={form.yardNo}
            id="field-yardNo"
            onChange={set("yardNo")}
            placeholder="e.g. Y2"
          />
        </div>
        <div className="hive-field">
          <label className="hive-label" htmlFor="field-hiveId">Hive ID</label>
          <input
            className={`hive-input${hiveIdError ? " hive-input--error" : ""}`}
            value={form.hiveId}
            id="field-hiveId"
            onChange={set("hiveId")}
            placeholder="e.g. H1"
          />
          {hiveIdError && (
            <p className="hive-field-error">Hive ID is required</p>
          )}
        </div>
      </div>
      <div className="hive-field">
        <label className="hive-label" htmlFor="field-date">Date</label>
        <input
          className="hive-input"
          id="field-date"
          type="date"
          value={form.date}
          onChange={set("date")}
        />
        <FieldError name="date" />
      </div>
    </div>
  );
}
