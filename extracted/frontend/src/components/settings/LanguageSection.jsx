import React from 'react';
import { Globe } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import SettingsSection from './SettingsSection';

export default function LanguageSection() {
  const { t, language, setLanguage } = useI18n();
  const langs = [
    { id: 'fa', label: 'فارسی' },
    { id: 'ku', label: 'کوردی' },
    { id: 'en', label: 'English' }
  ];
  return (
    <SettingsSection title={t('language')} icon={Globe}>
      <div className="grid grid-cols-3 gap-2">
        {langs.map((l) => (
          <button
            key={l.id}
            onClick={() => setLanguage(l.id)}
            className={`py-3 rounded-xl border text-sm font-medium transition-all ${language === l.id ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}
          >
            {l.label}
          </button>
        ))}
      </div>
    </SettingsSection>
  );
}