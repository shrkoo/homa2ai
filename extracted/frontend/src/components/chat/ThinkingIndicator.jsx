import React from 'react';
import HomaOrb from '@/components/HomaOrb';
import { useI18n } from '@/i18n/I18nContext';

export default function ThinkingIndicator() {
  const { t } = useI18n();
  return (
    <div className="relative flex items-center gap-3 rounded-[1.75rem] rounded-es-xl bg-white/[0.06] border border-white/[0.1] p-3.5 pe-5 backdrop-blur-md shadow-premium w-fit overflow-hidden">
      {/* subtle shimmer sweep */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
          style={{ animation: 'shimmerLine 2.4s ease-in-out infinite' }}
        />
      </div>
      <div style={{ animation: 'orbBreath 2s ease-in-out infinite' }}>
        <HomaOrb size={28} state="processing" />
      </div>
      <div className="flex items-center gap-2.5 relative">
        <span className="text-[13px] text-muted-foreground font-medium tracking-tight">{t('thinking')}</span>
        <div className="flex items-center gap-[3px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-[3px] h-[3px] rounded-full bg-primary"
              style={{
                animation: 'thinkingDot 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.18}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}