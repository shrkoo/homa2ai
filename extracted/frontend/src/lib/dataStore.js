/**
 * dataStore.js — Entity data access via Cloudflare Worker D1 (no Base44).
 *
 * All entity CRUD goes through the Worker's /data/* REST API.
 * User identity is proven by the Homa token (X-User-Token header).
 * No Base44 SDK dependency at runtime.
 */

// ===== Entity name mapping: PascalCase → Worker D1 snake_case =====
const ENTITY_NAME_MAP = {
  User: 'users',
  Conversation: 'conversations',
  ChatFolder: 'chat_folders',
  Message: 'messages',
  Usage: 'usage',
  CreditTransaction: 'credit_transactions',
  Order: 'orders',
  ApiKey: 'api_keys',
  ApiCredit: 'api_credits',
  ApiUsage: 'api_usage',
  ApiJob: 'api_jobs',
  SupportTicket: 'support_tickets',
  Referral: 'referrals',
  LibraryItem: 'library_items',
  Project: 'projects',
  Task: 'tasks',
  PromptTemplate: 'prompt_templates',
  Favorite: 'favorites',
  ShoppingList: 'shopping_lists',
  PriceReminder: 'price_reminders',
  PriceHistory: 'price_history',
  FavoriteStore: 'favorite_stores',
  SearchHistory: 'search_history',
  UserConnection: 'user_connections',
  TTSCache: 'tts_cache',
  Plan: 'plans',
  FeatureCost: 'feature_costs',
  ProviderConfig: 'provider_configs',
  Alarm: 'alarms',
  Reminder: 'reminders',
  AlarmHistory: 'alarm_history',
};

function toWorkerEntityName(pascalName) {
  return ENTITY_NAME_MAP[pascalName] || pascalName.toLowerCase();
}

// ===== Worker config (read from localStorage) =====
const getWorkerConfig = () => {
  try {
    return {
      url: (localStorage.getItem('homa_worker_url') || 'https://homa-ai-core.shahramalidazeh620.workers.dev').trim().replace(/\/$/, ''),
      token: (localStorage.getItem('base44_access_token') || '').trim(),
    };
  } catch {
    return { url: '', token: '' };
  }
};

export const isWorkerReady = () => {
  const c = getWorkerConfig();
  return !!(c.url && c.token);
};

// ===== Generic Worker D1 REST call =====
async function workerCall(path, method, body) {
  const { url, token } = getWorkerConfig();
  if (!url) throw new Error('worker_not_configured');
  if (!token) throw new Error('not_authenticated');

  const res = await fetch(url + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Token': token,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = 'worker_' + res.status;
    try { const j = await res.json(); if (j?.error) msg = j.error; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// ===== Map sort param: '-updated_date' → { field: 'updated_date', dir: 'DESC' } =====
function parseSort(sort) {
  if (!sort) return { field: 'created_at', dir: 'DESC' };
  const dir = sort.startsWith('-') ? 'DESC' : 'ASC';
  const field = sort.replace(/^-/, '');
  return { field, dir };
}

// ===== Entity factory: returns a Base44-compatible interface backed by Worker D1 =====
function makeWorkerEntity(pascalName) {
  const entityName = toWorkerEntityName(pascalName);
  const base = `/data/${entityName}`;

  return {
    async list(sort, limit) {
      const { field, dir } = parseSort(sort);
      const qs = new URLSearchParams({
        sort: field,
        dir,
        limit: String(limit || 100),
      });
      const res = await workerCall(`${base}?${qs}`, 'GET');
      return res.items || [];
    },

    async filter(query, sort, limit) {
      const { field, dir } = parseSort(sort);
      const qs = new URLSearchParams({
        query: JSON.stringify(query || {}),
        sort: field,
        dir,
        limit: String(limit || 100),
      });
      const res = await workerCall(`${base}?${qs}`, 'GET');
      return res.items || [];
    },

    async get(id) {
      return await workerCall(`${base}/${encodeURIComponent(id)}`, 'GET');
    },

    async create(data) {
      return await workerCall(base, 'POST', data);
    },

    async bulkCreate(records) {
      return await workerCall(`${base}/bulk`, 'POST', { records });
    },

    async update(id, data) {
      return await workerCall(`${base}/${encodeURIComponent(id)}`, 'PATCH', data);
    },

    async delete(id) {
      return await workerCall(`${base}/${encodeURIComponent(id)}`, 'DELETE');
    },

    async deleteMany(query) {
      return await workerCall(`${base}/bulk`, 'DELETE', { query });
    },

    async updateMany(query, update) {
      return await workerCall(`${base}/bulk`, 'PATCH', { query, update });
    },

    async bulkUpdate(records) {
      return await workerCall(`${base}/bulk`, 'PATCH', { records });
    },

    async schema() {
      return await workerCall(`${base}/schema`, 'GET');
    },

    subscribe() {
      console.warn(`[dataStore] subscribe() not supported in Worker mode for ${entityName}`);
      return () => {};
    },
  };
}

// ===== Unified entity accessor =====
function getEntity(pascalName) {
  return makeWorkerEntity(pascalName);
}

// ===== Exported entities object (mirrors base44.entities interface) =====
export const entities = new Proxy({}, {
  get(_target, prop) {
    if (typeof prop !== 'string') return undefined;
    return getEntity(prop);
  },
});

export { makeWorkerEntity, workerCall };