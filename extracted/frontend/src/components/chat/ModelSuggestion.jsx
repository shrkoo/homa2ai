import React, { useMemo } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const MODEL_RULES = [
  {
    id: 'lightning',
    patterns: [/کد|کۆد|code|coding|program|function|تابع|پایتون|python|javascript|ری‌اکت|react|html|css|sql|debug|باگ|bug|الگوریتم|algorithm/i],
    labelKey: 'model_suggestion_coding',
  },
  {
    id: 'ultra',
    patterns: [/استدلال\s*عمیق|تفکر\s*عمیق|تحلیل\s*عمیق|deep\s+think|complex|پیچیده|سخت|difficult|حل\s*مسئله|proof|اثبات|ریاضی|math|فلسفه|philosophy/i],
    labelKey: 'model_suggestion_reasoning',
  },
  {
    id: 'ultra',
    patterns: [/پژوهش|تحقیق|research|گزارش\s*جامع|comprehensive|لێکۆڵینەوە/i],
    labelKey: 'model_suggestion_research',
  },
  {
    id: 'nano',
    patterns: [/تصویر|وێنە|image|photo|عکس|analyze\s+image|تحلیل\s*تصویر|شیکاری\s*وێنە|vision|بینایی/i],
    labelKey: 'model_suggestion_vision',
  },
  {
    id: 'lightning',
    patterns: [/سریع|fast|quick|فوری|زود|خلیج|short|کوتاه|بەلەم/i],
    labelKey: 'model_suggestion_fast',
  },
  {
    id: 'minimax',
    patterns: [/متن\s*طولانی|long\s+text|کتاب|book|نمایشنامه|script|رمان|novel|مقاله\s*بلند|long\s+article|۱۰۰۰\s*کلمه|1000\s+words/i],
    labelKey: 'model_suggestion_longtext',
  },
];

export default function ModelSuggestion({ input, model, onApply, onDismiss }) {
  const { t } = useI18n();

  const suggestion = useMemo(() => {
    if (!input || input.trim().length < 8) return null;
    if (model !== 'auto') return null; // Only suggest when on auto
    for (const rule of MODEL_RULES) {
      if (rule.patterns.some((p) => p.test(input))) {
        return { modelId: rule.id, labelKey: rule.labelKey };
      }
    }
    return null;
  }, [input, model]);

  if (!suggestion) return null;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400">
      <Lightbulb size={11} className="shrink-0" />
      <span className="font-medium">{t(suggestion.labelKey)}</span>
      <button
        onClick={() => onApply(suggestion.modelId)}
        className="font-bold underline hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
      >
        {t('model_suggestion_apply')}
      </button>
      <button onClick={onDismiss} className="shrink-0 hover:text-amber-800 dark:hover:text-amber-300 transition-colors">
        <X size={10} />
      </button>
    </div>
  );
}