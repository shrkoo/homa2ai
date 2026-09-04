import React from 'react';
import { Instagram, Youtube, Send } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const LINKS = [
  { icon: Instagram, url: 'https://www.instagram.com/homaai2026', label: 'Instagram' },
  { icon: Youtube, url: 'https://www.youtube.com/@homaai2026', label: 'YouTube' },
  { icon: Send, url: 'https://t.me/HomaAI_AssistantBot', label: 'Telegram' }
];

export default function SocialLinks() {
  const { t } = useI18n();
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-semibold text-muted-foreground mb-2">{t('official_links')}</p>
      <div className="flex gap-2">
        {LINKS.map((l) => (
          <a key={l.url} href={l.url} target="_blank" rel="noreferrer" title={l.label} className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"><l.icon size={18} /></a>
        ))}
      </div>
    </div>
  );
}