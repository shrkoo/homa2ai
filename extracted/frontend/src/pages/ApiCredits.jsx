import React, { useEffect, useState } from 'react';
import { dataAdapter } from '@/lib/adapters';
import { Coins } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import DevNav from '@/components/DevNav';
import { useI18n } from '@/i18n/I18nContext';

export default function ApiCredits() {
  const { t } = useI18n();
  const [balance, setBalance] = useState(null);
  const [used, setUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const credits = await dataAdapter.list('ApiCredit',);
        if (credits && credits.length) setBalance(credits[0].balance);
        const usage = await dataAdapter.list('ApiUsage','-created_date', 200);
        setUsed((usage || []).reduce((s, r) => s + (r.credits_used || 0), 0));
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('api_credits')} />
      <DevNav />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="rounded-2xl border border-border p-6 text-center">
          <Coins className="mx-auto mb-2 text-primary" size={28} />
          <p className="text-xs text-muted-foreground">{t('balance')}</p>
          <p className="text-4xl font-extrabold">{loading ? '…' : (balance === null ? 0 : balance)}</p>
        </div>
        <div className="rounded-xl border border-border p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('total_used')}</span>
          <span className="font-semibold">{used} {t('credits_label')}</span>
        </div>
      </div>
    </div>
  );
}