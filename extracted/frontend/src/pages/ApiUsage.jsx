import React, { useEffect, useState } from 'react';
import { dataAdapter } from '@/lib/adapters';
import { BarChart3 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import DevNav from '@/components/DevNav';
import { useI18n } from '@/i18n/I18nContext';

export default function ApiUsage() {
  const { t } = useI18n();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await dataAdapter.list('ApiUsage','-created_date', 100);
        setRows(list || []);
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('api_usage')} />
      <DevNav />
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        ) : rows.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <BarChart3 className="mx-auto mb-2 opacity-40" size={28} />
            <p className="text-sm">{t('no_usage')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.endpoint}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_date).toLocaleString()}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {r.credits_used} {t('credits_label')}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${r.status === 'success' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-destructive/15 text-destructive'}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}