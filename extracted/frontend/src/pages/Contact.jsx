import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import PageHeader from '@/components/PageHeader';
import SocialLinks from '@/components/SocialLinks';

export default function Contact() {
  const { t } = useI18n();
  return (
    <div className="min-h-dvh">
      <PageHeader title={t('contact')} />
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <p className="text-sm text-muted-foreground">{t('contact_desc')}</p>
        <a href={'mailto:' + t('support_email')} className="block rounded-2xl border border-border bg-card p-4 text-sm font-medium">{t('support_email')}</a>
        <Link to="/support" className="block rounded-2xl bg-primary text-primary-foreground p-4 text-sm font-medium text-center">{t('open_ticket')}</Link>
        <SocialLinks />
      </div>
    </div>
  );
}