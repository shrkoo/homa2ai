import React from 'react';
import { Sun, Moon, Monitor, Palette } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTheme } from '@/context/ThemeContext';
import SettingsSection from './SettingsSection';

export default function AppearanceSection() {
  const { t } = useI18n();
  const { mode, setMode, colorTheme, setColorTheme, textSize, setTextSize, colorThemes } = useTheme();

  return (
    <SettingsSection title={t('appearance')} icon={Palette}>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { id: 'light', icon: Sun, label: t('light') },
          { id: 'dark', icon: Moon, label: t('dark') },
          { id: 'system', icon: Monitor, label: t('system') }
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all ${mode === m.id ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}
          >
            <m.icon size={18} /> {m.label}
          </button>
        ))}
      </div>
      <p className="text-xs font-semibold text-muted-foreground mb-2">{t('accent_color')}</p>
      <div className="flex gap-2.5 mb-4">
        {colorThemes.map((c) => (
          <button
            key={c.id}
            onClick={() => setColorTheme(c.id)}
            className={`w-9 h-9 rounded-full transition-all ${colorTheme === c.id ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground' : ''}`}
            style={{ background: `hsl(${c.primary})` }}
          />
        ))}
      </div>
      <p className="text-xs font-semibold text-muted-foreground mb-2">{t('text_size')}</p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { id: 'small', label: t('small') },
          { id: 'medium', label: t('medium') },
          { id: 'large', label: t('large') }
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setTextSize(s.id)}
            className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${textSize === s.id ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </SettingsSection>
  );
}