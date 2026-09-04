import React, { useState } from 'react';
import { ChevronDown, Sparkles, Check } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

export const MODELS = [
  { id: 'smart', labelKey: 'model_smart', model: 'openai/gpt-oss-120b' },
  { id: 'gpt120', label: 'GPT-OSS 120B', model: 'openai/gpt-oss-120b' },
  { id: 'gpt20', label: 'GPT-OSS 20B', model: 'openai/gpt-oss-20b' }
];

export default function ModelPicker({ model, onChange }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const current = MODELS.find((m) => m.model === model) || MODELS[0];
  const label = current.labelKey ? t(current.labelKey) : current.label;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 h-8 rounded-full bg-accent text-xs font-medium hover:bg-accent/70 transition-colors"
      >
        <Sparkles size={13} className="text-primary" /> {label} <ChevronDown size={13} className="text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute end-0 mt-1 z-40 w-52 rounded-xl border border-border bg-popover shadow-lg p-1.5">
            <p className="px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground">{t('model_manual')}</p>
            {MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => { onChange(m.model); setOpen(false); }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-accent text-sm text-start"
              >
                <span className="flex-1">{m.labelKey ? t(m.labelKey) : m.label}</span>
                {m.model === model && <Check size={15} className="text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}