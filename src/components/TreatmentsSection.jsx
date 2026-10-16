const TREATMENTS = [
  ["trtOxalic", "Oxalic acid"],
  ["trtApivar", "Apivar"],
  ["trtBayvarol", "Bayvarol"],
  ["trtFormic", "Formic acid"],
];

export default function TreatmentsSection({ form, set, setCheck }) {
  return (
    <div className="hive-section">
      <p className="hive-section__title">Treatments</p>
      <div className="hive-chk-grid">
        {TREATMENTS.map(([key, label]) => (
          <label key={key} className="hive-chk-item">
            <input
              type="checkbox"
              checked={form[key]}
              onChange={setCheck(key)}
            />
            {label}
          </label>
        ))}
      </div>
      <div className="hive-field" style={{ marginTop: 10 }}>
        <label className="hive-label">Other treatment</label>
        <input
          className="hive-input"
          value={form.trtOther}
          onChange={set("trtOther")}
          placeholder="Specify…"
        />
      </div>

      <p className="hive-label" style={{ marginTop: 14 }}>
        AFB (American Foulbrood)
      </p>

      <label className="hive-chk-item">
        <input
          type="checkbox"
          checked={form.afbChecked}
          onChange={setCheck("afbChecked")}
        />
        AFB check performed
      </label>

      <label className="hive-chk-item hive-chk-item--alert">
        <input
          type="checkbox"
          checked={form.afbSigns}
          onChange={setCheck("afbSigns")}
        />
        AFB signs found (notifiable disease)
      </label>

      {form.afbSigns && (
        <label className="hive-chk-item hive-chk-item--alert hive-chk-item--nested">
          <input
            type="checkbox"
            checked={form.afbReported}
            onChange={setCheck("afbReported")}
          />
          Reported to authority (required within 7 days)
        </label>
      )}
    </div>
  );
}
