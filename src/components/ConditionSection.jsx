import RadioGroup from "./ui/RadioGroup.jsx";
import FieldError from "./FieldError.jsx";

export default function ConditionSection({ form, set }) {
  return (
    <div className="hive-section">
      <p className="hive-section__title">Condition</p>
      <div id="hive-field-temperament" style={{ marginBottom: 10 }}>
        <label className="hive-label">Temperament</label>
        <RadioGroup
          name="temper"
          options={["Calm", "Nervous", "Aggressive"]}
          value={form.temperament}
          onChange={set("temperament")}
        />
      </div>
      <div className="hive-row2">
        <div className="hive-field">
          <label className="hive-label" htmlFor="field-broodPct">Brood coverage %</label>
          <input
            className="hive-input"
            type="number"
            min="0"
            max="100"
            inputMode="decimal"
            id="field-broodPct"
            value={form.broodPct}
            onChange={set("broodPct")}
            placeholder="0–100"
          />
          <FieldError name="broodPct" />
        </div>
        <div className="hive-field">
          <label className="hive-label" htmlFor="field-broodFrames">Frames</label>
          <input
            className="hive-input"
            type="number"
            min="0"
            inputMode="numeric"
            id="field-broodFrames"
            value={form.broodFrames}
            onChange={set("broodFrames")}
            placeholder="#"
          />
          <FieldError name="broodFrames" />
        </div>
      </div>
      <div id="hive-field-population" style={{ marginBottom: 10 }}>
        <label className="hive-label">Population</label>
        <RadioGroup
          name="population"
          options={["Heavy", "Medium", "Low"]}
          value={form.population}
          onChange={set("population")}
        />
      </div>
      <div className="hive-row2">
        <div>
          <label className="hive-label">Queen cells?</label>
          <RadioGroup
            name="queenCells"
            options={["Yes", "No"]}
            value={form.queenCells}
            onChange={set("queenCells")}
          />
        </div>
        <div id="hive-field-queenSighted">
          <label className="hive-label">Queen sighted?</label>
          <RadioGroup
            name="queenSighted"
            options={["Yes", "No"]}
            value={form.queenSighted}
            onChange={set("queenSighted")}
          />
        </div>
      </div>
    </div>
  );
}
