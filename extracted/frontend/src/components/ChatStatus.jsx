import React from 'react';
import { Loader2, Upload, AlertCircle, Wifi, Brain, Sparkles, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';

const MODEL_LABELS = {
  auto: 'Homa Auto',
  minimax: 'MiniMax M3',
  ultra: 'Nemotron 3 Ultra',
  super: 'Nemotron 3 Super',
  lightning: 'Nemotron 3.5 Lightning',
  nano: 'Nemotron 3 Nano Omni',
  ling: 'Ling 3.0 Flash Fin'
};

export default function ChatStatus({ status, model, error, usage, mode }) {
  const { t } = useI18n();
  const modelLabel = MODEL_LABELS[model] || model || 'Homa Auto';

  const isProcessing = status === 'processing' || status === 'uploading';
  const isWebSearch = mode === 'web' && status === 'processing';

  let icon = Wifi;
  let text = modelLabel;
  let colorClass = 'text-muted-foreground';
  let bgClass = 'bg-accent/50';
  let animate = false;

  if (status === 'uploading') {
    icon = Upload;
    text = t('status_uploading');
    colorClass = 'text-amber-600 dark:text-amber-400';
    bgClass = 'bg-amber-500/10';
    animate = true;
  } else if (status === 'processing') {
    icon = isWebSearch ? Search : Brain;
    text = isWebSearch ? 'در حال جستجوی وب…' : t('status_processing') + ' ' + modelLabel;
    colorClass = 'text-primary';
    bgClass = 'bg-primary/10';
    animate = true;
  } else if (status === 'error') {
    icon = AlertCircle;
    text = error || t('error_occurred');
    colorClass = 'text-destructive';
    bgClass = 'bg-destructive/10';
  }

  const showUpgrade = usage && usage.plan === 'free' && (usage.credits || 0) < 10 && !isProcessing;
  const showError = status === 'error';

  return (
    <>
      {isProcessing && (
        <div className="h-0.5 bg-primary/15 overflow-hidden">
          <div className="h-full bg-primary animate-pulse" />
        </div>
      )}
      {(isProcessing || showError) && (
        <div className="flex justify-center px-3 pb-1.5">
          <span className={`inline-flex items-center gap-1.5 px-2 h-6 rounded-full ${bgClass} ${colorClass} text-[11px] font-medium transition-colors`}>
            {animate ? <Loader2 size={11} className="animate-spin" /> : <icon size={11} />}
            {showError && <span className="max-w-[260px] truncate">{text}</span>}
          </span>
        </div>
      )}
      {showUpgrade && (
        <div className="flex justify-center pb-1.5">
          <Link to="/pricing" className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors" title={t('upgrade')}>
            <Sparkles size={11} />
          </Link>
        </div>
      )}
    </>
  );
}