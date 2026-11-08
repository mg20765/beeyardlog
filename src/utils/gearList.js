// The gear checklist: what to pack for a yard day, and what to pack for
// extraction day. Containers belong to extraction day only; they are not taken
// out to the yards.
//
// Ticks and the beekeeper's own items are kept on the phone, apart from the
// inspection records, so they are not part of the backup file and can never
// touch the log. `storage` is passed in so this can be unit tested.

const item = (id, label) => ({ id, label });

export const GEAR = {
  yard: [
    {
      title: "Essentials",
      items: [
        item("smoker", "Smoker"),
        item("smoker-fuel", "Smoker fuel"),
        item("lighter", "Lighter or matches"),
        item("hive-tool", "Hive tool"),
        item("bee-brush", "Bee brush"),
        item("suit", "Suit and veil"),
        item("gloves", "Gloves"),
        item("mite-kit", "Mite-check kit"),
        item("phone", "Phone charged (BeeYardLog)"),
      ],
    },
    {
      title: "Adding supers and feed",
      items: [
        item("supers", "Supers with frames"),
        item("excluders", "Queen excluders"),
        item("feed", "Feed (syrup or fondant)"),
        item("spares", "Spare lids and floors"),
        item("tie-downs", "Tie-downs for loading"),
      ],
    },
    {
      title: "Treatments",
      items: [
        item("treatments", "Treatments (check dates)"),
        item("treatment-gloves", "Gloves for treatments"),
      ],
    },
    {
      title: "Taking honey off",
      items: [
        item("escape-boards", "Bee escape boards"),
        item("carrier", "Bee-proof box or lid for supers"),
      ],
    },
    {
      title: "Looking after yourself",
      items: [
        item("water", "Water to drink"),
        item("sun", "Sunscreen and hat"),
        item("first-aid", "First-aid kit"),
      ],
    },
  ],
  extraction: [
    {
      title: "Extraction day",
      items: [
        item("extractor", "Extractor"),
        item("uncapping", "Uncapping knife or fork"),
        item("strainers", "Strainers"),
        item("containers", "Containers or buckets"),
        item("lids", "Food-safe lids"),
        item("labels", "Labels"),
        item("clean-cloths", "Clean cloths"),
      ],
    },
  ],
};

const MAX_NAME = 40;

export const emptyGear = () => ({ ticked: [], custom: { yard: [], extraction: [] } });

// The built-in groups, then the beekeeper's own items as a last group.
export function groupsFor(mode, gear) {
  const own = gear.custom[mode] ?? [];
  const groups = GEAR[mode].map((g) => ({ ...g, own: false }));
  return own.length > 0 ? [...groups, { title: "Your own items", items: own, own: true }] : groups;
}

export function allItems(mode, gear) {
  return groupsFor(mode, gear).flatMap((g) => g.items);
}

export function toggleTick(gear, id) {
  const ticked = gear.ticked.includes(id)
    ? gear.ticked.filter((t) => t !== id)
    : [...gear.ticked, id];
  return { ...gear, ticked };
}

export function addCustom(gear, mode, name) {
  const label = String(name ?? "").trim().slice(0, MAX_NAME).trim();
  if (!label) return gear;
  const taken = allItems(mode, gear).some((i) => i.label.toLowerCase() === label.toLowerCase());
  if (taken) return gear;
  const id = `custom:${mode}:${label.toLowerCase()}`;
  return { ...gear, custom: { ...gear.custom, [mode]: [...gear.custom[mode], item(id, label)] } };
}

export function removeCustom(gear, mode, id) {
  return {
    ticked: gear.ticked.filter((t) => t !== id),
    custom: { ...gear.custom, [mode]: gear.custom[mode].filter((i) => i.id !== id) },
  };
}

// A fresh trip: everything unticked, your own items kept.
export const startNewTrip = (gear) => ({ ...gear, ticked: [] });

export function progress(mode, gear) {
  const items = allItems(mode, gear);
  return { done: items.filter((i) => gear.ticked.includes(i.id)).length, total: items.length };
}

const KEY = "hive-gear-list";

const browserStorage = () => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

const isItem = (i) => i && typeof i.id === "string" && typeof i.label === "string";

export function loadGear(storage = browserStorage()) {
  try {
    const saved = JSON.parse(storage?.getItem(KEY) ?? "null");
    if (!saved || !Array.isArray(saved.ticked) || typeof saved.custom !== "object" || !saved.custom) {
      return emptyGear();
    }
    const list = (mode) => (Array.isArray(saved.custom[mode]) ? saved.custom[mode].filter(isItem) : []);
    return {
      ticked: saved.ticked.filter((t) => typeof t === "string"),
      custom: { yard: list("yard"), extraction: list("extraction") },
    };
  } catch {
    return emptyGear();
  }
}

export function saveGear(gear, storage = browserStorage()) {
  try {
    storage?.setItem(KEY, JSON.stringify(gear));
  } catch {
    // Not saved; the ticks still work until the app is closed.
  }
}
