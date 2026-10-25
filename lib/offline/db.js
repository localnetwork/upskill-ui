const DB_NAME = "upskill-offline";
const DB_VERSION = 1;
export const STORES = { QUEUE: "queue", DOWNLOADS: "downloads" };

let dbPromise = null;

function openDb() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORES.QUEUE)) {
          db.createObjectStore(STORES.QUEUE, {
            keyPath: "id",
            autoIncrement: true,
          });
        }
        if (!db.objectStoreNames.contains(STORES.DOWNLOADS)) {
          db.createObjectStore(STORES.DOWNLOADS, { keyPath: "lessonId" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = null;
        reject(req.error);
      };
    });
  }
  return dbPromise;
}

async function run(store, mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const request = fn(tx.objectStore(store));
    tx.oncomplete = () => resolve(request?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export const dbAdd = (store, value) => run(store, "readwrite", (s) => s.add(value));
export const dbPut = (store, value) => run(store, "readwrite", (s) => s.put(value));
export const dbGet = (store, key) => run(store, "readonly", (s) => s.get(key));
export const dbGetAll = (store) => run(store, "readonly", (s) => s.getAll());
export const dbDelete = (store, key) => run(store, "readwrite", (s) => s.delete(key));
export const dbClear = (store) => run(store, "readwrite", (s) => s.clear());
