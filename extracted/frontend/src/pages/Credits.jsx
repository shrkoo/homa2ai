import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, History, TrendingDown, TrendingUp } from 'lucide-react';
import { dataAdapter, billingAdapter } from '@/lib/adapters';
import { useI18n } from '@/i18n/I18nContext';
import PageHeader from '@/components/PageHeader';

export default function Credits() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [usage, setUsage] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const uRes = await billingAdapter.refreshUsage();
        setUsage(uRes?.data || uRes);
        try { setOrders(await dataAdapter.filter('Order', {}, '-created_date', 50)); } catch {}
      } catch {}
      setLoading(false);
    })();
  }, []);

  const subStatusKey = { active: 'subscription_active', none: 'subscription_none', expired: 'subscription_expired' }[usage?.subscription_status || 'none'];
  const lastPaid = orders.find((o) => o.status === 'paid' || o.status === 'verified');

  return (
    <div className="min-h-dvh">
      <PageHeader title={t('credits')} />
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-card p-4">
              <p className="text-xs text-muted-foreground">{t('credits_balance')}</p>
              <p className="text-3xl font-extrabold mt-1">{usage?.credits ?? 0} <span className="text-sm font-medium text-muted-foreground">{t('credits_label')}</span></p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span>{t('credits_plan')}: <span className="font-semibold text-foreground">{usage?.plan || 'free'}</span></span>
                <span>·</span>
                <span>{t('subscription_status')}: <span className="font-semibold text-foreground">{t(subStatusKey)}</span></span>
              </div>
              {usage?.subscription_end && usage.subscription_status === 'active' && (
                <p className="text-[11px] text-muted-foreground mt-1">{t('subscription_end')}: {new Date(usage.subscription_end).toLocaleDateString('fa-IR')}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-card p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><TrendingUp size={13} /> {t('credits_received')}</div>
                <p className="text-xl font-bold mt-1">{usage?.total_received ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><TrendingDown size={13} /> {t('credits_consumed')}</div>
                <p className="text-xl font-bold mt-1">{usage?.total_consumed ?? 0}</p>
              </div>
            </div>

            <button onClick={() => navigate('/pricing')} className="w-full h-11 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
              <Sparkles size={18} /> {t('credits_buy')}
            </button>

            {lastPaid && (
              <div className="rounded-2xl border border-border bg-card p-3 text-sm">
                <p className="text-xs text-muted-foreground mb-1">{t('credits_last_purchase')}</p>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{lastPaid.plan} · {(lastPaid.amount || 0).toLocaleString('fa-IR')} {t('toman')}</span>
                  <span className="text-[11px] text-muted-foreground">{new Date(lastPaid.created_date).toLocaleDateString('fa-IR')}</span>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5"><History size={13} /> {t('credits_purchase_history')}</p>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('credits_no_purchases')}</p>
              ) : (
                <div className="space-y-2">
                  {orders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{o.plan} · {(o.amount || 0).toLocaleString('fa-IR')} {t('toman')}</p>
                        <p className="text-[11px] text-muted-foreground">{new Date(o.created_date).toLocaleDateString('fa-IR')}</p>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${o.status === 'paid' || o.status === 'verified' ? 'bg-primary/15 text-primary' : o.status === 'failed' ? 'bg-destructive/15 text-destructive' : 'bg-accent'}`}>{o.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}