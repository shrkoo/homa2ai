import React, { useState } from 'react';
import { CalendarDays, Bell, Loader2, Check, Plus, X } from 'lucide-react';
import { connectorAdapter } from '@/lib/adapters';
import { useI18n } from '@/i18n/I18nContext';
import PageHeader from '@/components/PageHeader';
import { toast } from '@/components/ui/use-toast';
import CalendarGrid from '@/components/calendar/CalendarGrid';
import ReminderList from '@/components/calendar/ReminderList';

export default function Calendar() {
  const { t } = useI18n();
  const [tab, setTab] = useState('calendar');
  const [showGoogle, setShowGoogle] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);

  const handleGoogleEvent = async () => {
    if (!title || !date) return;
    setLoading(true);
    try {
      await connectorAdapter.createCalendarEvent({ title, date, time, duration });
      toast({ title: t('event_added') });
      setTitle(''); setDate(''); setTime('09:00'); setDuration(60);
      setShowGoogle(false);
    } catch {
      toast({ title: t('error_occurred') });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-dvh pb-6">
      <PageHeader title={t('calendar_tool') || 'تقویم'} />
      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl bg-accent">
          <button onClick={() => setTab('calendar')} className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium transition-colors ${tab === 'calendar' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>
            <CalendarDays size={16} /> {t('calendar_view') || 'تقویم'}
          </button>
          <button onClick={() => setTab('reminders')} className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium transition-colors ${tab === 'reminders' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>
            <Bell size={16} /> {t('reminders') || 'یادآورها'}
          </button>
        </div>

        {tab === 'calendar' ? (
          <div className="rounded-2xl border border-border bg-card p-4">
            <CalendarGrid />
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0"><Bell size={20} /></div>
              <div>
                <p className="text-sm font-semibold">{t('reminders') || 'یادآورها'}</p>
                <p className="text-xs text-muted-foreground leading-5">{t('reminders_desc') || 'یادآورهای فعال شما'}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-3">
              <ReminderList />
            </div>
          </>
        )}

        {/* Google Calendar export — collapsible */}
        <button onClick={() => setShowGoogle((v) => !v)} className="w-full h-11 rounded-2xl border border-border bg-card flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <CalendarDays size={16} className="text-primary" /> {t('add_to_google') || 'افزودن به گوگل تقویم'}
          {showGoogle ? <X size={15} /> : <Plus size={15} />}
        </button>
        {showGoogle && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('event_title')}</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full h-11 mt-1 px-3 rounded-xl bg-accent outline-none text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('event_date')}</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-11 mt-1 px-3 rounded-xl bg-accent outline-none text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('event_time')}</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full h-11 mt-1 px-3 rounded-xl bg-accent outline-none text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('event_duration')}</label>
              <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full h-11 mt-1 px-3 rounded-xl bg-accent outline-none text-sm" />
            </div>
            <button onClick={handleGoogleEvent} disabled={!title || !date || loading} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-all">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} {t('add_to_calendar')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}