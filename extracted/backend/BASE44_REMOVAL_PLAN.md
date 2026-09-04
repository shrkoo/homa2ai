# Base44 Removal Plan — Homa AI

> Final audit: 2026-09-03
> Verdict: **NOT READY FOR REAL DEPLOYMENT**

## Executive Summary

The Homa AI Cloudflare Worker is architecturally sound, self-contained, and partially functional. However, full Base44 independence is blocked by missing Worker routes, incomplete frontend decoupling, missing credentials, and unresolved infrastructure placeholders.

---

## 1. Build Status ✅

- `npm run build` succeeds without errors
- Output: `dist/assets/index-sZtOeEFF.js` (1.93 MB), `dist/assets/index-C4sEOTZT.css` (102 KB)
- No transform errors, no unresolved imports in frontend

## 2. Worker Self-Containedness ✅

- All Worker imports resolve (0 broken imports)
- No npm dependencies (Worker uses only `cloudflare:` and relative imports)
- All lib modules (`auth.js`, `db.js`, `credits.js`, `errors.js`, `payments.js`, `storage.js`, `email.js`) are self-contained
- Provider modules are self-contained

## 3. Schema Completeness ✅

- 31 tables defined in `schema.sql`
- All Worker-referenced tables exist (false-positive matches were SQL keywords, not table names)
- 17 previously-missing tables added: `chat_folders`, `credit_transactions`, `api_jobs`, `alarms`, `reminders`, `alarm_history`, `favorites`, `shopping_lists`, `price_reminders`, `price_history`, `favorite_stores`, `search_history`, `user_connections`, `tts_cache`, `plans`, `feature_costs`, `provider_configs`

## 4. SQL Injection ✅ FIXED

- `lib/db.js` uses `ENTITY_MAP` allowlist for table names (not user input)
- Column names sanitized: `replace(/[^a-zA-Z_]/g, '')`
- All values bound with `?` placeholders (parameterized queries)
- Sort fields validated against `ALLOWED_SORT_FIELDS` allowlist
- Admin-only entities gated by role check

## 5. Credit Race Condition ✅ FIXED

- `lib/credits.js` uses atomic conditional UPDATE with RETURNING:
  ```sql
  UPDATE usage SET credits = credits - ? WHERE user_id = ? AND credits >= ? RETURNING credits
  ```
- Concurrent requests cannot overdraw (DB-level atomicity)
- Full transaction ledger in `credit_transactions` table
- Refund and grant operations also atomic

## 6. useChat.js — Partially Decoupled ⚠️

- Conversation/message operations: wired to `chatAdapter` ✅
- 21 direct `base44.entities.*` calls remain for: `Usage`, `LibraryItem`, `SearchHistory`, `PriceReminder`, `ShoppingList`, `ApiJob`, `UserConnection`, `Alarm`, `PromptTemplate`, `SupportTicket`
- 1 direct `base44.functions.invoke('processReferral')` call remains
- These work via Base44 fallback but bypass the adapter layer

## 7. All 41 Backend Functions — Status

### IMPLEMENTED on Worker (26)
Chat, web_search, deep_research, analyze (website/instagram/tiktok/facebook), image_edit, stt, upload_file, file_analyze, generate_prompt, api/jobs, support/tickets, referral/status, payments/create, payments/callback, reasoning, getUsage, homaApiHealth, homaApiKeys, adminDashboard, adminManageUser, adminListTickets, adminUpdateTicket, processReferral, telegram

### ADAPTER_READY but NO Worker route (13)
- `homaApiCode` — no `/chat (type=coding)` route
- `homaApiImageAnalyze` — no `/image_analyze` route
- `homaApiVideoAnalyze` — no `/video_analyze` route
- `homaApiAudioSpeak` — TTS route exists but Persian voice not implemented
- `generateTTS` — same as above
- `textToSpeech` — same as above
- `createGoogleTask` — no `/google/tasks` route
- `createCalendarEvent` — no `/google/calendar/events` route

### PENDING — no Worker code (3)
- `exportToSheets` — no `/google/sheets/export` route
- `exportToDocs` — no `/google/docs/export` route
- `archiveOldConversations` — no cron trigger or `/maintenance/archive` route

## 8. Base44 Runtime References — Decoupling Gap

### Direct `base44.entities.*` calls outside adapters: 94
分布在 34 files. Top offenders:
- `hooks/useChat.js`: 21 calls
- `pages/Projects.jsx`: 5 calls
- `components/FolderSection.jsx`: 4 calls
- `components/ProductCard.jsx`: 4 calls
- `pages/Tasks.jsx`: 4 calls
- `pages/Settings.jsx`: 4 calls

### Direct `base44.functions.invoke` calls outside adapters: 25
分布在 15 files. These bypass `invokeFunctionDirect` (Worker router).

### Direct `base44.auth.*` calls: 16
All in auth pages (Login, Register, etc.) — **EXPECTED**. Auth is platform-owned by Base44. Full independence requires Supabase Auth migration (not started).

## 9. Real TODO/Mock/Stub

- Only 1 real TODO found: `homa-ai-worker.js:1316` — price fetch feature not implemented
- No mock/fake/stub code found in src or Worker
- No placeholder logic in adapters (all route to real Worker or Base44 fallback)

## 10. Blockers for Real Deployment

### Critical (would break functionality)
1. **8 Worker routes missing** — `homaApiCode`, `homaApiImageAnalyze`, `homaApiVideoAnalyze`, `createGoogleTask`, `createCalendarEvent`, `exportToSheets`, `exportToDocs`, `archiveOldConversations` have no Worker implementation
2. **Auth not independent** — Worker uses SHA-256 hash of Base44 access token for user identity. Full independence requires Supabase Auth migration
3. **6 missing secrets**: `HOMA_WORKER_KEY`, `ZARINPAL_MERCHANT_ID`, `RESEND_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `HOMA_ENCRYPTION_KEY`
4. **4 placeholder IDs in wrangler.toml**: `YOUR_KV_NAMESPACE_ID`, `YOUR_USER_CONNECTIONS_KV_ID`, `YOUR_USER_DATA_KV_ID`, `YOUR_D1_DATABASE_ID`

### Non-critical (works with Base44 fallback)
5. 94 direct `base44.entities` calls bypass adapter layer (app works on Base44, won't route to Worker)
6. 25 direct `base44.functions.invoke` calls bypass Worker router
7. Integration credits exhausted (Base44 backend functions blocked until 2026-10-01)

---

## Migration Path to Full Independence

### Phase 1: Infrastructure (user action required)
1. Create Cloudflare D1 database, KV namespaces, R2 bucket
2. Replace placeholder IDs in `wrangler.toml`
3. Set 6 missing secrets via `wrangler secret put`
4. Deploy Worker: `wrangler deploy`

### Phase 2: Missing Worker Routes
1. Implement `/chat (type=coding)` route
2. Implement `/image_analyze` route (vision model via Groq)
3. Implement `/video_analyze` route (TwelveLabs or Replicate)
4. Implement `/google/tasks` and `/google/calendar/events` routes
5. Implement `/google/sheets/export` and `/google/docs/export` routes
6. Implement cron trigger for `/maintenance/archive`

### Phase 3: Frontend Decoupling
1. Replace 94 `base44.entities.*` calls with adapter methods
2. Replace 25 `base44.functions.invoke` calls with `invokeFunctionDirect`
3. Migrate auth to Supabase (replace 16 `base44.auth.*` calls)

### Phase 4: Cutover
1. Set `homa_worker_url` in localStorage
2. Verify all features work through Worker
3. Remove Base44 SDK dependency