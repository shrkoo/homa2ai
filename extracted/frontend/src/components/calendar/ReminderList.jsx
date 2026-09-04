import React, { useState, useEffect } from 'react';
import { Bell, Loader2, Check, X, Clock } from 'lucide-react';
import { reminders as alarmReminders } from '@/lib/alarmStore';
import { useI18n } from '@/i18n/I18nContext';
import { toast } from '@/components/ui/use-toast';

export default function ReminderList() {
  const { t, language } = useI18n();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const all = await alarmReminders.filter({ status: 'pending' }, 'remind_at');
      setReminders(all || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (r) => {
    try {
      await alarmReminders.update(r.id, { status: r.status === 'done' ? 'pending' : 'done' });
      load();
    } catch { toast({ title: t('error_occurred') }); }
  };

  const remove = async (r) => {
    try {
      await alarmReminders.delete(r.id);
      load();
    } catch { toast({ title: t('error_occurred') }); }
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>;
  if (!reminders.length) return <p className="text-xs text-muted-foreground text-center py-4">{t('no_reminders') || 'یادآوری نیست'}</p>;

  return (
    <div className="space-y-2">
      {reminders.map((r) => {
        const d = new Date(r.remind_at);
        const overdue = d < new Date();
        return (
          <div key={r.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-accent/50">
            <button onClick={() => toggle(r)} className="w-7 h-7 rounded-full border-2 border-primary flex items-center justify-center shrink-0 mt-0.5">
              {r.status === 'done' && <Check size={13} className="text-primary" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${r.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{r.title}</p>
              <p className={`text-[11px] flex items-center gap-1 mt-0.5 ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                <Clock size={10} />
                {d.toLocaleDateString(language === 'en' ? 'en-US' : 'fa-IR', { month: 'short', day: 'numeric' })} · {d.toLocaleTimeString(language === 'en' ? 'en-US' : 'fa-IR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button onClick={() => remove(r)} className="w-7 h-7 rounded-full hover:bg-accent text-muted-foreground hover:text-destructive flex items-center justify-center shrink-0">
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}