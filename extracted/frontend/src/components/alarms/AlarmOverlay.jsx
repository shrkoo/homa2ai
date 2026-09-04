import React, { useState, useEffect } from 'react';
import { X, Clock, Bell, Check, Volume2, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { playAlarmSound, stopAlarmSound, vibrateDevice } from '@/utils/alarmSound';
import { speakHomaReminder, stopSpeech, isSpeechSupported, VOICE_ERROR_MESSAGES } from '@/utils/speak';
import { history } from '@/lib/alarmStore';
import { toast } from '@/components/ui/use-toast';

function stopVibration() {
  try { if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(0); } catch {}
}

export default function AlarmOverlay({ entry, onDismiss, onSnooze, onComplete }) {
  const { t, language } = useI18n();
  const [stopFn, setStopFn] = useState(null);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [voiceText, setVoiceText] = useState('');

  const isAlarm = entry.type === 'alarm';
  const data = entry.data;

  // Voice text: voiceText → message → title (no synthetic/fixed text)
  const getVoiceText = () => {
    const text =
      (data.voice_text || '').trim() ||
      (data.message || '').trim() ||
      (data.voice_message || '').trim() ||
      (data.title || '').trim();
    return text;
  };

  // Play alarm sound on mount
  useEffect(() => {
    if (isAlarm) {
      if (data.sound_enabled !== false) {
        const gradual = data.alarm_intensity === 'gradual';
        const loud = data.alarm_intensity === 'loud';
        const vol = loud ? 100 : data.volume || 70;
        const stop = playAlarmSound(data.sound || 'classic', vol, gradual);
        setStopFn(() => stop);
      }
      if (data.vibrate) vibrateDevice([300, 100, 300, 100, 300]);
    } else {
      // Reminder — gentle notification
      const stop = playAlarmSound('chime', 60, false);
      setStopFn(() => stop);
    }
    return () => { stopAlarmSound(); stopVibration(); stopSpeech(); };
  }, []);

  const stopAllSound = () => {
    stopAlarmSound();
    if (stopFn) stopFn();
    stopVibration();
  };

  // Play the Homa voice reminder (after alarm sound is stopped). Resolves when TTS ends.
  const playVoice = async () => {
    const text = getVoiceText();
    console.log('[HOMA VOICE] playVoice', {
      voiceEnabled: data.voice_enabled,
      voiceText: data.voice_text,
      message: data.message,
      title: data.title,
      selectedText: text?.slice(0, 100),
      speechSynthesisAvailable: isSpeechSupported(),
    });
    if (!text) {
      console.log('[HOMA VOICE] fallback — no voiceText/message/title, skipping TTS');
      toast({ title: 'متن صوتی خالی است — چیزی برای گفتن نیست' });
      return false;
    }
    setVoicePlaying(true);
    setVoiceText(text);
    const result = await speakHomaReminder(text, language);
    console.log('[HOMA VOICE] speech ended', result);
    setVoicePlaying(false);
    if (!result.ok) {
      toast({ title: VOICE_ERROR_MESSAGES[result.error] || 'خطا در پخش صدای هُما', duration: 6000 });
    }
    history.create({
      alarm_id: isAlarm ? data.id : '',
      reminder_id: isAlarm ? '' : data.id,
      entry_type: isAlarm ? 'alarm' : 'reminder',
      title: data.title,
      action: result.ok ? 'voice_played' : 'failed',
      triggered_at: new Date().toISOString(),
      voice_played: result.ok,
    }).catch(() => {});
    return result.ok;
  };

  // Dismiss: stop sound + vibration → speak voice reminder → close overlay
  const handleDismiss = async () => {
    stopAllSound();
    if (isAlarm && data.voice_enabled) {
      await playVoice();
      onDismiss(entry);
    } else {
      onDismiss(entry);
    }
  };

  const handleComplete = () => {
    stopAllSound();
    onComplete(entry);
  };

  const handleSnooze = () => {
    stopAllSound();
    const mins = data.snooze_duration || 10;
    onSnooze(entry, mins);
  };

  const formatTime = () => {
    if (isAlarm) {
      return String(data.hour).padStart(2, '0') + ':' + String(data.minute).padStart(2, '0') + ':' + String(data.second || 0).padStart(2, '0');
    }
    const d = new Date(data.remind_at);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-between p-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Header */}
      <div className="w-full flex items-center justify-center gap-2 pt-8">
        <div className="w-16 h-16 rounded-full bg-primary/15 text-primary flex items-center justify-center animate-pulse">
          {isAlarm ? <Bell size={32} /> : <Clock size={32} />}
        </div>
      </div>

      {/* Time + title */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-6xl font-bold font-heading tabular-nums">{formatTime()}</div>
        <div className="text-xl font-semibold">{data.title}</div>
        {data.message && <div className="text-sm text-muted-foreground max-w-xs">{data.message}</div>}
        {!data.message && data.description && <div className="text-sm text-muted-foreground max-w-xs">{data.description}</div>}
        {data.reason && (
          <div className="text-xs text-muted-foreground bg-accent rounded-xl px-3 py-1.5 max-w-xs">
            {t('reason') || 'دلیل'}: {data.reason}
          </div>
        )}
      </div>

      {/* Voice section */}
      {voicePlaying && (
        <div className="w-full max-w-sm rounded-2xl bg-accent p-4 flex items-center gap-3">
          <Loader2 size={18} className="animate-spin text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground">هُما در حال صحبت کردن...</p>
            <p className="text-sm mt-0.5 line-clamp-2">{voiceText}</p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="w-full max-w-sm space-y-3 pb-8">
        {isAlarm && data.voice_enabled && !voicePlaying && (
          <button onClick={playVoice} className="w-full h-12 rounded-2xl border border-border bg-accent text-foreground font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
            <Volume2 size={18} /> {t('test_voice') || 'تست صدای هُما'}
          </button>
        )}
        <div className="grid grid-cols-2 gap-3">
          {isAlarm && data.snooze_enabled && (data.snooze_count || 0) < (data.snooze_max_count || 3) && (
            <button onClick={handleSnooze} className="h-14 rounded-2xl border border-border bg-accent text-foreground font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
              <Clock size={18} /> {t('snooze') || 'Snooze'} ({data.snooze_duration || 10}')
            </button>
          )}
          <button onClick={handleDismiss} className="h-14 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all col-span-2">
            <X size={20} /> {t('dismiss_alarm') || 'خاموش کردن'}
          </button>
          <button onClick={handleComplete} className="h-14 rounded-2xl bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all col-span-2">
            <Check size={20} /> {t('complete') || 'انجام شد'}
          </button>
        </div>
      </div>
    </div>
  );
}