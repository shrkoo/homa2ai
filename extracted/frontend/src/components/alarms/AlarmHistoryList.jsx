import React, { useState, useEffect } from 'react';
import { History, Check, X, Clock, Volume2, AlertCircle } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { history } from '@/lib/alarmStore';

const ACTION_CONFIG = {
  triggered: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'اجرا شد' },
  dismissed: { icon: X, color: 'text-muted-foreground', bg: 'bg-accent', label: 'خاموش شد' },
  snoozed: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Snooze' },
  completed: { icon: Check, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'انجام شد' },
  voice_played: { icon: Volume2, color: 'text-primary', bg: 'bg-primary/10', label: 'صدای هُما' },
  failed: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'ناموفق' },
};

export default function AlarmHistoryList({ refreshKey }) {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const h = await history.list('-triggered_at', 200);
        setItems(h);
      } catch {}
      setLoading(false);
    })();
  }, [refreshKey]);

  if (loading) return <div className="text-center py-8 text-sm text-muted-foreground">...</div>;
  if (!items.length) return (
    <div className="text-center py-12 text-muted-foreground">
      <History size={32} className="mx-auto mb-2 opacity-40" />
      <p className="text-sm">{t('no_history') || 'تاریخچه‌ای نیست'}</p>
    </div>
  );

  // Group by day
  const groups = {};
  items.forEach((h) => {
    const day = new Date(h.triggered_at).toLocaleDateString('fa-IR');
    if (!groups[day]) groups[day] = [];
    groups[day].push(h);
  });

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([day, hist]) => (
        <div key={day}>
          <p className="text-xs font-medium text-muted-foreground mb-2 px-1">{day}</p>
          <div className="space-y-1.5">
            {hist.map((h) => {
              const cfg = ACTION_CONFIG[h.action] || ACTION_CONFIG.triggered;
              const Icon = cfg.icon;
              const time = new Date(h.triggered_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={h.id} className="flex items-center gap-3 rounded-xl bg-card border border-border p-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{h.title || '—'}</p>
                    <p className="text-[10px] text-muted-foreground">{cfg.label} {h.snooze_count > 0 && `×${h.snooze_count}`}</p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">{time}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}