import React from 'react';
import { useI18n } from '@/i18n/I18nContext';
import PageHeader from '@/components/PageHeader';
import TextCounter from '@/components/studio/TextCounter';
import TitleChecker from '@/components/studio/TitleChecker';
import AspectRatioCalc from '@/components/studio/AspectRatioCalc';
import DurationCalc from '@/components/studio/DurationCalc';
import ScriptProgress from '@/components/studio/ScriptProgress';

const TOOLS = [
  { key: 'studio_text_counter', Comp: TextCounter },
  { key: 'studio_title_checker', Comp: TitleChecker },
  { key: 'studio_aspect_ratio', Comp: AspectRatioCalc },
  { key: 'studio_duration', Comp: DurationCalc },
  { key: 'studio_script_progress', Comp: ScriptProgress }
];

export default function Studio() {
  const { t } = useI18n();
  return (
    <div className="min-h-dvh">
      <PageHeader title={t('studio')} />
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        <p className="text-sm text-muted-foreground">{t('studio_desc')}</p>
        {TOOLS.map(({ key, Comp }) => (
          <div key={key} className="rounded-2xl border border-border bg-card p-4">
            <h2 className="font-semibold text-sm mb-3">{t(key)}</h2>
            <Comp />
          </div>
        ))}
      </div>
    </div>
  );
}