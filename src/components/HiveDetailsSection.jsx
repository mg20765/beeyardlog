export default function HiveDetailsSection({ form, set, hiveIdError }) {
  return (
    <div className="hive-section">
      <p className="hive-section__title">Hive details</p>
      <div className="hive-row2">
        <div className="hive-field">
          <label className="hive-label">Hive ID</label>
          <input
            className={`hive-input${hiveIdError ? " hive-input--error" : ""}`}
            value={form.hiveId}
            onChange={set("hiveId")}
            placeholder="e.g. H1"
          />
          {hiveIdError && (
            <p className="hive-field-error">Hive ID is required</p>
          )}
        </div>
        <div className="hive-field">
          <label className="hive-label">Yard #</label>
          <input
            className="hive-input"
            value={form.yardNo}
            onChange={set("yardNo")}
            placeholder="e.g. Y2"
          />
        </div>
      </div>
      <div className="hive-field">
        <label className="hive-label">Date</label>
        <input
          className="hive-input"
          type="date"
          value={form.date}
          onChange={set("date")}
        />
      </div>
    </div>
  );
}
