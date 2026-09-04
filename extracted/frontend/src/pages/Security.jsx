import React from 'react';
import { useI18n } from '@/i18n/I18nContext';
import PageHeader from '@/components/PageHeader';

export default function Security() {
  const { t } = useI18n();
  return (
    <div className="min-h-dvh">
      <PageHeader title={t('security')} />
      <div className="max-w-2xl mx-auto px-4 py-4">
        <p className="text-sm leading-7 text-muted-foreground">{t('security_desc')}</p>
      </div>
    </div>
  );
}