import React from 'react';
import { MessageSquare, Video, Image as ImageIcon, Music } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const CHIPS = [
  { id: 'chat', icon: MessageSquare, action: 'mode', mode: null },
  { id: 'video', icon: Video, action: 'prefix', prefix: { fa: 'ساخت ویدیو: ', en: 'Create video: ', ku: 'دروستکردنی ڤیدیۆ: ' } },
  { id: 'image', icon: ImageIcon, action: 'prefix', prefix: { fa: 'ساخت تصویر: ', en: 'Create image: ', ku: 'دروستکردنی وێنە: ' } },
  { id: 'music', icon: Music, action: 'prefix', prefix: { fa: 'ساخت آهنگ: ', en: 'Create music: ', ku: 'دروستکردنی مۆسیقا: ' } },
];

export default function ChatModeChips({ input, setInput, textareaRef, mode, onSetMode }) {
  const { language } = useI18n();
  const lang = language || 'fa';

  const handleChip = (chip) => {
    if (chip.action === 'mode') {
      onSetMode(chip.mode);
    } else if (chip.action === 'prefix') {
      onSetMode(null);
      const prefix = chip.prefix[lang] || chip.prefix.fa;
      if (input.trim() && !input.startsWith(prefix)) {
        setInput(prefix + input.trim());
      } else if (!input.trim()) {
        setInput(prefix);
        setTimeout(() => textareaRef.current?.focus(), 50);
      }
    }
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      {CHIPS.map((chip) => {
        const active = chip.action === 'mode' && chip.mode === mode;
        return (
          <button
            key={chip.id}
            onClick={() => handleChip(chip)}
            className={`flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
              active
                ? 'bg-chatButton text-chatButton-foreground'
                : 'bg-background border border-chatBorder text-muted-foreground hover:text-foreground hover:border-chatBorder'
            }`}
          >
            <chip.icon size={15} />
          </button>
        );
      })}
    </div>
  );
}