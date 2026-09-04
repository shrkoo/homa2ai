import React from 'react';
import { useI18n } from '@/i18n/I18nContext';
import TemplatesPicker from '@/components/TemplatesPicker';

export default function ChatEmpty({ temporary, setInput, setMode }) {
  const { t } = useI18n();
  if (temporary) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-heading text-2xl font-bold">{t('temp_chat')}</h1>
        <p className="text-muted-foreground text-sm leading-7 mt-3 max-w-xs">{t('temp_chat_desc')}</p>
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 px-6 overflow-y-auto py-6">
      <TemplatesPicker onPick={(body) => setInput(body)} />
    </div>
  );
}