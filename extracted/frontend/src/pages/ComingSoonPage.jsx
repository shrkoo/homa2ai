import React from 'react';
import { Sparkles } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import PageHeader from '@/components/PageHeader';

export default function ComingSoonPage({ titleKey }) {
  const { t } = useI18n();
  const title = titleKey ? t(titleKey) : t('coming_soon');
  return (
    <div className="min-h-dvh">
      <PageHeader title={title} />
      <div className="flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <Sparkles size={28} />
        </div>
        <h2 className="font-heading text-xl font-bold">{t('coming_soon')}</h2>
        <p className="text-sm text-muted-foreground mt-1.5">{t('coming_soon_desc')}</p>
      </div>
    </div>
  );
}