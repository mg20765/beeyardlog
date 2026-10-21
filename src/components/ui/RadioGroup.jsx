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
          />
          {o}
        </label>
      ))}
    </div>
  );
}
