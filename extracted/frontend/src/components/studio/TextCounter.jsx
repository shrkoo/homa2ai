import React, { useMemo, useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';

export default function TextCounter() {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const stats = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const minutes = words / 200;
    return { words, chars: text.length, charsNoSpace: text.replace(/\s/g, '').length, minutes };
  }, [text]);
  return (
    <div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t('studio_enter_text')} rows={5} className="w-full resize-none rounded-2xl border border-border bg-card p-3 text-[15px] outline-none focus:border-primary" />
      <div className="grid grid-cols-4 gap-2 mt-3">
        <Stat label={t('studio_words')} value={stats.words} />
        <Stat label={t('studio_chars')} value={stats.chars} />
        <Stat label={t('studio_chars_no_space')} value={stats.charsNoSpace} />
        <Stat label={t('studio_reading_time')} value={stats.minutes < 1 ? `<1 ${t('studio_minutes')}` : `${Math.ceil(stats.minutes)} ${t('studio_minutes')}`} />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-accent/60 p-2.5 text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}