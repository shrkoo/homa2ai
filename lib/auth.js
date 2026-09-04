/**
 * Homa AI — Authentication & Authorization
 *
 * Supports TWO token formats:
 *   1. Homa Token (new, independent): homa_<userId>.<expiry>.<hmac>
 *      - Issued by /auth/login or /auth/verify-otp
 *      - Signed with HOMA_WORKER_KEY (HMAC-SHA256)
 *      - userId is extracted directly (no hashing)
 *   2. Base44 Token (legacy): any string not starting with "homa_"
 *      - Hashed with SHA-256 to derive userKey (backward compatible)
 *      - Allows existing Base44 users to keep their data during migration
 *
 * Admin role is checked against the users table in D1.
 */

import { ErrorCodes, errorResponse } from './errors.js';

// ===== Homa Token (independent auth) =====

async function getHmacKey(env) {
  if (!env.HOMA_WORKER_KEY) throw new Error('no_worker_key');
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.HOMA_WORKER_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

// Issue a signed Homa token: homa_<userId>.<expiry>.<hmac>
export async function issueHomaToken(userId, env) {
  const expiry = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
  const payload = `${userId}.${expiry}`;
  const key = await getHmacKey(env);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const hmac = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `homa_${userId}.${expiry}.${hmac}`;
}

// Verify a Homa token and extract userId. Returns null if invalid/expired.
export async function verifyHomaToken(token, env) {
  if (!token || !token.startsWith('homa_')) return null;
  const rest = token.slice(5); // remove "homa_"
  const lastDot = rest.lastIndexOf('.');
  const secondLastDot = rest.lastIndexOf('.', lastDot - 1);
  if (lastDot < 0 || secondLastDot < 0) return null;

  const userId = rest.slice(0, secondLastDot);
  const expiryStr = rest.slice(secondLastDot + 1, lastDot);
  const hmac = rest.slice(lastDot + 1);

  const expiry = parseInt(expiryStr, 10);
  if (isNaN(expiry) || expiry < Math.floor(Date.now() / 1000)) return null;

  const payload = `${userId}.${expiry}`;
  const key = await getHmacKey(env);
  const expectedSig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const expectedHmac = Array.from(new Uint8Array(expectedSig)).map(b => b.toString(16).padStart(2, '0')).join('');

  if (hmac !== expectedHmac) return null;
  return { userId, expiry };
}

// ===== User identity derivation =====
// Homa tokens: extract userId directly (no hashing)
// Legacy tokens: SHA-256 hash (backward compatible with Base44 tokens)
export async function deriveUserKey(token, env) {
  if (!token) throw new Error('no_token');

  // Homa token — verify and extract userId
  if (token.startsWith('homa_')) {
    const verified = await verifyHomaToken(token, env);
    if (!verified) throw new Error('invalid_token');
    return verified.userId;
  }

  // Legacy token — hash it (backward compatible with Base44 access tokens)
  const data = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ===== Bearer token check (shared secret for API access) =====
export function requireBearer(request, env) {
  if (!env.HOMA_WORKER_KEY) return false;
  const authHeader = request.headers.get('Authorization');
  return authHeader === 'Bearer ' + env.HOMA_WORKER_KEY;
}

// ===== Auth guard: requires valid Bearer token + X-User-Token =====
export async function requireAuth(request, env) {
  const requestId = request.headers.get('X-Request-Id') || '';
  if (!requireBearer(request, env)) {
    return { error: errorResponse(ErrorCodes.AUTH_REQUIRED, 401, undefined, requestId), user: null };
  }
  const userToken = request.headers.get('X-User-Token');
  if (!userToken) {
    return { error: errorResponse(ErrorCodes.AUTH_REQUIRED, 401, undefined, requestId), user: null };
  }
  try {
    const userKey = await deriveUserKey(userToken, env);
    return { error: null, user: { id: userKey, token: userToken }, requestId };
  } catch {
    return { error: errorResponse(ErrorCodes.AUTH_REQUIRED, 401, undefined, requestId), user: null };
  }
}

// ===== Admin guard: requires auth + admin role in D1 =====
export async function requireAdmin(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return auth;

  if (env.DB) {
    try {
      const userRow = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(auth.user.id).first();
      if (userRow && userRow.role === 'admin') {
        return { ...auth, isAdmin: true };
      }
    } catch {}
  }

  if (env.USER_DATA) {
    try {
      const adminFlag = await env.USER_DATA.get('admin:' + auth.user.id);
      if (adminFlag === 'true') return { ...auth, isAdmin: true };
    } catch {}
  }

  return {
    error: errorResponse(ErrorCodes.FORBIDDEN, 403, 'دسترسی مدیریت لازم است.', auth.requestId),
    user: auth.user,
    isAdmin: false,
  };
}

// ===== User auth: accepts Homa token (X-User-Token) as primary auth =====
// No Bearer token required — the Homa token alone proves user identity.
// Used for all frontend-facing routes (data, chat, connectors, alarms, etc.).
export async function requireUserAuth(request, env) {
  const requestId = request.headers.get('X-Request-Id') || '';
  const userToken = request.headers.get('X-User-Token');
  if (!userToken) {
    return { error: errorResponse(ErrorCodes.AUTH_REQUIRED, 401, 'Authentication required', requestId), user: null };
  }
  try {
    const userKey = await deriveUserKey(userToken, env);
    return { error: null, user: { id: userKey, token: userToken }, requestId };
  } catch {
    return { error: errorResponse(ErrorCodes.AUTH_REQUIRED, 401, 'Invalid or expired token', requestId), user: null };
  }
}

// ===== Rate limiting (basic, in-memory per isolate) =====
// NOTE: Cloudflare Workers may reset isolates, so this is best-effort.
// For production-grade rate limiting, use Cloudflare Rate Limiting Rules
// (dashboard → Security → WAF → Rate limiting rules).
const rateLimitMap = new Map();
export function checkRateLimit(key, max, windowMs) {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export function getClientIp(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
}

// ===== Get or create user record in D1 =====
export async function ensureUserRecord(env, userId, email) {
  if (!env.DB) return null;
  try {
    const existing = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first();
    if (existing) return existing;
    await env.DB.prepare(
      'INSERT INTO users (id, email, role) VALUES (?, ?, ?)'
    ).bind(userId, email || ('user_' + userId.slice(0, 8) + '@homa.local'), 'user').run();
    return { id: userId };
  } catch (e) {
    return null;
  }
}

// ===== Get user role from D1 =====
export async function getUserRole(env, userId) {
  if (!env.DB) return 'user';
  try {
    const row = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(userId).first();
    return row?.role || 'user';
  } catch {
    return 'user';
  }
}

// ===== Password hashing (PBKDF2-SHA256, 100k iterations) =====
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(derived)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2:100000:${saltHex}:${hashHex}`;
}

export async function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;
  const parts = storedHash.split(':');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = parseInt(parts[1], 10);
  const salt = new Uint8Array(parts[2].match(/.{2}/g).map(b => parseInt(b, 16)));
  const expectedHash = parts[3];

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const actualHash = Array.from(new Uint8Array(derived)).map(b => b.toString(16).padStart(2, '0')).join('');
  return actualHash === expectedHash;
}

// ===== OTP & Reset Token generators =====
export function generateOtp() {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const num = (bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3]) >>> 0;
  return String(num % 1000000).padStart(6, '0');
}

export function generateResetToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}