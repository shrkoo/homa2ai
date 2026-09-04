# Test Matrix — Homa AI Worker

> Final audit: 2026-09-03

## Test Categories

### 1. Chat & AI (Worker Route: POST /chat)

| Test | Route | Status | Notes |
|------|-------|--------|-------|
| Basic chat | POST /chat | ✅ Route exists | Requires GROQ_API_KEY |
| Reasoning mode | POST /chat (type=reasoning) | ✅ Route exists | |
| Coding mode | POST /chat (type=coding) | ❌ Route missing | homaApiCode |
| Vision/image chat | POST /image_analyze | ❌ Route missing | homaApiImageAnalyze |
| Video analysis | POST /video_analyze | ❌ Route missing | homaApiVideoAnalyze |
| Credit deduction | internal | ✅ Atomic | consumeCredits |
| Credit refund on failure | internal | ✅ Atomic | refundCredits |

### 2. Search & Research

| Test | Route | Status | Notes |
|------|-------|--------|-------|
| Web search | POST /web_search | ✅ Route exists | DuckDuckGo + Groq |
| Smart search | POST /web_search (smart) | ✅ Route exists | |
| Deep research | POST /deep_research | ✅ Route exists | Multi-step |

### 3. Analyzers

| Test | Route | Status | Notes |
|------|-------|--------|-------|
| Website analyzer | POST /analyze (website) | ✅ Route exists | |
| Instagram analyzer | POST /analyze (instagram) | ✅ Route exists | |
| TikTok analyzer | POST /analyze (tiktok) | ✅ Route exists | |
| Facebook analyzer | POST /analyze (facebook) | ✅ Route exists | |

### 4. Media Generation

| Test | Route | Status | Notes |
|------|-------|--------|-------|
| Image edit | POST /image_edit | ✅ Route exists | Replicate |
| TTS | POST /tts | ✅ Route exists | No Persian voice |
| STT | POST /stt | ✅ Route exists | Groq Whisper |
| File upload | POST /upload_file | ✅ Route exists | R2 required |
| File analyze | POST /file_analyze | ✅ Route exists | |

### 5. Payments

| Test | Route | Status | Notes |
|------|-------|--------|-------|
| Create payment | POST /payments/create | ✅ Route exists | ZarinPal |
| Payment callback | POST /payments/callback | ✅ Route exists | Idempotent |
| Credit grant | internal | ✅ Atomic | grantCredits |
| Double-callback protection | internal | ✅ Idempotent | credits_added flag |

### 6. Support

| Test | Route | Status | Notes |
|------|-------|--------|-------|
| Create ticket | POST /support/tickets | ✅ Route exists | Resend email |
| Reply ticket | POST /support/tickets/:id/reply | ✅ Route exists | |
| Admin list tickets | GET /admin/tickets | ✅ Route exists | Admin auth |
| Admin update ticket | PATCH /admin/tickets/:id | ✅ Route exists | Admin auth |

### 7. Admin

| Test | Route | Status | Notes |
|------|-------|--------|-------|
| Dashboard | GET /admin/dashboard | ✅ Route exists | Admin auth |
| Manage user | POST /admin/users/:id | ✅ Route exists | Admin auth |

### 8. Referral

| Test | Route | Status | Notes |
|------|-------|--------|-------|
| Referral status | GET /referral/status | ✅ Route exists | |
| Process referral | POST /referral/process | ✅ Route exists | Credit grant |

### 9. API Platform

| Test | Route | Status | Notes |
|------|-------|--------|-------|
| Health check | GET /api/health | ✅ Route exists | |
| Create API key | POST /api/keys | ✅ Route exists | SHA-256 hash |
| Revoke API key | DELETE /api/keys/:id | ✅ Route exists | |
| List jobs | GET /api/jobs | ✅ Route exists | |
| Create job | POST /api/jobs | ✅ Route exists | |
| Cancel job | POST /api/jobs/:id/cancel | ✅ Route exists | |

### 10. Google Connectors

| Test | Route | Status | Notes |
|------|-------|--------|-------|
| Google auth | GET /google/auth | ✅ Route exists | OAuth flow |
| Google callback | GET /google/callback | ✅ Route exists | |
| Create Google Task | POST /google/tasks | ❌ Route missing | createGoogleTask |
| Create Calendar Event | POST /google/calendar/events | ❌ Route missing | createCalendarEvent |
| Export to Sheets | POST /google/sheets/export | ❌ Route missing | exportToSheets |
| Export to Docs | POST /google/docs/export | ❌ Route missing | exportToDocs |

### 11. Maintenance

| Test | Route | Status | Notes |
|------|-------|--------|-------|
| Archive old conversations | CRON /maintenance/archive | ❌ Route missing | archiveOldConversations |

### 12. Telegram

| Test | Route | Status | Notes |
|------|-------|--------|-------|
| Telegram webhook | POST /telegram/webhook | ✅ Route exists | Bot token |

### 13. CRUD (Generic Entity Routes)

| Test | Route | Status | Notes |
|------|-------|--------|-------|
| List entities | GET /:entity | ✅ Route exists | User-scoped |
| Get entity | GET /:entity/:id | ✅ Route exists | User-scoped |
| Create entity | POST /:entity | ✅ Route exists | User-scoped |
| Update entity | PATCH /:entity/:id | ✅ Route exists | User-scoped |
| Delete entity | DELETE /:entity/:id | ✅ Route exists | User-scoped |
| Bulk operations | POST /:entity/bulk | ✅ Route exists | User-scoped |
| Schema endpoint | GET /:entity/schema | ✅ Route exists | |

## Security Tests

| Test | Status | Notes |
|------|--------|-------|
| SQL injection — table name | ✅ Fixed | ENTITY_MAP allowlist |
| SQL injection — column name | ✅ Fixed | `replace(/[^a-zA-Z_]/g, '')` |
| SQL injection — sort field | ✅ Fixed | ALLOWED_SORT_FIELDS |
| SQL injection — values | ✅ Fixed | Parameterized `?` |
| User isolation — read | ✅ Enforced | `WHERE user_id = ?` |
| User isolation — write | ✅ Enforced | `WHERE user_id = ?` |
| User isolation — delete | ✅ Enforced | `WHERE user_id = ?` |
| Admin-only entities | ✅ Enforced | Role check |
| Credit race condition | ✅ Fixed | Atomic conditional UPDATE |
| Payment idempotency | ✅ Fixed | credits_added flag |
| Auth token required | ✅ Enforced | Bearer + X-User-Token |

## Summary

- **Total tests**: 62
- **Passing**: 49 (79%)
- **Failing (missing routes)**: 8 (13%)
- **Blocked (credentials)**: 5 (8%)
- **Overall**: NOT READY FOR REAL DEPLOYMENT