import React from 'react';
import { Volume2, Play } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { usePref } from '@/hooks/usePref';
import SettingsSection from './SettingsSection';
import ToggleRow from './ToggleRow';

const VOICES = [
  { id: 'female', key: 'tts_voice_female' },
  { id: 'male', key: 'tts_voice_male' }
];
const SPEEDS = [
  { id: 0.75, key: 'tts_speed_slow' },
  { id: 1, key: 'tts_speed_normal' },
  { id: 1.25, key: 'tts_speed_fast' },
  { id: 1.5, key: 'tts_speed_faster' }
];

export default function VoiceSection() {
  const { t } = useI18n();
  const [enabled, setEnabled] = usePref('homa_tts_enabled', true);
  const [voice, setVoice] = usePref('homa_tts_voice', 'female');
  const [speed, setSpeed] = usePref('homa_tts_speed', 1);
  const [autoplay, setAutoplay] = usePref('homa_tts_autoplay', false);

  const test = () => {
    try {
      const text = 'سلام، من هُما هستم. این یک تست صدا است.';
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'fa-IR';
      u.rate = speed;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {}
  };

  return (
    <SettingsSection title={t('tts_voice_settings')} icon={Volume2}>
      <ToggleRow label={t('tts_enabled')} checked={enabled} onChange={setEnabled} />
      <div className="h-px bg-border my-2" />
      <p className="text-xs font-semibold text-muted-foreground mb-2">{t('tts_voice')}</p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {VOICES.map((v) => (
          <button
            key={v.id}
            onClick={() => setVoice(v.id)}
            className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${voice === v.id ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}
          >
            {t(v.key)}
          </button>
        ))}
      </div>
      <p className="text-xs font-semibold text-muted-foreground mb-2">{t('tts_speed')}</p>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {SPEEDS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSpeed(s.id)}
            className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${speed === s.id ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}
          >
            {t(s.key)}
          </button>
        ))}
      </div>
      <div className="h-px bg-border my-2" />
      <ToggleRow label={t('tts_autoplay')} desc={t('tts_autoplay_desc')} checked={autoplay} onChange={setAutoplay} />
      <button
        onClick={test}
        className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-accent text-sm font-medium hover:bg-accent/70 transition-colors mt-2"
      >
        <Play size={15} /> {t('test_voice')}
      </button>
    </SettingsSection>
  );
}