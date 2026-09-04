import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

export default function DurationCalc() {
  const { t } = useI18n();
  const [scenes, setScenes] = useState([{ d: '' }]);
  const total = scenes.reduce((s, sc) => s + (parseFloat(sc.d) || 0), 0);
  const mm = Math.floor(total / 60);
  const ss = Math.round(total % 60);
  const set = (i, v) => setScenes((p) => p.map((x, idx) => (idx === i ? { d: v } : x)));
  return (
    <div>
      {scenes.map((sc, i) => (
        <div key={i} className="flex items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground w-14 shrink-0">{t('studio_scene')} {i + 1}</span>
          <input type="number" value={sc.d} onChange={(e) => set(i, e.target.value)} placeholder={t('studio_seconds_short')} className="flex-1 h-11 px-3 rounded-2xl border border-border bg-card text-[15px] outline-none focus:border-primary" />
          {scenes.length > 1 && <button onClick={() => setScenes((p) => p.filter((_, idx) => idx !== i))} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent text-muted-foreground"><Trash2 size={16} /></button>}
        </div>
      ))}
      <button onClick={() => setScenes((p) => [...p, { d: '' }])} className="flex items-center gap-1.5 text-sm text-primary font-medium py-1"><Plus size={16} /> {t('studio_add_scene')}</button>
      <div className="mt-3 rounded-2xl bg-accent/60 p-3 text-center">
        <p className="text-xs text-muted-foreground">{t('studio_total')}</p>
        <p className="text-2xl font-bold">{mm}:{String(ss).padStart(2, '0')}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{Math.round(total)} {t('studio_seconds_short')}</p>
      </div>
    </div>
  );
}