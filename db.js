// db.js
export function openDB(callback) {
  const request = indexedDB.open("ProductionDB", 1);

  request.onupgradeneeded = e => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains("entries")) {
      db.createObjectStore("entries", { keyPath: "orderNo" });
    }
  };

  request.onsuccess = e => {
    const db = e.target.result;
    callback(db);
  };

  request.onerror = e => {
    console.error("❌ Failed to open IndexedDB:", e.target.error);
  };
}
