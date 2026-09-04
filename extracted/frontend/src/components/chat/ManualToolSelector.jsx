import React, { useState, useEffect } from 'react';
import { Settings2, Check, ChevronDown } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { getProvidersByCapability } from '@/lib/providerRegistry';

const TEXTS = {
  fa: { auto: 'خودکار', select: 'انتخاب ابزار', manual: 'دستی' },
  en: { auto: 'Auto', select: 'Select tool', manual: 'Manual' },
  ku: { auto: 'خۆکار', select: 'ئامراز هەڵبژێرە', manual: 'دەستی' },
};

export default function ManualToolSelector({ capabilityId, selectedProvider, onSelect, connectedToolIds = new Set() }) {
  const { language } = useI18n();
  const [open, setOpen] = useState(false);
  const T = TEXTS[language] || TEXTS.fa;

  const providers = getProvidersByCapability(capabilityId);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [open]);

  if (!providers.length) return null;

  const available = providers.filter(p => p.type === 'internal' || connectedToolIds.has(p.id));

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-accent text-xs font-medium hover:bg-accent/70 transition-colors"
      >
        <Settings2 size={12} />
        {selectedProvider ? selectedProvider.name : T.auto}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute bottom-full mb-1 start-0 z-40 w-56 rounded-2xl border border-border bg-popover shadow-2xl p-1.5 max-h-60 overflow-y-auto">
          <button
            onClick={() => { onSelect(null); setOpen(false); }}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-accent text-xs text-start transition-colors ${!selectedProvider ? 'bg-primary/10 text-primary font-medium' : ''}`}
          >
            <span className="flex-1">{T.auto}</span>
            {!selectedProvider && <Check size={13} />}
          </button>
          <div className="h-px bg-border my-1" />
          {available.map((p) => (
            <button
              key={p.id}
              onClick={() => { onSelect(p); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-accent text-xs text-start transition-colors ${selectedProvider?.id === p.id ? 'bg-primary/10 text-primary font-medium' : ''}`}
            >
              <span className="flex-1 truncate">{p.name}</span>
              {p.type === 'external' && !connectedToolIds.has(p.id) && (
                <span className="text-[9px] text-muted-foreground/50">—</span>
              )}
              {selectedProvider?.id === p.id && <Check size={13} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}