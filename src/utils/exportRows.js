import { omitId } from "./omitId.js";

// Rows as they should appear in the Excel export. Checkbox fields are stored
// as true/false, which Excel would show as TRUE/FALSE next to columns that
// say Yes/No, so they're converted here. Stored data is left as it is.
export function rowsForExport(log) {
  return log.map((row) => {
    const out = omitId(row);
    for (const key of Object.keys(out)) {
      if (typeof out[key] === "boolean") out[key] = out[key] ? "Yes" : "No";
    }
    return out;
  });
}
