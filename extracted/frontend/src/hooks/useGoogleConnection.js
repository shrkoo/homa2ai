import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';

const getWorkerConfig = () => {
  try {
    return {
      url: (localStorage.getItem('homa_worker_url') || 'https://homa-ai-core.shahramalidazeh620.workers.dev').trim().replace(/\/$/, ''),
      token: (localStorage.getItem('base44_access_token') || '').trim(),
    };
  } catch { return { url: '', token: '' }; }
};

/**
 * useGoogleConnection — manages independent Google OAuth via Homa Worker.
 * Tokens are stored encrypted in Worker KV; frontend never sees them.
 * Uses X-User-Token (Homa token) for auth — no Worker key needed.
 */
export function useGoogleConnection() {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    const { url, token } = getWorkerConfig();
    if (!url || !token || !user) { setLoading(false); return; }
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Token': token },
        body: JSON.stringify({ type: 'google_status' }),
      });
      const data = await res.json();
      setConnected(data.connected === true);
    } catch {}
    setLoading(false);
  }, [user]);

  const connect = useCallback(() => {
    const { url } = getWorkerConfig();
    if (!url || !user) return;
    const redirect = window.location.origin + window.location.pathname + window.location.search;
    window.location.href = `${url}/google/auth?user_id=${encodeURIComponent(user.id)}&redirect=${encodeURIComponent(redirect)}`;
  }, [user]);

  const disconnect = useCallback(async () => {
    const { url, token } = getWorkerConfig();
    if (!url || !token || !user) return;
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Token': token },
        body: JSON.stringify({ type: 'google_disconnect' }),
      });
      setConnected(false);
    } catch {}
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_connected') === '1') {
      setConnected(true);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } else if (params.get('google_error')) {
      setLoading(false);
    } else {
      checkStatus();
    }
  }, [checkStatus]);

  return { connected, loading, connect, disconnect, checkStatus };
}