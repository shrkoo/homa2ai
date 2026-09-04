import React from 'react';
import { Image, Video, Music, Languages, Globe, Brain, ShoppingBag, Code } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { filterSlashCommands } from '@/lib/slashCommands';

const ICONS = { Image, Video, Music, Languages, Globe, Brain, ShoppingBag, Code };

export default function SlashMenu({ query, onSelect }) {
  const { language } = useI18n();
  const lang = language || 'fa';
  const filtered = filterSlashCommands(query);
  if (filtered.length === 0) return null;

  return (
    <>
      <div className="absolute bottom-full mb-2 start-0 z-40 w-72 rounded-2xl border border-border bg-popover shadow-2xl p-1.5 max-h-[50vh] overflow-y-auto">
        <p className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          {lang === 'en' ? 'Quick Commands' : lang === 'ku' ? 'فەرمانە خێراکان' : 'دستورات سریع'}
        </p>
        {filtered.map((c) => {
          const Icon = ICONS[c.icon] || Globe;
          return (
            <button
              key={c.cmd}
              onClick={() => onSelect(c)}
              className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-accent text-sm text-start transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{c.cmd}</p>
                <p className="text-xs text-muted-foreground truncate">{c.label[lang] || c.label.fa}</p>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}