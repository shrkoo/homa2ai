import React, { useState } from 'react';
import { Shield, Trash2, Loader2, ChevronDown } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { dataAdapter } from '@/lib/adapters';
import { toast } from '@/components/ui/use-toast';
import SettingsSection from './SettingsSection';

export default function PrivacySection() {
  const { t } = useI18n();
  const [busy, setBusy] = useState(null);
  const [open, setOpen] = useState(false);

  const clearChats = async () => {
    if (!confirm(t('delete_data_confirm'))) return;
    setBusy('chats');
    try {
      await dataAdapter.deleteMany('Message', {});
      await dataAdapter.deleteMany('Conversation', {});
      toast({ title: t('data_cleared') });
    } catch {
      toast({ title: t('error_occurred') });
    }
    setBusy(null);
  };

  const clearSaved = async () => {
    if (!confirm(t('delete_data_confirm'))) return;
    setBusy('saved');
    try {
      await dataAdapter.deleteMany('LibraryItem', {});
      toast({ title: t('data_cleared') });
    } catch {
      toast({ title: t('error_occurred') });
    }
    setBusy(null);
  };

  return (
    <SettingsSection title={t('privacy')} icon={Shield}>
      <p className="text-xs text-muted-foreground mb-3">{t('privacy_intro')}</p>
      <button
        onClick={clearChats}
        disabled={!!busy}
        className="w-full flex items-center gap-2 h-10 px-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 disabled:opacity-50 transition-colors"
      >
        {busy === 'chats' ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} {t('clear_chats')}
      </button>
      <button
        onClick={clearSaved}
        disabled={!!busy}
        className="mt-2 w-full flex items-center gap-2 h-10 px-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 disabled:opacity-50 transition-colors"
      >
        {busy === 'saved' ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} {t('clear_saved')}
      </button>
      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-3 w-full flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        {t('privacy_policy')}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="mt-2 text-xs text-muted-foreground leading-6">{t('privacy_policy_text')}</p>}
    </SettingsSection>
  );
}