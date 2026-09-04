import React, { useEffect, useState } from 'react';
import { Sparkles, Plus, Trash2 } from 'lucide-react';
import { dataAdapter } from '@/lib/adapters';
import { useI18n } from '@/i18n/I18nContext';

// Built-in ready-made prompts (Persian-first). User-saved templates are loaded
// from the PromptTemplate entity and shown alongside them.
const BUILTIN = [
  { title: 'خلاصه متن', body: 'متن زیر را به‌صورت خلاصه و ساختاریافته خلاصه کن:\n\n' },
  { title: 'ترجمه به انگلیسی', body: 'متن زیر را به انگلیسی روان ترجمه کن:\n\n' },
  { title: 'ایمیل حرفه‌ای', body: 'یک ایمیل حرفه‌ای برای موضوع زیر بنویس:\n\n' },
  { title: 'کمک برنامه‌نویسی', body: 'کد زیر را بررسی کن و باگ‌هایش را رفع کن:\n\n' },
  { title: 'ایده محتوا', body: 'برای موضوع زیر ۱۰ ایده محتوای اینستاگرامی پیشنهاد بده:\n\n' },
  { title: 'تحلیل وب‌سایت', body: 'وب‌سایت زیر را تحلیل کن:\n\n' }
];

export default function TemplatesPicker({ onPick }) {
  const { t } = useI18n();
  const [mine, setMine] = useState([]);

  const load = async () => {
    try { setMine(await dataAdapter.list('PromptTemplate','-updated_date', 50)); } catch {}
  };
  useEffect(() => { load(); }, []);

  const del = async (id) => {
    setMine((p) => p.filter((x) => x.id !== id));
    try { await dataAdapter.delete('PromptTemplate', id); } catch {}
  };

  return (
    <div className="w-full max-w-sm">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
        <Sparkles size={12} className="text-primary" /> {t('templates_title')}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {BUILTIN.map((tpl) => (
          <button
            key={tpl.title}
            onClick={() => onPick(tpl.body)}
            className="shrink-0 flex items-center gap-1.5 px-3 h-9 rounded-full border border-border bg-card text-xs font-medium hover:border-primary hover:text-primary transition-colors"
          >
            <Plus size={12} /> {tpl.title}
          </button>
        ))}
        {mine.map((tpl) => (
          <div key={tpl.id} className="shrink-0 flex items-center gap-1 px-3 h-9 rounded-full border border-primary/30 bg-primary/5 text-xs font-medium">
            <button onClick={() => onPick(tpl.body)} className="text-primary">{tpl.title}</button>
            <button onClick={() => del(tpl.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={11} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}