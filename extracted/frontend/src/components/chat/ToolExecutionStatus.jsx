import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Check, AlertCircle, Zap, Cpu, Cloud, Search, Image as ImageIcon, Video, Music, FileText, X, Clock } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const STAGES = {
  submitting: { icon: Cloud, color: 'text-amber-500', bg: 'bg-amber-500/10', label: { fa: 'در حال ارسال درخواست...', en: 'Submitting request...', ku: 'ناردنی داواکاری...' }, progress: 5 },
  analyzing: { icon: Search, color: 'text-blue-500', bg: 'bg-blue-500/10', label: { fa: 'در حال تحلیل درخواست...', en: 'Analyzing request...', ku: 'شیکاری داواکاری...' }, progress: 10 },
  queued: { icon: Cpu, color: 'text-purple-500', bg: 'bg-purple-500/10', label: { fa: 'در صف پردازش...', en: 'Queued...', ku: 'لەڕیز...' }, progress: 15 },
  generating: { icon: Loader2, color: 'text-primary', bg: 'bg-primary/10', label: { fa: 'در حال تولید...', en: 'Generating...', ku: 'بەرهەمهێنان...' }, progress: 50 },
  processing: { icon: Loader2, color: 'text-primary', bg: 'bg-primary/10', label: { fa: 'در حال پردازش...', en: 'Processing...', ku: 'پرۆسێسکردن...' }, progress: 60 },
  downloading: { icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-500/10', label: { fa: 'در حال دانلود نتیجه...', en: 'Downloading result...', ku: 'داگرتنی ئەنجام...' }, progress: 90 },
  completed: { icon: Check, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: { fa: 'آماده شد', en: 'Ready', ku: 'ئامادە بوو' }, progress: 100 },
  error: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: { fa: 'خطا رخ داد', en: 'Error', ku: 'هەڵە' }, progress: 100 },
  cancelled: { icon: X, color: 'text-muted-foreground', bg: 'bg-accent', label: { fa: 'لغو شد', en: 'Cancelled', ku: 'هەڵوەشایەوە' }, progress: 100 },
};

const CAPABILITY_ICON = {
  IMAGE_GENERATION: ImageIcon,
  IMAGE_EDITING: ImageIcon,
  IMAGE_UPSCALING: ImageIcon,
  VIDEO_GENERATION: Video,
  IMAGE_TO_VIDEO: Video,
  VIDEO_EDITING: Video,
  MUSIC_GENERATION: Music,
  SONG_GENERATION: Music,
  TEXT_TO_SPEECH: FileText,
};

// Estimated total duration (seconds) by capability — used for ETA
const ESTIMATED_DURATION = {
  IMAGE_GENERATION: 20,
  IMAGE_EDITING: 25,
  IMAGE_UPSCALING: 15,
  VIDEO_GENERATION: 180,
  IMAGE_TO_VIDEO: 180,
  VIDEO_EDITING: 200,
  MUSIC_GENERATION: 60,
  SONG_GENERATION: 90,
  TEXT_TO_SPEECH: 10,
  default: 30,
};

function formatTime(seconds) {
  if (seconds < 0 || isNaN(seconds)) return '--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}ث`;
}

export default function ToolExecutionStatus({ statusData, onCancel }) {
  const { language } = useI18n();
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  // Tick elapsed time every second while in non-terminal stage
  useEffect(() => {
    if (statusData.stage === 'completed' || statusData.stage === 'error' || statusData.stage === 'cancelled') return;
    startRef.current = statusData.startTime || Date.now();
    setElapsed(0);
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [statusData.startTime, statusData.stage]);

  if (!statusData) return null;

  const stage = statusData.stage || 'submitting';
  const config = STAGES[stage] || STAGES.submitting;
  const Icon = config.icon;
  const isAnimated = ['generating', 'processing', 'analyzing', 'queued', 'submitting', 'downloading'].includes(stage);
  const isTerminal = stage === 'completed' || stage === 'error' || stage === 'cancelled';

  // Progress: use explicit progress if provided, otherwise estimate from elapsed time
  const estDuration = ESTIMATED_DURATION[statusData.capability] || ESTIMATED_DURATION.default;
  let progress = statusData.progress;
  if (progress == null || progress === undefined) {
    if (isTerminal) progress = 100;
    else progress = Math.min(90, Math.round((elapsed / estDuration) * 100));
  }

  const label = config.label[language] || config.label.fa;
  const message = statusData.message || '';
  const CapIcon = CAPABILITY_ICON[statusData.capability] || Zap;
  const eta = Math.max(0, estDuration - elapsed);

  return (
    <div className="rounded-2xl border border-border bg-card p-3.5 space-y-3">
      {/* Header: stage + capability */}
      <div className="flex items-center gap-3">
        <div className={`relative w-10 h-10 rounded-full ${config.bg} ${config.color} flex items-center justify-center shrink-0`}>
          <Icon size={18} className={isAnimated ? 'animate-spin' : ''} />
          {statusData.capability && (
            <div className="absolute -bottom-1 -end-1 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center">
              <CapIcon size={10} className="text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{label}</p>
          {message && <p className="text-xs text-muted-foreground truncate mt-0.5">{message}</p>}
          {statusData.capability_label && !message && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{statusData.capability_label}</p>
          )}
        </div>
        {!isTerminal && onCancel && (
          <button
            onClick={onCancel}
            className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="لغو"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-1.5 rounded-full bg-accent overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${stage === 'error' ? 'bg-destructive' : stage === 'completed' ? 'bg-emerald-500' : 'bg-primary'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Time info row */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock size={10} />
            {formatTime(elapsed)} گذشته
          </span>
          <span className="tabular-nums">{progress}%</span>
          {!isTerminal && eta > 0 && (
            <span className="inline-flex items-center gap-1 text-primary/70">
              ~{formatTime(eta)} باقی‌مانده
            </span>
          )}
        </div>
      </div>

      {/* Provider badge */}
      {statusData.provider && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground/60">Provider:</span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-accent">{statusData.provider}</span>
        </div>
      )}
    </div>
  );
}