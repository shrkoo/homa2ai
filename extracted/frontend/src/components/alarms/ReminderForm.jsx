import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, Volume2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { reminders } from '@/lib/alarmStore';
import { toast } from '@/components/ui/use-toast';
import { syncReminderToGCal } from '@/utils/gcalSync';

function defaultWhen() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setSeconds(0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ReminderForm({ open, onClose, conversationId, onSaved }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', remind_at: defaultWhen(), reason: '', voice_enabled: false, voice_message: '' });

  useEffect(() => {
    if (open) setForm({ title: '', remind_at: defaultWhen(), reason: '', voice_enabled: false, voice_message: '' });
  }, [open]);

  if (!open) return null;
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.remind_at) { toast({ title: t('error_occurred') }); return; }
    setSaving(true);
    try {
      const when = new Date(form.remind_at).toISOString();
      const rem = await reminders.create({
        title: form.title.trim(), remind_at: when, status: 'pending',
        notes: '', conversation_id: (conversationId && conversationId !== 'new') ? conversationId : '', source: 'manual',
        reminder_type: 'time', voice_enabled: form.voice_enabled,
        voice_message: form.voice_message, reason: form.reason, recurring_type: 'once',
      });
      await syncReminderToGCal({ ...rem, remind_at: when, title: form.title.trim() });
      toast({ title: t('reminder_set') || 'یادآور تنظیم شد' });
      onSaved?.();
      onClose();
    } catch { toast({ title: t('error_occurred') }); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-background flex flex-col">
      <div className="flex items-center gap-2 px-4 h-14 border-b border-border pt-[env(safe-area-inset-top)]">
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent"><X size={20} /></button>
        <h1 className="font-heading text-base font-semibold flex-1">{t('new_reminder') || 'یادآور جدید'}</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-md mx-auto w-full">
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t('reminder_title') || 'عنوان'}</label>
          <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="کار مهم" className="w-full h-11 mt-1 px-3 rounded-xl bg-accent outline-none text-sm" autoFocus />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t('alarm_time') || 'زمان'}</label>
          <input type="datetime-local" value={form.remind_at} onChange={(e) => set('remind_at', e.target.value)} className="w-full h-11 mt-1 px-3 rounded-xl bg-accent outline-none text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t('reason') || 'دلیل'}</label>
          <input value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder="اختیاری" className="w-full h-11 mt-1 px-3 rounded-xl bg-accent outline-none text-sm" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2"><Volume2 size={16} /> {t('voice_after_alarm') || 'پخش صدا'}</span>
            <button onClick={() => set('voice_enabled', !form.voice_enabled)} className={`w-12 h-7 rounded-full transition-colors ${form.voice_enabled ? 'bg-primary' : 'bg-accent'}`}>
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${form.voice_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          {form.voice_enabled && (
            <textarea value={form.voice_message} onChange={(e) => set('voice_message', e.target.value)} placeholder="متن سفارشی (اختیاری)" className="w-full min-h-20 p-3 rounded-xl bg-accent outline-none text-sm resize-none" />
          )}
        </div>
      </div>
      <div className="p-4 border-t border-border pb-[env(safe-area-inset-bottom)]">
        <button onClick={handleSave} disabled={saving || !form.title.trim()} className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-all">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} {t('save') || 'ذخیره'}
        </button>
      </div>
    </div>
  );
}