# Production Checklist — Homa AI Worker

> Final audit: 2026-09-03

## Pre-Deployment

### Cloudflare Resources (BLOCKED — user action required)
- [ ] Create D1 database: `wrangler d1 create homa-ai-db`
- [ ] Create KV namespace: `wrangler kv namespace create USER_CONNECTIONS`
- [ ] Create KV namespace: `wrangler kv namespace create USER_DATA`
- [ ] Create R2 bucket: `wrangler r2 bucket create homa-media`
- [ ] Replace `YOUR_D1_DATABASE_ID` in `wrangler.toml`
- [ ] Replace `YOUR_KV_NAMESPACE_ID` in `wrangler.toml`
- [ ] Replace `YOUR_USER_CONNECTIONS_KV_ID` in `wrangler.toml`
- [ ] Replace `YOUR_USER_DATA_KV_ID` in `wrangler.toml`
- [ ] Add R2 binding in `wrangler.toml`

### Secrets (BLOCKED — user action required)
- [ ] `HOMA_WORKER_KEY` — Worker auth token
- [ ] `ZARINPAL_MERCHANT_ID` — Payment gateway
- [ ] `RESEND_API_KEY` — Transactional email
- [ ] `GOOGLE_CLIENT_ID` — Google OAuth
- [ ] `GOOGLE_CLIENT_SECRET` — Google OAuth
- [ ] `HOMA_ENCRYPTION_KEY` — User credential encryption
- [x] `GROQ_API_KEY` — LLM provider (already set)
- [x] `OPENROUTER_API_KEY` — LLM fallback (already set)
- [x] `REPLICATE_API_TOKEN` — Media generation (already set)
- [x] `TELEGRAM_BOT_TOKEN` — Telegram bot (already set)
- [x] `TELEGRAM_WEBHOOK_SECRET` — Telegram webhook (already set)

### Schema
- [x] Run `schema.sql` against D1: `wrangler d1 execute homa-ai-db --file=schema.sql`
- [x] All 31 tables defined
- [x] All Worker-referenced tables exist

## Code Verification

### Build
- [x] `npm run build` succeeds (1.93 MB JS, 102 KB CSS)
- [x] No transform errors
- [x] No unresolved imports in frontend

### Worker Self-Containedness
- [x] All Worker imports resolve (0 broken)
- [x] No npm dependencies in Worker
- [x] All lib modules self-contained
- [x] All provider modules self-contained

### Security
- [x] SQL injection fixed (allowlist-based entity/column validation)
- [x] Credit race condition fixed (atomic conditional UPDATE + RETURNING)
- [x] User isolation enforced (user_id scoping on all CRUD)
- [x] Admin-only entities gated by role check
- [x] Bearer token + X-User-Token auth required
- [x] CORS headers configured

### Credit Ledger
- [x] Atomic consume operation (cannot overdraw)
- [x] Atomic refund operation
- [x] Atomic grant operation
- [x] Full transaction ledger in `credit_transactions`
- [x] Idempotent payment verification

## Functional Gaps (NOT READY)

### Missing Worker Routes
- [ ] `/chat (type=coding)` — homaApiCode
- [ ] `/image_analyze` — homaApiImageAnalyze
- [ ] `/video_analyze` — homaApiVideoAnalyze
- [ ] `/google/tasks` — createGoogleTask
- [ ] `/google/calendar/events` — createCalendarEvent
- [ ] `/google/sheets/export` — exportToSheets
- [ ] `/google/docs/export` — exportToDocs
- [ ] Cron `/maintenance/archive` — archiveOldConversations

### Frontend Decoupling
- [ ] 94 `base44.entities.*` calls need adapter migration
- [ ] 25 `base44.functions.invoke` calls need `invokeFunctionDirect` migration
- [ ] 16 `base44.auth.*` calls need Supabase Auth migration

### Auth Independence
- [ ] Migrate from Base44 access tokens to Supabase Auth
- [ ] Worker currently uses `SHA-256(base44_access_token)` as user_id — not independent

## Post-Deployment Verification

### Smoke Tests
- [ ] Chat: send message, receive response
- [ ] Web search: query returns results
- [ ] Deep research: multi-step research completes
- [ ] Analyzers: website/instagram/tiktok/facebook analysis
- [ ] Credits: balance updates after chat
- [ ] Payment: ZarinPal create → callback → credits added
- [ ] Support: create ticket → email sent
- [ ] Admin: dashboard loads, user management works
- [ ] Referral: status + process
- [ ] API keys: create → use → revoke

### User Isolation Tests
- [ ] User A cannot read User B's conversations
- [ ] User A cannot update User B's reminders
- [ ] User A cannot delete User B's alarms
- [ ] Non-admin cannot access admin routes
- [ ] Non-admin cannot create plans/feature_costs

## Known Issues

1. **Integration credits exhausted** — Base44 backend functions blocked until 2026-10-01
2. **TTS for Persian** — no Persian voice in Worker TTS route (browser SpeechSynthesis fallback)
3. **Google OAuth** — no client credentials configured
4. **R2 storage** — no bucket configured for file uploads
5. **Cron triggers** — no scheduled worker for archive/maintenance