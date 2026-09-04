# Homa AI — Phase 0: Infrastructure Preparation

This document describes the infrastructure prepared in Phase 0 of the Base44 → independent migration.

## What Was Done

### 1. Cloudflare D1 Database
- **Schema file**: `deploy/cloudflare-worker/schema.sql`
- **Tables created** (13 total, matching actual Base44 entity fields exactly):
  - `users`, `conversations`, `messages`, `usage`, `orders`
  - `api_keys`, `api_credits`, `api_usage`, `support_tickets`, `referrals`
  - `library_items`, `projects`, `tasks`, `prompt_templates`
- All tables are user-scoped (`user_id` column) for row-level isolation.
- **No data migration performed** — tables are created empty.

### 2. Cloudflare Worker — D1 Routes
- **D1 binding added** to `wrangler.toml` (binding = "DB")
- **Generic CRUD handler** added to `homa-ai-worker.js`:
  - `GET    /data/{entity}` — list with filter/sort/limit
  - `GET    /data/{entity}/{id}` — get one
  - `POST   /data/{entity}` — create
  - `POST   /data/{entity}/bulk` — bulk create
  - `PATCH  /data/{entity}/{id}` — update
  - `PATCH  /data/{entity}/bulk` — bulkUpdate / updateMany
  - `DELETE /data/{entity}/{id}` — delete one
  - `DELETE /data/{entity}/bulk` — deleteMany
  - `GET    /data/{entity}/schema` — schema info
- **Existing routes untouched** — all current functionality preserved.
- **Security**:
  - All `/data/*` routes require `Authorization: Bearer <HOMA_WORKER_KEY>`
  - All routes require `X-User-Token` header (Base44 access token)
  - User identity derived via `deriveUserKey()` (SHA-256 hash) — body-supplied user_id is NEVER trusted
  - All SQL queries scoped by `user_id = userKey` (or `owner_id` / `referrer_id` for special entities)
  - Entity names whitelisted via `D1_ENTITIES` map (no SQL injection via table name)
  - Sort columns whitelisted via `SORTABLE_COLUMNS` set
  - Column names sanitized (only `[a-zA-Z_]` allowed)

### 3. Storage (R2) — Plan Only
- **Current**: Worker uses `0x0.st` and `tmpfiles.org` as file upload proxies.
- **R2 binding** added to `wrangler.toml` but **commented out** (not active).
- **No changes to current upload flow** — `handleUploadFile` untouched.
- R2 will replace 0x0.st in a future phase.

### 4. Authentication — Not Touched
- Base44 Auth remains fully active.
- `AuthContext.jsx`, `Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx` — **unchanged**.
- `dataStore.js` uses `base44_access_token` from localStorage (same token Base44 uses).
- Supabase Auth migration planned for Phase 2 (not started).

### 5. Data Abstraction Layer
- **New file**: `src/lib/dataStore.js`
- **NOT imported anywhere yet** — no existing functionality changed.
- Provides `entities` proxy that returns Worker-backed or Base44-backed entity interfaces.
- Will be wired into components in Phase 1.

## Deployment Steps (When Ready)

```bash
# 1. Create D1 database
wrangler d1 create homa-ai-db
# → Copy database_id to wrangler.toml

# 2. Run schema
wrangler d1 execute homa-ai-db --file=./schema.sql

# 3. (Optional) Create R2 bucket
wrangler r2 bucket create homa-storage
# → Uncomment R2 binding in wrangler.toml

# 4. Deploy Worker
wrangler deploy
```

## Secrets Required

Already configured (from existing Worker):
- `OPENROUTER_API_KEY` — chat, vision, deep research
- `GROQ_API_KEY` — chat, search, analyzers, STT, file analysis
- `HOMA_WORKER_KEY` — auth (required)
- `HOMA_ENCRYPTION_KEY` — AES-GCM encryption for credentials
- `GOOGLE_CLIENT_ID` — Google OAuth (Tasks/Calendar)
- `GOOGLE_CLIENT_SECRET` — Google OAuth
- `REPLICATE_API_TOKEN` — image/video editing (optional)
- `TELEGRAM_BOT_TOKEN` — Telegram bot
- `TELEGRAM_WEBHOOK_SECRET` — Telegram webhook

Needed for future phases (NOT yet):
- `SUPABASE_URL` — Phase 2 (Auth migration)
- `SUPABASE_ANON_KEY` — Phase 2
- `SUPABASE_SERVICE_ROLE_KEY` — Phase 2 (server-side)
- `RESEND_API_KEY` — Phase 3 (email, replaces Base44 SendEmail)
- `ZARINPAL_MERCHANT_ID` — Phase 3 (payments, if not already in Worker)
- `R2_ACCESS_KEY_ID` — Phase 3+ (if using R2 with API access)
- `R2_SECRET_ACCESS_KEY` — Phase 3+

## Compatibility Status

- ✅ Base44 SDK — active, unchanged
- ✅ Base44 Auth — active, unchanged
- ✅ Base44 Entities — active, unchanged
- ✅ Base44 Backend Functions — active, unchanged
- ✅ Worker — active, D1 routes added (no existing routes changed)
- ✅ directInvoke — active, unchanged (Worker-first + Base44 fallback)
- ✅ dataStore.js — created but not imported (zero impact)