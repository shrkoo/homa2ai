# Homa AI Core — Independent Cloudflare Worker

**Backend مستقل و کامل هُما AI.** هیچ وابستگی Runtime به Base44 ندارد. تمام قابلیت‌های AI مستقیماً از Groq / OpenRouter / DuckDuckGo / Pollinations / Replicate فراخوانی می‌شوند. داده‌ها در Cloudflare D1، KV و R2 ذخیره می‌شوند.

---

## فهرست قابلیت‌ها

| قابلیت | مسیر Worker | ذخیره‌سازی |
|--------|-------------|-----------|
| Chat + Auto Model + مدل‌ها | `POST /` (type=chat) | D1: conversations, messages |
| Web Search | `POST /` (type=web_search) | DuckDuckGo (بدون کلید) |
| Deep Research | `POST /` (type=deep_research) | DuckDuckGo + Groq |
| تحلیل فایل | `POST /` (type=file_analyze) | Groq |
| تحلیل تصویر / دوربین | `POST /` (type=chat + image_data) | Groq Vision / OpenRouter Vision |
| تحلیل ویدئو | `POST /` (type=video_analyze) | Twelve Labs (در صورت اتصال) |
| تولید تصویر | `POST /` (type=image_generate) | Pollinations (رایگان) |
| ویرایش تصویر | `POST /` (type=image_edit) | Replicate / OpenAI |
| تولید ویدئو | `POST /` (type=video_generate) | Replicate / Runway / Kling / Luma |
| TTS | `POST /` (type=tts) | Piper (در صورت تنظیم) |
| STT | `POST /` (type=stt) | Groq Whisper |
| Global Search | `POST /` (type=global_search) | DuckDuckGo + Groq |
| Tool Router | `POST /` (type=tool_route) | Groq |
| Generate Prompt | `POST /` (type=generate_prompt) | Groq |
| Analyze (Website/IG/TikTok/FB) | `POST /` (type=analyze) | DuckDuckGo + Groq |
| Upload File | `POST /` (type=upload_file) | 0x0.st / R2 |
| Connectors | `POST /connect`, `POST /disconnect`, `GET /connection/status` | KV: USER_CONNECTIONS |
| Jobs | `POST /jobs`, `GET /jobs/:id`, `POST /jobs/:id/cancel` | KV: USER_CONNECTIONS |
| Google OAuth | `GET /google/auth`, `GET /google/callback` | KV: GOOGLE_TOKENS |
| Google Tasks | `POST /` (type=google_tasks_create) | Google API |
| Google Calendar | `POST /` (type=google_calendar_create) | Google API |
| Alarms | `GET/POST/PATCH/DELETE /alarms` | KV: USER_DATA |
| Reminders | `GET/POST/PATCH/DELETE /reminders` | KV: USER_DATA |
| Alarm History | `GET/POST/PATCH/DELETE /alarms/history` | KV: USER_DATA |
| D1 Data CRUD | `GET/POST/PATCH/DELETE /data/:entity` | D1 |
| API Keys | `POST/GET/DELETE /api/keys` | D1: api_keys |
| API Credits | `GET /api/credits` | D1: api_credits |
| API Usage | `GET /api/usage` | D1: api_usage |
| API Health | `GET /api/health` | — |
| Admin Dashboard | `GET /admin/dashboard` | D1 |
| Admin Users | `GET /admin/users`, `PATCH /admin/users/:id` | D1 |
| Admin Orders | `GET /admin/orders` | D1 |
| Admin Tickets | `GET /admin/tickets`, `PATCH /admin/tickets/:id` | D1 |
| Admin Provider Health | `GET /admin/provider-health` | — |
| Admin Credit Transactions | `GET /admin/credits/transactions` | D1 |
| Support Tickets | `POST/GET /support/tickets`, `POST /support/tickets/:id/reply` | D1 |
| Referrals | `GET /referrals/status`, `POST /referrals/process` | D1 |
| Payments | `POST /payments/create`, `GET /payments/zarinpal/callback`, `GET /payments/status/:id` | D1 |

---

## معماری

```
Frontend (React)
  ↓ fetch (X-User-Token = Base44 access token)
  ↓ Authorization: Bearer HOMA_WORKER_KEY
Cloudflare Worker (homa-ai-core)
  ├── Groq API        → Chat, Search, Analyzers, STT, File Analysis
  ├── OpenRouter API  → Chat fallback, Vision, Deep Research
  ├── DuckDuckGo     → Web Search, Global Search (بدون کلید)
  ├── Pollinations   → Image Generation (رایگان، بدون کلید)
  ├── Replicate      → Image/Video editing (در صورت اتصال)
  ├── Piper TTS      → Text-to-Speech (در صورت تنظیم)
  ├── Google OAuth   → Tasks + Calendar (مستقل از Base44)
  ├── D1 Database    → تمام داده‌های ساختاریافته
  ├── KV Namespaces  → Connectors, Google tokens, Alarms/Reminders
  └── R2 Bucket      → File storage (در صورت تنظیم)
```

**هیچ فراخوانی Base44 Integration/Runtime وجود ندارد.** تمام API keyها در Worker Secrets هستند و هرگز به Frontend ارسال نمی‌شوند.

---

## Prerequisites

1. حساب Cloudflare (رایگان) — https://dash.cloudflare.com/sign-up
2. `wrangler` CLI:
   ```bash
   npm install -g wrangler
   wrangler login
   ```

---

## Deploy گام‌به‌گام

### ۱. ساخت KV Namespaces

```bash
wrangler kv namespace create GOOGLE_TOKENS
wrangler kv namespace create USER_CONNECTIONS
wrangler kv namespace create USER_DATA
```

خروجی هر دستور یک `id` دارد — آن را در `wrangler.toml` جایگزین `YOUR_..._KV_ID` کن.

### ۲. ساخت D1 Database

```bash
wrangler d1 create homa-ai-db
```

خروجی یک `database_id` دارد — آن را در `wrangler.toml` جایگزین `YOUR_D1_DATABASE_ID` کن.

### ۳. اجرای Schema

```bash
wrangler d1 execute homa-ai-db --file=./schema.sql
```

### ۴. ساخت R2 Bucket

```bash
wrangler r2 bucket create homa-storage
```

### ۵. تنظیم Secrets

```bash
# الزامی:
wrangler secret put GROQ_API_KEY
wrangler secret put OPENROUTER_API_KEY
wrangler secret put HOMA_WORKER_KEY          # openssl rand -hex 32
wrangler secret put HOMA_ENCRYPTION_KEY      # openssl rand -hex 32

# اختیاری (Google OAuth مستقل):
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET

# اختیاری (TTS):
wrangler secret put PIPER_TTS_URL
wrangler secret put PIPER_TTS_API_KEY

# اختیاری (Image/Video editing):
wrangler secret put REPLICATE_API_TOKEN

# اختیاری (Email):
wrangler secret put RESEND_API_KEY
wrangler secret put MAIL_FROM                # مثال: Homa AI <noreply@homa.ai>
wrangler secret put ADMIN_EMAIL              # مثال: support@homa.ai

# اختیاری (Payments):
wrangler secret put ZARINPAL_MERCHANT_ID
wrangler secret put APP_URL                  # مثال: https://homa.ai
```

### ۶. Deploy

```bash
wrangler deploy
```

خروجی URL خواهد بود:
```
https://homa-ai-core.<your-subdomain>.workers.dev
```

---

## فهرست کامل Secrets

| Secret | الزامی | توضیح |
|--------|--------|-------|
| `GROQ_API_KEY` | بله | Chat، Search، Analyzers، STT، File Analysis |
| `OPENROUTER_API_KEY` | بله | Chat fallback، Vision، Deep Research |
| `HOMA_WORKER_KEY` | بله | کلید auth بین Frontend و Worker |
| `HOMA_ENCRYPTION_KEY` | بله | AES-GCM برای رمزنگاری credentialها و Google tokens |
| `GOOGLE_CLIENT_ID` | خیر | Google OAuth مستقل (Tasks + Calendar) |
| `GOOGLE_CLIENT_SECRET` | خیر | Google OAuth مستقل |
| `PIPER_TTS_URL` | خیر | سرور Piper TTS |
| `PIPER_TTS_API_KEY` | خیر | کلید Piper TTS |
| `REPLICATE_API_TOKEN` | خیر | ویرایش تصویر/ویدئو |
| `RESEND_API_KEY` | خیر | ارسال ایمیل |
| `MAIL_FROM` | خیر | آدرس فرستنده ایمیل |
| `ADMIN_EMAIL` | خیر | ایمیل ادمین برای نوتیفیکیشن تیکت |
| `ZARINPAL_MERCHANT_ID` | خیر | درگاه پرداخت زرین‌پال |
| `APP_URL` | خیر | URL برنامه برای redirect بعد از پرداخت |

---

## فهرست کامل Bindings

| Binding | نوع | الزامی | توضیح |
|---------|-----|--------|-------|
| `DB` | D1 | بله | دیتابیس اصلی (conversations, messages, usage, orders, ...) |
| `GOOGLE_TOKENS` | KV | خیر | رمزنگاری شده Google OAuth tokens |
| `USER_CONNECTIONS` | KV | خیر | رمزنگاری شده connector credentials + Jobs |
| `USER_DATA` | KV | خیر | Alarms, Reminders, History (per-user) |
| `STORAGE` | R2 | خیر | File uploads (در صورت نبودن، fallback به 0x0.st) |

---

## تنظیم Frontend

Frontend به‌صورت پیش‌فرض به Worker جدید متصل می‌شود:
```
https://homa-ai-core.shahramalidazeh620.workers.dev
```

برای تنظیم `HOMA_WORKER_KEY` در Frontend:
1. در برنامه Homa به صفحه **Settings** برو
2. بخش **Worker Configuration** را پیدا کن
3. مقدار `HOMA_WORKER_KEY` را وارد کن (همان مقداری که با `wrangler secret put HOMA_WORKER_KEY` تنظیم کردی)

> **توجه:** `HOMA_WORKER_KEY` در localStorage مرورگر ذخیره می‌شود و برای auth بین Frontend و Worker استفاده می‌شود. این کلید در کد Frontend قرار ندارد — کاربر آن را در Settings وارد می‌کند.

---

## مدل‌های پشتیبانی‌شده

| Key | Provider | Model ID |
|-----|----------|----------|
| `auto` | Groq → OpenRouter | انتخاب خودکار (Groq → Ling/Ultra) |
| `minimax` | OpenRouter | `minimax/minimax-m3:free` |
| `ultra` | OpenRouter | `nvidia/nemotron-3-ultra-550b-a55b:free` |
| `super` | OpenRouter | `nvidia/nemotron-3-super-120b-a12b:free` |
| `lightning` | OpenRouter | `nvidia/nemotron-3.5-lightning:free` |
| `nano` | OpenRouter | `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` |
| `ling` | OpenRouter | `inclusionai/ling-3.0-flash-fin:free` |

---

## Auth و User Identity

### وضعیت فعلی
- User identity از `X-User-Token` header مشتق می‌شود (SHA-256 hash).
- این token فعلاً Base44 access token است.
- Worker **هیچ فراخوانی Base44 انجام نمی‌دهد** — فقط token را hash می‌کند تا یک userKey پایدار بسازد.
- تمام داده‌ها با این userKey در D1/KV ایزوله می‌شوند.

### مهاجرت آینده (بدون تغییر Worker)
- وقتی Auth به Supabase JWT یا custom JWT منتقل شود، فقط کافیست Frontend همان JWT را در `X-User-Token` بفرستد.
- Worker بدون تغییر کار می‌کند — فقط hash متفاوت خواهد بود.
- برای مهاجرت داده‌ها: یک اسکریپت one-time که userKey قدیمی → جدید را map کند.

---

## تست

```bash
# Chat
curl -X POST https://homa-ai-core.<your-subdomain>.workers.dev \
  -H "Authorization: Bearer <HOMA_WORKER_KEY>" \
  -H "X-User-Token: <any-string>" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"سلام"}],"language":"fa","model":"auto"}'

# Web Search
curl -X POST https://homa-ai-core.<your-subdomain>.workers.dev \
  -H "Authorization: Bearer <HOMA_WORKER_KEY>" \
  -H "X-User-Token: <any-string>" \
  -H "Content-Type: application/json" \
  -d '{"type":"web_search","input":"بهترین گوشی 2025","language":"fa"}'

# Health
curl https://homa-ai-core.<your-subdomain>.workers.dev/api/health \
  -H "Authorization: Bearer <HOMA_WORKER_KEY>" \
  -H "X-User-Token: <any-string>"
```

---

## ساختار پروژه

```
deploy/cloudflare-worker/
├── wrangler.toml           ← تنظیمات Worker (name = homa-ai-core)
├── package.json            ← npm scripts (deploy, dev, db:init)
├── schema.sql              ← D1 schema (تمام جداول)
├── homa-ai-worker.js       ← Worker اصلی (entry point)
├── README.md               ← این فایل
├── lib/
│   ├── auth.js             ← User identity + admin guard
│   ├── credits.js          ← Credit ledger (atomic, race-safe)
│   ├── db.js               ← Entity allowlist + safe columns
│   ├── email.js            ← Resend email abstraction
│   ├── errors.js           ← Standard error system + CORS
│   └── payments.js         ← ZarinPal payment abstraction
├── routes/
│   ├── admin.js            ← Admin dashboard, users, orders, tickets
│   ├── api.js              ← API keys, credits, usage, health
│   ├── payments.js         ← Payment create, callback, status
│   ├── referral.js         ← Referral status + process
│   └── support.js          ← Support tickets + replies
└── providers/
    ├── helpers.js           ← probe, classify, postJson, uploadBytes
    ├── index.js             ← Adapter registry
    ├── router.js            ← Capability-based provider routing
    ├── openai.js             ← OpenAI Images (DALL-E, edit, variation)
    ├── replicate.js          ← Replicate (image, video, upscale, bg-remove)
    ├── elevenlabs.js         ← ElevenLabs (TTS, voice cloning, STT)
    ├── stability.js          ← Stability AI (image gen, upscale)
    ├── removebg.js           ← Remove.bg (background removal)
    ├── heygen.js             ← HeyGen (avatar video, lip sync)
    ├── runway.js             ← Runway (text-to-video, image-to-video)
    ├── kling.js              ← Kling AI (text-to-video, image-to-video)
    ├── pika.js               ← Pika (validation only — generation N/A)
    ├── luma.js               ← Luma Dream Machine (video gen)
    ├── suno.js               ← Suno (validation only — generation N/A)
    └── twelvelabs.js         ← Twelve Labs (video analysis)
```

---

## ملاحظات

1. **Worker قدیمی `homa-ai-api` دست‌نخورده باقی می‌ماند.** این پروژه یک Worker جدید `homa-ai-core` ایجاد می‌کند.
2. **Frontend به‌صورت خودکار به Worker جدید متصل می‌شود** (URL پیش‌فرض در کد تنظیم شده).
3. **Fallback به Base44 در Frontend حفظ شده** — اگر Worker در دسترس نباشد (CORS/network error)، به Base44 SDK برمی‌گردد.
4. **Smart Watch scheduler فعلاً INACTIVE است** — برای فعال‌سازی، `fetchProductPrice` helper باید استخراج شود و `[triggers]` در wrangler.toml uncomment شود.
5. **هیچ صفحه یا Route از Frontend حذف نشده** — تمام صفحات فعلی حفظ شده‌اند.
6. **هیچ قابلیتی حذف نشده** — تمام قابلیت‌های Chat، مدل‌ها، Search، Analyzers، TTS، STT، Connectors، Google، Alarms، Reminders، History، Library، Projects، Tasks، Favorites، Shopping، Price Tracking، Credits، Plans، Payments، Referrals، Support، API، Jobs حفظ شده‌اند.

---

## آماده Deploy ✓

این پروژه کامل و آماده Deploy است. تمام import‌ها resolve می‌شوند، تمام bindingها و secretها مستند شده‌اند، و هیچ وابستگی Runtime به Base44 وجود ندارد.