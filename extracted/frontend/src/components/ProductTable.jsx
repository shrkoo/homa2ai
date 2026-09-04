import React, { useState } from 'react';
import { Medal, Store, ExternalLink, Check, X, Bell, CalendarPlus, Loader2, ImageOff, ListTodo } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/lib/AuthContext';
import { invokeFunctionDirect } from '@/lib/directInvoke';
import { dataAdapter } from '@/lib/adapters';
import { toast } from '@/components/ui/use-toast';
import FavoriteButton from '@/components/FavoriteButton';
import PriceHistoryButton from '@/components/PriceHistoryButton';

function fmtPrice(price, currency) {
  if (!price && price !== 0) return '—';
  const num = typeof price === 'number' ? price : parseFloat(String(price).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return String(price);
  return num.toLocaleString('en-US') + (currency ? ' ' + currency : '');
}

function faviconFor(url) {
  if (!url) return '';
  try {
    const d = new URL(url).hostname.replace(/^www\./, '');
    return `https://www.google.com/s2/favicons?domain=${d}&sz=64`;
  } catch { return ''; }
}

export function productKey(p) {
  return p.url || `${p.name || ''}|${p.seller || ''}`;
}

function ProductImage({ product, size = 'sm' }) {
  const [errored, setErrored] = useState(false);
  const img = product.image || faviconFor(product.url);
  const sizeClass = size === 'sm' ? 'w-10 h-10' : 'w-12 h-12';
  if (!img || errored) {
    return (
      <div className={`${sizeClass} rounded-lg bg-accent flex items-center justify-center shrink-0`}>
        <ImageOff size={14} className="text-muted-foreground/50" />
      </div>
    );
  }
  return (
    <img
      src={img}
      alt={product.name || ''}
      className={`${sizeClass} rounded-lg object-cover shrink-0 bg-accent border border-border/50`}
      onError={() => setErrored(true)}
      loading="lazy"
    />
  );
}

function StockBadge({ product }) {
  const { t } = useI18n();
  const inStock = product.in_stock === true || product.in_stock === 'true';
  const outOfStock = product.in_stock === false || product.in_stock === 'false';
  if (inStock) return <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium"><Check size={9} /> {t('gs_in_stock')}</span>;
  if (outOfStock) return <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium"><X size={9} /> {t('gs_out_of_stock')}</span>;
  return null;
}

function TrackPriceButton({ product }) {
  const { t } = useI18n();
  const [tracking, setTracking] = useState(false);
  const [tracked, setTracked] = useState(false);

  const handleTrack = async () => {
    setTracking(true);
    try {
      const remindAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await dataAdapter.create('PriceReminder', {
        product_name: product.name || '',
        price: String(product.price || ''),
        currency: product.currency || '',
        seller: product.seller || '',
        url: product.url || '',
        remind_at: remindAt,
        status: 'pending',
      });
      // Save price history and detect price drop
      let priceDropped = false;
      if (product.url) {
        try {
          const prev = await dataAdapter.filter('PriceHistory', { product_url: product.url }, '-created_date', 1);
          await dataAdapter.create('PriceHistory', {
            product_url: product.url,
            product_name: product.name || '',
            price: String(product.price || ''),
            currency: product.currency || '',
            seller: product.seller || '',
          });
          if (prev.length) {
            const prevPrice = parseFloat(String(prev[0].price || '').replace(/[^0-9.]/g, ''));
            const curPrice = parseFloat(String(product.price || '').replace(/[^0-9.]/g, ''));
            if (!isNaN(prevPrice) && !isNaN(curPrice) && curPrice < prevPrice) priceDropped = true;
          }
        } catch {}
      }
      setTracked(true);
      toast({ title: priceDropped ? t('gs_price_dropped') + '!' : t('gs_price_tracked') });
    } catch { toast({ title: t('error_occurred') }); }
    setTracking(false);
  };

  if (tracked) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium">
        <Bell size={11} /> {t('gs_tracking')}
      </span>
    );
  }

  return (
    <button
      onClick={handleTrack}
      disabled={tracking || !product.url}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent text-xs font-medium hover:bg-accent/70 transition-colors disabled:opacity-40"
    >
      {tracking ? <Loader2 size={11} className="animate-spin" /> : <Bell size={11} />}
      {t('gs_track_price')}
    </button>
  );
}

function SaveTaskButton({ product }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const notes = [
        `${t('gs_price_col')}: ${fmtPrice(product.price, product.currency)}`,
        `${t('gs_store_col')}: ${product.seller || '—'}`,
        product.url ? `URL: ${product.url}` : '',
      ].filter(Boolean).join('\n');
      const res = await invokeFunctionDirect('googleTasksCreate', { user_id: user?.id || '', title: product.name || 'Product', notes });
      const data = res?.data || res;
      if (data.error === 'not_connected') {
        toast({ title: t('gs_google_connect_in_settings') });
      } else if (data.error) {
        toast({ title: t('gs_task_connect_failed') });
      } else {
        setDone(true);
        toast({ title: t('gs_task_saved') });
      }
    } catch { toast({ title: t('gs_task_connect_failed') }); }
    setLoading(false);
  };

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium">
        <Check size={11} /> {t('gs_task_saved')}
      </span>
    );
  }

  return (
    <button
      onClick={handleSave}
      disabled={loading}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent text-xs font-medium hover:bg-accent/70 transition-colors disabled:opacity-40"
    >
      {loading ? <Loader2 size={11} className="animate-spin" /> : <ListTodo size={11} />}
      {t('gs_save_task')}
    </button>
  );
}

function CalendarReminderButton({ product }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [dateValue, setDateValue] = useState('');

  // Default: tomorrow at 09:00 local time
  const defaultDate = () => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    d.setHours(9, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleCalendar = async () => {
    if (!dateValue) return;
    setLoading(true);
    try {
      const [datePart, timePart] = dateValue.split('T');
      const res = await invokeFunctionDirect('googleCalendarCreate', {
        user_id: user?.id || '',
        title: `یادآوری: ${product.name || ''}`.slice(0, 60),
        description: `یادآوری خرید: ${product.name || ''}\nقیمت: ${fmtPrice(product.price, product.currency)}\nفروشگاه: ${product.seller || ''}\nلینک: ${product.url || ''}`,
        date: datePart,
        time: timePart || '09:00',
      });
      const data = res?.data || res;
      if (data.error === 'not_connected') {
        toast({ title: t('gs_google_connect_in_settings') });
      } else if (data.error) {
        toast({ title: t('error_occurred') });
      } else {
        setDone(true);
        setShowPicker(false);
        toast({ title: t('gs_calendar_added') });
      }
    } catch { toast({ title: t('error_occurred') }); }
    setLoading(false);
  };

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium">
        <Check size={11} /> {t('gs_calendar_added')}
      </span>
    );
  }

  return (
    <div className="contents">
      <button
        onClick={() => { setShowPicker(v => !v); if (!dateValue) setDateValue(defaultDate()); }}
        disabled={loading}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent text-xs font-medium hover:bg-accent/70 transition-colors disabled:opacity-40"
      >
        {loading ? <Loader2 size={11} className="animate-spin" /> : <CalendarPlus size={11} />}
        {t('gs_calendar_reminder')}
      </button>
      {showPicker && (
        <div className="w-full mt-1.5 p-2 rounded-xl bg-accent/40 border border-border flex flex-wrap items-center gap-1.5">
          <input
            type="datetime-local"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            className="flex-1 min-w-[140px] h-8 px-2 rounded-lg bg-card border border-border text-xs outline-none"
          />
          <button
            onClick={handleCalendar}
            disabled={loading || !dateValue}
            className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40"
          >
            {loading ? <Loader2 size={12} className="animate-spin mx-auto" /> : t('gs_reminder_confirm')}
          </button>
          <button
            onClick={() => setShowPicker(false)}
            className="h-8 px-2 rounded-lg bg-accent text-xs text-muted-foreground"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

function SourceButton({ product }) {
  const { t } = useI18n();
  if (!product.url) return <span className="text-xs text-muted-foreground/50">—</span>;
  return (
    <a
      href={product.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
    >
      {t('gs_view_product')} <ExternalLink size={11} />
    </a>
  );
}

function CompareCheckbox({ checked, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
        checked ? 'bg-primary border-primary' : 'border-border hover:border-primary/50'
      }`}
    >
      {checked && <Check size={12} className="text-primary-foreground" />}
    </button>
  );
}

export default function ProductTable({ products, sort, selected, onToggleSelect }) {
  const { t } = useI18n();
  if (!products || products.length === 0) return null;

  const selectedSet = selected || new Set();

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
        {/* Header */}
        <div className="grid [grid-template-columns:28px_44px_1fr_120px_100px_80px_240px] gap-2 px-3 py-2 border-b border-border bg-accent/30 text-xs font-medium text-muted-foreground">
            <div></div>
            <div></div>
            <div>{t('gs_product')}</div>
            <div>{t('gs_price_col')}</div>
            <div>{t('gs_store_col')}</div>
            <div className="text-center">{t('gs_status_col')}</div>
            <div>{t('gs_actions')}</div>
          </div>

          {products.map((p, i) => {
            const rank = sort === 'relevance' ? (p.rank || i + 1) : i + 1;
            const isCheapest = rank === 1;
            const key = productKey(p);
            const isChecked = selectedSet.has(key);
            return (
              <div key={i} className={`border-b border-border/50 last:border-0 ${isCheapest ? 'bg-amber-500/5' : ''}`}>
                <div className="grid [grid-template-columns:28px_44px_1fr_120px_100px_80px_240px] gap-2 px-3 py-2.5 items-center">
                  <div className="flex items-center">
                    <CompareCheckbox checked={isChecked} onClick={() => onToggleSelect?.(key)} />
                  </div>
                  <div className="flex items-center gap-1">
                    {isCheapest ? <Medal size={14} className="text-amber-500" /> : <span className="text-xs text-muted-foreground tabular-nums w-4 text-center">{rank}</span>}
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <ProductImage product={p} />
                    <div className="min-w-0">
                      <p className="font-medium text-sm line-clamp-1">{p.name || t('gs_no_name')}</p>
                      {p.specs && <p className="text-xs text-muted-foreground line-clamp-1">{p.specs}</p>}
                    </div>
                  </div>
                  <div className={`font-bold tabular-nums text-sm whitespace-nowrap ${isCheapest ? 'text-amber-600' : ''}`}>{fmtPrice(p.price, p.currency)}</div>
                  <div className="text-xs truncate">{p.seller || '—'}</div>
                  <div className="flex justify-center"><StockBadge product={p} /></div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <FavoriteButton product={p} />
                    <SourceButton product={p} />
                    <TrackPriceButton product={p} />
                    <SaveTaskButton product={p} />
                    <PriceHistoryButton product={p} />
                    <CalendarReminderButton product={p} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}