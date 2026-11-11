import React from 'react';
import { Button } from '@/components/ui/button';
import GoogleIcon from '@/components/GoogleIcon';
import { useI18n } from '@/i18n/I18nContext';

const BTN_CLASS = "w-full h-12 text-sm font-medium mb-2.5 rounded-full bg-white/[0.08] border border-white/10 hover:bg-white/[0.14] hover:border-white/20 transition-all tap-feedback text-white justify-start px-5";

export default function SocialAuthButtons({ onGoogle }) {
  const { t } = useI18n();
  return (
    <>
      <Button variant="outline" className={BTN_CLASS} onClick={onGoogle}>
        <GoogleIcon className="w-5 h-5 shrink-0" />
        <span className="flex-1 text-center -ml-5">{t("auth_continue_google")}</span>
      </Button>
    </>
  );
}