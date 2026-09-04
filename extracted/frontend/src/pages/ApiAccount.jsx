import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/PageHeader';
import DevNav from '@/components/DevNav';
import { useI18n } from '@/i18n/I18nContext';

const API_BASE = 'https://homa-ai-core.shahramalidazeh620.workers.dev';

export default function ApiAccount() {
  const { t } = useI18n();
  const { user } = useAuth();
  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('api_account')} />
      <DevNav />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="rounded-xl border border-border p-4 space-y-2">
          <p className="text-sm font-medium">{user?.full_name || t('profile')}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <div className="rounded-xl border border-border p-4 space-y-2">
          <p className="text-xs text-muted-foreground">{t('api_base_url')}</p>
          <code className="block text-xs break-all bg-accent/60 rounded-lg p-2">{API_BASE}</code>
        </div>
      </div>
    </div>
  );
}