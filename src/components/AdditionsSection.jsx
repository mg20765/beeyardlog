import RadioGroup from "./ui/RadioGroup.jsx";
import FieldError from "./FieldError.jsx";

const ADDITIONS = [
  ["addBoxes", "Boxes added"],
  ["addSupers", "Supers added"],
  ["addExcluder", "Excluder"],
  ["addSplit", "Split"],
  ["addRequeened", "Requeened"],
  ["addPollenTrap", "Pollen trap"],
  ["addFeeder", "Feeder"],
  ["winteredDown", "Wintered down"],
  ["removedToStorage", "Removed to storage"],
  ["movedApiary", "Moved to different apiary"],
];

const STORAGE_ITEMS = [
  ["storageBase", "Base"],
  ["storageLid", "Lid"],
  ["storageExcluder", "Queen excluder"],
  ["storageFeeder", "Feeder"],
  ["storageStrap", "Strap"],
];

export default function AdditionsSection({ form, set, setCheck }) {
  return (
    <div className="hive-section">
      <p className="hive-section__title">Additions</p>
      <div className="hive-chk-grid">
        {ADDITIONS.map(([key, label]) => (
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

      {form.removedToStorage && (
        <div className="hive-subblock">
          <p className="hive-label">What's going to storage?</p>
          <div className="hive-row2" style={{ marginTop: 6 }}>
            <div className="hive-field">
              <label className="hive-label">FD boxes</label>
              <input
                className="hive-input"
                type="number"
                min="0"
                id="field-storageFdBoxes"
                value={form.storageFdBoxes}
                onChange={set("storageFdBoxes")}
                placeholder="0"
              />
              <FieldError name="storageFdBoxes" />
            </div>
            <div className="hive-field">
              <label className="hive-label">3/4 boxes</label>
              <input
                className="hive-input"
                type="number"
                min="0"
                id="field-storageThreeQuarterBoxes"
                value={form.storageThreeQuarterBoxes}
                onChange={set("storageThreeQuarterBoxes")}
                placeholder="0"
              />
              <FieldError name="storageThreeQuarterBoxes" />
            </div>
          </div>
          <div className="hive-chk-grid" style={{ marginTop: 8 }}>
            {STORAGE_ITEMS.map(([key, label]) => (
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
          <div className="hive-field" style={{ marginTop: 8 }}>
            <label className="hive-label">Other</label>
            <input
              className="hive-input"
              value={form.storageOther}
              onChange={set("storageOther")}
              placeholder="Specify…"
            />
          </div>
        </div>
      )}

      {form.movedApiary && (
        <div className="hive-field" style={{ marginTop: 10 }}>
          <label className="hive-label">New apiary location</label>
          <input
            className="hive-input"
            value={form.newApiaryLocation}
            onChange={set("newApiaryLocation")}
            placeholder="e.g. Riverside apiary"
          />
        </div>
      )}

      <div className="hive-row2" style={{ marginTop: 10 }}>
        <div className="hive-field">
          <label className="hive-label">New hive ID</label>
          <input
            className="hive-input"
            value={form.newHiveId}
            onChange={set("newHiveId")}
            placeholder="e.g. H3"
          />
        </div>
        <div>
          <label className="hive-label">Adjusted entrance?</label>
          <RadioGroup
            name="entrance"
            options={["Yes", "No"]}
            value={form.entrance}
            onChange={set("entrance")}
          />
        </div>
      </div>
    </div>
  );
}
