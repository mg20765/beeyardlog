const VIEWS = [
  ["log", "Log"],
  ["hives", "Hives"],
  ["gear", "Gear"],
];

// Three buttons that pick what the page shows: the form (Log), which hives are
// due (Hives) or the expiry dates and gear list (Gear). The Hives button
// carries the number of overdue hives, so it can be seen without opening it.
export default function ViewTabs({ view, onChange, overdue }) {
  return (
    <nav className="hive-tabs" aria-label="Views">
      {VIEWS.map(([key, label]) => (
        <button
          key={key}
          type="button"
          className={key === view ? "hive-btn-add" : "hive-btn-outline"}
          aria-pressed={key === view}
          onClick={() => onChange(key)}
        >
          {label}
          {key === "hives" && overdue > 0 && (
            <span className="hive-tab-badge">{overdue}</span>
          )}
        </button>
      ))}
    </nav>
  );
}
