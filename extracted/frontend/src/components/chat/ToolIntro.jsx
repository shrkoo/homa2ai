import React from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { MessageSquare, Search, Microscope, Image, Video, FileText, Globe, Instagram, Bell, Eye, ShoppingCart, Calendar, Star, Library, Code, Languages } from 'lucide-react';

const TOOLS = [
  { icon: MessageSquare, title: { fa: 'چت هوشمند', en: 'Smart Chat', ku: 'دەنگی زیرەک' }, desc: { fa: 'گفتگو با هوش مصنوعی', en: 'Chat with AI', ku: 'گفتگو لەگەڵ AI' } },
  { icon: Search, title: { fa: 'جستجوی وب', en: 'Web Search', ku: 'گەڕان' }, desc: { fa: 'جستجو و مقایسه آنلاین', en: 'Search & compare', ku: 'گەڕان و بەراورد' } },
  { icon: Microscope, title: { fa: 'پژوهش عمیق', en: 'Deep Research', ku: 'لێکۆڵینەوە' }, desc: { fa: 'تحقیق جامع و تخصصی', en: 'Deep research', ku: 'لێکۆڵینەوەی قووڵ' } },
  { icon: Image, title: { fa: 'تولید تصویر', en: 'Image Gen', ku: 'وێنە' }, desc: { fa: 'ساخت تصویر با AI', en: 'AI images', ku: 'دروستکردنی وێنە' } },
  { icon: Video, title: { fa: 'تولید ویدیو', en: 'Video Gen', ku: 'ڤیدیۆ' }, desc: { fa: 'ساخت ویدیو با AI', en: 'AI videos', ku: 'دروستکردنی ڤیدیۆ' } },
  { icon: FileText, title: { fa: 'تحلیل فایل', en: 'File Analysis', ku: 'شیکاری فایل' }, desc: { fa: 'آنالیز فایل و سند', en: 'Analyze files', ku: 'شیکاری فایل' } },
  { icon: Globe, title: { fa: 'تحلیل وب‌سایت', en: 'Website Analyzer', ku: 'ماڵپەڕ' }, desc: { fa: 'بررسی وب‌سایت‌ها', en: 'Analyze sites', ku: 'شیکاری ماڵپەڕ' } },
  { icon: Instagram, title: { fa: 'تحلیل سوشال', en: 'Social Analyzer', ku: 'تۆڕ' }, desc: { fa: 'اینستا/تیک‌تاک/فیسبوک', en: 'Social media', ku: 'شیکاری تۆڕ' } },
  { icon: Bell, title: { fa: 'یادآور و آلارم', en: 'Reminders', ku: 'بیرخستنەوە' }, desc: { fa: 'مدیریت زمان', en: 'Time management', ku: 'بەڕێکردنی کات' } },
  { icon: Eye, title: { fa: 'watch هوشمند', en: 'Smart Watch', ku: 'چاودێری' }, desc: { fa: 'ردیابی قیمت', en: 'Track prices', ku: 'چاودێری نرخ' } },
  { icon: ShoppingCart, title: { fa: 'لیست خرید', en: 'Shopping', ku: 'کڕین' }, desc: { fa: 'مدیریت خرید', en: 'Shopping lists', ku: 'لیستی کڕین' } },
  { icon: Calendar, title: { fa: 'تقویم', en: 'Calendar', ku: 'ساڵنامە' }, desc: { fa: 'مدیریت رویدادها', en: 'Events', ku: 'بەڕێکردنی ساڵنامە' } },
  { icon: Languages, title: { fa: 'ترجمه', en: 'Translate', ku: 'وەرگێڕان' }, desc: { fa: 'ترجمه متن', en: 'Translate text', ku: 'وەرگێڕانی دەق' } },
  { icon: Code, title: { fa: 'کدنویسی', en: 'Code', ku: 'کۆد' }, desc: { fa: 'نوشتن و دیباگ کد', en: 'Write & debug', ku: 'نووسینی کۆد' } },
  { icon: Star, title: { fa: 'علاقه‌مندی‌ها', en: 'Favorites', ku: 'دڵخوازەکان' }, desc: { fa: 'ذخیره محصولات', en: 'Save products', ku: 'پاشەکەوتی بەرهەم' } },
  { icon: Library, title: { fa: 'کتابخانه', en: 'Library', ku: 'کتێبخانە' }, desc: { fa: 'ذخیره محتوا', en: 'Save content', ku: 'پاشەکەوتی ناوەڕۆک' } },
];

export default function ToolIntro() {
  const { language } = useI18n();
  const tr = (obj) => obj[language] || obj.fa;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="text-center space-y-1.5">
        <h2 className="font-heading text-xl font-bold">هُما چه کارهایی می‌کند؟</h2>
        <p className="text-muted-foreground text-sm">دستیار هوشمند شما برای هر کاری</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {TOOLS.map((tool, i) => (
          <div key={i} className="flex items-start gap-2.5 p-3 rounded-2xl bg-accent/50 border border-border/50">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <tool.icon size={18} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">{tr(tool.title)}</p>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">{tr(tool.desc)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}