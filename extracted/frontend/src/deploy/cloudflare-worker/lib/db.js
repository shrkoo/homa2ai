/**
 * Homa AI — D1 Database Helpers (B3)
 *
 * Entity allowlist, safe column names, CRUD helpers.
 * Table names are NEVER taken from user input — only from the allowlist.
 */

// ===== Entity → Table mapping =====
// userScoped: records are isolated by user_id
// ownerKey: alternative owner column (e.g. owner_id for api_usage)
// singleton: one record per user (e.g. usage, api_credits)
// adminOnly: only admins can read/write (e.g. plans, feature_costs, provider_configs)
export const ENTITY_MAP = {
  users:            { table: 'users',            userScoped: true,  singleton: true },
  conversations:    { table: 'conversations',     userScoped: true },
  chat_folders:     { table: 'chat_folders',      userScoped: true },
  messages:         { table: 'messages',          userScoped: true },
  usage:            { table: 'usage',             userScoped: true,  singleton: true },
  credit_transactions: { table: 'credit_transactions', userScoped: true, readOnly: true },
  orders:           { table: 'orders',            userScoped: true },
  api_keys:         { table: 'api_keys',          userScoped: true },
  api_credits:      { table: 'api_credits',       userScoped: true,  singleton: true },
  api_usage:        { table: 'api_usage',         userScoped: false, ownerKey: 'owner_id' },
  api_jobs:         { table: 'api_jobs',          userScoped: false, ownerKey: 'owner_id' },
  support_tickets:  { table: 'support_tickets',   userScoped: true },
  referrals:        { table: 'referrals',         userScoped: false, ownerKey: 'referrer_id' },
  library_items:    { table: 'library_items',     userScoped: true },
  projects:        { table: 'projects',          userScoped: true },
  tasks:           { table: 'tasks',              userScoped: true },
  prompt_templates: { table: 'prompt_templates',  userScoped: true },
  favorites:       { table: 'favorites',          userScoped: true },
  shopping_lists:  { table: 'shopping_lists',     userScoped: true },
  price_reminders: { table: 'price_reminders',    userScoped: true },
  price_history:   { table: 'price_history',      userScoped: true },
  favorite_stores: { table: 'favorite_stores',     userScoped: true },
  search_history:  { table: 'search_history',     userScoped: true },
  user_connections: { table: 'user_connections',  userScoped: true },
  tts_cache:       { table: 'tts_cache',          userScoped: true },
  plans:           { table: 'plans',              userScoped: false, adminOnly: true, publicRead: true },
  feature_costs:   { table: 'feature_costs',      userScoped: false, adminOnly: true },
  provider_configs:{ table: 'provider_configs',  userScoped: false, adminOnly: true },
  alarms:          { table: 'alarms',             userScoped: true },
  reminders:       { table: 'reminders',          userScoped: true },
  alarm_history:   { table: 'alarm_history',      userScoped: true },
};

export function isValidEntity(name) {
  return !!ENTITY_MAP[name];
}

export function getEntityConfig(name) {
  return ENTITY_MAP[name];
}

// ===== Safe column name (prevent SQL injection) =====
export function safeColumn(name) {
  const cleaned = String(name || '').replace(/[^a-zA-Z_]/g, '');
  return cleaned || 'id';
}

// ===== Sortable columns whitelist =====
const SORTABLE = new Set([
  'id', 'created_at', 'updated_at', 'title', 'name', 'status', 'priority',
  'amount', 'credits', 'balance', 'sort', 'active', 'price_toman',
  'remind_at', 'triggered_at', 'next_trigger', 'due_date', 'last_used_at',
]);

export function safeSort(field) {
  const f = safeColumn(field);
  return SORTABLE.has(f) ? f : 'created_at';
}

// ===== Generate record ID =====
export function genId() {
  return 'rec_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
}

// ===== Build WHERE clause with user scoping =====
export function buildScopedWhere(cfg, userId, extraConditions, binds) {
  const ownerCol = cfg.userScoped ? 'user_id' : (cfg.ownerKey || 'user_id');
  const conditions = [`${ownerCol} = ?`];
  const allBinds = [userId, ...(binds || [])];
  if (extraConditions) {
    conditions.push(...extraConditions);
  }
  return { where: conditions.join(' AND '), binds: allBinds };
}