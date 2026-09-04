import React, { useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';

export default function TitleChecker() {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const len = title.length;
  const status = len === 0 ? null : len < 30 ? 'short' : len <= 60 ? 'good' : 'long';
  const style = { short: 'bg-amber-500/15 text-amber-600', good: 'bg-primary/15 text-primary', long: 'bg-destructive/15 text-destructive' };
  const label = { short: t('studio_short'), good: t('studio_good'), long: t('studio_long') };
  return (
    <div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('studio_enter_title')} className="w-full h-11 px-4 rounded-2xl border border-border bg-card text-[15px] outline-none focus:border-primary" />
      <div className="flex items-center gap-2 mt-3 text-sm">
        <span className="text-muted-foreground">{t('studio_chars')}: <span className="font-bold text-foreground">{len}</span></span>
        {status && <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style[status]}`}>{label[status]}</span>}
      </div>
      <p className="text-xs text-muted-foreground mt-2">{t('studio_title_hint')}</p>
    </div>
  );
}