// Varroa mite check maths (alcohol wash or sugar roll): you sample a number of
// bees, count the mites, and compare as mites per 100 bees.

// The line where the app suggests treating, in mites per 100 bees. Chosen by
// the beekeeper; change it here if your own guidance uses a different number.
export const TREAT_AT_PER_100 = 3;

// Mites per 100 bees to one decimal place, or null when the numbers can't
// give a sensible answer (blank, zero bees, negative, not whole numbers, or
// more mites than bees).
export function mitesPer100(bees, mites) {
  if (bees === "" || mites === "" || bees == null || mites == null) return null;
  const b = Number(bees);
  const m = Number(mites);
  if (!Number.isInteger(b) || !Number.isInteger(m)) return null;
  if (b <= 0 || m < 0 || m > b) return null;
  return Math.round((m / b) * 1000) / 10;
}

export function isAtOrAboveThreshold(rate) {
  return rate != null && rate >= TREAT_AT_PER_100;
}
