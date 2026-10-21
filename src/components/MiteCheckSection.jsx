import RadioGroup from "./ui/RadioGroup.jsx";
import {
  TREAT_AT_PER_100,
  mitesPer100,
  isAtOrAboveThreshold,
} from "../utils/mites.js";

export default function MiteCheckSection({ form, set }) {
  const rate = mitesPer100(form.miteBees, form.miteCount);
  const bothEntered = form.miteBees !== "" && form.miteCount !== "";
  const tooManyMites =
    bothEntered &&
    Number(form.miteBees) > 0 &&
    Number(form.miteCount) > Number(form.miteBees);

  return (
    <div className="hive-section">
      <p className="hive-section__title">Mite check</p>
      <div style={{ marginBottom: 10 }}>
        <label className="hive-label">Method</label>
        <RadioGroup
          name="miteMethod"
          options={["Alcohol wash", "Sugar roll"]}
          value={form.miteMethod}
          onChange={set("miteMethod")}
        />
      </div>
      <div className="hive-row2">
        <div className="hive-field">
          <label className="hive-label">Bees sampled</label>
          <input
            className="hive-input"
            type="number"
            min="1"
            inputMode="numeric"
            value={form.miteBees}
            onChange={set("miteBees")}
            placeholder="e.g. 300"
          />
        </div>
        <div className="hive-field">
          <label className="hive-label">Mites counted</label>
          <input
            className="hive-input"
            type="number"
            min="0"
            inputMode="numeric"
            value={form.miteCount}
            onChange={set("miteCount")}
            placeholder="e.g. 5"
          />
        </div>
      </div>

      {tooManyMites && (
        <p className="hive-mite-error">
          Mites can't be more than the bees sampled. Check the two numbers.
        </p>
      )}
      {bothEntered && !tooManyMites && rate === null && (
        <p className="hive-mite-error">
          Use whole numbers, with at least 1 bee sampled.
        </p>
      )}
      {rate !== null && (
        <>
          <p className="hive-mite-result">Mites per 100 bees: {rate}</p>
          {isAtOrAboveThreshold(rate) ? (
            <p className="hive-mite-status hive-mite-status--treat">
              At or above the {TREAT_AT_PER_100} per 100 threshold. Consider
              treating.
            </p>
          ) : (
            <p className="hive-mite-status">
              Below the {TREAT_AT_PER_100} per 100 threshold.
            </p>
          )}
        </>
      )}
    </div>
  );
}
