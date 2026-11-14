import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Minus } from 'lucide-react';
import { dataAdapter, adminAdapter } from '@/lib/adapters';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import PageHeader from '@/components/PageHeader';
import { toast } from '@/components/ui/use-toast';

const PLAN_IDS = ['free', 'start', 'plus', 'pro', 'special'];

export default function Admin() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [tab, setTab] = useState('summary');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [creditInput, setCreditInput] = useState({});

  const load = async (section) => {
    setLoading(true);
    try {
      if (section === 'plans') {
        const plans = await dataAdapter.filter('Plan', { active: { $ne: 2 } }, 'id', 50);
        setData({ plans });
        setLoading(false);
        return;
      }
      const res = await adminAdapter.getDashboard({ section });
      setData(res?.data || res);
    } catch (e) { setData(null); }
    setLoading(false);
  };
  useEffect(() => { load(tab); }, [tab]);

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-dvh">
        <PageHeader title={t('admin_dashboard')} />
        <div className="p-8 text-center text-muted-foreground text-sm">{t('admin_only_desc')}</div>
      </div>
    );
  }

  const savePlan = async (plan, field, value) => {
    setBusy(plan.id + field);
    try {
      const numFields = ['price', 'credits', 'web_search_per_day', 'deep_research_per_day'];
      await dataAdapter.update('Plan', plan.id, { [field]: numFields.includes(field) ? Number(value) : value });
      toast({ title: t('changes_saved') });
    } catch (e) { toast({ title: t('error_occurred') }); }
    setBusy(null);
  };

  const togglePlanActive = async (plan) => {
    setBusy(plan.id + 'active');
    try {
      await dataAdapter.update('Plan', plan.id, { active: !plan.active });
      toast({ title: t('changes_saved') });
      load(tab);
    } catch (e) { toast({ title: t('error_occurred') }); }
    setBusy(null);
  };

  const manageUser = async (u, action, value) => {
    setBusy(u.id + action);
    try {
      await adminAdapter.manageUser({ userId: u.id, action, value });
      toast({ title: t('changes_saved') });
      load(tab);
    } catch (e) { toast({ title: t('error_occurred') }); }
    setBusy(null);
  };

  const saveCost = async (c, value) => {
    setBusy(c.id + 'cost');
    try {
      await dataAdapter.update('FeatureCost', c.id, { cost: Number(value) });
      toast({ title: t('changes_saved') });
    } catch (e) { toast({ title: t('error_occurred') }); }
    setBusy(null);
  };

  const tabs = [
    { id: 'summary', label: t('admin_summary') },
    { id: 'plans', label: t('admin_plans') },
    { id: 'orders', label: t('admin_orders') },
    { id: 'users', label: t('admin_users') },
    { id: 'usage', label: t('admin_usage') },
    { id: 'requests', label: t('admin_requests') },
    { id: 'referral', label: t('admin_referral') }
  ];

  return (
    <div className="min-h-dvh">
      <PageHeader title={t('admin_dashboard')} />
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex gap-1.5 mb-4 overflow-x-auto">
          {tabs.map((tb) => (
            <button key={tb.id} onClick={() => setTab(tb.id)} className={`px-3.5 h-8 rounded-full text-xs font-semibold whitespace-nowrap ${tab === tb.id ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}>{tb.label}</button>
          ))}
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {tab === 'summary' && data && (
              <div className="grid grid-cols-2 gap-3">
                <Stat label={t('admin_users')} value={data.users ?? 0} />
                <Stat label={t('admin_successful_orders')} value={data.paid_orders ?? 0} />
                <Stat label={t('admin_tickets')} value={data.open_tickets ?? 0} />
                <Stat label={t('admin_consumed')} value={data.total_credits ?? 0} />
                <Stat label={t('admin_revenue')} value={`${(data.total_revenue ?? 0).toLocaleString('fa-IR')} ${t('toman')}`} />
              </div>
            )}

            {tab === 'plans' && data && (
              <div className="space-y-3">
                {(data.plans || []).map((p) => (
                  <div key={p.id} className="rounded-xl border border-border bg-card p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{p.name || p.id}</p>
                      <button onClick={() => togglePlanActive(p)} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${p.active ? 'bg-primary/15 text-primary' : 'bg-accent text-muted-foreground'}`}>
                        {p.active ? t('admin_plan_active') : t('admin_plan_inactive')}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <Field label={`${t('admin_price')} (${t('toman')})`} def={p.price ?? p.price_toman} onSave={(v) => savePlan(p, 'price', v)} busy={busy === p.id + 'price'} />
                      <Field label={t('admin_credits')} def={p.credits} onSave={(v) => savePlan(p, 'credits', v)} busy={busy === p.id + 'credits'} />

                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'orders' && data && (
              <div className="space-y-2">
                {(data.orders || []).map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                    <div><p className="font-semibold">{o.plan} · {(o.amount || 0).toLocaleString('fa-IR')} {t('toman')}</p><p className="text-[11px] text-muted-foreground">{o.user_id || ''} · {o.created_at ? new Date(o.created_at).toLocaleDateString('fa-IR') : ''}</p></div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${o.status === 'paid' || o.status === 'verified' ? 'bg-primary/15 text-primary' : o.status === 'failed' ? 'bg-destructive/15 text-destructive' : 'bg-accent'}`}>{o.status}</span>
                  </div>
                ))}
                {(!data.orders || !data.orders.length) && <p className="text-sm text-muted-foreground text-center py-6">—</p>}
              </div>
            )}

            {tab === 'users' && data && (
              <div className="space-y-2">
                {(data.users || []).map((u) => (
                  <div key={u.id} className="rounded-xl border border-border bg-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{u.full_name || u.name || u.email}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                      </div>
                      <span className="text-sm font-bold">{u.credits ?? 0} {t('credits_label')}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                      <span>{t('credits_plan')}: <span className="font-semibold text-foreground">{u.plan || 'free'}</span></span>
                      <span>·</span>
                      <span>{t('subscription_status')}: <span className="font-semibold text-foreground">{t({ active: 'subscription_active', none: 'subscription_none', expired: 'subscription_expired' }[u.subscription_status] || 'subscription_none')}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <input type="number" value={creditInput[u.id] || ''} onChange={(e) => setCreditInput((p) => ({ ...p, [u.id]: e.target.value }))} placeholder="0" className="w-16 h-8 px-2 rounded-lg bg-background border border-border text-xs" />
                      <button onClick={() => manageUser(u, 'add_credits', Number(creditInput[u.id] || 0))} disabled={busy === u.id + 'add_credits'} className="h-8 px-2 rounded-lg bg-primary/15 text-primary text-xs font-semibold flex items-center gap-1"><Plus size={13} /> {t('admin_add_credits')}</button>
                      <button onClick={() => manageUser(u, 'remove_credits', Number(creditInput[u.id] || 0))} disabled={busy === u.id + 'remove_credits'} className="h-8 px-2 rounded-lg bg-accent text-xs font-semibold flex items-center gap-1"><Minus size={13} /> {t('admin_remove_credits')}</button>
                      <select value={u.plan || 'free'} onChange={(e) => manageUser(u, 'set_plan', e.target.value)} disabled={busy === u.id + 'set_plan'} className="h-8 px-2 rounded-lg bg-background border border-border text-xs">
                        {PLAN_IDS.map((pid) => <option key={pid} value={pid}>{pid}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
                {(!data.users || !data.users.length) && <p className="text-sm text-muted-foreground text-center py-6">—</p>}
              </div>
            )}

            {tab === 'costs' && data && (
              <div className="space-y-2">
                {(data.costs || []).map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                    <span className="font-medium">{c.feature}</span>
                    <Field label={t('admin_credits')} def={c.cost} onSave={(v) => saveCost(c, v)} busy={busy === c.id + 'cost'} compact />
                  </div>
                ))}
                {(!data.costs || !data.costs.length) && <p className="text-sm text-muted-foreground text-center py-6">—</p>}
              </div>
            )}

            {tab === 'usage' && data && (
              <div className="space-y-2">
                {(data.transactions || []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                    <div><p className="font-semibold">{item.type || item.reason || 'تراکنش'}</p><p className="text-[11px] text-muted-foreground">{item.user_id} · {item.created_at ? new Date(item.created_at).toLocaleString('fa-IR') : ''}</p></div>
                    <span className="text-xs font-semibold">{item.amount > 0 ? '+' : ''}{item.amount ?? 0}</span>
                  </div>
                ))}
                {(!data.transactions || !data.transactions.length) && <p className="text-sm text-muted-foreground text-center py-6">—</p>}
              </div>
            )}

            {tab === 'requests' && data && (
              <div className="space-y-2">
                {(data.requests || []).map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{r.endpoint}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{r.created_date}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-medium">{r.credits_used || 0} {t('credits_label')}</span>
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${r.status === 'success' ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'}`}>{r.status}</span>
                    </div>
                  </div>
                ))}
                {(!data.requests || !data.requests.length) && <p className="text-sm text-muted-foreground text-center py-6">—</p>}
              </div>
            )}

            {tab === 'referral' && data && (
              <div className="space-y-2">
                <div className="rounded-xl border border-border bg-card p-3 mb-2">
                  <p className="text-xs text-muted-foreground">{t('admin_referral_total')}</p>
                  <p className="text-xl font-bold mt-1">{data.referral?.total || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">نرخ تبدیل: {data.referral?.conversion_rate || 0}%</p>
                </div>
                {(data.referral?.sources || []).map((s) => (
                  <div key={s.key} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                    <span className="font-medium">{s.label}</span>
                    <span className="font-bold">{s.count}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}

function Field({ label, def, onSave, busy, compact }) {
  return (
    <label className="flex flex-col gap-1">
      {!compact && <span className="text-muted-foreground">{label}</span>}
      <input type="number" defaultValue={def} onBlur={(e) => e.target.value !== String(def) && onSave(e.target.value)} className="h-8 px-2 rounded-lg bg-background border border-border text-xs" />
    </label>
  );
}