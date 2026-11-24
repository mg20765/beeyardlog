// Shown when a newer version of the app is online. Updating reloads the page;
// the records are stored on the phone and a half-filled form is kept as a draft,
// so nothing is lost.
export default function UpdateBanner({ onUpdate }) {
  return (
    <div className="hive-update-banner" aria-live="polite">
      <p>
        A new version of BeeYardLog is ready. Your records stay as they are, and
        anything half-filled is kept.
      </p>
      <button type="button" className="hive-btn-add" onClick={onUpdate}>
        Update now
      </button>
    </div>
  );
}
