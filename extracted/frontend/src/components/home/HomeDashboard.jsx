import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Cpu, Clock, ChevronLeft } from 'lucide-react';
import { dataAdapter } from '@/lib/adapters';
import { reminders as alarmReminders } from '@/lib/alarmStore';
import { useI18n } from '@/i18n/I18nContext';

function isToday(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export default function HomeDashboard() {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const r = await alarmReminders.filter({ status: 'pending' }, 'remind_at', 50);
      setReminders(r.filter((x) => isToday(x.remind_at)));
      const j = await dataAdapter.filter('ApiJob', { status: { $in: ['queued', 'processing'] } }, '-created_date', 20);
      setJobs(j);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 15000);
    return () => clearInterval(i);
  }, []);

  if (loading) return null;
  if (!reminders.length && !jobs.length) return null;

  return (
    <div className="space-y-3 mb-6">
      {reminders.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center"><Bell size={16} /></div>
              <span className="text-sm font-semibold">{t('today_reminders') || 'یادآورهای امروز'}</span>
            </div>
            <button onClick={() => navigate('/alarms')} className="text-xs text-muted-foreground flex items-center gap-0.5">
              <span>{t('all') || 'همه'}</span> <ChevronLeft size={14} className="rtl:rotate-180" />
            </button>
          </div>
          <div className="space-y-1">
            {reminders.slice(0, 4).map((r) => {
              const dt = new Date(r.remind_at);
              const overdue = dt < new Date();
              return (
                <button key={r.id} onClick={() => navigate('/alarms')} className="w-full flex items-center gap-2.5 py-1.5 text-start">
                  <Clock size={14} className={overdue ? 'text-destructive' : 'text-muted-foreground'} />
                  <span className="text-xs font-medium tabular-nums">{dt.toLocaleTimeString(language === 'en' ? 'en-US' : 'fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className={`text-sm flex-1 truncate ${overdue ? 'text-destructive' : ''}`}>{r.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center"><Cpu size={16} /></div>
              <span className="text-sm font-semibold">{t('processing_jobs') || 'کارهای در حال پردازش'}</span>
            </div>
            <button onClick={() => navigate('/library')} className="text-xs text-muted-foreground flex items-center gap-0.5">
              <span>{t('all') || 'همه'}</span> <ChevronLeft size={14} className="rtl:rotate-180" />
            </button>
          </div>
          <div className="space-y-1">
            {jobs.slice(0, 4).map((j) => (
              <div key={j.id} className="flex items-center gap-2.5 py-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span className="text-sm flex-1 truncate">{j.capability || 'AI Job'}</span>
                <span className="text-xs text-muted-foreground truncate">{j.provider || ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}