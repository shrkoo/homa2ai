// Homa Alarm Store — IndexedDB-backed offline-first data layer for
// Alarms, Reminders, and AlarmHistory. Replaces base44.entities for the
// alarm/reminder subsystem. The alarm engine reads from IndexedDB so alarms
// fire with no network and no Base44 runtime dependency.
//
// Cloud source of truth: Homa API (Cloudflare Worker) — best-effort sync.
// Local source of runtime: IndexedDB. Sync is optional and never blocks.

const DB_NAME = 'homa_alarms';
const DB_VERSION = 1;
const STORES = { alarms: 'alarms', reminders: 'reminders', history: 'history', meta: 'meta' };

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORES.alarms)) db.createObjectStore(STORES.alarms, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(STORES.reminders)) db.createObjectStore(STORES.reminders, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(STORES.history)) db.createObjectStore(STORES.history, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(STORES.meta)) db.createObjectStore(STORES.meta, { keyPath: 'key' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) { reject(e); }
  });
  return dbPromise;
}

function txGetAll(store) {
  return openDB().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(store, 'readonly');
    const req = t.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  }));
}

function txPut(store, value) {
  return openDB().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(store, 'readwrite');
    t.objectStore(store).put(value);
    t.oncomplete = () => resolve(value);
    t.onerror = () => reject(t.error);
  }));
}

function txDelete(store, id) {
  return openDB().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(store, 'readwrite');
    t.objectStore(store).delete(id);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  }));
}

function txMetaSet(key, value) { return txPut(STORES.meta, { key, value }); }
function txMetaGet(key) {
  return openDB().then((db) => new Promise((resolve) => {
    const t = db.transaction(STORES.meta, 'readonly');
    const req = t.objectStore(STORES.meta).get(key);
    req.onsuccess = () => resolve(req.result?.value ?? null);
    req.onerror = () => resolve(null);
  }));
}

// ---- Cloud sync config (Homa Worker) ----
function workerConfig() {
  try {
    return {
      url: (localStorage.getItem('homa_worker_url') || '').trim(),
      key: (localStorage.getItem('homa_worker_key') || '').trim(),
      token: (localStorage.getItem('base44_access_token') || '').trim(),
    };
  } catch { return { url: '', key: '', token: '' }; }
}

function isOnline() { try { return navigator.onLine !== false; } catch { return true; } }

async function cloudCall(path, method, body) {
  const { url, key, token } = workerConfig();
  if (!url || !key || !isOnline()) return null;
  const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key };
  if (token) headers['X-User-Token'] = token;
  try {
    const res = await fetch(url.replace(/\/$/, '') + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// ---- Helpers ----
function genId() {
  try { return (crypto.randomUUID && crypto.randomUUID()) || 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2); }
  catch { return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2); }
}
function nowISO() { return new Date().toISOString(); }

function matchesFilter(record, query) {
  if (!query || typeof query !== 'object') return true;
  for (const [field, cond] of Object.entries(query)) {
    if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
      if ('$in' in cond) { if (!Array.isArray(cond.$in) || !cond.$in.includes(record[field])) return false; }
      else if ('$gte' in cond) { if (!(record[field] >= cond.$gte)) return false; }
      else if ('$lte' in cond) { if (!(record[field] <= cond.$lte)) return false; }
      else if ('$ne' in cond) { if (record[field] === cond.$ne) return false; }
      else { if (record[field] !== cond) return false; }
    } else {
      if (record[field] !== cond) return false;
    }
  }
  return true;
}

function sortByField(arr, sort) {
  if (!sort) return arr;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return [...arr].sort((a, b) => {
    const av = a[field], bv = b[field];
    if (av == null && bv == null) return 0;
    if (av == null) return desc ? 1 : -1;
    if (bv == null) return desc ? -1 : 1;
    if (av < bv) return desc ? 1 : -1;
    if (av > bv) return desc ? -1 : 1;
    return 0;
  });
}

// ---- Generic collection factory ----
function makeCollection(storeName, cloudPath) {
  return {
    async list(sort, limit) {
      const all = await txGetAll(storeName);
      let res = sortByField(all, sort);
      if (limit) res = res.slice(0, limit);
      return res;
    },
    async filter(query, sort, limit) {
      const all = await txGetAll(storeName);
      let res = sortByField(all.filter((r) => matchesFilter(r, query)), sort);
      if (limit) res = res.slice(0, limit);
      return res;
    },
    async get(id) {
      const all = await txGetAll(storeName);
      return all.find((r) => r.id === id) || null;
    },
    async create(data) {
      const now = nowISO();
      const record = { ...data, id: data.id || genId(), created_date: now, updated_date: now };
      await txPut(storeName, record);
      cloudCall(cloudPath, 'POST', record).catch(() => {});
      return record;
    },
    async update(id, data) {
      const all = await txGetAll(storeName);
      const existing = all.find((r) => r.id === id) || {};
      const record = { ...existing, ...data, id, updated_date: nowISO() };
      await txPut(storeName, record);
      cloudCall(`${cloudPath}/${encodeURIComponent(id)}`, 'PATCH', data).catch(() => {});
      return record;
    },
    async delete(id) {
      await txDelete(storeName, id);
      cloudCall(`${cloudPath}/${encodeURIComponent(id)}`, 'DELETE').catch(() => {});
    },
  };
}

export const alarms = makeCollection(STORES.alarms, '/alarms');
export const reminders = makeCollection(STORES.reminders, '/reminders');
export const history = makeCollection(STORES.history, '/alarms/history');

// ---- Sync: pull cloud → IDB, then push IDB-only records → cloud ----
let syncing = false;
export async function sync() {
  if (syncing) return;
  const { url, key, token } = workerConfig();
  if (!url || !key || !token || !isOnline()) return;
  syncing = true;
  try {
    const [alarmsRes, remindersRes, historyRes] = await Promise.all([
      cloudCall('/alarms', 'GET'),
      cloudCall('/reminders', 'GET'),
      cloudCall('/alarms/history', 'GET'),
    ]);
    const cloudAlarms = alarmsRes?.items;
    const cloudReminders = remindersRes?.items;
    const cloudHistory = historyRes?.items;
    const merge = async (storeName, cloudList, cloudPath) => {
      if (!Array.isArray(cloudList)) return;
      const local = await txGetAll(storeName);
      const localIds = new Set(local.map((r) => r.id));
      // Upsert cloud records into IDB (cloud wins if newer)
      for (const cr of cloudList) {
        if (!cr?.id) continue;
        const lr = local.find((r) => r.id === cr.id);
        if (!lr || new Date(cr.updated_date || 0) >= new Date(lr.updated_date || 0)) {
          await txPut(storeName, cr);
        }
      }
      // Push local-only records to cloud
      const refreshed = await txGetAll(storeName);
      const cloudIds = new Set(cloudList.map((r) => r.id));
      for (const r of refreshed) {
        if (!cloudIds.has(r.id)) { cloudCall(cloudPath, 'POST', r).catch(() => {}); }
      }
    };
    await merge(STORES.alarms, cloudAlarms, '/alarms');
    await merge(STORES.reminders, cloudReminders, '/reminders');
    await merge(STORES.history, cloudHistory, '/alarms/history');
    await txMetaSet('lastSyncAt', nowISO());
  } catch {}
  syncing = false;
}

// Auto-sync on app start + when back online
if (typeof window !== 'undefined') {
  let booted = false;
  const boot = () => { if (!booted) { booted = true; setTimeout(sync, 1500); } };
  boot();
  window.addEventListener('online', () => setTimeout(sync, 500));
}

export default { alarms, reminders, history, sync };