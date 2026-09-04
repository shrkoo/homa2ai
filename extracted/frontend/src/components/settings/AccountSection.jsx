import React from 'react';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import SettingsSection from './SettingsSection';

export default function AccountSection() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const initial = (user?.full_name || user?.email || '?').charAt(0).toUpperCase();

  return (
    <SettingsSection title={t('account')} icon={User}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{user?.full_name || t('untitled')}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
      </div>
      <button
        onClick={() => logout(true)}
        className="mt-3 w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
      >
        <LogOut size={16} /> {t('logout')}
      </button>
    </SettingsSection>
  );
}