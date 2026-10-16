// Pure, testable validation logic for the inspection form - kept out of
// useHiveLog.js so it can be unit tested without mocking IndexedDB or the
// DOM, and can't silently drift from what the UI actually checks.

// Fields worth nudging about if left blank - the same ones the compact log
// preview shows (Population, Queen, Honey), plus Temperament. Not a strict
// requirement, just a "did you mean to skip this?" check before saving.
export const NUDGE_FIELDS = [
  ["temperament", "Temperament"],
  ["population", "Population"],
  ["queenSighted", "Queen sighted"],
  ["honeyLevel", "Honey level"],
];

// Hive ID is the one hard requirement - an entry with no ID isn't
// recoverable/useful data later.
export function isHiveIdMissing(form) {
  return !form.hiveId || !form.hiveId.trim();
}

// Returns [{ key, label }, ...] for every nudge field left blank.
export function getMissingNudgeFields(form) {
  return NUDGE_FIELDS.filter(([key]) => !form[key]).map(([key, label]) => ({
    key,
    label,
  }));
}
