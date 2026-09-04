import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronLeft, Bell, Loader2, Cpu, Check, Plus, X, AlarmClock } from 'lucide-react';
import { dataAdapter } from '@/lib/adapters';
import { alarms as alarmStoreAlarms, reminders as alarmStoreReminders } from '@/lib/alarmStore';
import { useI18n } from '@/i18n/I18nContext';
import { toast } from '@/components/ui/use-toast';

const WEEKDAYS_FA = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const WEEKDAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function toISOLocal(date) {
  const tz = date.getTimezoneOffset() * 60000;
  return new Date(date - tz).toISOString().slice(0, 16);
}

export default function CalendarGrid() {
  const { t, language } = useI18n();
  const [cursor, setCursor] = useState(new Date());
  const [reminders, setReminders] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDateTime, setFormDateTime] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [rems, jb, al] = await Promise.all([
        alarmStoreReminders.filter({}).catch(() => []),
        dataAdapter.filter('ApiJob', {}).catch(() => []),
        alarmStoreAlarms.filter({ active: true }).catch(() => []),
      ]);
      setReminders(rems || []);
      setJobs(jb || []);
      setAlarms(al || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

  const dayEvents = useMemo(() => {
    const map = {};
    const inRange = (d) => d >= monthStart && d <= monthEnd;
    reminders.forEach((r) => {
      const d = new Date(r.remind_at);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push({ type: 'reminder', item: r });
    });
    jobs.forEach((j) => {
      const d = new Date(j.created_date);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push({ type: 'job', item: j });
    });
    alarms.forEach((a) => {
      let d = a.next_trigger ? new Date(a.next_trigger) : null;
      if (!d || isNaN(d)) {
        d = new Date();
        d.setHours(a.hour || 7, a.minute || 0, 0, 0);
        if (d < new Date()) d.setDate(d.getDate() + 1);
      }
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push({ type: 'alarm', item: a });
    });
    return map;
  }, [reminders, jobs, alarms, year, month]);

  const weekdays = language === 'en' ? WEEKDAYS_EN : WEEKDAYS_FA;
  const monthLabel = language === 'en'
    ? cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : cursor.toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCursor(new Date(year, month - 1, 1));
  const nextMonth = () => setCursor(new Date(year, month + 1, 1));
  const goToday = () => { setCursor(new Date()); setSelectedDate(null); };

  const todayKey = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${n.getMonth()}-${n.getDate()}`;
  })();

  const selectedEvents = selectedDate ? (dayEvents[selectedDate.key] || []) : [];

  const toggleReminder = async (r) => {
    try {
      await alarmStoreReminders.update(r.id, { status: r.status === 'done' ? 'pending' : 'done' });
      load();
    } catch { toast({ title: t('error_occurred') }); }
  };

  const deleteReminder = async (r) => {
    try {
      await alarmStoreReminders.delete(r.id);
      load();
    } catch { toast({ title: t('error_occurred') }); }
  };

  const submitForm = async () => {
    if (!formTitle.trim() || !formDateTime) return;
    try {
      await alarmStoreReminders.create({
        title: formTitle.trim(),
        remind_at: new Date(formDateTime).toISOString(),
        status: 'pending',
        source: 'manual',
      });
      setFormTitle(''); setFormDateTime(''); setShowForm(false);
      toast({ title: t('reminder_added') || 'یادآور ثبت شد' });
      load();
    } catch { toast({ title: t('error_occurred') }); }
  };

  const openFormForDate = (key) => {
    const [y, m, d] = key.split('-').map(Number);
    const dt = new Date(y, m, d, 9, 0);
    setFormDateTime(toISOLocal(dt));
    setShowForm(true);
  };

  return (
    <div className="space-y-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="w-9 h-9 rounded-full hover:bg-accent flex items-center justify-center">
          <ChevronRight size={18} />
        </button>
        <div className="text-center">
          <p className="font-heading font-semibold text-sm">{monthLabel}</p>
          <button onClick={goToday} className="text-[11px] text-primary mt-0.5">{t('today') || 'امروز'}</button>
        </div>
        <button onClick={nextMonth} className="w-9 h-9 rounded-full hover:bg-accent flex items-center justify-center">
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1">
        {weekdays.map((w, i) => (
          <div key={i} className="text-center text-[11px] font-medium text-muted-foreground py-1">{w}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startWeekday }).map((_, i) => (
          <div key={`e_${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = `${year}-${month}-${day}`;
          const events = dayEvents[key] || [];
          const isToday = key === todayKey;
          const isSelected = selectedDate?.key === key;
          return (
            <button
              key={day}
              onClick={() => setSelectedDate({ key, day })}
              className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-colors
                ${isSelected ? 'bg-primary text-primary-foreground' : isToday ? 'bg-primary/15 text-primary font-bold' : 'hover:bg-accent'}`}
            >
              <span className={events.length ? 'font-semibold' : ''}>{day}</span>
              {events.length > 0 && (
                <div className="absolute bottom-1 flex gap-0.5">
                  {events.slice(0, 3).map((e, idx) => (
                    <span key={idx} className={`w-1 h-1 rounded-full ${e.type === 'reminder' ? (e.item.status === 'done' ? 'bg-emerald-500' : 'bg-primary') : e.type === 'alarm' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1 flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> {t('reminders') || 'یادآورها'}</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> {t('ai_jobs') || 'کارهای AI'}</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> {t('alarms') || 'آلارم‌ها'}</span>
      </div>

      {/* Selected day events */}
      {selectedDate && (
        <div className="rounded-2xl border border-border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {language === 'en'
                ? new Date(selectedDate.key.split('-')[0], selectedDate.key.split('-')[1], selectedDate.key.split('-')[2]).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })
                : new Date(selectedDate.key.split('-')[0], selectedDate.key.split('-')[1], selectedDate.key.split('-')[2]).toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <button onClick={() => openFormForDate(selectedDate.key)} className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center">
              <Plus size={15} />
            </button>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">{t('no_events') || 'رویدادی برای این روز نیست'}</p>
          ) : (
            selectedEvents.map((e, i) => {
              const isReminder = e.type === 'reminder';
              const isAlarm = e.type === 'alarm';
              const isJob = e.type === 'job';
              const icon = isReminder ? <Bell size={14} /> : isAlarm ? <AlarmClock size={14} /> : <Cpu size={14} />;
              const iconBg = isReminder ? 'bg-primary/15 text-primary' : isAlarm ? 'bg-rose-500/15 text-rose-500' : 'bg-amber-500/15 text-amber-600';
              const title = isReminder ? e.item.title : isAlarm ? e.item.title : `${e.item.capability || 'AI Job'} — ${e.item.provider || ''}`;
              const time = isReminder ? new Date(e.item.remind_at) : isAlarm ? (() => { const d = e.item.next_trigger ? new Date(e.item.next_trigger) : new Date(); d.setHours(e.item.hour || 7, e.item.minute || 0, 0, 0); return d; })() : new Date(e.item.created_date);
              return (
                <div key={i} className="flex items-start gap-2.5 p-2 rounded-xl bg-accent/50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {time.toLocaleTimeString(language === 'en' ? 'en-US' : 'fa-IR', { hour: '2-digit', minute: '2-digit' })}
                      {isJob && e.item.status ? ` · ${e.item.status}` : ''}
                      {isAlarm && e.item.recurring_type && e.item.recurring_type !== 'once' ? ` · ${e.item.recurring_type}` : ''}
                    </p>
                  </div>
                  {isReminder && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => toggleReminder(e.item)} className={`w-7 h-7 rounded-full flex items-center justify-center ${e.item.status === 'done' ? 'bg-emerald-500 text-white' : 'bg-accent text-muted-foreground'}`}>
                        <Check size={13} />
                      </button>
                      <button onClick={() => deleteReminder(e.item)} className="w-7 h-7 rounded-full bg-accent text-muted-foreground hover:text-destructive flex items-center justify-center">
                        <X size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add reminder form */}
      {showForm && (
        <div className="rounded-2xl border border-border bg-card p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{t('new_reminder') || 'یادآور جدید'}</p>
            <button onClick={() => setShowForm(false)} className="w-7 h-7 rounded-full hover:bg-accent flex items-center justify-center"><X size={15} /></button>
          </div>
          <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder={t('reminder_title') || 'عنوان یادآور'} className="w-full h-11 px-3 rounded-xl bg-accent outline-none text-sm" />
          <input type="datetime-local" value={formDateTime} onChange={(e) => setFormDateTime(e.target.value)} className="w-full h-11 px-3 rounded-xl bg-accent outline-none text-sm" />
          <button onClick={submitForm} disabled={!formTitle.trim() || !formDateTime} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-all">
            <Check size={17} /> {t('add_reminder') || 'افزودن یادآور'}
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-4"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
      )}
    </div>
  );
}