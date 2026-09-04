/**
 * authAdapter.js — Independent Authentication (Worker-backed, no Base44)
 *
 * All auth operations go directly to the Homa Worker's /auth/* endpoints.
 * Email/password auth is fully independent — no Base44 SDK dependency.
 *
 * Google OAuth: Worker's independent Google OAuth flow (/google/auth?login=1)
 * Apple/Microsoft/Facebook: not yet supported (requires independent OAuth client setup)
 */

import { safeReturnTo } from '@/lib/authReturnTo';

const DEFAULT_WORKER_URL = 'https://homa-ai-core.shahramalidazeh620.workers.dev';

const getWorkerConfig = () => {
  try {
    return {
      url: (localStorage.getItem('homa_worker_url') || DEFAULT_WORKER_URL).trim().replace(/\/$/, ''),
      key: (localStorage.getItem('homa_worker_key') || '').trim(),
    };
  } catch {
    return { url: DEFAULT_WORKER_URL, key: '' };
  }
};

async function authFetch(path, options = {}) {
  const { url, key } = getWorkerConfig();
  const headers = {
    'Content-Type': 'application/json',
    ...(key ? { Authorization: 'Bearer ' + key } : {}),
    ...(options.token ? { 'X-User-Token': options.token } : {}),
  };
  const res = await fetch(url + path, {
    method: options.method || 'POST',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  let data;
  try { data = await res.json(); } catch { throw new Error('خطای شبکه — پاسخ سرور نامعتبر'); }
  if (!data.success) {
    const err = new Error(data.error?.message || 'خطای احراز هویت');
    err.code = data.error?.code;
    err.status = res.status;
    throw err;
  }
  return data.data;
}

export const authAdapter = {
  // ── Email / Password (fully independent) ──────────────────

  async login(email, password) {
    const result = await authFetch('/auth/login', { body: { email, password } });
    if (result?.access_token) {
      this.setToken(result.access_token);
    }
    return result;
  },

  async register(email, password) {
    // register does NOT log in — user must verify OTP first
    return authFetch('/auth/register', { body: { email, password } });
  },

  async verifyOtp(email, otpCode) {
    const result = await authFetch('/auth/verify-otp', { body: { email, otp_code: otpCode } });
    if (result?.access_token) {
      this.setToken(result.access_token);
    }
    return result;
  },

  async resendOtp(email) {
    return authFetch('/auth/resend-otp', { body: { email } });
  },

  // ── Session (fully independent) ─────────────────────────────

  async getCurrentUser() {
    const token = this.getAccessToken();
    if (!token) return null;
    try {
      const result = await authFetch('/auth/me', { method: 'GET', token });
      return result?.user || null;
    } catch {
      return null;
    }
  },

  async isAuthenticated() {
    const token = this.getAccessToken();
    if (!token) return false;
    const user = await this.getCurrentUser();
    return !!user;
  },

  async logout(redirectUrl) {
    this.clearToken();
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  },

  async redirectToLogin(nextUrl) {
    const currentUrl = nextUrl || window.location.href;
    window.location.href = '/login?returnTo=' + encodeURIComponent(currentUrl);
  },

  // ── Password Reset (fully independent) ──────────────────────

  async resetPasswordRequest(email) {
    // Always show generic success — API hides whether email exists
    try {
      await authFetch('/auth/reset-request', { body: { email } });
    } catch {
      // swallow — show generic success regardless
    }
    return { ok: true };
  },

  async resetPassword(resetToken, newPassword) {
    return authFetch('/auth/reset', { body: { token: resetToken, new_password: newPassword } });
  },

  // ── Profile (fully independent) ────────────────────────────

  async updateProfile(data) {
    const token = this.getAccessToken();
    const result = await authFetch('/auth/profile', { method: 'PATCH', body: data, token });
    return result?.user;
  },

  // ── Token storage (shared with directInvoke/dataStore) ─────

  getAccessToken() {
    try {
      return localStorage.getItem('base44_access_token') || '';
    } catch {
      return '';
    }
  },

  setToken(token) {
    try {
      localStorage.setItem('base44_access_token', token);
    } catch {}
  },

  clearToken() {
    try {
      localStorage.removeItem('base44_access_token');
    } catch {}
  },

  // ── OAuth (independent — via Worker) ──────────────────────
  // Google: Worker's independent Google OAuth flow
  // Apple/Microsoft/Facebook: not yet supported (requires independent OAuth client setup)

  async loginWithProvider(provider, returnTo) {
    if (provider === 'google') {
      const { url } = getWorkerConfig();
      const redirect = returnTo || safeReturnTo();
      window.location.href = `${url}/google/auth?login=1&redirect=${encodeURIComponent(window.location.origin + redirect)}`;
      return;
    }
    throw new Error('ورود با ' + provider + ' فعلاً پشتیبانی نمی‌شود. لطفاً از ایمیل و رمز عبور استفاده کنید.');
  },
};

export default authAdapter;