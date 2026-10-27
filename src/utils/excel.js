// Builds and saves the Excel export. Kept out of the hook so the spreadsheet
// library lives in one place (and can be loaded on demand later).
import * as XLSX from "xlsx";
import { rowsForExport } from "./exportRows.js";
import { todayLocal } from "./date.js";

// Excel stores a date as the number of days since 30 Dec 1899. Worked out from
// the calendar date alone, so the person's timezone can't shift it by a day.
// Returns null for anything that isn't a real YYYY-MM-DD date.
export function excelDateSerial(date) {
  if (typeof date !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(y, mo - 1, d);
  const check = new Date(t);
  const real =
    check.getUTCFullYear() === y && check.getUTCMonth() === mo - 1 && check.getUTCDate() === d;
  return real ? (t - Date.UTC(1899, 11, 30)) / 86400000 : null;
}

// The workbook for a log: real numbers and real dates (so Excel can add up,
// sort and chart them), IDs left as text, ticks as Yes/No.
export function buildWorkbook(log) {
  const rows = rowsForExport(log);
  const ws = XLSX.utils.json_to_sheet(rows);

  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let c = range.s.c; c <= range.e.c; c++) {
    if (ws[XLSX.utils.encode_cell({ r: 0, c })]?.v !== "Date") continue;
    for (let r = 1; r <= range.e.r; r++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      const serial = excelDateSerial(cell?.v);
      if (serial !== null) Object.assign(cell, { t: "n", v: serial, z: "yyyy-mm-dd" });
    }
  }

  const keys = [...new Set(rows.flatMap(Object.keys))];
  ws["!cols"] = keys.map((k) => ({
    wch: Math.max(k.length, ...rows.map((r) => String(r[k] ?? "").length)) + 2,
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inspections");
  return wb;
}

export function writeExcel(log) {
  if (log.length === 0) return;
  XLSX.writeFile(buildWorkbook(log), `hive_log_${todayLocal()}.xlsx`);
}
