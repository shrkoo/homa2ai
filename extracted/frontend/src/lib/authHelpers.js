/**
 * authHelpers.js — OAuth helper (Worker-backed, no Base44).
 *
 * Google: redirects to Worker's independent Google OAuth flow.
 * Apple/Microsoft/Facebook: not yet supported — requires independent OAuth client setup.
 */

import { safeReturnTo } from '@/lib/authReturnTo';

const DEFAULT_WORKER_URL = 'https://homa-ai-core.shahramalidazeh620.workers.dev';

const getWorkerUrl = () => {
  try {
    return (localStorage.getItem('homa_worker_url') || DEFAULT_WORKER_URL).trim().replace(/\/$/, '');
  } catch {
    return DEFAULT_WORKER_URL;
  }
};

export function loginWithAccountPicker(provider) {
  if (provider === 'google') {
    const redirect = window.location.origin + safeReturnTo();
    window.location.href = `${getWorkerUrl()}/google/auth?login=1&redirect=${encodeURIComponent(redirect)}`;
    return;
  }
  throw new Error('ورود با ' + provider + ' فعلاً پشتیبانی نمی‌شود. لطفاً از ایمیل و رمز عبور استفاده کنید.');
}