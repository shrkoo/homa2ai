import React from 'react';
import { useI18n } from '@/i18n/I18nContext';
import PageHeader from '@/components/PageHeader';
import SocialLinks from '@/components/SocialLinks';

export default function About() {
  const { t } = useI18n();
  return (
    <div className="min-h-dvh">
      <PageHeader title={t('about')} />
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 text-2xl font-extrabold">ه</div>
          <h1 className="font-heading text-2xl font-extrabold">هُما AI</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('tagline')}</p>
        </div>
        <p className="text-sm leading-7 text-muted-foreground">{t('about_homa_desc')}</p>
        <div className="rounded-2xl border border-border bg-card p-4 text-sm space-y-1">
          <p className="font-medium">{t('creator_name')}</p>
          <p className="text-muted-foreground">{t('version')} ۲۰۲۶</p>
        </div>
        <SocialLinks />
      </div>
    </div>
  );
}