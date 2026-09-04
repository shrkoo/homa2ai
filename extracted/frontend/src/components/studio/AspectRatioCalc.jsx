import React, { useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

export default function AspectRatioCalc() {
  const { t } = useI18n();
  const [w, setW] = useState('1920');
  const [h, setH] = useState('1080');
  const wi = parseInt(w) || 0, hi = parseInt(h) || 0;
  let ratio = '—';
  if (wi > 0 && hi > 0) { const g = gcd(wi, hi); ratio = `${wi / g}:${hi / g}`; }
  const common = ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'];
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">{t('studio_width')}
          <input type="number" value={w} onChange={(e) => setW(e.target.value)} className="h-11 px-3 rounded-2xl border border-border bg-card text-[15px] outline-none focus:border-primary" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">{t('studio_height')}
          <input type="number" value={h} onChange={(e) => setH(e.target.value)} className="h-11 px-3 rounded-2xl border border-border bg-card text-[15px] outline-none focus:border-primary" />
        </label>
      </div>
      <div className="mt-3 rounded-2xl bg-accent/60 p-3 text-center">
        <p className="text-2xl font-bold">{ratio}</p>
        {common.includes(ratio) && <p className="text-xs text-primary mt-1">{t('studio_common_ratio')}</p>}
      </div>
    </div>
  );
}