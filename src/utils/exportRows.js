import { omitId } from "./omitId.js";

// Columns that hold a typed number. In the export they become real numbers so
// Excel can add up, average and sort them. IDs and names are left as text:
// a Hive ID of "007" must stay "007".
const NUMBER_COLUMNS = [
  "Temp (°C)",
  "Brood Coverage %",
  "Brood Frames",
  "Bees Sampled",
  "Mites Counted",
  "Supers Removed",
  "Honey (kg)",
];

const PLAIN_NUMBER = /^-?(\d+(\.\d+)?|\.\d+)$/;

// Rows as they should appear in the Excel export. Checkbox fields are stored
// as true/false, which Excel would show as TRUE/FALSE next to columns that
// say Yes/No, so they're converted here; typed numbers become numbers. A value
// that isn't a plain number is left as it is rather than lost. Stored data is
// left as it is.
export function rowsForExport(log) {
  return log.map((row) => {
    const out = omitId(row);
    for (const key of Object.keys(out)) {
      const value = out[key];
      if (typeof value === "boolean") {
        out[key] = value ? "Yes" : "No";
      } else if (
        NUMBER_COLUMNS.includes(key) &&
        typeof value === "string" &&
        PLAIN_NUMBER.test(value.trim())
      ) {
        out[key] = Number(value.trim());
      }
    }
    return out;
  });
}
