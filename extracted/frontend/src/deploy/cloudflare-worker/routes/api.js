/**
 * Homa AI — API Platform Routes (B7)
 *
 * Endpoints for developer API keys, credits, usage, and health.
 *
 *   POST   /api/keys          — create API key (returns plaintext ONCE)
 *   GET    /api/keys          — list user's API keys
 *   DELETE /api/keys/:id      — revoke (delete) API key
 *   GET    /api/credits        — get API credit balance
 *   POST   /api/credits/purchase — purchase API credits (admin/payment)
 *   GET    /api/usage          — get API usage history
 *   GET    /api/health         — health check + provider availability
 *
 * API keys are stored as SHA-256 hashes. Plaintext is shown ONLY at creation.
 * Prefix (first 8 chars) is stored for display.
 */

import { requireAuth } from '../lib/auth.js';
import { successResponse, errorResponse, ErrorCodes } from '../lib/errors.js';
import { isValidEntity } from '../lib/db.js';

// ===== API Key generation =====
function generateApiKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return 'homa_' + hex;
}

async function hashApiKey(plaintext) {
  const data = new TextEncoder().encode(plaintext);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ===== Rate limit (in-memory, per-isolate) =====
const rateLimitMap = new Map();
function checkRateLimit(key, maxPerMin) {
  const now = Date.now();
  const window = Math.floor(now / 60000);
  const k = key + ':' + window;
  const count = rateLimitMap.get(k) || 0;
  if (count >= maxPerMin) return false;
  rateLimitMap.set(k, count + 1);
  return true;
}

// ===== Main handler =====
export async function handleApiRoutes(request, env, url, user) {
  const path = url.pathname;
  const method = request.method;

  // POST /api/keys — create
  if (path === '/api/keys' && method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return errorResponse(ErrorCodes.INVALID_INPUT); }
    if (!env.DB) return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, 'Database not configured');

    const plaintext = generateApiKey();
    const keyHash = await hashApiKey(plaintext);
    const prefix = plaintext.slice(0, 12) + '...';
    const id = 'apikey_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);

    try {
      await env.DB.prepare(
        'INSERT INTO api_keys (id, user_id, key_hash, key_prefix, label, active) VALUES (?, ?, ?, ?, ?, 1)'
      ).bind(id, user.id, keyHash, prefix, body.label || '').run();
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }

    return successResponse({ id, key: plaintext, prefix, label: body.label || '' });
  }

  // GET /api/keys — list
  if (path === '/api/keys' && method === 'GET') {
    if (!env.DB) return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, 'Database not configured');
    try {
      const { results } = await env.DB.prepare(
        'SELECT id, key_prefix, label, active, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC'
      ).bind(user.id).all();
      return successResponse({ keys: results || [] });
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
  }

  // DELETE /api/keys/:id — revoke
  const keyMatch = path.match(/^\/api\/keys\/([^/]+)$/);
  if (keyMatch && method === 'DELETE') {
    if (!env.DB) return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, 'Database not configured');
    const keyId = decodeURIComponent(keyMatch[1]);
    try {
      const result = await env.DB.prepare(
        'DELETE FROM api_keys WHERE id = ? AND user_id = ?'
      ).bind(keyId, user.id).run();
      if (result.meta.changes === 0) return errorResponse(ErrorCodes.NOT_FOUND);
      return successResponse({ revoked: true });
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
  }

  // GET /api/credits — balance
  if (path === '/api/credits' && method === 'GET') {
    if (!env.DB) return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, 'Database not configured');
    try {
      let row = await env.DB.prepare('SELECT balance FROM api_credits WHERE user_id = ?').bind(user.id).first();
      if (!row) {
        const id = 'ac_' + user.id.slice(0, 12);
        await env.DB.prepare('INSERT INTO api_credits (id, user_id, balance) VALUES (?, ?, 100)').bind(id, user.id).run();
        row = { balance: 100 };
      }
      return successResponse({ balance: row.balance });
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
  }

  // GET /api/usage — history
  if (path === '/api/usage' && method === 'GET') {
    if (!env.DB) return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, 'Database not configured');
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 200);
    try {
      const { results } = await env.DB.prepare(
        'SELECT * FROM api_usage WHERE owner_id = ? ORDER BY created_at DESC LIMIT ?'
      ).bind(user.id, limit).all();
      return successResponse({ usage: results || [] });
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
  }

  // GET /api/health — provider availability
  if (path === '/api/health' && method === 'GET') {
    const { router } = await import('../providers/router.js');
    const capabilities = ['chat', 'reasoning', 'coding', 'vision', 'image', 'stt', 'tts', 'file_analysis', 'web_search', 'deep_research'];
    const health = {};
    for (const cap of capabilities) {
      health[cap] = router.isAvailable(cap, env);
    }
    return successResponse({
      status: 'ok',
      database: !!env.DB,
      storage: !!env.STORAGE,
      email: !!env.RESEND_API_KEY,
      payments: !!env.ZARINPAL_MERCHANT_ID,
      capabilities: health,
    });
  }

  return errorResponse(ErrorCodes.NOT_FOUND);
}