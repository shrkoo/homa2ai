import React from 'react';
import { X, Medal, ExternalLink, Check, Store, ImageOff } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

function fmtPrice(price, currency) {
  if (!price && price !== 0) return '—';
  const num = typeof price === 'number' ? price : parseFloat(String(price || '').replace(/[^0-9.]/g, ''));
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

function ProductImage({ product }) {
  const img = product.image || faviconFor(product.url);
  if (!img) {
    return (
      <div className="w-full h-24 rounded-xl bg-accent flex items-center justify-center">
        <ImageOff size={20} className="text-muted-foreground/40" />
      </div>
    );
  }
  return (
    <img
      src={img}
      alt=""
      className="w-full h-24 rounded-xl object-cover bg-accent border border-border/50"
      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling?.style?.setProperty('display', 'flex'); }}
    />
  );
}

export default function ComparisonDashboard({ products, onClose }) {
  const { t } = useI18n();
  if (!products || products.length < 2) return null;

  const prices = products.map(p => {
    const n = typeof p.price === 'number' ? p.price : parseFloat(String(p.price || '').replace(/[^0-9.]/g, ''));
    return isNaN(n) ? Infinity : n;
  });
  const cheapestIdx = prices.indexOf(Math.min(...prices));

  const rows = [
    { key: 'image', label: '', render: (p) => <ProductImage product={p} /> },
    { key: 'name', label: t('gs_product'), render: (p) => <p className="font-semibold text-sm leading-snug line-clamp-3">{p.name || '—'}</p> },
    { key: 'price', label: t('gs_price_col'), render: (p, isCheap) => <p className={`text-lg font-bold tabular-nums ${isCheap ? 'text-amber-600' : ''}`}>{fmtPrice(p.price, p.currency)}</p> },
    { key: 'seller', label: t('gs_store_col'), render: (p) => <p className="text-sm flex items-center gap-1"><Store size={11} className="text-muted-foreground" /> {p.seller || '—'}</p> },
    { key: 'stock', label: t('gs_status_col'), render: (p) => {
      const inStock = p.in_stock === true || p.in_stock === 'true';
      const outOfStock = p.in_stock === false || p.in_stock === 'false';
      if (inStock) return <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600 font-medium"><Check size={11} /> {t('gs_in_stock')}</span>;
      if (outOfStock) return <span className="text-xs text-destructive font-medium">{t('gs_out_of_stock')}</span>;
      return <span className="text-xs text-muted-foreground">—</span>;
    }},
    { key: 'specs', label: 'Specs', render: (p) => p.specs ? <p className="text-xs text-muted-foreground line-clamp-3">{p.specs}</p> : <span className="text-xs text-muted-foreground">—</span> },
    { key: 'link', label: t('gs_source_col'), render: (p) => p.url ? <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline">{t('gs_view_product')} <ExternalLink size={11} /></a> : <span className="text-xs text-muted-foreground">—</span> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card w-full sm:max-w-3xl sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between z-10">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Medal size={16} className="text-amber-500" />
            {t('gs_comparison_title')}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-accent flex items-center justify-center hover:bg-accent/70">
            <X size={16} />
          </button>
        </div>

        {/* Comparison table — horizontal scroll on mobile */}
        <div className="overflow-x-auto p-4">
          <table className="w-full min-w-[480px] border-collapse">
            <thead>
              <tr>
                <th className="w-24 sticky start-0 bg-card z-10 text-start text-xs font-medium text-muted-foreground px-2 py-2 align-bottom">
                  {t('gs_attribute')}
                </th>
                {products.map((p, i) => {
                  const isCheapest = i === cheapestIdx;
                  return (
                    <th key={i} className={`text-start px-3 py-2 align-bottom min-w-[160px] ${isCheapest ? 'bg-amber-500/5' : ''}`}>
                      {isCheapest && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 text-xs font-bold mb-1">
                          <Medal size={10} /> {t('gs_cheapest_badge')}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={row.key} className={ri % 2 === 0 ? 'bg-accent/20' : ''}>
                  <td className="w-24 sticky start-0 bg-card z-10 text-xs font-medium text-muted-foreground px-2 py-2.5 align-top whitespace-nowrap">
                    {row.label}
                  </td>
                  {products.map((p, i) => {
                    const isCheapest = i === cheapestIdx;
                    return (
                      <td key={i} className={`px-3 py-2.5 align-top ${isCheapest ? 'bg-amber-500/5' : ''}`}>
                        {row.render(p, isCheapest)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}