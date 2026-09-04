import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { translations as baseTranslations, LANGUAGES } from './translations';
import { gsTranslations } from './gs-translations';
import { suggestionTranslations } from './suggestion-translations';

const translations = {};
for (const lang of Object.keys(baseTranslations)) {
  translations[lang] = { ...baseTranslations[lang], ...(gsTranslations[lang] || {}), ...(suggestionTranslations[lang] || {}) };
}

const I18nContext = createContext(null);

const STORAGE_KEY = 'hoshiar_lang';

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'fa';
  });

  const dir = LANGUAGES.find((l) => l.code === language)?.dir || 'rtl';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    localStorage.setItem(STORAGE_KEY, language);
  }, [language, dir]);

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback(
    (key) => {
      const dict = translations[language] || translations.fa;
      return dict[key] || translations.fa[key] || key;
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, dir, languages: LANGUAGES }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}