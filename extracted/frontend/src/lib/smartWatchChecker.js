// Smart Watch on-demand price/stock checker.
// Calls the Homa Worker's global_search endpoint (independent of Base44 credits)
// to fetch the current price/stock of a tracked product and evaluates the watch condition.
// This is the REAL trigger path — no fake success. If the Worker is not configured or
// returns no data, an honest error/not-met result is returned.

function workerConfig() {
  try {
    return {
      url: (localStorage.getItem('homa_worker_url') || '').trim(),
      key: (localStorage.getItem('homa_worker_key') || '').trim(),
    };
  } catch { return { url: '', key: '' }; }
}

async function readSSE(body) {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let final = null;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const events = buf.split('\n\n');
    buf = events.pop();
    for (const ev of events) {
      const line = ev.split('\n').find((l) => l.startsWith('data:'));
      if (!line) continue;
      try {
        const d = JSON.parse(line.replace(/^data:\s*/, ''));
        if (d.status === 'completed' || d.status === 'limited') final = d;
        if (d.status === 'error') return { error: d.error || 'error' };
      } catch {}
    }
  }
  return final || { error: 'no_result' };
}

function toNumber(v) {
  if (typeof v === 'number') return v;
  return parseFloat(String(v || '').replace(/[^0-9.]/g, '')) || 0;
}

// Check a single smart watch against live data from the Worker.
// Returns { status: 'triggered'|'not_met'|'error', currentPrice, oldPrice, inStock, product, reason, lastChecked }
export async function checkSmartWatch(watch) {
  const { url, key } = workerConfig();
  if (!url || !key) return { status: 'error', error: 'worker_not_configured', lastChecked: new Date().toISOString() };

  const query = watch.product_name || watch.product_url || watch.title || '';
  if (!query) return { status: 'error', error: 'no_product', lastChecked: new Date().toISOString() };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key, Accept: 'text/event-stream' },
      body: JSON.stringify({ type: 'global_search', query: query + ' قیمت', language: 'fa' }),
    });
    if (!res.ok) return { status: 'error', error: 'http_' + res.status, lastChecked: new Date().toISOString() };
    const ct = res.headers.get('Content-Type') || '';
    const data = ct.includes('text/event-stream') && res.body ? await readSSE(res.body) : await res.json();
    if (!data || data.error) return { status: 'error', error: data?.error || 'no_data', lastChecked: new Date().toISOString() };

    const results = data.results || [];
    if (!results.length) return { status: 'not_met', reason: 'no_results', lastChecked: new Date().toISOString() };

    // Best match: exact URL, else first result with a price
    let match = watch.product_url ? results.find((r) => r.url && r.url === watch.product_url) : null;
    if (!match) match = results.find((r) => toNumber(r.price) > 0) || results[0];

    const currentPrice = toNumber(match.price);
    const inStock = match.in_stock === true || match.in_stock === 'true' || match.in_stock === 1 || match.in_stock === 'in_stock';
    // Previous known price stored in condition_data (for PRICE_DECREASE baseline)
    const oldPrice = toNumber(watch.condition_data);

    let triggered = false;
    let reason = '';
    if (watch.condition_type === 'PRICE_BELOW') {
      const target = Number(watch.target_price) || toNumber(watch.condition_value);
      triggered = target > 0 && currentPrice > 0 && currentPrice < target;
      reason = `قیمت فعلی ${currentPrice.toLocaleString('fa-IR')} تومان — هدف: زیر ${target.toLocaleString('fa-IR')}`;
    } else if (watch.condition_type === 'PRICE_DECREASE') {
      triggered = oldPrice > 0 && currentPrice > 0 && currentPrice < oldPrice;
      reason = oldPrice > 0
        ? `قیمت از ${oldPrice.toLocaleString('fa-IR')} به ${currentPrice.toLocaleString('fa-IR')} کاهش یافت`
        : `قیمت فعلی ${currentPrice.toLocaleString('fa-IR')} تومان (خط پایه ثبت شد)`;
    } else if (watch.condition_type === 'BACK_IN_STOCK') {
      triggered = !!inStock;
      reason = inStock ? 'محصول دوباره موجود شد' : 'هنوز ناموجود است';
    }

    return {
      status: triggered ? 'triggered' : 'not_met',
      currentPrice, oldPrice, inStock, product: match, reason,
      lastChecked: new Date().toISOString(),
    };
  } catch (e) {
    return { status: 'error', error: String(e?.message || 'network'), lastChecked: new Date().toISOString() };
  }
}