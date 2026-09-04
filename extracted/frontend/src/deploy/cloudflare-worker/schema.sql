-- Homa AI — Complete D1 Database Schema
-- Run: wrangler d1 execute homa-ai-db --file=./schema.sql
--
-- This schema mirrors ALL Base44 entity fields exactly.
-- All user-owned tables have user_id for row-level isolation.
-- Booleans stored as INTEGER (0/1). Arrays/objects stored as TEXT (JSON).
-- Dates stored as TEXT (ISO 8601).

-- ===== Users (metadata only — auth managed by Base44 now, Supabase later) =====
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT DEFAULT '',
  role TEXT DEFAULT 'user',
  display_name TEXT DEFAULT '',
  age_range TEXT DEFAULT '',
  use_cases TEXT DEFAULT '[]',
  experience_level TEXT DEFAULT '',
  primary_goal TEXT DEFAULT '',
  referral_source TEXT DEFAULT '',
  onboarding_completed INTEGER DEFAULT 0,
  default_model TEXT DEFAULT 'auto',
  memory TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ===== Conversations =====
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT DEFAULT 'گفتگوی جدید',
  last_message TEXT DEFAULT '',
  language TEXT DEFAULT 'fa',
  model TEXT DEFAULT 'auto',
  temporary INTEGER DEFAULT 0,
  archived INTEGER DEFAULT 0,
  folder_id TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_folder ON conversations(folder_id);

-- ===== Chat Folders =====
CREATE TABLE IF NOT EXISTS chat_folders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '217 91% 60%',
  sort INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_folder_user ON chat_folders(user_id, sort);

-- ===== Messages =====
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  model TEXT DEFAULT '',
  feedback TEXT DEFAULT 'none',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_msg_user ON messages(user_id);

-- ===== Usage / Credits =====
CREATE TABLE IF NOT EXISTS usage (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free',
  credits INTEGER DEFAULT 30,
  paid_total INTEGER DEFAULT 0,
  subscription_status TEXT DEFAULT 'none',
  subscription_start TEXT DEFAULT '',
  subscription_end TEXT DEFAULT '',
  total_received INTEGER DEFAULT 0,
  total_consumed INTEGER DEFAULT 0,
  daily_images INTEGER DEFAULT 0,
  daily_videos INTEGER DEFAULT 0,
  daily_files INTEGER DEFAULT 0,
  daily_search INTEGER DEFAULT 0,
  daily_research INTEGER DEFAULT 0,
  daily_date TEXT DEFAULT '',
  total_images INTEGER DEFAULT 0,
  total_videos INTEGER DEFAULT 0,
  total_files INTEGER DEFAULT 0,
  total_search INTEGER DEFAULT 0,
  total_research INTEGER DEFAULT 0,
  kimi_used INTEGER DEFAULT 0,
  kimi_total_used INTEGER DEFAULT 0,
  kimi_reset_at TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ===== Credit Transactions (Ledger — B6) =====
CREATE TABLE IF NOT EXISTS credit_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reference_id TEXT DEFAULT '',
  capability TEXT DEFAULT '',
  status TEXT DEFAULT 'completed',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_credtxn_user ON credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credtxn_ref ON credit_transactions(reference_id);

-- ===== Orders =====
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  plan TEXT NOT NULL,
  credits INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  authority TEXT DEFAULT '',
  ref_id TEXT DEFAULT '',
  description TEXT DEFAULT '',
  credits_added INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_order_user ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_status ON orders(status);

-- ===== API Keys (Developer API) =====
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  label TEXT DEFAULT '',
  active INTEGER DEFAULT 1,
  first_party INTEGER DEFAULT 0,
  expires_at TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_apikey_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_apikey_hash ON api_keys(key_hash);

-- ===== API Credits =====
CREATE TABLE IF NOT EXISTS api_credits (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  balance INTEGER DEFAULT 100,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ===== API Usage Log =====
CREATE TABLE IF NOT EXISTS api_usage (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  api_key_id TEXT DEFAULT '',
  endpoint TEXT NOT NULL,
  credits_used INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success',
  metadata TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_apiusage_owner ON api_usage(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apiusage_key ON api_usage(api_key_id);

-- ===== API Jobs (Async generation) =====
CREATE TABLE IF NOT EXISTS api_jobs (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  api_key_id TEXT DEFAULT '',
  capability TEXT NOT NULL,
  status TEXT DEFAULT 'queued',
  provider TEXT DEFAULT '',
  model TEXT DEFAULT '',
  prompt TEXT DEFAULT '',
  external_id TEXT DEFAULT '',
  result_url TEXT DEFAULT '',
  result TEXT DEFAULT '',
  error TEXT DEFAULT '',
  credits_charged INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_apijob_owner ON api_jobs(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apijob_status ON api_jobs(status);

-- ===== Support Tickets =====
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  user_email TEXT DEFAULT '',
  user_name TEXT DEFAULT '',
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'normal',
  replies TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ticket_user ON support_tickets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_status ON support_tickets(status, created_at DESC);

-- ===== Referrals =====
CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  referrer_id TEXT NOT NULL,
  referred_user_id TEXT NOT NULL,
  referred_email TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  credits_awarded INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_referral_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_referred ON referrals(referred_user_id);

-- ===== Library Items =====
CREATE TABLE IF NOT EXISTS library_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  kind TEXT DEFAULT 'text',
  file_url TEXT DEFAULT '',
  provider TEXT DEFAULT '',
  prompt TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_lib_user ON library_items(user_id, created_at DESC);

-- ===== Projects =====
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  color TEXT DEFAULT '217 91% 60%',
  archived INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_proj_user ON projects(user_id, updated_at DESC);

-- ===== Tasks =====
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT DEFAULT '',
  title TEXT NOT NULL,
  notes TEXT DEFAULT '',
  done INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'normal',
  due_date TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_task_user ON tasks(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_project ON tasks(project_id);

-- ===== Prompt Templates =====
CREATE TABLE IF NOT EXISTS prompt_templates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pt_user ON prompt_templates(user_id, created_at DESC);

-- ===== Favorites (Shopping) =====
CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  price TEXT DEFAULT '',
  currency TEXT DEFAULT '',
  seller TEXT DEFAULT '',
  url TEXT DEFAULT '',
  image TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_fav_user ON favorites(user_id, created_at DESC);

-- ===== Shopping Lists =====
CREATE TABLE IF NOT EXISTS shopping_lists (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  items TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_shop_user ON shopping_lists(user_id, updated_at DESC);

-- ===== Price Reminders =====
CREATE TABLE IF NOT EXISTS price_reminders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  price TEXT DEFAULT '',
  currency TEXT DEFAULT '',
  seller TEXT DEFAULT '',
  url TEXT DEFAULT '',
  remind_at TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  calendar_event_id TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_premind_user ON price_reminders(user_id, remind_at);

-- ===== Price History =====
CREATE TABLE IF NOT EXISTS price_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_url TEXT NOT NULL,
  product_name TEXT DEFAULT '',
  price TEXT NOT NULL,
  currency TEXT DEFAULT '',
  seller TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_phist_user ON price_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phist_url ON price_history(product_url);

-- ===== Favorite Stores =====
CREATE TABLE IF NOT EXISTS favorite_stores (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_fstore_user ON favorite_stores(user_id);

-- ===== Search History =====
CREATE TABLE IF NOT EXISTS search_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  language TEXT DEFAULT 'fa',
  result_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_shist_user ON search_history(user_id, created_at DESC);

-- ===== User Connections (Tool credentials) =====
CREATE TABLE IF NOT EXISTS user_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tool_id TEXT NOT NULL,
  provider_id TEXT DEFAULT '',
  connection_type TEXT DEFAULT 'api_key',
  encrypted_key TEXT NOT NULL,
  key_hint TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  last_used TEXT DEFAULT '',
  metadata TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_conn_user ON user_connections(user_id, tool_id);

-- ===== TTS Cache =====
CREATE TABLE IF NOT EXISTS tts_cache (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  text_hash TEXT NOT NULL,
  voice TEXT DEFAULT 'female',
  model TEXT DEFAULT '',
  speed REAL DEFAULT 1,
  format TEXT DEFAULT 'mp3',
  audio_url TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  char_count INTEGER DEFAULT 0,
  last_used_at TEXT DEFAULT '',
  expires_at TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tts_user ON tts_cache(user_id, last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_tts_key ON tts_cache(cache_key);

-- ===== Plans (Public — pricing tiers) =====
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  sort INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  name_fa TEXT DEFAULT '',
  name_en TEXT DEFAULT '',
  name_ku TEXT DEFAULT '',
  price_toman INTEGER DEFAULT 0,
  credits INTEGER DEFAULT 0,
  image_credits INTEGER DEFAULT 0,
  video_credits INTEGER DEFAULT 0,
  audio_credits INTEGER DEFAULT 0,
  web_search_per_day INTEGER DEFAULT 50,
  deep_research_per_day INTEGER DEFAULT 20,
  file_uploads_per_day INTEGER DEFAULT 3,
  max_video_duration INTEGER DEFAULT 6,
  max_resolution TEXT DEFAULT '720p',
  image_editing INTEGER DEFAULT 0,
  video_editing INTEGER DEFAULT 0,
  deep_research INTEGER DEFAULT 1,
  priority TEXT DEFAULT 'normal',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ===== Feature Costs (Admin — cost per capability) =====
CREATE TABLE IF NOT EXISTS feature_costs (
  id TEXT PRIMARY KEY,
  feature TEXT NOT NULL,
  cost INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_fcost_feature ON feature_costs(feature);

-- ===== Provider Configs (Admin — provider management) =====
CREATE TABLE IF NOT EXISTS provider_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 1,
  estimated_cost INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pconfig_type ON provider_configs(type, priority);

-- ===== Alarms =====
CREATE TABLE IF NOT EXISTS alarms (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  message TEXT DEFAULT '',
  hour INTEGER DEFAULT 7,
  minute INTEGER DEFAULT 0,
  second INTEGER DEFAULT 0,
  time_format TEXT DEFAULT '24',
  recurring_type TEXT DEFAULT 'once',
  days_of_week TEXT DEFAULT '[]',
  end_date TEXT DEFAULT '',
  sound TEXT DEFAULT 'classic',
  sound_enabled INTEGER DEFAULT 1,
  volume INTEGER DEFAULT 70,
  vibrate INTEGER DEFAULT 1,
  voice_enabled INTEGER DEFAULT 0,
  voice_mode TEXT DEFAULT 'auto',
  voice_message TEXT DEFAULT '',
  voice_text TEXT DEFAULT '',
  snooze_enabled INTEGER DEFAULT 1,
  snooze_duration INTEGER DEFAULT 10,
  snooze_max_count INTEGER DEFAULT 3,
  alarm_intensity TEXT DEFAULT 'normal',
  label TEXT DEFAULT '',
  color TEXT DEFAULT '217 91% 60%',
  icon TEXT DEFAULT 'bell',
  active INTEGER DEFAULT 1,
  wake_up_mode INTEGER DEFAULT 0,
  reason TEXT DEFAULT '',
  last_triggered TEXT DEFAULT '',
  next_trigger TEXT DEFAULT '',
  snooze_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_alarm_user ON alarms(user_id, active, next_trigger);

-- ===== Reminders =====
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  remind_at TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT DEFAULT '',
  conversation_id TEXT DEFAULT '',
  source TEXT DEFAULT 'manual',
  reason TEXT DEFAULT '',
  reminder_type TEXT DEFAULT 'time',
  voice_enabled INTEGER DEFAULT 0,
  voice_message TEXT DEFAULT '',
  snooze_enabled INTEGER DEFAULT 1,
  snooze_duration INTEGER DEFAULT 10,
  condition_type TEXT DEFAULT '',
  condition_value TEXT DEFAULT '',
  condition_data TEXT DEFAULT '',
  product_url TEXT DEFAULT '',
  product_name TEXT DEFAULT '',
  target_price INTEGER DEFAULT 0,
  recurring_type TEXT DEFAULT 'once',
  days_of_week TEXT DEFAULT '[]',
  label TEXT DEFAULT '',
  color TEXT DEFAULT '217 91% 60%',
  last_triggered TEXT DEFAULT '',
  cooldown_until TEXT DEFAULT '',
  notify_once INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_remind_user ON reminders(user_id, status, remind_at);

-- ===== Alarm History =====
CREATE TABLE IF NOT EXISTS alarm_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  alarm_id TEXT DEFAULT '',
  reminder_id TEXT DEFAULT '',
  entry_type TEXT DEFAULT 'alarm',
  title TEXT DEFAULT '',
  action TEXT DEFAULT 'triggered',
  triggered_at TEXT NOT NULL,
  snooze_count INTEGER DEFAULT 0,
  voice_played INTEGER DEFAULT 0,
  details TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ahist_user ON alarm_history(user_id, triggered_at DESC);