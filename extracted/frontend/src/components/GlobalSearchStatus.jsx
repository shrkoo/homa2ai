import React from 'react';
import { Loader2, AlertCircle, CheckCircle2, Search, Globe, ShoppingBag, Smartphone, FileSearch, DollarSign, Brain, BookOpen, RefreshCw, ImageIcon } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const STAGES = [
  { key: 'starting', icon: Search, labelKey: 'gs_status_starting' },
  { key: 'searching_web', icon: Globe, labelKey: 'gs_status_searching_web' },
  { key: 'checking_stores', icon: ShoppingBag, labelKey: 'gs_status_checking_stores' },
  { key: 'checking_social', icon: Smartphone, labelKey: 'gs_status_checking_social' },
  { key: 'verifying_sources', icon: FileSearch, labelKey: 'gs_status_verifying_sources' },
  { key: 'comparing_prices', icon: DollarSign, labelKey: 'gs_status_comparing_prices' },
  { key: 'fetching_images', icon: ImageIcon, labelKey: 'gs_status_fetching_images' },
  { key: 'analyzing', icon: Brain, labelKey: 'gs_status_analyzing' },
  { key: 'preparing_sources', icon: BookOpen, labelKey: 'gs_status_preparing_sources' },
];

export default function GlobalSearchStatus({ status, onRetry }) {
  const { t } = useI18n();
  const currentStatus = status?.status || 'starting';
  const progress = Math.min(100, Math.max(0, status?.progress || 0));
  const isError = currentStatus === 'error';
  const isComplete = currentStatus === 'completed' || currentStatus === 'limited';

  const currentIndex = STAGES.findIndex((s) => s.key === currentStatus);

  return (
    <div className="w-full rounded-2xl border border-border bg-card overflow-hidden">
      {/* Progress bar */}
      {!isError && (
        <div className="h-1 bg-accent">
          <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <AlertCircle size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-destructive">{t('gs_status_error')}</p>
              <p className="text-xs text-muted-foreground mt-1">{status?.message || t('error_occurred')}</p>
              {onRetry && (
                <button onClick={onRetry} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium active:scale-95 transition-transform">
                  <RefreshCw size={12} /> {t('gs_retry')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active / complete state */}
      {!isError && (
        <div className="p-4 space-y-3">
          {/* Current stage highlight */}
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${isComplete ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
              {isComplete ? <CheckCircle2 size={18} /> : <Loader2 size={18} className="animate-spin" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                {isComplete ? t('gs_status_completed') : t(STAGES[Math.max(0, currentIndex)]?.labelKey || 'gs_status_starting')}
              </p>
              {status?.message && !isComplete && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{status.message}</p>
              )}
              {isComplete && status?.limited && (
                <p className="text-xs text-amber-500 mt-0.5">{t('gs_limited_note')}</p>
              )}
            </div>
            {!isComplete && (
              <span className="text-xs font-mono text-muted-foreground tabular-nums">{progress}%</span>
            )}
          </div>

          {/* Stage list */}
          <div className="space-y-1.5 pt-1">
            {STAGES.map((stage, i) => {
              const done = isComplete || i < currentIndex;
              const current = !isComplete && i === currentIndex;
              const Icon = stage.icon;
              return (
                <div key={stage.key} className={`flex items-center gap-2.5 transition-opacity ${i > currentIndex && !isComplete ? 'opacity-40' : 'opacity-100'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${done ? 'bg-emerald-500/15 text-emerald-500' : current ? 'bg-primary/15 text-primary' : 'bg-accent text-muted-foreground'}`}>
                    {done ? <CheckCircle2 size={11} /> : current ? <Loader2 size={11} className="animate-spin" /> : <Icon size={10} />}
                  </div>
                  <span className={`text-xs ${current ? 'font-semibold text-foreground' : done ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                    {t(stage.labelKey)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}