// Shared form shape + row-mapping helpers for the Hive Logbook.
import { todayLocal } from "./date.js";
import { mitesPer100 } from "./mites.js";

export const STORAGE_KEY = "hive_inspection_log";

export const initialForm = () => ({
  date: todayLocal(),
  hiveId: "",
  yardNo: "",
  weatherTemp: "",
  weatherCondition: "",
  temperament: "",
  broodPct: "",
  broodFrames: "",
  population: "",
  queenCells: "",
  queenSighted: "",
  // Varroa mite check (alcohol wash / sugar roll)
  miteMethod: "",
  miteBees: "",
  miteCount: "",
  // Ticked when no mite check was done this visit, so a blank means "forgot"
  // and "Not done" means "decided to skip".
  miteNotDone: false,
  // Varroa / mite treatments
  trtOxalic: false,
  trtApivar: false,
  trtBayvarol: false,
  trtFormic: false,
  trtOther: "",
  // AFB isn't a treatment (there's no treating it - it's a notifiable
  // disease), but it gets flagged during the same inspection pass, so it
  // lives in the Treatments section as its own dedicated column.
  // Split into two so ticking "checked" (routine, required 4x/year) can
  // never be mistaken for ticking "found signs" (rare, the real alert).
  afbChecked: false,
  afbSigns: false,
  afbReported: false,
  // Feeding (separate from treatments)
  feedSyrup: false,
  feedDryFeed: false,
  feedPatties: false,
  feedNutrition: false,
  feedOther: "",
  addBoxes: false,
  addSupers: false,
  addExcluder: false,
  addSplit: false,
  addRequeened: false,
  addPollenTrap: false,
  addFeeder: false,
  removedToStorage: false,
  storageFdBoxes: "",
  storageThreeQuarterBoxes: "",
  storageBase: false,
  storageLid: false,
  storageExcluder: false,
  storageFeeder: false,
  storageStrap: false,
  storageOther: "",
  movedApiary: false,
  newApiaryLocation: "",
  newHiveId: "",
  entrance: "",
  honeyLevel: "",
  pollenLevel: "",
  supersRemoved: "",
  honeyKg: "",
  notes: "",
  winteredDown: false,
});

export function formToRow(f) {
  const treatments = [
    f.trtOxalic && "Oxalic acid",
    f.trtApivar && "Apivar",
    f.trtBayvarol && "Bayvarol",
    f.trtFormic && "Formic acid",
  ]
    .filter(Boolean)
    .join(", ");

  const feeding = [
    f.feedSyrup && "Syrup",
    f.feedDryFeed && "Dry feed",
    f.feedPatties && "Patties",
    f.feedNutrition && "Nutrition boost",
  ]
    .filter(Boolean)
    .join(", ");

  const storageItems = [
    f.storageFdBoxes && `${f.storageFdBoxes}x FD box`,
    f.storageThreeQuarterBoxes && `${f.storageThreeQuarterBoxes}x 3/4 box`,
    f.storageBase && "Base",
    f.storageLid && "Lid",
    f.storageExcluder && "Queen excluder",
    f.storageFeeder && "Feeder",
    f.storageStrap && "Strap",
    f.storageOther && f.storageOther,
  ]
    .filter(Boolean)
    .join(", ");

  const additions = [
    f.addBoxes && "Boxes added",
    f.addSupers && "Supers added",
    f.addExcluder && "Excluder",
    f.addSplit && "Split",
    f.addRequeened && "Requeened",
    f.addPollenTrap && "Pollen trap",
    f.addFeeder && "Feeder",
    f.removedToStorage && "Removed to storage",
    f.movedApiary && "Moved to different apiary",
    f.winteredDown && "Wintered down",
  ]
    .filter(Boolean)
    .join(", ");

  return {
    Date: f.date,
    // Trimmed so "H1 " and "H1" don't become two different hives in Excel.
    "Hive ID": f.hiveId.trim(),
    "Yard #": f.yardNo.trim(),
    "Temp (°C)": f.weatherTemp,
    Weather: f.weatherCondition,
    Temperament: f.temperament,
    "Brood Coverage %": f.broodPct,
    "Brood Frames": f.broodFrames,
    Population: f.population,
    "Queen Cells": f.queenCells,
    "Queen Sighted": f.queenSighted,
    // When skipped, any numbers typed earlier are ignored.
    "Mite Method": f.miteNotDone ? "Not done" : f.miteMethod,
    "Bees Sampled": f.miteNotDone ? "" : f.miteBees,
    "Mites Counted": f.miteNotDone ? "" : f.miteCount,
    // Worked out here (not typed) so the saved row always agrees with the counts.
    "Mites per 100 Bees": f.miteNotDone
      ? ""
      : (mitesPer100(f.miteBees, f.miteCount) ?? ""),
    Treatments: treatments,
    "Other Treatment": f.trtOther,
    "AFB Checked": f.afbChecked,
    "AFB Signs Found": f.afbSigns,
    "AFB Reported (7-day)": f.afbSigns ? (f.afbReported ? "Yes" : "No") : "",
    Feeding: feeding,
    "Other Feed": f.feedOther,
    Additions: additions,
    "Storage Contents": f.removedToStorage ? storageItems : "",
    "New Apiary Location": f.movedApiary ? f.newApiaryLocation : "",
    "New Hive ID": f.newHiveId.trim(),
    "Adjusted Entrance": f.entrance,
    "Honey Level": f.honeyLevel,
    "Pollen Level": f.pollenLevel,
    "Supers Removed": f.supersRemoved,
    "Honey (kg)": f.honeyKg,
    "Wintered Down": f.winteredDown,
    Notes: f.notes,
  };
}
