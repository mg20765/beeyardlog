export default function LevelButtons({ value, onChange }) {
  return (
    <div className="hive-lvl-group">
      {["High", "Average", "Low"].map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(value === v ? "" : v)}
          className={`hive-lvl-btn${value === v ? " hive-lvl-btn--active" : ""}`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
