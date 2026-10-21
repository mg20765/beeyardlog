// Keeps a half-filled inspection form on the device so it survives the page
// reloading (an ad, a phone call, the browser reclaiming memory). It lives in
// localStorage: the form is tiny, and the read has to be instant on startup.
// Storage is passed in so the logic can be unit tested without a browser.
import { initialForm } from "./hiveForm.js";
import { todayLocal } from "./date.js";

// The key keeps the app's earlier name on purpose: it is where saved drafts
// already live on people's phones, so renaming it would orphan them.
export const DRAFT_KEY = "yardbook_form_draft";

// True when nothing has been typed or ticked. The date is ignored because it
// is pre-filled with today's date.
export function isPristine(form) {
  const blank = initialForm();
  return Object.keys(blank).every((key) => key === "date" || form[key] === blank[key]);
}

// Lays saved values over a blank form, keeping only keys the form still has
// and values of the right type, so an old or damaged draft can't break it.
export function mergeDraft(saved, base) {
  if (saved === null || typeof saved !== "object" || Array.isArray(saved)) {
    return base;
  }
  const merged = { ...base };
  for (const key of Object.keys(base)) {
    if (key in saved && typeof saved[key] === typeof base[key]) {
      merged[key] = saved[key];
    }
  }
  return merged;
}

// Returns the saved draft as a full form, or null if there isn't a usable one.
// If the draft was started on an earlier day and its date was just that day's
// pre-filled default, the date moves to today; a date the person picked on
// purpose (for example when catching up on old inspections) is kept.
export function loadDraft(storage = localStorage, today = todayLocal()) {
  try {
    const raw = storage.getItem(DRAFT_KEY);
    if (raw === null) return null;
    const saved = JSON.parse(raw);
    const form = mergeDraft(saved, initialForm());
    const draftedOn = saved?._draftedOn;
    if (draftedOn && draftedOn !== today && form.date === draftedOn) {
      form.date = today;
    }
    return form;
  } catch {
    return null;
  }
}

// Saves the form, or removes the draft if the form is back to blank. The day
// it was saved is kept alongside, so a stale default date can be spotted later.
export function saveDraft(form, storage = localStorage, today = todayLocal()) {
  try {
    if (isPristine(form)) storage.removeItem(DRAFT_KEY);
    else storage.setItem(DRAFT_KEY, JSON.stringify({ ...form, _draftedOn: today }));
  } catch {
    // Storage full or blocked: the draft just isn't kept. Never break typing.
  }
}

export function clearDraft(storage = localStorage) {
  try {
    storage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}
