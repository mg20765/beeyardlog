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

// Optional number fields that must make sense when they are filled in:
// [key, label, min, max, wholeNumber]. They are stopped at save, because a
// brood coverage of 150 or a negative frame count is a slip, not a record.
const NUMBER_RULES = [
  ["weatherTemp", "Temp (°C)", -30, 50, false],
  ["broodPct", "Brood coverage %", 0, 100, false],
  ["broodFrames", "Brood frames", 0, Infinity, true],
  ["supersRemoved", "Supers removed", 0, Infinity, true],
  ["honeyKg", "Honey (kg)", 0, Infinity, false],
];

// Only relevant (and only saved) when "Removed to storage" is ticked.
const STORAGE_RULES = [
  ["storageFdBoxes", "FD boxes", 0, Infinity, true],
  ["storageThreeQuarterBoxes", "3/4 boxes", 0, Infinity, true],
];

// The order the fields appear on the form, top to bottom, so the first
// problem listed is also the first one you reach.
const FIELD_ORDER = [
  "date",
  "weatherTemp",
  "broodPct",
  "broodFrames",
  "miteBees",
  "miteCount",
  "storageFdBoxes",
  "storageThreeQuarterBoxes",
  "supersRemoved",
  "honeyKg",
];

function numberProblem(form, [key, label, min, max, whole]) {
  const raw = form[key];
  if (raw === "" || raw === undefined || raw === null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return `${label} must be a number.`;
  if (whole && !Number.isInteger(n)) return `${label} must be a whole number.`;
  if (n < min || n > max) {
    return max === Infinity
      ? `${label} can't be negative.`
      : `${label} must be between ${min} and ${max}.`;
  }
  return null;
}

// Returns [{ field, message }] for everything that stops an entry being
// saved, other than the Hive ID (checked separately). `field` is the form key,
// so the screen can jump to it. Empty list = fine.
export function getInputProblems(form) {
  const problems = [];
  if (!form.date) problems.push({ field: "date", message: "Date is required." });

  const rules = form.removedToStorage ? [...NUMBER_RULES, ...STORAGE_RULES] : NUMBER_RULES;
  for (const rule of rules) {
    const message = numberProblem(form, rule);
    if (message) problems.push({ field: rule[0], message });
  }

  if (!form.miteNotDone) {
    const bees = form.miteBees;
    const mites = form.miteCount;
    const beesOk = bees === "" || (Number.isInteger(Number(bees)) && Number(bees) >= 1);
    const mitesOk = mites === "" || (Number.isInteger(Number(mites)) && Number(mites) >= 0);
    if (!beesOk) {
      problems.push({ field: "miteBees", message: "Bees sampled must be a whole number, 1 or more." });
    }
    if (!mitesOk) {
      problems.push({ field: "miteCount", message: "Mites counted must be a whole number, 0 or more." });
    }
    if (bees !== "" && mites !== "" && beesOk && mitesOk && Number(mites) > Number(bees)) {
      problems.push({ field: "miteCount", message: "Mites counted can't be more than bees sampled." });
    }
  }
  return problems.sort((a, b) => FIELD_ORDER.indexOf(a.field) - FIELD_ORDER.indexOf(b.field));
}
