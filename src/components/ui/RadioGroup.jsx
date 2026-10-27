// Round choices. Tapping the chosen one again clears it, so a mis-tap can be
// undone (like the High / Average / Low buttons).
export default function RadioGroup({ name, options, value, onChange, disabled = false }) {
  return (
    <div className="hive-radio-group">
      {options.map((o) => (
        <label key={o} className="hive-radio-item">
          <input
            type="radio"
            name={name}
            value={o}
            checked={value === o}
            disabled={disabled}
            onChange={() => onChange(o)}
            onClick={() => {
              // A radio only fires "change" when it becomes chosen, so a tap
              // on the one that is already chosen is caught here.
              if (value === o) onChange("");
            }}
          />
          {o}
        </label>
      ))}
    </div>
  );
}
