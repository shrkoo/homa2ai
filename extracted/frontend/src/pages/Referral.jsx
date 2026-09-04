import React, { useEffect, useState } from 'react';
import { Gift, Copy, Share2, Users, Check } from 'lucide-react';
import { referralAdapter } from '@/lib/adapters';
import { useI18n } from '@/i18n/I18nContext';
import PageHeader from '@/components/PageHeader';
import { toast } from '@/components/ui/use-toast';

export default function Referral() {
  const { t } = useI18n();
  const [data, setData] = useState(null);

  const load = async () => {
    try { const res = await referralAdapter.getStatus(); setData(res?.data || res); } catch {}
  };
  useEffect(() => { load(); }, []);

  const link = data?.link ? (window.location.origin + data.link) : '';
  const copy = () => { navigator.clipboard?.writeText(link); toast({ title: t('link_copied') }); };
  const share = () => {
    if (navigator.share) navigator.share({ title: 'Homa AI', text: t('referral_share_text'), url: link }).catch(() => {});
    else { navigator.clipboard?.writeText(link); toast({ title: t('link_copied') }); }
  };

  return (
    <div className="min-h-dvh">
      <PageHeader title={t('referral_title')} />
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/15 text-primary flex items-center justify-center mx-auto mb-3"><Gift size={26} /></div>
          <h2 className="font-heading text-lg font-bold">{t('referral_title')}</h2>
          <p className="text-sm text-muted-foreground leading-7 mt-2">{t('referral_desc')}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">{t('referral_link_label')}</p>
          <div className="flex gap-2">
            <input value={link} readOnly className="flex-1 h-11 px-3 rounded-xl bg-accent text-xs outline-none truncate" />
            <button onClick={copy} className="w-11 h-11 shrink-0 rounded-xl bg-accent flex items-center justify-center"><Copy size={17} /></button>
            <button onClick={share} className="w-11 h-11 shrink-0 rounded-xl bg-primary text-primary-foreground flex items-center justify-center"><Share2 size={17} /></button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-border bg-card p-3 text-center"><Users size={18} className="mx-auto text-muted-foreground mb-1" /><p className="text-xl font-bold">{data?.invited ?? 0}</p><p className="text-[11px] text-muted-foreground">{t('referral_invited')}</p></div>
          <div className="rounded-2xl border border-border bg-card p-3 text-center"><Check size={18} className="mx-auto text-primary mb-1" /><p className="text-xl font-bold">{data?.rewarded ?? 0}</p><p className="text-[11px] text-muted-foreground">{t('referral_successful')}</p></div>
          <div className="rounded-2xl border border-border bg-card p-3 text-center"><Gift size={18} className="mx-auto text-primary mb-1" /><p className="text-xl font-bold">{data?.credits ?? 0}</p><p className="text-[11px] text-muted-foreground">{t('referral_credits')}</p></div>
        </div>
      </div>
    </div>
  );
}