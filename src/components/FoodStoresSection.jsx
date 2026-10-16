import LevelButtons from "./ui/LevelButtons.jsx";

export default function FoodStoresSection({ form, set }) {
  return (
    <div className="hive-section">
      <p className="hive-section__title">Food stores</p>
      <div id="hive-field-honeyLevel" style={{ marginBottom: 12 }}>
        <label className="hive-label">Honey level</label>
        <LevelButtons value={form.honeyLevel} onChange={set("honeyLevel")} />
      </div>
      <div>
        <label className="hive-label">Pollen level</label>
        <LevelButtons
          value={form.pollenLevel}
          onChange={set("pollenLevel")}
        />
      </div>
    </div>
  );
}
