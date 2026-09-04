import React, { useState } from 'react';
import { Shield, KeyRound, Trash2, Loader2, Mail } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { dataAdapter, authAdapter } from '@/lib/adapters';
import { toast } from '@/components/ui/use-toast';
import SettingsSection from './SettingsSection';

export default function SecuritySection() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const changePassword = async () => {
    if (!user?.email) return;
    setSending(true);
    try {
      await authAdapter.resetPasswordRequest(user.email);
      toast({ title: t('auth_reset_sent') });
    } catch {
      toast({ title: t('error_occurred') });
    }
    setSending(false);
  };

  const deleteAccount = async () => {
    if (!confirm(t('delete_account_warning'))) return;
    setDeleting(true);
    try {
      await dataAdapter.deleteMany('Message', {});
      await dataAdapter.deleteMany('Conversation', {});
      await dataAdapter.deleteMany('LibraryItem', {});
      toast({ title: t('data_cleared') });
    } catch {
      toast({ title: t('error_occurred') });
    }
    setDeleting(false);
  };

  return (
    <SettingsSection title={t('security')} icon={Shield}>
      <div className="flex items-center gap-2 text-sm mb-3 min-w-0">
        <Mail size={15} className="text-muted-foreground shrink-0" />
        <span className="truncate">{user?.email}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{t('change_password_desc')}</p>
      <button
        onClick={changePassword}
        disabled={sending}
        className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-accent text-sm font-medium hover:bg-accent/70 disabled:opacity-50 transition-colors"
      >
        {sending ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />} {t('change_password')}
      </button>
      <button
        onClick={deleteAccount}
        disabled={deleting}
        className="mt-2 w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 disabled:opacity-50 transition-colors"
      >
        {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} {t('delete_account')}
      </button>
      <p className="mt-2 text-[11px] text-muted-foreground leading-5">{t('delete_account_data_note')}</p>
    </SettingsSection>
  );
}