import React, { useState, useEffect } from 'react';
import { Heart, ExternalLink, Trash2, Store, Loader2, ImageOff, ArrowLeft } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { dataAdapter } from '@/lib/adapters';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

function fmtPrice(price, currency) {
  if (!price && price !== 0) return '—';
  const num = typeof price === 'number' ? price : parseFloat(String(price).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return String(price);
  return num.toLocaleString('en-US') + (currency ? ' ' + currency : '');
}

function faviconFor(url) {
  if (!url) return '';
  try {
    const d = new URL(url).hostname.replace(/^www./, '');
    return `https://www.google.com/s2/favicons?domain=${d}&sz=64`;
  } catch { return ''; }
}

export default function Favorites() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setItems(await dataAdapter.list('Favorite','-created_date', 100)); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    try {
      await dataAdapter.delete('Favorite', id);
      setItems(prev => prev.filter(i => i.id !== id));
      toast({ title: t('gs_favorite_removed') });
    } catch { toast({ title: t('error_occurred') }); }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full hover:bg-accent flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-bold text-lg flex items-center gap-2">
            <Heart size={18} className="text-rose-500" fill="currentColor" />
            {t('gs_favorites_title')}
          </h1>
          <span className="text-sm text-muted-foreground">({items.length})</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Heart size={40} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t('gs_no_favorites')}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[560px]">
                <div className="grid [grid-template-columns:48px_1fr_110px_100px_90px_40px] gap-2 px-3 py-2 border-b border-border bg-accent/30 text-xs font-medium text-muted-foreground">
                  <div></div>
                  <div>{t('gs_product')}</div>
                  <div>{t('gs_price_col')}</div>
                  <div>{t('gs_store_col')}</div>
                  <div className="text-center">{t('gs_source_col')}</div>
                  <div></div>
                </div>
                {items.map((item) => {
                  const img = item.image || faviconFor(item.url);
                  return (
                    <div key={item.id} className="grid [grid-template-columns:48px_1fr_110px_100px_90px_40px] gap-2 px-3 py-2.5 items-center border-b border-border/50 last:border-0">
                      <div className="w-10 h-10 rounded-lg bg-accent overflow-hidden flex items-center justify-center shrink-0">
                        {img ? (
                          <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : <ImageOff size={14} className="text-muted-foreground/50" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{item.product_name || '—'}</p>
                      </div>
                      <div className="font-bold tabular-nums text-sm whitespace-nowrap">{fmtPrice(item.price, item.currency)}</div>
                      <div className="text-xs truncate flex items-center gap-1">
                        {item.seller ? <><Store size={10} className="text-muted-foreground shrink-0" /> {item.seller}</> : '—'}
                      </div>
                      <div className="flex justify-center">
                        {item.url ? (
                          <a href={item.url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1 text-xs font-medium">
                            {t('gs_view_col')} <ExternalLink size={10} />
                          </a>
                        ) : '—'}
                      </div>
                      <div className="flex justify-center">
                        <button onClick={() => handleDelete(item.id)} className="w-7 h-7 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}