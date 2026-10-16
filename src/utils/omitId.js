// Strips the IndexedDB-assigned "id" field from a row, e.g. before writing
// it to an Excel export or JSON backup where it doesn't belong.
export function omitId(row) {
  const copy = { ...row };
  delete copy.id;
  return copy;
}
