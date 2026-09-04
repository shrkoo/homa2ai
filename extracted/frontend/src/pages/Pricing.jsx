import React, { useEffect, useState } from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { dataAdapter, billingAdapter } from '@/lib/adapters';
import { useI18n } from '@/i18n/I18nContext';
import PageHeader from '@/components/PageHeader';
import { toast } from '@/components/ui/use-toast';

export default function Pricing() {
  const { t, language } = useI18n();
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState({});

  useEffect(() => {
    dataAdapter.list('Plan','sort').then(setPlans).catch(() => {});
    billingAdapter.refreshUsage().then((r) => setUsage(r?.data || r)).catch(() => {});
    const pay = searchParams.get('pay');
    if (pay === 'ok') toast({ title: t('payment_success') });
    else if (pay === 'failed') toast({ title: t('payment_failed') });
    else if (pay === 'dup') toast({ title: t('payment_duplicate') });
  }, []);

  const buy = async (planId) => {
    setLoading((p) => ({ ...p, [planId]: true }));
    try {
      const res = await billingAdapter.createPayment({ plan: planId });
      const data = res?.data || res;
      if (data.error) {
        toast({ title: data.error === 'no_merchant' ? t('err_payment_config') : t('payment_failed') });
      } else if (data.gatewayUrl) {
        window.location.href = data.gatewayUrl;
      }
    } catch (e) {
      toast({ title: t('payment_failed') });
    }
    setLoading((p) => ({ ...p, [planId]: false }));
  };

  const nameOf = (p) => (language === 'en' ? p.name_en : language === 'ku' ? p.name_ku : p.name_fa) || p.id;
  const fmtPrice = (n) => n.toLocaleString('fa-IR');

  return (
    <div className="min-h-dvh">
      <PageHeader title={t('pricing')} />
      <div className="max-w-3xl mx-auto px-4 py-4">
        {usage && (
          <div className="flex items-center justify-between rounded-2xl bg-card border border-border p-3 mb-4">
            <span className="text-sm text-muted-foreground">{t('current_plan')}</span>
            <span className="font-semibold text-sm">{usage.plan} · {t('credits_label')}: {usage.credits ?? 0}</span>
          </div>
        )}
        <div className="grid grid-cols-1 gap-3">
          {plans.filter((p) => p.active).map((p) => (
            <div key={p.id} className={`rounded-2xl border p-4 ${p.id === 'premium' ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-heading font-bold text-lg">{nameOf(p)}</p>
                  <p className="text-2xl font-bold mt-1">{p.price_toman === 0 ? t('plan_free') : fmtPrice(p.price_toman) + ' ' + t('toman')}</p>
                  {p.price_toman > 0 && <p className="text-xs text-muted-foreground">{t('per_month')}</p>}
                </div>
                {p.price_toman > 0 && (
                  <button onClick={() => buy(p.id)} disabled={loading[p.id]} className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 shrink-0">
                    {loading[p.id] ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} {t('upgrade_now')}
                  </button>
                )}
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-1.5">
                <li className="text-xs text-muted-foreground flex items-start gap-1.5"><Check size={13} className="text-primary mt-0.5 shrink-0" /> {t('web_search')}: {p.web_search_per_day}/day</li>
                {p.deep_research && <li className="text-xs text-muted-foreground flex items-start gap-1.5"><Check size={13} className="text-primary mt-0.5 shrink-0" /> {t('deep_research')}: {p.deep_research_per_day}/day</li>}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}