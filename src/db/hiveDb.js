import { openDB } from "idb";
import { omitId } from "../utils/omitId.js";

const DB_NAME = "hive-logbook-db";

const DB_VERSION = 2;
const STORE = "inspections";


export const LEGACY_STORAGE_KEY = "hive_inspection_log";

let dbPromise;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, {
            keyPath: "id",
            autoIncrement: true,
          });
          
          store.createIndex("byDate", "Date");
        }
      },
    });
  }
  return dbPromise;
}

let migrated = false;

// One-time move of any rows saved under the legacy localStorage key into
// IndexedDB. Safe to call repeatedly - it's a no-op once the key is gone.
async function migrateFromLocalStorage() {
  if (migrated) return;
  migrated = true;
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return;
    const rows = JSON.parse(raw);
    if (Array.isArray(rows) && rows.length > 0) {
      const db = await getDb();
      const tx = db.transaction(STORE, "readwrite");
      for (const row of rows) {
        await tx.store.add(omitId(row));
      }
      await tx.done;
    }
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (err) {
    console.warn("Could not migrate legacy localStorage log:", err);
  }
}

export async function getAllInspections() {
  await migrateFromLocalStorage();
  const db = await getDb();
  const all = await db.getAll(STORE);
  return all.sort((a, b) => a.id - b.id);
}

export async function addInspection(row) {
  const db = await getDb();
  const id = await db.add(STORE, row);
  return { ...row, id };
}

export async function deleteInspection(id) {
  const db = await getDb();
  await db.delete(STORE, id);
}

export async function clearInspections() {
  const db = await getDb();
  await db.clear(STORE);
}

// Adds a batch of rows from an imported backup file. Existing ids are
// dropped so autoIncrement assigns fresh ones - importing never overwrites
// what's already on the device, it only adds to it.
export async function importInspections(rows) {
  const db = await getDb();
  const tx = db.transaction(STORE, "readwrite");
  for (const row of rows) {
    await tx.store.add(omitId(row));
  }
  await tx.done;
  return getAllInspections();
}
