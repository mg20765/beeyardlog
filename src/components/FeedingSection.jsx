const FEED = [
  ["feedSyrup", "Syrup"],
  ["feedDryFeed", "Dry feed"],
  ["feedPatties", "Patties"],
  ["feedNutrition", "Nutrition boost (e.g. Agrisea)"],
];

export default function FeedingSection({ form, set, setCheck }) {
  return (
    <div className="hive-section">
      <p className="hive-section__title">Feeding</p>
      <div className="hive-chk-grid">
        {FEED.map(([key, label]) => (
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
        <label className="hive-label" htmlFor="field-feedOther">Other feed</label>
        <input
          className="hive-input"
          value={form.feedOther}
          id="field-feedOther"
          onChange={set("feedOther")}
          placeholder="Specify…"
        />
      </div>
    </div>
  );
}
