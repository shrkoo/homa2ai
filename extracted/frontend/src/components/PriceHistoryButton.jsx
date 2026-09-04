import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, History, Loader2, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useI18n } from '@/i18n/I18nContext';
import { dataAdapter } from '@/lib/adapters';

function parsePrice(p) {
  if (typeof p === 'number') return p;
  const n = parseFloat(String(p || '').replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
}

function fmtPrice(price, currency) {
  if (!price && price !== 0) return '—';
  const num = typeof price === 'number' ? price : parseFloat(String(price).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return String(price);
  return num.toLocaleString('en-US') + (currency ? ' ' + currency : '');
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function shortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function PriceHistoryButton({ product }) {
  const { t, language } = useI18n();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    if (!product.url) return;
    setLoading(true);
    try {
      const rows = await dataAdapter.filter('PriceHistory', { product_url: product.url }, '-created_date', 20);
      setHistory(rows);
    } catch { setHistory([]); }
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchHistory();
  }, [open]);

  const trend = (() => {
    if (history.length < 2) return null;
    const prices = history.map(h => parsePrice(h.price)).filter(p => p !== null);
    if (prices.length < 2) return null;
    const latest = prices[0];
    const prev = prices[1];
    if (latest < prev) return { dir: 'down', pct: Math.round(((prev - latest) / prev) * 100) };
    if (latest > prev) return { dir: 'up', pct: Math.round(((latest - prev) / prev) * 100) };
    return { dir: 'stable', pct: 0 };
  })();

  const trendIcon = trend?.dir === 'down' ? <TrendingDown size={13} className="text-emerald-500" />
    : trend?.dir === 'up' ? <TrendingUp size={13} className="text-rose-500" />
    : trend?.dir === 'stable' ? <Minus size={13} className="text-muted-foreground" />
    : <History size={13} className="text-muted-foreground" />;

  const chartData = [...history].reverse()
    .map(h => ({ date: shortDate(h.created_date || h.updated_date), price: parsePrice(h.price) }))
    .filter(d => d.price !== null);

  return (
    <div className="contents">
      <button
        onClick={() => setOpen(v => !v)}
        title={t('gs_price_history')}
        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent text-muted-foreground hover:bg-accent/70 transition-colors"
      >
        {trendIcon}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-card w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2"><History size={15} /> {t('gs_price_history')}</h3>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full bg-accent flex items-center justify-center"><X size={14} /></button>
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{product.name || '—'}</p>
              {loading ? (
                <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
              ) : history.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">{t('gs_no_history')}</p>
              ) : (
                <div className="space-y-2">
                  {trend && (
                    <div className={`flex items-center gap-2 p-2.5 rounded-xl text-sm font-medium ${
                      trend.dir === 'down' ? 'bg-emerald-500/10 text-emerald-600' :
                      trend.dir === 'up' ? 'bg-rose-500/10 text-rose-600' :
                      'bg-accent text-muted-foreground'
                    }`}>
                      {trendIcon}
                      <span>{trend.dir === 'down' ? t('gs_price_dropped') : trend.dir === 'up' ? t('gs_price_increased') : t('gs_price_stable')}</span>
                      {trend.pct > 0 && <span className="tabular-nums">{trend.pct}%</span>}
                    </div>
                  )}
                  {chartData.length >= 2 && (
                    <div className="rounded-xl bg-accent/40 p-2.5">
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">{t('gs_price_trend')}</p>
                      <ResponsiveContainer width="100%" height={130}>
                        <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : String(v)} domain={['auto', 'auto']} />
                          <Tooltip
                            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: '12px' }}
                            formatter={(v) => [fmtPrice(v, product.currency), t('gs_price_col')]}
                          />
                          <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--primary))' }} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {history.map((h, i) => {
                    const prev = i < history.length - 1 ? parsePrice(history[i + 1].price) : null;
                    const cur = parsePrice(h.price);
                    const diff = prev !== null && cur !== null ? cur - prev : null;
                    return (
                      <div key={h.id || i} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-accent/40">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold tabular-nums">{fmtPrice(h.price, h.currency)}</p>
                          {h.seller && <p className="text-xs text-muted-foreground truncate">{h.seller}</p>}
                        </div>
                        <div className="text-end shrink-0">
                          <p className="text-xs text-muted-foreground">{timeAgo(h.created_date || h.updated_date)}</p>
                          {diff !== null && diff !== 0 && (
                            <p className={`text-xs font-medium tabular-nums ${diff < 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {diff < 0 ? '▼' : '▲'} {Math.abs(diff).toLocaleString('en-US')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}