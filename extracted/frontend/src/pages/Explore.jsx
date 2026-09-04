import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Microscope, Instagram, FileText, MessageSquare, Languages, FileSearch, Code, PenLine, Wand2, Facebook, Music2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import PageHeader from '@/components/PageHeader';

const TOOLS = [
  { icon: Wand2, titleKey: 'prompt_editor', descKey: 'prompt_editor_desc', path: '/prompt-editor' },
  { icon: MessageSquare, titleKey: 'feature_chat', descKey: 'feature_chat_desc', path: '/chat/new' },
  { icon: Globe, titleKey: 'web_search', descKey: 'menu_web_search', path: '/web-search' },
  { icon: Microscope, titleKey: 'deep_research', descKey: 'menu_deep_research', path: '/deep-research' },
  { icon: Instagram, titleKey: 'instagram_analyzer', descKey: 'instagram_analyzer', path: '/instagram-analyzer' },
  { icon: Music2, titleKey: 'tiktok_analyzer', descKey: 'tiktok_analyzer', path: '/tiktok-analyzer' },
  { icon: Facebook, titleKey: 'facebook_analyzer', descKey: 'facebook_analyzer', path: '/facebook-analyzer' },
  { icon: Globe, titleKey: 'website_analyzer', descKey: 'website_analyzer', path: '/website-analyzer' },
  { icon: FileText, titleKey: 'file_analysis', descKey: 'menu_upload', path: '/files' },
  { icon: Languages, titleKey: 'tool_translate', descKey: 'tool_translate_desc', path: '/chat/new' },
  { icon: PenLine, titleKey: 'tool_rewrite', descKey: 'tool_rewrite_desc', path: '/chat/new' },
  { icon: Code, titleKey: 'tool_code', descKey: 'tool_code_desc', path: '/chat/new' },
  { icon: FileSearch, titleKey: 'tool_summarize', descKey: 'tool_summarize_desc', path: '/chat/new' }
];

export default function Explore() {
  const { t } = useI18n();
  const navigate = useNavigate();
  return (
    <div className="min-h-dvh">
      <PageHeader title={t('explore')} />
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          {TOOLS.map((tool, i) => (
            <button key={i} onClick={() => navigate(tool.path)} className="text-start p-3.5 rounded-2xl border border-border bg-card hover:bg-accent/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2.5"><tool.icon size={19} /></div>
              <p className="font-semibold text-sm">{t(tool.titleKey)}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t(tool.descKey)}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}