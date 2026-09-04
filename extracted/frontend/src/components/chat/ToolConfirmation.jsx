import React from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const TEXTS = {
  fa: { title: 'تأیید هزینه', desc: 'این عملیات تقریباً هزینه خواهد داشت', continue: 'ادامه', cancel: 'لغو', credits: 'اعتبار' },
  en: { title: 'Cost Confirmation', desc: 'This operation will cost approximately', continue: 'Continue', cancel: 'Cancel', credits: 'credits' },
  ku: { title: 'پشتڕاستکردنەوەی تێچوون', desc: 'ئەم کارە نزیکەی تێچووی دەبێت', continue: 'بەردەوامبە', cancel: 'هەڵوەشاندنەوە', credits: 'بڕ' },
};

export default function ToolConfirmation({ cost, providerName, onConfirm, onCancel }) {
  const { language } = useI18n();
  const T = TEXTS[language] || TEXTS.fa;

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3.5">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
          <AlertTriangle size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{T.title}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {T.desc}: <span className="font-bold text-amber-600">{cost} {T.credits}</span>
            {providerName && <span className="text-muted-foreground/60"> • {providerName}</span>}
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={onConfirm}
          className="flex-1 h-9 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
        >
          <Check size={14} /> {T.continue}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 h-9 rounded-full bg-accent text-foreground text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-accent/70 transition-colors"
        >
          <X size={14} /> {T.cancel}
        </button>
      </div>
    </div>
  );
}