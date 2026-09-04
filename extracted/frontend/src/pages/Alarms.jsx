import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock, Bell, Sparkles, History, Volume2, CalendarDays } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { usePref } from '@/hooks/usePref';
import PageHeader from '@/components/PageHeader';
import AlarmList from '@/components/alarms/AlarmList';
import ReminderListPanel from '@/components/alarms/ReminderListPanel';
import SmartReminderList from '@/components/alarms/SmartReminderList';
import AlarmHistoryList from '@/components/alarms/AlarmHistoryList';
import AlarmForm from '@/components/alarms/AlarmForm';
import ReminderForm from '@/components/alarms/ReminderForm';
import AlarmClock from '@/components/alarms/AlarmClock';
import VoiceTestPanel from '@/components/alarms/VoiceTestPanel';
import CalendarGrid from '@/components/calendar/CalendarGrid';

export default function Alarms() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [tab, setTab] = useState('alarms');
  const [formOpen, setFormOpen] = useState(false);
  const [reminderFormOpen, setReminderFormOpen] = useState(false);
  const [editAlarm, setEditAlarm] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [quickOpen, setQuickOpen] = useState(false);
  const [gcalSync, setGcalSync] = usePref('homa_gcal_sync', false);

  const tabs = [
    { id: 'alarms', icon: Clock, label: t('alarms') || 'آلارم' },
    { id: 'reminders', icon: Bell, label: t('reminders') || 'یادآور' },
    { id: 'smart', icon: Sparkles, label: t('smart_reminders') || 'هوشمند' },
    { id: 'history', icon: History, label: t('history') || 'تاریخچه' },
    { id: 'calendar', icon: CalendarDays, label: 'تقویم' },
  ];

  const openNew = () => { setEditAlarm(null); setFormOpen(true); };
  const openEdit = (alarm) => { setEditAlarm(alarm); setFormOpen(true); };

  const testSound = () => {
    // Trigger a real full-screen test alarm overlay (sound + voice + actions)
    const testAlarm = {
      id: 'test_' + Date.now(),
      title: 'تست آلارم',
      hour: new Date().getHours(),
      minute: new Date().getMinutes(),
      second: new Date().getSeconds(),
      sound: 'classic',
      volume: 70,
      vibrate: true,
      alarm_intensity: 'normal',
      voice_enabled: false,
      snooze_enabled: false,
      reason: '',
      description: 'این یک تست واقعی است',
    };
    window.dispatchEvent(new CustomEvent('homa-test-alarm', { detail: { alarm: testAlarm } }));
  };

  return (
    <div className="min-h-dvh">
      <PageHeader title={t('alarms_reminders') || 'آلارم و یادآور'} action={
        <div className="flex items-center gap-1.5">
          <button onClick={testSound} title={t('test_alarm') || 'تست صدا'} className="w-9 h-9 flex items-center justify-center rounded-full bg-accent text-foreground active:scale-95 transition-transform">
            <Volume2 size={18} />
          </button>
          <button onClick={() => setQuickOpen(!quickOpen)} className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-95 transition-transform shadow-sm shadow-primary/30">
            <Plus size={20} />
          </button>
        </div>
      } />

      {quickOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm flex items-end justify-center animate-in fade-in" onClick={() => setQuickOpen(false)}>
          <div className="w-full max-w-md rounded-t-3xl border-t border-border bg-card p-3 pb-6 shadow-2xl animate-in slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-3" />
            <p className="text-sm font-semibold text-center mb-3">افزودن جدید</p>
            <button onClick={() => { setQuickOpen(false); openNew(); }} className="w-full h-14 rounded-2xl hover:bg-accent flex items-center gap-3 px-4 text-sm font-medium border border-border">
              <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center"><Clock size={18} /></div>
              <div className="text-start flex-1">
                <p className="text-sm font-semibold">{t('new_alarm') || 'آلارم جدید'}</p>
                <p className="text-xs text-muted-foreground">زنگ در زمان مشخص</p>
              </div>
            </button>
            <button onClick={() => { setQuickOpen(false); setReminderFormOpen(true); }} className="w-full h-14 rounded-2xl hover:bg-accent flex items-center gap-3 px-4 text-sm font-medium border border-border mt-2">
              <div className="w-9 h-9 rounded-full bg-blue-500/15 text-blue-500 flex items-center justify-center"><Bell size={18} /></div>
              <div className="text-start flex-1">
                <p className="text-sm font-semibold">{t('new_reminder') || 'یادآور جدید'}</p>
                <p className="text-xs text-muted-foreground">یادآوری ساده</p>
              </div>
            </button>
            <button onClick={() => { setQuickOpen(false); navigate('/favorites'); }} className="w-full h-14 rounded-2xl hover:bg-accent flex items-center gap-3 px-4 text-sm font-medium border border-border mt-2">
              <div className="w-9 h-9 rounded-full bg-violet-500/15 text-violet-500 flex items-center justify-center"><Sparkles size={18} /></div>
              <div className="text-start flex-1">
                <p className="text-sm font-semibold">{t('new_smart') || 'یادآور هوشمند'}</p>
                <p className="text-xs text-muted-foreground">بر اساس قیمت یا موجودی</p>
              </div>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Real-time clock + countdown */}
        <AlarmClock refreshKey={refreshKey} />

        {/* Final voice test panel — ready-to-run test for real Android device */}
        <VoiceTestPanel />

        {/* Google Calendar sync toggle */}
        <button onClick={() => setGcalSync(!gcalSync)} className={`w-full rounded-2xl border p-3.5 flex items-center gap-3 transition-colors ${gcalSync ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${gcalSync ? 'bg-primary/15 text-primary' : 'bg-accent text-muted-foreground'}`}><CalendarDays size={18} /></div>
          <div className="flex-1 text-start min-w-0">
            <p className="text-sm font-semibold">{t('gcal_sync') || 'هماهنگی با گوگل تقویم'}</p>
            <p className="text-xs text-muted-foreground leading-5 truncate">{gcalSync ? (t('gcal_sync_on') || 'یادآورها و کارهای سنگین در تقویم ثبت می‌شوند') : (t('gcal_sync_off') || 'غیرفعال')}</p>
          </div>
          <div className={`w-12 h-7 rounded-full transition-colors shrink-0 ${gcalSync ? 'bg-primary' : 'bg-accent'}`}>
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${gcalSync ? 'translate-x-6' : 'translate-x-1'}`} />
          </div>
        </button>

        <div className="flex gap-1 p-1 rounded-2xl bg-accent/60 overflow-x-auto">
          {tabs.map((tb) => {
            const active = tab === tb.id;
            return (
              <button key={tb.id} onClick={() => setTab(tb.id)} className={`flex-1 min-w-[64px] h-10 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${active ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                <tb.icon size={15} /> <span className="truncate">{tb.label}</span>
              </button>
            );
          })}
        </div>

        {tab === 'alarms' && <AlarmList onEdit={openEdit} refreshKey={refreshKey} />}
        {tab === 'reminders' && <ReminderListPanel refreshKey={refreshKey} />}
        {tab === 'smart' && <SmartReminderList refreshKey={refreshKey} />}
        {tab === 'history' && <AlarmHistoryList refreshKey={refreshKey} />}
        {tab === 'calendar' && <CalendarGrid />}
      </div>

      <AlarmForm open={formOpen} onClose={() => setFormOpen(false)} editAlarm={editAlarm} onSaved={() => setRefreshKey((k) => k + 1)} />
      <ReminderForm open={reminderFormOpen} onClose={() => setReminderFormOpen(false)} onSaved={() => setRefreshKey((k) => k + 1)} />
    </div>
  );
}