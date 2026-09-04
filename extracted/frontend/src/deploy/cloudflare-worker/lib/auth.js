/**
 * Homa AI — Authentication & Authorization (B15)
 *
 * User identity is derived from the caller's access token (X-User-Token header).
 * The token is NEVER trusted from request body — only from the header.
 *
 * Current: token is the Base44 access token (SHA-256 hash → userKey).
 * Future: token will be a Supabase JWT (validated via JWK).
 *
 * Admin role is checked against the users table in D1 (when available),
 * falling back to a KV-cached role lookup.
 */

import { ErrorCodes, errorResponse } from './errors.js';

// ===== User identity derivation =====
// Hashes the access token to a stable, opaque user key.
// This is the SAME function used in the existing Worker (deriveUserKey).
export async function deriveUserKey(token, env) {
  if (!token) throw new Error('no_token');
  const data = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ===== Auth guard: requires valid Bearer token + X-User-Token =====
export async function requireAuth(request, env) {
  const requestId = request.headers.get('X-Request-Id') || '';
  const authHeader = request.headers.get('Authorization');
  if (!env.HOMA_WORKER_KEY || authHeader !== 'Bearer ' + env.HOMA_WORKER_KEY) {
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

  // Check admin role in D1 users table
  if (env.DB) {
    try {
      const userRow = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(auth.user.id).first();
      if (userRow && userRow.role === 'admin') {
        return { ...auth, isAdmin: true };
      }
    } catch {}
  }

  // Fallback: check KV for admin flag (set during migration)
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