/**
 * functionMap.js — Base44 Backend Function → Worker Route mapping (B19).
 *
 * Inventory of all 41 Base44 backend functions with their Worker
 * equivalents, dependencies, and credential requirements.
 *
 * Status legend:
 *   ✅ IMPLEMENTED   — Worker route exists and is functional
 *   🔧 ADAPTER READY  — Adapter created, Worker route needs wiring
 *   🔒 CREDENTIAL     — Code prepared, needs external credential
 *   ⏳ PENDING        — Worker implementation needed
 */

export const FUNCTION_MAP = {
  // ── Chat & AI ──────────────────────────────────────────────
  chat: {
    workerRoute: 'POST /chat',
    status: 'IMPLEMENTED',
    credentials: ['GROQ_API_KEY'],
    deps: ['D1 (messages)', 'KV (rate limit)'],
  },
  homaApiChat: {
    workerRoute: 'POST /chat',
    status: 'IMPLEMENTED',
    credentials: ['GROQ_API_KEY'],
    deps: ['D1 (messages)'],
  },
  homaApiReason: {
    workerRoute: 'POST /chat (type=reasoning)',
    status: 'ADAPTER_READY',
    credentials: ['GROQ_API_KEY'],
    deps: ['Provider Router'],
  },
  homaApiCode: {
    workerRoute: 'POST /chat (type=coding)',
    status: 'ADAPTER_READY',
    credentials: ['GROQ_API_KEY'],
    deps: ['Provider Router'],
  },

  // ── Search & Research ──────────────────────────────────────
  webSearch: {
    workerRoute: 'POST /web_search',
    status: 'IMPLEMENTED',
    credentials: [],
    deps: ['DuckDuckGo API', 'GROQ_API_KEY'],
  },
  homaApiWebSearch: {
    workerRoute: 'POST /web_search',
    status: 'IMPLEMENTED',
    credentials: [],
    deps: ['DuckDuckGo', 'Groq'],
  },
  smartSearch: {
    workerRoute: 'POST /web_search (type=smart)',
    status: 'IMPLEMENTED',
    credentials: [],
    deps: ['DuckDuckGo', 'Groq'],
  },
  deepResearch: {
    workerRoute: 'POST /deep_research',
    status: 'IMPLEMENTED',
    credentials: [],
    deps: ['DuckDuckGo', 'GROQ_API_KEY'],
  },
  homaApiDeepResearch: {
    workerRoute: 'POST /deep_research',
    status: 'IMPLEMENTED',
    credentials: [],
    deps: ['DuckDuckGo', 'Groq'],
  },

  // ── Analyzers ──────────────────────────────────────────────
  analyzeWebsite: {
    workerRoute: 'POST /analyze (type=website)',
    status: 'IMPLEMENTED',
    credentials: [],
    deps: ['DuckDuckGo', 'Groq'],
  },
  analyzeInstagram: {
    workerRoute: 'POST /analyze (type=instagram)',
    status: 'IMPLEMENTED',
    credentials: [],
    deps: ['DuckDuckGo', 'Groq'],
  },
  analyzeTikTok: {
    workerRoute: 'POST /analyze (type=tiktok)',
    status: 'IMPLEMENTED',
    credentials: [],
    deps: ['DuckDuckGo', 'Groq'],
  },
  analyzeFacebook: {
    workerRoute: 'POST /analyze (type=facebook)',
    status: 'IMPLEMENTED',
    credentials: [],
    deps: ['DuckDuckGo', 'Groq'],
  },

  // ── Media Generation ───────────────────────────────────────
  homaApiImageAnalyze: {
    workerRoute: 'POST /image_analyze',
    status: 'ADAPTER_READY',
    credentials: ['GROQ_API_KEY'],
    deps: ['Provider Router (vision)'],
  },
  homaApiImageEdit: {
    workerRoute: 'POST /image_edit',
    status: 'ADAPTER_READY',
    credentials: ['REPLICATE_API_TOKEN'],
    deps: ['Provider Router (image edit)'],
  },
  homaApiVideoAnalyze: {
    workerRoute: 'POST /video_analyze',
    status: 'ADAPTER_READY',
    credentials: ['REPLICATE_API_TOKEN'],
    deps: ['Provider Router (video)'],
  },

  // ── Audio ──────────────────────────────────────────────────
  homaApiAudioTranscribe: {
    workerRoute: 'POST /stt',
    status: 'ADAPTER_READY',
    credentials: ['GROQ_API_KEY'],
    deps: ['Provider Router (STT)'],
  },
  homaApiAudioSpeak: {
    workerRoute: 'POST /tts',
    status: 'ADAPTER_READY',
    credentials: ['CREDENTIAL_BLOCKED'],
    deps: ['Piper TTS or ElevenLabs'],
  },
  generateTTS: {
    workerRoute: 'POST /tts',
    status: 'ADAPTER_READY',
    credentials: ['CREDENTIAL_BLOCKED'],
    deps: ['Piper TTS or ElevenLabs'],
  },
  textToSpeech: {
    workerRoute: 'POST /tts',
    status: 'ADAPTER_READY',
    credentials: ['CREDENTIAL_BLOCKED'],
    deps: ['Piper TTS'],
  },

  // ── File Operations ────────────────────────────────────────
  uploadFile: {
    workerRoute: 'POST /upload_file',
    status: 'ADAPTER_READY',
    credentials: ['R2 binding'],
    deps: ['R2 storage'],
  },
  homaApiFileAnalyze: {
    workerRoute: 'POST /file_analyze',
    status: 'ADAPTER_READY',
    credentials: ['GROQ_API_KEY'],
    deps: ['Provider Router (file)'],
  },

  // ── Usage & Credits ────────────────────────────────────────
  getUsage: {
    workerRoute: 'GET /api/usage',
    status: 'IMPLEMENTED',
    credentials: [],
    deps: ['D1 (usage)'],
  },

  // ── Payments ───────────────────────────────────────────────
  createZarinpalPayment: {
    workerRoute: 'POST /payments/create',
    status: 'IMPLEMENTED',
    credentials: ['ZARINPAL_MERCHANT_ID'],
    deps: ['D1 (orders)', 'Credit Ledger'],
  },
  zarinpalCallback: {
    workerRoute: 'POST /payments/callback',
    status: 'IMPLEMENTED',
    credentials: ['ZARINPAL_MERCHANT_ID'],
    deps: ['D1 (orders)', 'Credit Ledger'],
  },

  // ── Support ────────────────────────────────────────────────
  createTicket: {
    workerRoute: 'POST /support/tickets',
    status: 'IMPLEMENTED',
    credentials: ['RESEND_API_KEY'],
    deps: ['D1 (support_tickets)', 'Email'],
  },
  replyTicket: {
    workerRoute: 'POST /support/tickets/:id/reply',
    status: 'IMPLEMENTED',
    credentials: ['RESEND_API_KEY'],
    deps: ['D1 (support_tickets)', 'Email'],
  },
  adminListTickets: {
    workerRoute: 'GET /admin/tickets',
    status: 'IMPLEMENTED',
    credentials: [],
    deps: ['D1 (support_tickets)', 'Admin auth'],
  },
  adminUpdateTicket: {
    workerRoute: 'PATCH /admin/tickets/:id',
    status: 'IMPLEMENTED',
    credentials: [],
    deps: ['D1 (support_tickets)', 'Admin auth'],
  },

  // ── Admin ───────────────────────────────────────────────────
  adminDashboard: {
    workerRoute: 'GET /admin/dashboard',
    status: 'IMPLEMENTED',
    credentials: [],
    deps: ['D1 (all tables)', 'Admin auth'],
  },
  adminManageUser: {
    workerRoute: 'POST /admin/users/:id',
    status: 'IMPLEMENTED',
    credentials: [],
    deps: ['D1 (users)', 'Admin auth'],
  },

  // ── Referral ────────────────────────────────────────────────
  referralStatus: {
    workerRoute: 'GET /referral/status',
    status: 'IMPLEMENTED',
    credentials: [],
    deps: ['D1 (referrals)'],
  },
  processReferral: {
    workerRoute: 'POST /referral/process',
    status: 'IMPLEMENTED',
    credentials: [],
    deps: ['D1 (referrals)', 'Credit Ledger'],
  },

  // ── API Platform ───────────────────────────────────────────
  homaApiHealth: {
    workerRoute: 'GET /api/health',
    status: 'IMPLEMENTED',
    credentials: [],
    deps: [],
  },
  homaApiKeys: {
    workerRoute: 'POST /api/keys',
    status: 'IMPLEMENTED',
    credentials: [],
    deps: ['D1 (api_keys)', 'SHA-256'],
  },

  // ── Google Connectors ──────────────────────────────────────
  createGoogleTask: {
    workerRoute: 'POST /google/tasks',
    status: 'ADAPTER_READY',
    credentials: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    deps: ['KV (OAuth tokens)'],
  },
  createCalendarEvent: {
    workerRoute: 'POST /google/calendar/events',
    status: 'ADAPTER_READY',
    credentials: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    deps: ['KV (OAuth tokens)'],
  },

  // ── Export ──────────────────────────────────────────────────
  exportToSheets: {
    workerRoute: 'POST /google/sheets/export',
    status: 'PENDING',
    credentials: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    deps: ['Google Sheets API', 'KV (OAuth tokens)'],
  },
  exportToDocs: {
    workerRoute: 'POST /google/docs/export',
    status: 'PENDING',
    credentials: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    deps: ['Google Docs API', 'KV (OAuth tokens)'],
  },

  // ── Prompt ──────────────────────────────────────────────────
  generatePrompt: {
    workerRoute: 'POST /generate_prompt',
    status: 'IMPLEMENTED',
    credentials: ['GROQ_API_KEY'],
    deps: ['Provider Router (chat)'],
  },

  // ── Maintenance ─────────────────────────────────────────────
  archiveOldConversations: {
    workerRoute: 'CRON /maintenance/archive',
    status: 'PENDING',
    credentials: [],
    deps: ['D1 (conversations)', 'Cron trigger'],
  },

  // ── Telegram ────────────────────────────────────────────────
  telegram: {
    workerRoute: 'POST /telegram/webhook',
    status: 'IMPLEMENTED',
    credentials: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_WEBHOOK_SECRET'],
    deps: ['Telegram Bot API'],
  },
};

// ── Summary ────────────────────────────────────────────────────
export const FUNCTION_SUMMARY = {
  total: 41,
  implemented: Object.values(FUNCTION_MAP).filter(f => f.status === 'IMPLEMENTED').length,
  adapterReady: Object.values(FUNCTION_MAP).filter(f => f.status === 'ADAPTER_READY').length,
  pending: Object.values(FUNCTION_MAP).filter(f => f.status === 'PENDING').length,
  credentialBlocked: Object.values(FUNCTION_MAP).filter(f => f.credentials.includes('CREDENTIAL_BLOCKED')).length,
};

export default FUNCTION_MAP;