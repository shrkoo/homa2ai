import React from 'react';
import { CheckCircle2, AlertCircle, Loader2, Link2, Unlink } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useGoogleConnection } from '@/hooks/useGoogleConnection';
import { ExpandableRow } from '@/components/settings/List';

export default function GoogleConnectionSection() {
  const { t } = useI18n();
  const { connected, loading, connect, disconnect } = useGoogleConnection();

  return (
    <ExpandableRow icon={Link2} label={t('gs_google_connect')} value={loading ? '…' : connected ? t('gs_google_connected') : t('gs_google_not_connected')}>
      <p className="text-xs text-muted-foreground mb-3 leading-5">{t('gs_google_connect_desc')}</p>
      {loading ? (
        <div className="flex items-center justify-center py-3"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
      ) : connected ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 text-sm">
            <CheckCircle2 size={16} /> {t('gs_google_connected_msg')}
          </div>
          <button onClick={disconnect} className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-destructive/10 text-destructive text-sm font-medium transition-colors">
            <Unlink size={15} /> {t('gs_google_disconnect')}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <button onClick={connect} className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-colors">
            <Link2 size={15} /> {t('gs_google_connect_btn')}
          </button>
          <p className="text-[11px] text-muted-foreground leading-5 flex items-start gap-1">
            <AlertCircle size={11} className="shrink-0 mt-0.5" /> {t('gs_google_connect_note')}
          </p>
        </div>
      )}
    </ExpandableRow>
  );
}