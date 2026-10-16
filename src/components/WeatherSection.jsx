import RadioGroup from "./ui/RadioGroup.jsx";

const CONDITIONS = ["Sunny", "Cloudy", "Overcast", "Windy", "Rainy"];

export default function WeatherSection({ form, set }) {
  return (
    <div className="hive-section">
      <p className="hive-section__title">Weather</p>
      <div className="hive-field" style={{ marginBottom: 10 }}>
        <label className="hive-label">Temp (°C)</label>
        <input
          className="hive-input"
          type="number"
          value={form.weatherTemp}
          onChange={set("weatherTemp")}
          placeholder="e.g. 18"
        />
      </div>
      <div>
        <label className="hive-label">Conditions</label>
        <RadioGroup
          name="weatherCondition"
          options={CONDITIONS}
          value={form.weatherCondition}
          onChange={set("weatherCondition")}
        />
      </div>
    </div>
  );
}
