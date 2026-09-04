import { useCallback } from 'react';
import { useI18n } from '@/i18n/I18nContext';

/**
 * useGlobalSearch — streams real status updates from the Homa Worker
 * for the "Homa Global Search" capability (multi-source product/price comparison).
 *
 * API contract (Worker endpoint: type = "global_search"):
 *
 * Frontend sends (POST):
 *   { type: "global_search", query: "...", language: "fa" }
 *
 * Worker returns one of:
 *   A) SSE stream (Content-Type: text/event-stream):
 *      data: {"request_id":"...","status":"starting","progress":5,"message":"..."}
 *      ...
 *      data: {"request_id":"...","status":"completed","progress":100,
 *             "results":[...],"sources":[...],"summary":"...","limited":false}
 *      (or status "limited" / "error")
 *
 *   B) JSON (fallback):
 *      { request_id, status, progress, message, results, sources, summary, limited, error }
 *
 * Result object:
 *   { name, price, currency, seller, country, in_stock, specs, url, checked_at, rank }
 *
 * Source object:
 *   { title, url, site, favicon }
 */
export function useGlobalSearch() {
  const { language } = useI18n();

  const runGlobalSearch = useCallback(async (query, { onStatus, onComplete, onError } = {}) => {
    let url, key;
    try {
      url = (localStorage.getItem('homa_worker_url') || '').trim();
      key = (localStorage.getItem('homa_worker_key') || '').trim();
    } catch {
      url = ''; key = '';
    }

    if (!url) {
      onError?.({ status: 'error', error: 'worker_not_configured', message: 'Worker تنظیم نشده. به Settings → «اتصال مستقیم به Homa Worker» بروید.' });
      return;
    }

    const requestId = 'gs_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    onStatus?.({ request_id: requestId, status: 'starting', progress: 3, message: 'starting' });

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key,
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ type: 'global_search', query, language, request_id: requestId }),
      });

      if (!res.ok) {
        onError?.({ request_id: requestId, status: 'error', error: 'http_' + res.status, message: `Worker error: ${res.status}` });
        return;
      }

      const contentType = res.headers.get('Content-Type') || '';

      // --- SSE streaming path ---
      if (contentType.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finalData = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split('\n\n');
          buffer = events.pop();

          for (const event of events) {
            const dataLine = event.split('\n').find((l) => l.startsWith('data:'));
            if (!dataLine) continue;
            const jsonStr = dataLine.replace(/^data:\s*/, '');
            try {
              const data = JSON.parse(jsonStr);
              if (data.status === 'completed' || data.status === 'limited') {
                finalData = data;
              }
              if (data.status === 'error') {
                onError?.(data);
                return;
              }
              onStatus?.(data);
            } catch {}
          }
        }

        if (finalData) {
          onComplete?.(finalData);
        } else {
          onError?.({ request_id: requestId, status: 'error', error: 'no_result', message: 'no_final_result' });
        }
        return;
      }

      // --- JSON fallback path ---
      const data = await res.json();
      if (data.error || data.status === 'error') {
        onError?.(data);
      } else {
        onStatus?.({ ...data, status: 'completed', progress: 100 });
        onComplete?.(data);
      }
    } catch (e) {
      const msg = String(e?.message || '');
      if (msg.includes('401')) {
        onError?.({ request_id: requestId, status: 'error', error: 'unauthorized', message: 'کلید Worker نامعتبر است.' });
      } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network')) {
        onError?.({ request_id: requestId, status: 'error', error: 'network', message: 'network_error' });
      } else {
        onError?.({ request_id: requestId, status: 'error', error: 'unknown', message: msg || 'unknown_error' });
      }
    }
  }, [language]);

  return { runGlobalSearch };
}