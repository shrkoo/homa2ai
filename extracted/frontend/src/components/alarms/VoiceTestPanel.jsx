import React, { useState } from 'react';
import { Volume2, Bell, Loader2, AlertTriangle } from 'lucide-react';
import { speakHomaReminder, isSpeechSupported, VOICE_ERROR_MESSAGES } from '@/utils/speak';
import { isNativeTTSAvailable } from '@/utils/nativeTTS';
import { toast } from '@/components/ui/use-toast';

// Fixed test text for the final Android voice test.
export const TEST_VOICE_TEXT = 'پاشو پسر، وقتشه روی پروژه هُما کار کنی. این یادآوری رو خودت در هُما ثبت کرده بودی.';

function buildTestAlarm() {
  const now = new Date();
  return {
    id: 'test_voice_' + Date.now(),
    title: 'تست هُما',
    hour: now.getHours(),
    minute: now.getMinutes(),
    second: now.getSeconds(),
    sound: 'classic',
    sound_enabled: true,
    volume: 70,
    vibrate: true,
    alarm_intensity: 'normal',
    voice_enabled: true,
    voice_text: TEST_VOICE_TEXT,
    message: '',
    snooze_enabled: false,
    reason: '',
    description: '',
  };
}

export default function VoiceTestPanel() {
  const [testingVoice, setTestingVoice] = useState(false);
  const [browserSupported] = useState(isSpeechSupported());
  const [nativeSupported] = useState(isNativeTTSAvailable());

  const showError = (error) => {
    toast({ title: VOICE_ERROR_MESSAGES[error] || 'خطای ناشناخته در پخش صدا', duration: 6000 });
  };

  // ▶ تست صدای هُما — speaks the test text directly (no alarm), with user-facing errors.
  const handleTestVoice = async () => {
    setTestingVoice(true);
    console.log('[HOMA VOICE] VoiceTestPanel — testVoice', { text: TEST_VOICE_TEXT, native: nativeSupported, browser: browserSupported });
    const result = await speakHomaReminder(TEST_VOICE_TEXT, 'fa');
    setTestingVoice(false);
    if (result.ok) {
      toast({ title: '✅ صدای هُما پخش شد' });
    } else {
      console.log('[HOMA VOICE] testVoice failed', result);
      showError(result.error);
    }
  };

  // 🔔 تست کامل آلارم — triggers the real full-screen overlay with the test alarm.
  const handleFullTest = () => {
    console.log('[HOMA VOICE] VoiceTestPanel — full alarm test', { voice_text: TEST_VOICE_TEXT });
    window.dispatchEvent(new CustomEvent('homa-test-alarm', { detail: { alarm: buildTestAlarm() } }));
  };

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-accent/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center">
          <Volume2 size={16} />
        </div>
        <div>
          <p className="text-sm font-semibold">تست صدای هُما</p>
          <p className="text-[11px] text-muted-foreground">پخش صدا قبل از استفاده واقعی</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 text-[11px] rounded-xl bg-background/60 p-2.5">
        <div className="flex items-center gap-2">
          <span className={nativeSupported ? 'text-emerald-500' : 'text-muted-foreground/50'}>{nativeSupported ? '●' : '○'}</span>
          <span className={nativeSupported ? 'text-foreground' : 'text-muted-foreground'}>صدای نیتیو اندروید: {nativeSupported ? 'فعال' : 'در انتظار bridge'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={browserSupported ? 'text-emerald-500' : 'text-muted-foreground/50'}>{browserSupported ? '●' : '○'}</span>
          <span className={browserSupported ? 'text-foreground' : 'text-muted-foreground'}>صدای مرورگر: {browserSupported ? 'فعال' : 'غیرفعال'}</span>
        </div>
      </div>

      {!nativeSupported && !browserSupported && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400 leading-6">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>در این محیط پخش صدا پشتیبانی نمی‌شود. روی گوشی اندروید با bridge نیتیو کار می‌کند.</span>
        </div>
      )}

      <div className="rounded-xl bg-accent/40 p-3 text-xs text-muted-foreground leading-6">
        <p className="font-medium text-foreground mb-1">متن تست:</p>
        «هُما: {TEST_VOICE_TEXT}»
      </div>

      <button onClick={handleTestVoice} disabled={testingVoice} className="w-full h-11 rounded-xl bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all">
        {testingVoice ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />} تست پخش صدا
      </button>

      <button onClick={handleFullTest} className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm shadow-primary/30">
        <Bell size={16} /> تست کامل آلارم
      </button>

      <p className="text-[10px] text-muted-foreground leading-5 text-center">
        زنگ → تمام صفحه → خاموش → صدای هُما → بستن
      </p>
    </div>
  );
}