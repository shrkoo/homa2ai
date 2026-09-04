import React from 'react';
import { Image, Film } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { pe } from './promptEditorStrings';
import { TEMPLATES, CATEGORIES } from './promptTemplates';

export default function PromptTemplatesTab({ onApply }) {
  const { language } = useI18n();
  return (
    <div className="space-y-4">
      {CATEGORIES.map((cat) => {
        const items = TEMPLATES.filter((t) => t.category === cat);
        if (!items.length) return null;
        return (
          <div key={cat}>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">{pe(language, 'cat_' + cat)}</p>
            <div className="space-y-2">
              {items.map((t) => (
                <button key={t.id} onClick={() => onApply(t)} className="w-full text-start p-3 rounded-2xl border border-border bg-card hover:bg-accent/40 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    {t.type === 'image' ? <Image size={14} className="text-primary" /> : <Film size={14} className="text-primary" />}
                    <span className="text-sm font-semibold flex-1">{t.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.sections.subject}</p>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}