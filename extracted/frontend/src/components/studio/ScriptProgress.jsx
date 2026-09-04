import React, { useMemo, useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';

export default function ScriptProgress() {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [target, setTarget] = useState('1000');
  const words = useMemo(() => { const tr = text.trim(); return tr ? tr.split(/\s+/).length : 0; }, [text]);
  const tgt = parseInt(target) || 1;
  const pct = Math.min(100, Math.round((words / tgt) * 100));
  return (
    <div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t('studio_enter_text')} rows={4} className="w-full resize-none rounded-2xl border border-border bg-card p-3 text-[15px] outline-none focus:border-primary" />
      <label className="flex flex-col gap-1 text-xs text-muted-foreground mt-3">{t('studio_target_words')}
        <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} className="h-11 px-3 rounded-2xl border border-border bg-card text-[15px] outline-none focus:border-primary" />
      </label>
      <div className="mt-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5"><span>{t('studio_current_words')}: {words}</span><span>{pct}%</span></div>
        <div className="h-2.5 rounded-full bg-accent overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
      </div>
    </div>
  );
}