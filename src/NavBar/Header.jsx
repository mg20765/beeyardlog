import "./Header.css";

export default function Header({ justSaved }) {
  return (
    <div className="hive-header">
      <h1 className="hive-header__title">🐝 BeeYardLog</h1>
      <p className="hive-header__sub">
        Records saved automatically — no signal needed
      </p>
      {justSaved && <div className="hive-saved-pill">✓ Saved to device</div>}
    </div>
  );
}
