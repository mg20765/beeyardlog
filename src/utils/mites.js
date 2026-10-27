// Varroa mite check maths (alcohol wash or sugar roll): you sample a number of
// bees, count the mites, and compare as mites per 100 bees.

// The line where the app suggests treating, in mites per 100 bees. Chosen by
// the beekeeper; change it here if your own guidance uses a different number.
export const TREAT_AT_PER_100 = 3;

// A whole number from a number or from plain digits. Anything written oddly
// ("3e2", "0x12") gives NaN instead of being quietly accepted.
const whole = (v) => {
  if (typeof v === "number") return v;
  const text = String(v).trim();
  return /^\d+$/.test(text) ? Number(text) : NaN;
};

// Mites per 100 bees to one decimal place, or null when the numbers can't
// give a sensible answer (blank, zero bees, negative, not whole numbers, or
// more mites than bees).
export function mitesPer100(bees, mites) {
  if (bees === "" || mites === "" || bees == null || mites == null) return null;
  const b = whole(bees);
  const m = whole(mites);
  if (!Number.isInteger(b) || !Number.isInteger(m)) return null;
  if (b <= 0 || m < 0 || m > b) return null;
  return Math.round((m / b) * 1000) / 10;
}

export function isAtOrAboveThreshold(rate) {
  return rate != null && rate >= TREAT_AT_PER_100;
}
