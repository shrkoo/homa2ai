/**
 * Shared helpers for provider adapters.
 * Credential validation probe + response classification + HTTP + upload utilities.
 */

export async function probe(url, headers, timeoutMs = 10000) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { method: 'GET', headers, signal: controller.signal });
    clearTimeout(timeout);
    return { status: res.status, ok: res.ok, netError: false };
  } catch (e) {
    return { status: 0, ok: false, netError: true, reason: e?.name === 'AbortError' ? 'timeout' : 'network' };
  }
}

export function classify(status, ok, netError) {
  if (netError) return { valid: false, status: 'API_UNAVAILABLE' };
  if (status === 401 || status === 403) return { valid: false, status: 'EXPIRED' };
  if (ok) return { valid: true, status: 'CONNECTED' };
  if (status >= 400 && status < 500) return { valid: true, status: 'CONNECTED' };
  if (status >= 500) return { valid: false, status: 'API_UNAVAILABLE' };
  return { valid: false, status: 'ERROR' };
}

export function normalizeError(status, body) {
  if (status === 401 || status === 403) return { code: 'invalid_credentials', message: 'API key is invalid or expired' };
  if (status === 402) return { code: 'insufficient_credits', message: 'Account has insufficient credits' };
  if (status === 429) return { code: 'rate_limited', message: 'Rate limit reached — try again later' };
  if (status >= 500) return { code: 'provider_unavailable', message: 'Provider is temporarily unavailable' };
  return { code: 'provider_error', message: 'Provider returned an error' };
}

/**
 * POST JSON and return parsed response.
 * @returns { status, ok, data }
 */
export async function postJson(url, headers, body, timeoutMs = 60000) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    let data = null;
    const text = await res.text();
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { status: res.status, ok: res.ok, data };
  } catch (e) {
    return { status: 0, ok: false, data: null, netError: true, reason: e?.name === 'AbortError' ? 'timeout' : 'network' };
  }
}

/**
 * GET JSON with timeout.
 */
export async function getJson(url, headers, timeoutMs = 30000) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { method: 'GET', headers, signal: controller.signal });
    clearTimeout(timeout);
    let data = null;
    const text = await res.text();
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { status: res.status, ok: res.ok, data };
  } catch (e) {
    return { status: 0, ok: false, data: null, netError: true, reason: e?.name === 'AbortError' ? 'timeout' : 'network' };
  }
}

/**
 * Upload raw bytes to a public file host (0x0.st → tmpfiles.org fallback).
 * Returns a public URL or null.
 */
export async function uploadBytesToHost(bytes, filename, mimeType) {
  const blob = new Blob([bytes], { type: mimeType || 'application/octet-stream' });
  // 0x0.st
  try {
    const fd = new FormData();
    fd.append('file', blob, filename);
    const r = await fetch('https://0x0.st', { method: 'POST', body: fd });
    if (r.ok) {
      const url = (await r.text()).trim();
      if (url.startsWith('http')) return url;
    }
  } catch {}
  // tmpfiles.org fallback
  try {
    const fd2 = new FormData();
    fd2.append('file', blob, filename);
    const r2 = await fetch('https://tmpfiles.org/api/v1/upload', { method: 'POST', body: fd2 });
    if (r2.ok) {
      const d = await r2.json();
      const url = d?.data?.url;
      if (url && url.startsWith('http')) return url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
    }
  } catch {}
  return null;
}

/**
 * Fetch a URL's bytes and re-upload to the public host (useful when a provider
 * returns a temporary URL that expires). Returns a stable public URL or null.
 */
export async function uploadUrlToHost(sourceUrl, filename, mimeType) {
  try {
    const r = await fetch(sourceUrl);
    if (!r.ok) return null;
    const bytes = new Uint8Array(await r.arrayBuffer());
    return await uploadBytesToHost(bytes, filename, mimeType);
  } catch {
    return null;
  }
}

/**
 * Standard job result shapes returned by adapter execute()/getJobStatus().
 */
export function jobCompleted(resultUrl, resultText, metadata) {
  return { status: 'COMPLETED', result_url: resultUrl || '', result_text: resultText || '', metadata: metadata || null };
}
export function jobProcessing(providerJobId, context) {
  return { status: 'PROCESSING', provider_job_id: providerJobId, context: context || null };
}
export function jobFailed(code, message) {
  return { status: 'FAILED', error: message || code, code };
}
export function jobNotSupported(capability) {
  return { status: 'NOT_SUPPORTED', error: `Capability ${capability} is not supported by this provider`, code: 'not_supported' };
}