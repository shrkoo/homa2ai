import React from 'react';
import { Medal, ExternalLink, Check, X } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

function fmtPrice(price, currency) {
  if (!price) return '—';
  const num = typeof price === 'number' ? price : parseFloat(String(price).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return String(price);
  return num.toLocaleString('en-US') + (currency ? ' ' + currency : '');
}

export default function ComparisonTable({ products }) {
  const { t } = useI18n();
  if (!products || products.length < 2) return null;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-3.5 py-2.5 border-b border-border bg-accent/30">
        <p className="text-xs font-bold">{t('gs_comparison')}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-start font-medium px-3 py-2 whitespace-nowrap">{t('gs_product')}</th>
              <th className="text-start font-medium px-3 py-2 whitespace-nowrap">{t('gs_price_col')}</th>
              <th className="text-start font-medium px-3 py-2 whitespace-nowrap">{t('gs_store_col')}</th>
              <th className="text-start font-medium px-3 py-2 whitespace-nowrap">{t('gs_status_col')}</th>
              <th className="text-start font-medium px-3 py-2 whitespace-nowrap">{t('gs_source_col')}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => {
              const isCheapest = i === 0;
              const inStock = p.in_stock === true || p.in_stock === 'true';
              const outOfStock = p.in_stock === false || p.in_stock === 'false';
              return (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {isCheapest && <Medal size={12} className="text-amber-500 shrink-0" />}
                      <span className="font-medium line-clamp-1">{p.name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-bold tabular-nums">{fmtPrice(p.price, p.currency)}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{p.seller || '—'}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {inStock ? <Check size={12} className="text-emerald-600" /> : outOfStock ? <X size={12} className="text-destructive" /> : '—'}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {p.url ? <a href={p.url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1">{t('gs_view_col')} <ExternalLink size={10} /></a> : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}