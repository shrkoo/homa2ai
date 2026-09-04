import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';

export default function ErrorPage() {
  const { t } = useI18n();
  const p = new URLSearchParams(window.location.search);
  const code = p.get('code') || '500';
  const msg = p.get('msg');
  const titles = { '403': 'دسترسی غیرمجاز', '404': 'صفحه پیدا نشد', '500': 'خطای سرور', 'credits': 'اعتبار کافی نیست' };
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center text-center px-6">
      <p className="font-heading text-5xl font-extrabold text-primary">{code}</p>
      <h1 className="font-heading text-xl font-bold mt-3">{titles[code] || t('error_occurred')}</h1>
      {msg && <p className="text-sm text-muted-foreground mt-2 max-w-sm">{msg}</p>}
      <Link to="/" className="mt-5 px-5 h-10 rounded-full bg-primary text-primary-foreground text-sm font-medium inline-flex items-center">هُما</Link>
    </div>
  );
}