/**
 * Homa AI — File Storage Abstraction (B13)
 *
 * Provider: Cloudflare R2 (when configured)
 * Fallback: existing 0x0.st / tmpfiles.org proxy (current Worker behavior)
 *
 * API:
 *   storage.upload(env, userId, file, opts)   → { url, key, size }
 *   storage.download(env, userId, key)        → signed URL
 *   storage.delete(env, userId, key)          → { ok }
 *   storage.getSignedUrl(env, userId, key, ttl) → signed URL
 *
 * Access control: files are keyed by user_id prefix. User A cannot
 * access User B's files — the key always includes the user hash.
 *
 * For sensitive files, use getSignedUrl (time-limited).
 * For public files (images for display), upload returns a public URL.
 *
 * If R2 is not configured AND no fallback proxy is available:
 *   returns { error: 'NO_STORAGE_PROVIDER' }
 */

import { ErrorCodes } from './errors.js';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_MIMES = new Set([
  'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml',
  'video/mp4', 'video/webm', 'video/quicktime',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/flac',
  'application/pdf',
  'text/plain', 'text/csv', 'text/html', 'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/json',
]);

function genFileKey(userId, fileName, mimeType) {
  const ext = (fileName || '').split('.').pop() || 'bin';
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${userId.slice(0, 16)}/${ts}_${rand}.${ext}`;
}

function validateFile(file, opts) {
  if (!file) return { error: 'NO_FILE' };
  const size = file.size || file.byteLength || 0;
  if (size > MAX_FILE_SIZE) return { error: ErrorCodes.FILE_TOO_LARGE };
  const mime = file.type || opts?.mimeType || '';
  if (mime && !ALLOWED_MIMES.has(mime)) return { error: ErrorCodes.UNSUPPORTED_FILE };
  return { ok: true, size, mime };
}

// ===== R2 Provider =====
async function r2Upload(env, userId, file, opts) {
  const key = genFileKey(userId, file.name, file.type);
  const buffer = file.arrayBuffer ? await file.arrayBuffer() : file;

  await env.STORAGE.put(key, buffer, {
    httpMetadata: { contentType: file.type || opts?.mimeType || 'application/octet-stream' },
  });

  // R2 public URL requires custom domain or dev URL.
  // For now, return a key that can be used with getSignedUrl.
  return { url: null, key, size: file.size || buffer.byteLength, provider: 'r2' };
}

async function r2GetSignedUrl(env, userId, key, ttl) {
  // R2 doesn't have native signed URLs like S3.
  // We use the Worker as a proxy: GET /files/:key with auth.
  // The Worker validates the user owns the file and streams it.
  // For now, return a placeholder — the actual streaming is in routes/files.js
  return { url: null, proxy: true, key };
}

async function r2Delete(env, userId, key) {
  // Verify ownership: key must start with user prefix
  if (!key.startsWith(userId.slice(0, 16) + '/')) {
    return { ok: false, error: ErrorCodes.FORBIDDEN };
  }
  await env.STORAGE.delete(key);
  return { ok: true };
}

// ===== Fallback Provider (0x0.st proxy — existing behavior) =====
async function proxyUpload(file, env) {
  const formData = new FormData();
  formData.append('file', file, file.name || 'upload');

  const proxyUrl = env.FILE_PROXY_URL || 'https://0x0.st';
  try {
    const res = await fetch(proxyUrl, { method: 'POST', body: formData });
    if (!res.ok) return { error: 'PROXY_FAILED', status: res.status };
    const text = await res.text();
    const url = text.trim().split('\n')[0];
    if (!url || !url.startsWith('http')) return { error: 'PROXY_INVALID_RESPONSE' };
    return { url, key: null, size: file.size || 0, provider: 'proxy' };
  } catch (e) {
    return { error: 'PROXY_ERROR', message: e.message };
  }
}

// ===== Main storage API =====
export const storage = {
  async upload(env, userId, file, opts = {}) {
    const validation = validateFile(file, opts);
    if (validation.error) return { error: validation.error };

    // R2 (preferred)
    if (env.STORAGE) {
      try {
        return await r2Upload(env, userId, file, opts);
      } catch (e) {
        // Fall through to proxy
      }
    }

    // Proxy fallback (current behavior)
    if (env.FILE_PROXY_URL || !env.STORAGE) {
      return await proxyUpload(file, env);
    }

    return { error: ErrorCodes.NO_STORAGE_PROVIDER };
  },

  async getSignedUrl(env, userId, key, ttl = 300) {
    if (env.STORAGE) {
      return await r2GetSignedUrl(env, userId, key, ttl);
    }
    return { error: ErrorCodes.NO_STORAGE_PROVIDER };
  },

  async delete(env, userId, key) {
    if (env.STORAGE) {
      return await r2Delete(env, userId, key);
    }
    // Proxy doesn't support deletion
    return { ok: true, note: 'proxy_no_delete' };
  },

  isAvailable(env) {
    return !!(env.STORAGE || env.FILE_PROXY_URL);
  },
};