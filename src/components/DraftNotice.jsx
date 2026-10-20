export default function DraftNotice({ visible, onDiscard }) {
  if (!visible) return null;
  return (
    <div className="hive-backup-reminder">
      <p>↩ Restored your unsaved entry from earlier.</p>
      <button type="button" className="hive-btn-outline" onClick={onDiscard}>
        Discard draft
      </button>
    </div>
  );
}
