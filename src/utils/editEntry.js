// Correcting a saved entry. Only the typed fields can be fixed (Hive ID, Yard #,
// Date, notes and the other typed boxes). Ticks and choices are stored as
// combined text such as "Oxalic acid, Apivar", so they can't be taken apart
// reliably: for those, delete the entry and add it again.
import { mitesPer100 } from "./mites.js";
import { isHiveIdMissing, getInputProblems } from "./validation.js";

// column = the name in the saved row, name = the form field it matches.
// `core` fields are always offered; the others only when the entry has a value.
const FIELDS = [
  { column: "Yard #", name: "yardNo", label: "Yard #", type: "text", core: true },
  { column: "Hive ID", name: "hiveId", label: "Hive ID", type: "text", core: true },
  { column: "Date", name: "date", label: "Date", type: "date", core: true },
  { column: "Temp (°C)", name: "weatherTemp", label: "Temp (°C)", type: "number", inputMode: "decimal" },
  { column: "Brood Coverage %", name: "broodPct", label: "Brood coverage %", type: "number", inputMode: "decimal" },
  { column: "Brood Frames", name: "broodFrames", label: "Brood frames", type: "number", inputMode: "numeric" },
  { column: "Bees Sampled", name: "miteBees", label: "Bees sampled", type: "number", inputMode: "numeric", mite: true },
  { column: "Mites Counted", name: "miteCount", label: "Mites counted", type: "number", inputMode: "numeric", mite: true },
  { column: "Other Treatment", name: "trtOther", label: "Other treatment", type: "text" },
  { column: "Other Feed", name: "feedOther", label: "Other feed", type: "text" },
  { column: "New Apiary Location", name: "newApiaryLocation", label: "New apiary location", type: "text" },
  { column: "New Hive ID", name: "newHiveId", label: "New hive ID", type: "text" },
  { column: "Supers Removed", name: "supersRemoved", label: "Supers removed", type: "number", inputMode: "numeric" },
  { column: "Honey (kg)", name: "honeyKg", label: "Honey (kg)", type: "number", inputMode: "decimal" },
  { column: "Notes", name: "notes", label: "Notes", type: "textarea", core: true },
];

const hasValue = (v) => v !== "" && v !== undefined && v !== null;

export function editableFields(row) {
  const skipped = row["Mite Method"] === "Not done";
  return FIELDS.filter(
    (f) => f.core || (hasValue(row[f.column]) && !(f.mite && skipped)),
  );
}

// The saved columns as strings, ready to put in the edit boxes.
export function rowToEdits(row) {
  return Object.fromEntries(FIELDS.map((f) => [f.name, String(row[f.column] ?? "")]));
}

// Returns a copy of the row with the edits written in. Only fields offered for
// editing are touched, text is trimmed, and mites per 100 is worked out again
// from the counts; everything else in the row is left exactly as it was.
export function applyEdits(row, edits) {
  const next = { ...row };
  for (const f of editableFields(row)) {
    if (!(f.name in edits)) continue;
    const value = edits[f.name];
    next[f.column] = typeof value === "string" ? value.trim() : value;
  }
  if (row["Mite Method"] !== "Not done") {
    next["Mites per 100 Bees"] = mitesPer100(next["Bees Sampled"], next["Mites Counted"]) ?? "";
  }
  return next;
}

// Same rules as when adding an entry, plus the Hive ID. [{ field, message }]
export function getEditProblems(edits, row) {
  const problems = [];
  if (isHiveIdMissing({ hiveId: edits.hiveId })) {
    problems.push({ field: "hiveId", message: "Hive ID is required." });
  }
  problems.push(
    ...getInputProblems({ ...edits, miteNotDone: row["Mite Method"] === "Not done" }),
  );
  return problems;
}

