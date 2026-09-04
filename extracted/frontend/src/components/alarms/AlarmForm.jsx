import React, { useState, useEffect } from 'react';
import { X, Check, Volume2, Bell, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { alarms } from '@/lib/alarmStore';
import { toast } from '@/components/ui/use-toast';
import { getAlarmSounds, playAlarmSound, vibrateDevice } from '@/utils/alarmSound';
import { speakHomaReminder, isSpeechSupported, VOICE_ERROR_MESSAGES } from '@/utils/speak';

const DAYS = ['یک', 'دو', 'سه', 'چهار', 'پنج', 'جمعه', 'شنبه'];
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AlarmForm({ open, onClose, editAlarm, onSaved }) {
  const { t, language } = useI18n();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    message: '',
    hour: 7,
    minute: 0,
    second: 0,
    recurring_type: 'once',
    days_of_week: [],
    sound: 'classic',
    sound_enabled: true,
    volume: 70,
    vibrate: true,
    voice_enabled: false,
    voice_mode: 'auto',
    voice_message: '',
    voice_text: '',
    snooze_enabled: true,
    snooze_duration: 10,
    snooze_max_count: 3,
    alarm_intensity: 'normal',
    label: '',
    reason: '',
    wake_up_mode: false,
    active: true,
  });

  useEffect(() => {
    if (editAlarm) {
      setForm({ ...form, ...editAlarm });
    } else {
      setForm({
        title: '', description: '', message: '', hour: 7, minute: 0, second: 0, recurring_type: 'once', days_of_week: [],
        sound: 'classic', sound_enabled: true, volume: 70, vibrate: true, voice_enabled: false, voice_mode: 'auto',
        voice_message: '', voice_text: '', snooze_enabled: true, snooze_duration: 10, snooze_max_count: 3,
        alarm_intensity: 'normal', label: '', reason: '', wake_up_mode: false, active: true,
      });
    }
  }, [editAlarm, open]);

  if (!open) return null;

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const toggleDay = (d) => {
    setForm((p) => ({
      ...p,
      days_of_week: p.days_of_week.includes(d)
        ? p.days_of_week.filter((x) => x !== d)
        : [...p.days_of_week, d],
    }));
  };

  // Voice text: voiceText → message → title (no synthetic text)
  const getVoiceText = () => {
    return (form.voice_text || '').trim() || (form.message || '').trim() || (form.voice_message || '').trim() || (form.title || '').trim();
  };

  // ▶ تست صدای هُما — speaks the actual voice text via TTS
  const testVoice = async () => {
    const text = getVoiceText();
    console.log('[HOMA VOICE] testVoice', {
      voiceText: form.voice_text,
      message: form.message,
      title: form.title,
      selectedText: text?.slice(0, 100),
      speechSynthesisAvailable: isSpeechSupported(),
    });
    if (!text) { toast({ title: 'متن صوتی خالی است — ابتدا متن را وارد کنید' }); return; }
    const result = await speakHomaReminder(text, language);
    if (!result.ok) toast({ title: VOICE_ERROR_MESSAGES[result.error] || 'خطا در پخش صدا', duration: 6000 });
  };

  // 🔔 تست زنگ — plays the alarm ring sound only (not the full overlay)
  const testRing = () => {
    const gradual = form.alarm_intensity === 'gradual';
    const loud = form.alarm_intensity === 'loud';
    const vol = loud ? 100 : form.volume || 70;
    const stop = playAlarmSound(form.sound || 'classic', vol, gradual);
    if (form.vibrate) vibrateDevice([300, 100, 300, 100, 300]);
    setTimeout(() => stop(), 2500);
  };

  // 🔔 تست کامل آلارم — triggers the real full-screen overlay (sound → dismiss → voice)
  const testAlarm = () => {
    console.log('[HOMA VOICE] testAlarm — full flow', {
      title: form.title,
      voice_enabled: form.voice_enabled,
      voice_text: form.voice_text,
      message: form.message,
    });
    window.dispatchEvent(new CustomEvent('homa-test-alarm', { detail: { alarm: { ...form, id: editAlarm?.id || 'test_' + Date.now() } } }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast({ title: t('error_occurred') }); return; }
    setSaving(true);
    try {
      // Compute next trigger
      const now = new Date();
      const target = new Date(now);
      target.setHours(form.hour, form.minute, form.second || 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      // For recurring, find next matching day
      if (form.recurring_type !== 'once' && form.days_of_week.length > 0) {
        for (let i = 0; i < 8; i++) {
          const c = new Date(target);
          c.setDate(c.getDate() + i);
          if (form.days_of_week.includes(c.getDay())) { c.setHours(form.hour, form.minute, form.second || 0, 0); if (c > now) { target.setTime(c.getTime()); break; } }
        }
      }
      const payload = { ...form, next_trigger: target.toISOString() };
      if (editAlarm) {
        await alarms.update(editAlarm.id, payload);
      } else {
        await alarms.create(payload);
      }
      toast({ title: editAlarm ? t('save') : t('alarm_saved') || 'آلارم ذخیره شد' });
      onSaved?.();
      onClose();
    } catch { toast({ title: t('error_occurred') }); }
    setSaving(false);
  };

  const dayNames = language === 'en' ? DAYS_EN : DAYS;

  return (
    <div className="fixed inset-0 z-[90] bg-background flex flex-col">
      <div className="flex items-center gap-2 px-4 h-14 border-b border-border pt-[env(safe-area-inset-top)]">
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent">
          <X size={20} />
        </button>
        <h1 className="font-heading text-base font-semibold flex-1">{editAlarm ? t('edit') : t('new_alarm') || 'آلارم جدید'}</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 max-w-md mx-auto w-full">
        {/* Title */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t('reminder_title') || 'عنوان'}</label>
          <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="بیدار شو" className="w-full h-11 mt-1 px-3 rounded-xl bg-accent outline-none text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t('description') || 'توضیح'}</label>
          <input value={form.description} onChange={(e) => set('description', e.target.value)} className="w-full h-11 mt-1 px-3 rounded-xl bg-accent outline-none text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">متن یادآوری (message)</label>
          <input value={form.message} onChange={(e) => set('message', e.target.value)} placeholder="پاشو پسر، وقتشه روی پروژه هُما کار کنی." className="w-full h-11 mt-1 px-3 rounded-xl bg-accent outline-none text-sm" />
          <p className="text-[10px] text-muted-foreground mt-1">اگر متن صوتی خالی باشد، از این متن برای صدا استفاده می‌شود.</p>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t('reason') || 'دلیل'}</label>
          <input value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder="برای پیشرفت پروژه هُما" className="w-full h-11 mt-1 px-3 rounded-xl bg-accent outline-none text-sm" />
        </div>

        {/* Time */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">{t('alarm_time') || 'ساعت آلارم'}</p>
          <div className="flex items-center justify-center gap-2">
            <select value={form.hour} onChange={(e) => set('hour', Number(e.target.value))} className="h-14 w-20 rounded-xl bg-accent text-center text-2xl font-bold outline-none">
              {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}</option>)}
            </select>
            <span className="text-2xl font-bold">:</span>
            <select value={form.minute} onChange={(e) => set('minute', Number(e.target.value))} className="h-14 w-20 rounded-xl bg-accent text-center text-2xl font-bold outline-none">
              {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}</option>)}
            </select>
            <span className="text-2xl font-bold">:</span>
            <select value={form.second} onChange={(e) => set('second', Number(e.target.value))} className="h-14 w-20 rounded-xl bg-accent text-center text-2xl font-bold outline-none">
              {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}</option>)}
            </select>
          </div>
          {/* Quick-seconds presets */}
          <div className="mt-3">
            <p className="text-[11px] text-muted-foreground mb-2">{t('quick_in') || 'زمان‌سنج سریع'}</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '10 ثانیه', secs: 10 },
                { label: '30 ثانیه', secs: 30 },
                { label: '1 دقیقه', secs: 60 },
                { label: '5 دقیقه', secs: 300 },
                { label: '10 دقیقه', secs: 600 },
                { label: '30 دقیقه', secs: 1800 },
                { label: '1 ساعت', secs: 3600 },
              ].map((q) => (
                <button key={q.secs} onClick={() => {
                  const d = new Date(Date.now() + q.secs * 1000);
                  setForm((p) => ({ ...p, hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds(), recurring_type: 'once' }));
                }} className="px-2.5 h-8 rounded-lg text-[11px] font-medium bg-accent text-foreground hover:bg-primary/10 transition-colors">
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recurring */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">{t('repeat') || 'تکرار'}</p>
          <div className="flex flex-wrap gap-2">
            {[
              { v: 'once', l: 'یک‌بار' }, { v: 'daily', l: 'هر روز' }, { v: 'weekdays', l: 'شنبه-پنجشنبه' },
              { v: 'custom', l: 'روزهای انتخابی' }, { v: 'weekly', l: 'هر هفته' }, { v: 'monthly', l: 'هر ماه' },
            ].map((r) => (
              <button key={r.v} onClick={() => set('recurring_type', r.v)} className={`px-3 h-9 rounded-xl text-xs font-medium transition-colors ${form.recurring_type === r.v ? 'bg-primary text-primary-foreground' : 'bg-accent text-foreground'}`}>
                {r.l}
              </button>
            ))}
          </div>
          {(form.recurring_type === 'custom' || form.recurring_type === 'weekly') && (
            <div className="flex gap-1.5">
              {dayNames.map((d, i) => (
                <button key={i} onClick={() => toggleDay(i)} className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${form.days_of_week.includes(i) ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground'}`}>
                  {d.slice(0, language === 'en' ? 3 : 2)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sound */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">{t('alarm_sound') || 'صدای آلارم'}</p>
          <div className="flex flex-wrap gap-2">
            {getAlarmSounds().map((s) => (
              <button key={s} onClick={() => set('sound', s)} className={`px-3 h-9 rounded-xl text-xs font-medium transition-colors ${form.sound === s ? 'bg-primary text-primary-foreground' : 'bg-accent text-foreground'}`}>
                {s}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t('volume') || 'صدا'}: {form.volume}%</label>
            <input type="range" min="0" max="100" value={form.volume} onChange={(e) => set('volume', Number(e.target.value))} className="w-full mt-1" />
          </div>
          <div className="flex gap-2">
            <button onClick={testRing} className="flex-1 h-10 rounded-xl bg-accent text-sm font-medium flex items-center justify-center gap-2"><Bell size={16} /> 🔔 تست زنگ</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => set('sound_enabled', form.sound_enabled === false ? true : false)} className={`w-12 h-7 rounded-full transition-colors ${form.sound_enabled !== false ? 'bg-primary' : 'bg-accent'}`}>
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${form.sound_enabled !== false ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm">صدای زنگ</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => set('vibrate', !form.vibrate)} className={`w-12 h-7 rounded-full transition-colors ${form.vibrate ? 'bg-primary' : 'bg-accent'}`}>
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${form.vibrate ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm">{t('vibrate') || 'لرزش'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { v: 'normal', l: 'معمولی' }, { v: 'loud', l: 'بلند' }, { v: 'gradual', l: 'افزاینده' },
            ].map((i) => (
              <button key={i.v} onClick={() => set('alarm_intensity', i.v)} className={`px-3 h-9 rounded-xl text-xs font-medium transition-colors ${form.alarm_intensity === i.v ? 'bg-primary text-primary-foreground' : 'bg-accent text-foreground'}`}>{i.l}</button>
            ))}
          </div>
        </div>

        {/* Voice — 🔊 متن صوتی هُما */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">🔊 {t('voice_after_alarm') || 'صدای هُما بعد از آلارم'}</span>
            <button onClick={() => set('voice_enabled', !form.voice_enabled)} className={`w-12 h-7 rounded-full transition-colors ${form.voice_enabled ? 'bg-primary' : 'bg-accent'}`}>
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${form.voice_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          {form.voice_enabled && (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground">متن صوتی هُما (voiceText)</label>
                <textarea value={form.voice_text} onChange={(e) => set('voice_text', e.target.value)} placeholder="پاشو پسر، وقتشه روی پروژه هُما کار کنی." className="w-full min-h-24 mt-1 p-3 rounded-xl bg-accent outline-none text-sm resize-none" />
                <p className="text-[10px] text-muted-foreground mt-1">این متن همراه آلارم ذخیره می‌شود. اگر خالی باشد، از «متن یادآوری» یا «عنوان» استفاده می‌شود. هیچ متن ساختگی اضافه نمی‌شود.</p>
              </div>
              <button onClick={testVoice} className="w-full h-10 rounded-xl bg-accent text-sm font-medium flex items-center justify-center gap-2"><Volume2 size={16} /> ▶ تست صدای هُما</button>
              <button onClick={testAlarm} className="w-full h-10 rounded-xl bg-primary/10 text-sm font-medium flex items-center justify-center gap-2"><Bell size={16} /> 🔔 تست کامل آلارم</button>
              <p className="text-[10px] text-muted-foreground">تست کامل: زنگ → تمام صفحه → خاموش کردن → صدای هُما → بستن</p>
            </>
          )}
        </div>

        {/* Snooze */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('snooze') || 'Snooze'}</span>
            <button onClick={() => set('snooze_enabled', !form.snooze_enabled)} className={`w-12 h-7 rounded-full transition-colors ${form.snooze_enabled ? 'bg-primary' : 'bg-accent'}`}>
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${form.snooze_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          {form.snooze_enabled && (
            <div className="flex flex-wrap gap-2">
              {[5, 10, 15, 30, 60].map((m) => (
                <button key={m} onClick={() => set('snooze_duration', m)} className={`px-3 h-9 rounded-xl text-xs font-medium transition-colors ${form.snooze_duration === m ? 'bg-primary text-primary-foreground' : 'bg-accent text-foreground'}`}>{m} {t('min') || 'دقیقه'}</button>
              ))}
            </div>
          )}
          {form.snooze_enabled && (
            <div>
              <label className="text-xs text-muted-foreground">{t('snooze_max') || 'حداکثر Snooze'}: {form.snooze_max_count}</label>
              <input type="range" min="1" max="10" value={form.snooze_max_count} onChange={(e) => set('snooze_max_count', Number(e.target.value))} className="w-full mt-1" />
            </div>
          )}
        </div>

        {/* Wake-up mode */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">🌅 {t('wake_up_mode') || 'حالت بیداری'}</span>
              <p className="text-xs text-muted-foreground mt-0.5">{t('wake_up_desc') || 'آلارم بلندتر، تمام صفحه و پیام انگیزشی'}</p>
            </div>
            <button onClick={() => set('wake_up_mode', !form.wake_up_mode)} className={`w-12 h-7 rounded-full transition-colors ${form.wake_up_mode ? 'bg-primary' : 'bg-accent'}`}>
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${form.wake_up_mode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="p-4 border-t border-border pb-[env(safe-area-inset-bottom)]">
        <button onClick={handleSave} disabled={saving || !form.title.trim()} className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-all">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} {t('save_alarm') || 'ذخیره آلارم'}
        </button>
      </div>
    </div>
  );
}