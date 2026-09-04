import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const REASONS = ['feedback_issue', 'feedback_suggestion', 'feedback_inappropriate', 'feedback_other'];

export default function FeedbackModal({ open, onClose, onSubmit }) {
  const { t } = useI18n();
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [openSelect, setOpenSelect] = useState(false);
  if (!open) return null;
  const submit = () => { onSubmit(reason, details); setDetails(''); setReason(REASONS[0]); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-card border border-border p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-base font-bold">{t('share_feedback')}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent transition-colors text-muted-foreground"><X size={18} /></button>
        </div>
        <div className="space-y-3.5">
          <div className="relative">
            <button
              onClick={() => setOpenSelect((v) => !v)}
              className="w-full h-12 px-4 flex items-center justify-between rounded-2xl border border-border bg-background text-sm transition-colors hover:border-primary/50"
            >
              <span className="font-medium">{t(reason)}</span>
              <ChevronDown size={16} className={`text-muted-foreground transition-transform ${openSelect ? 'rotate-180' : ''}`} />
            </button>
            {openSelect && (
              <div className="absolute top-full mt-1 left-0 right-0 z-10 rounded-2xl border border-border bg-popover shadow-xl overflow-hidden">
                {REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => { setReason(r); setOpenSelect(false); }}
                    className={`w-full px-4 h-11 flex items-center text-sm text-start transition-colors hover:bg-accent ${r === reason ? 'text-primary font-medium' : ''}`}
                  >
                    {t(r)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={t('feedback_details_placeholder')}
            rows={4}
            className="w-full p-3.5 rounded-2xl border border-border bg-background text-sm resize-none outline-none transition-colors focus:border-primary/50 leading-6"
          />
          <p className="text-[11px] text-muted-foreground leading-5">{t('feedback_note')}</p>
          <button
            onClick={submit}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            {t('send')}
          </button>
        </div>
      </div>
    </div>
  );
}