import React, { useMemo } from 'react';
import { Sparkles, ArrowRight, Globe, FileText, Languages, Code2, Microscope, PenLine } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

function generateFollowUps(content, language) {
  const followUps = [];
  const lower = content.toLowerCase();

  const isFa = language === 'fa';
  const isKu = language === 'ku';

  const txt = (fa, en, ku) => (isFa ? fa : isKu ? ku : en);

  // Always offer "explain more"
  followUps.push({
    icon: FileText,
    label: txt('بیشتر توضیح بده', 'Explain more', 'زیاتر ڕوونی بکەرەوە'),
    prompt: txt('می‌تونی بیشتر توضیح بدی؟', 'Can you explain more?', 'دەتوانیت زیاتر ڕوونی بکەیتەوە؟'),
  });

  // Code-related
  if (lower.includes('code') || lower.includes('کد') || lower.includes('کۆد') || lower.includes('function') || lower.includes('تابع')) {
    followUps.push({
      icon: Code2,
      label: txt('کدش را بنویس', 'Write the code', 'کۆدەکە بنووسە'),
      prompt: txt('کد این را برایم بنویس', 'Write the code for this', 'کۆدی ئەمە بۆ من بنووسە'),
    });
  }

  // If it's a long response, offer summarize
  if (content.length > 500) {
    followUps.push({
      icon: FileText,
      label: txt('خلاصه کن', 'Summarize', 'کورتەی بکەرەوە'),
      prompt: txt('این را به‌صورت خلاصه بیان کن', 'Summarize this briefly', 'ئەمە بە کورتی ڕوونی بکەرەوە'),
    });
  }

  // Translate
  followUps.push({
    icon: Languages,
    label: txt('ترجمه کن', 'Translate', 'وەربگێڕە'),
    prompt: txt('این را به انگلیسی ترجمه کن', 'Translate this to Persian', 'ئەمە بۆ فارسی وەربگێڕە'),
  });

  // Web search
  followUps.push({
    icon: Globe,
    label: txt('در وب بگرد', 'Search web', 'لە وێب بگەڕێ'),
    prompt: txt('در مورد این در وب جستجو کن', 'Search the web about this', 'دەربارەی ئەمە لە وێب بگەڕێ'),
  });

  // Deep research
  if (content.length > 200) {
    followUps.push({
      icon: Microscope,
      label: txt('پژوهش عمیق', 'Deep research', 'لێکۆڵینەوەی قووڵ'),
      prompt: txt('پژوهش عمیق درباره این موضوع انجام بده', 'Do deep research on this topic', 'لێکۆڵینەوەی قووڵ دەربارەی ئەم بابەتە بکە'),
    });
  }

  // Continue/rewrite
  followUps.push({
    icon: PenLine,
    label: txt('بازنویس کن', 'Rewrite', 'دووبارە بنووسەوە'),
    prompt: txt('این را بهتر و روان‌تر بازنویس کن', 'Rewrite this better and more fluently', 'ئەمە باشتر بنووسەوە'),
  });

  return followUps.slice(0, 5);
}

export default function FollowUpSuggestions({ msg, onPick, isLast }) {
  const { language } = useI18n();
  const followUps = useMemo(() => generateFollowUps(msg.content, language), [msg.content, language]);

  if (!isLast || followUps.length === 0) return null;

  return (
    <div className="flex items-start gap-1.5 mt-2 flex-wrap">
      <div className="flex items-center gap-1 me-0.5 mt-0.5">
        <Sparkles size={11} className="text-primary" />
      </div>
      {followUps.map((fu, i) => (
        <button
          key={i}
          onClick={() => onPick(fu.prompt)}
          className="flex items-center gap-1 px-2.5 h-7 rounded-full bg-accent/60 hover:bg-primary/10 hover:text-primary text-xs font-medium text-muted-foreground transition-colors border border-transparent hover:border-primary/20"
        >
          <fu.icon size={11} className="shrink-0" />
          <span>{fu.label}</span>
        </button>
      ))}
    </div>
  );
}