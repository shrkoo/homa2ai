import React from 'react';
import { FileText, Check, Languages, PenLine, HelpCircle } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const SHORTCUTS = [
  { key: 'shortcut_summarize', icon: FileText, prefix: { fa: 'این متن را خلاصه کن:\n\n', en: 'Summarize this text:\n\n', ku: 'ئەم دەقە کورت بکەرەوە:\n\n' } },
  { key: 'shortcut_correct', icon: Check, prefix: { fa: 'این متن را از نظر املایی و نگارشی اصلاح کن:\n\n', en: 'Correct spelling and grammar of this text:\n\n', ku: 'ئەم دەقە چاک بکە:\n\n' } },
  { key: 'shortcut_translate', icon: Languages, prefix: { fa: 'این متن را ترجمه کن:\n\n', en: 'Translate this text:\n\n', ku: 'ئەم دەقە وەربگێڕە:\n\n' } },
  { key: 'shortcut_rewrite', icon: PenLine, prefix: { fa: 'این متن را روان‌تر و خواناتر بازنویسی کن:\n\n', en: 'Rewrite this text more fluently:\n\n', ku: 'ئەم دەقە باشتر بنووسەوە:\n\n' } },
  { key: 'shortcut_explain', icon: HelpCircle, prefix: { fa: 'این متن را ساده و قابل‌فهم توضیح بده:\n\n', en: 'Explain this text simply:\n\n', ku: 'ئەم دەقە سادە ڕوونی بکەرەوە:\n\n' } }
];

export default function QuickShortcuts({ input, setInput, textareaRef }) {
  const { t, language } = useI18n();
  const lang = language || 'fa';

  const apply = (sc) => {
    const prefix = sc.prefix[lang] || sc.prefix.fa;
    if (input.trim()) {
      setInput(prefix + input.trim());
    } else {
      setInput(prefix);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      {SHORTCUTS.map((sc) => (
        <button
          key={sc.key}
          onClick={() => apply(sc)}
          className="flex items-center gap-1 px-2.5 h-7 rounded-full bg-background border border-border text-xs font-medium whitespace-nowrap text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors shrink-0"
        >
          <sc.icon size={12} />
          {t(sc.key)}
        </button>
      ))}
    </div>
  );
}