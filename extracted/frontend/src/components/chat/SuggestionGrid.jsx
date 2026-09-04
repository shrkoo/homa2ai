import React from 'react';
import {
  PenLine, Globe, Code2, FileText, Link2, Image as ImageIcon,
  Video, Mic, ShoppingBag, Microscope, Share2, Sparkles
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const SUGGESTIONS = [
  { key: 'suggestion_write',   icon: PenLine,      mode: null,        action: null },
  { key: 'suggestion_web',     icon: Globe,        mode: 'web',       action: null },
  { key: 'suggestion_shop',    icon: ShoppingBag,  mode: 'global',    action: null },
  { key: 'suggestion_research', icon: Microscope,  mode: 'research',  action: null },
  { key: 'suggestion_code',    icon: Code2,        mode: null,        action: 'code' },
  { key: 'suggestion_file',    icon: FileText,     mode: null,        action: 'file' },
  { key: 'suggestion_link',    icon: Link2,       mode: null,        action: 'link' },
  { key: 'suggestion_image',   icon: ImageIcon,    mode: null,        action: 'image' },
  { key: 'suggestion_video',   icon: Video,        mode: null,        action: 'video' },
  { key: 'suggestion_voice',   icon: Mic,          mode: null,        action: 'voice' },
  { key: 'suggestion_social',  icon: Share2,       mode: null,        action: 'social' },
];

const PROMPTS = {
  fa: {
    suggestion_write: 'یک متن حرفه‌ای بنویس',
    suggestion_web: 'جدیدترین اخبار امروز را جستجو کن',
    suggestion_shop: 'قیمت گوشی سامسونگ A55 را مقایسه کن',
    suggestion_research: 'پژوهش عمیق درباره تأثیر هوش مصنوعی بر آموزش',
    suggestion_code: 'یک تابع پایتون برای مرتب‌سازی لیست بنویس',
    suggestion_file: 'یک فایل PDF برای تحلیل آپلود کن',
    suggestion_link: 'یک لینک وب‌سایت برای تحلیل بده',
    suggestion_image: 'یک تصویر زیبا از غروب آفتاب بساز',
    suggestion_video: 'یک ویدیوی کوتاه از فضای بی‌کران بساز',
    suggestion_voice: 'متن را به صدا تبدیل کن',
    suggestion_social: 'تحلیل کامل یک پیج اینستاگرام',
  },
  en: {
    suggestion_write: 'Write a professional text',
    suggestion_web: 'Search the latest news today',
    suggestion_shop: 'Compare prices of Samsung A55',
    suggestion_research: 'Deep research on AI in education',
    suggestion_code: 'Write a Python function to sort a list',
    suggestion_file: 'Upload a PDF file for analysis',
    suggestion_link: 'Provide a website link to analyze',
    suggestion_image: 'Generate a beautiful sunset image',
    suggestion_video: 'Create a short video of space',
    suggestion_voice: 'Convert text to speech',
    suggestion_social: 'Full analysis of an Instagram page',
  },
  ku: {
    suggestion_write: 'دەقێکی پیشەیی بنووسە',
    suggestion_web: 'دوایین هەواڵەکانی ئەمڕۆ بگەڕێ',
    suggestion_shop: 'نرخی مۆبایلی سامسۆنگ A55 بەراورد بکە',
    suggestion_research: 'لێکۆڵینەوەی قووڵ دەربارەی AI لە پەروەردە',
    suggestion_code: 'فەنکشنی پایتۆن بۆ ڕیزکردنی لیست بنووسە',
    suggestion_file: 'فایلێکی PDF بۆ شیکار ئەپلۆد بکە',
    suggestion_link: 'بەستەری وێبسایتێک بۆ شیکار بدە',
    suggestion_image: 'وێنەیەکی جوانی ئاوابوونی خۆر دروست بکە',
    suggestion_video: 'ڤیدیۆیەکی کورتی بۆشایی دروست بکە',
    suggestion_voice: 'دەق بگۆڕە بۆ دەنگ',
    suggestion_social: 'شیکاری تەواوی پەڕەیەکی ئینستاگرام',
  },
};

export default function SuggestionGrid({ setInput, setMode }) {
  const { t, language } = useI18n();
  const lang = language || 'fa';

  const handleClick = (s) => {
    const prompt = (PROMPTS[lang] || PROMPTS.fa)[s.key];
    if (s.action === 'file' || s.action === 'link' || s.action === 'image' || s.action === 'video' || s.action === 'voice' || s.action === 'social') {
      // These need navigation or file upload — just set the prompt as a hint
      setInput(prompt);
      setMode(s.mode);
    } else if (s.action === 'code') {
      setInput(prompt);
      setMode(null);
    } else {
      setInput(prompt);
      setMode(s.mode);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <Sparkles size={13} className="text-primary" />
        <span className="text-xs font-semibold text-muted-foreground">{t('suggestion_title')}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => handleClick(s)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all text-start group"
          >
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <s.icon size={15} />
            </div>
            <span className="text-xs font-medium leading-tight">{t(s.key)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}