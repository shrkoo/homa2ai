import React from 'react';
import { Zap, Crown, Gauge, Scale } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { usePref } from '@/hooks/usePref';

const TEXTS = {
  fa: {
    title: 'ترجیح ابزار',
    desc: 'هنگام انتخاب خودکار ابزار، اولویت را مشخص کنید',
    cheapest: 'ارزان‌ترین',
    quality: 'بهترین کیفیت',
    fastest: 'سریع‌ترین',
    balanced: 'متعادل',
    cheapest_desc: 'ارزان‌ترین Provider مناسب',
    quality_desc: 'بالاترین کیفیت خروجی',
    fastest_desc: 'سریع‌ترین پردازش',
    balanced_desc: 'بهترین نسبت کیفیت به هزینه',
  },
  en: {
    title: 'Tool Preference',
    desc: 'Set priority for automatic tool selection',
    cheapest: 'Cheapest',
    quality: 'Best Quality',
    fastest: 'Fastest',
    balanced: 'Balanced',
    cheapest_desc: 'Most affordable suitable provider',
    quality_desc: 'Highest output quality',
    fastest_desc: 'Fastest processing',
    balanced_desc: 'Best quality-to-cost ratio',
  },
  ku: {
    title: 'پەسەندی ئامراز',
    desc: 'پێشینایی بۆ هەڵبژاردنی خۆکاری ئامراز دیاری بکە',
    cheapest: 'هەرزانترین',
    quality: 'باشترین کوالیتی',
    fastest: 'خێراترین',
    balanced: 'هاوسەنگ',
    cheapest_desc: 'هەرزانترین Provider گونجاو',
    quality_desc: 'بەرزترین کوالیتی دەرئەنجام',
    fastest_desc: 'خێراترین پرۆسێس',
    balanced_desc: 'باشترین ڕێژەی کوالیتی بۆ تێچوون',
  },
};

const OPTIONS = [
  { key: 'balanced', icon: Scale },
  { key: 'cheapest', icon: Zap },
  { key: 'quality', icon: Crown },
  { key: 'fastest', icon: Gauge },
];

export default function ToolPreferenceSection() {
  const { language } = useI18n();
  const [pref, setPref] = usePref('homa_tool_preference', 'balanced');
  const T = TEXTS[language] || TEXTS.fa;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold">{T.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{T.desc}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = pref === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => setPref(opt.key)}
              className={`flex flex-col items-start gap-1 p-3 rounded-2xl border text-start transition-colors ${
                active
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-card hover:bg-accent/50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Icon size={14} />
                <span className="text-xs font-medium">{T[opt.key]}</span>
              </div>
              <span className="text-[10px] text-muted-foreground leading-relaxed">{T[opt.key + '_desc']}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}