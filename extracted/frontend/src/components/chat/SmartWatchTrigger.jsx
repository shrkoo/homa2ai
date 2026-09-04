import React from 'react';
import { Bell, ExternalLink } from 'lucide-react';

// Persisted trigger-result card, shown when a smart watch condition is met.
// Rendered from a ```smart-watch-trigger block in MessageItem.
export default function SmartWatchTrigger({ data }) {
  if (!data) return null;
  const { watch, result } = data;
  const oldP = result?.oldPrice;
  const newP = result?.currentPrice;
  const url = watch?.product_url || result?.product?.url || '';

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3.5">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <Bell size={17} />
        </div>
        <p className="text-sm font-bold">🔔 هشدار هوشمند هُما</p>
      </div>
      <p className="text-sm mb-2">قیمت محصولی که زیر نظر داشتی کاهش پیدا کرد / شرط برقرار شد. ✅</p>
      {oldP > 0 && (
        <div className="text-xs space-y-0.5 mb-2">
          <p className="text-muted-foreground">قیمت قبلی: <span className="font-semibold text-foreground">{oldP.toLocaleString('fa-IR')} تومان</span></p>
          <p className="text-muted-foreground">قیمت جدید: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{newP.toLocaleString('fa-IR')} تومان</span></p>
        </div>
      )}
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary active:scale-95 transition-transform">
          <ExternalLink size={13} /> مشاهده محصول
        </a>
      )}
    </div>
  );
}