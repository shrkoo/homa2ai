import React, { useState, useEffect } from 'react';
import { Brain, Loader2, Check } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { authAdapter } from '@/lib/adapters';
import { toast } from '@/components/ui/use-toast';
import { usePref } from '@/hooks/usePref';
import SettingsSection from './SettingsSection';
import ToggleRow from './ToggleRow';

export default function MemorySection() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const [enabled, setEnabled] = usePref('homa_memory_enabled', true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNote(user?.memory || '');
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      await authAdapter.updateProfile({ memory: note.trim() });
      toast({ title: t('changes_saved') });
    } catch {
      toast({ title: t('error_occurred') });
    }
    setSaving(false);
  };

  return (
    <SettingsSection title={t('memory')} icon={Brain}>
      <ToggleRow label={t('enable_personalization')} checked={enabled} onChange={setEnabled} />
      <p className="text-xs text-muted-foreground mb-2">{t('memory_desc')}</p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        disabled={!enabled}
        rows={3}
        placeholder={t('memory_placeholder')}
        className="w-full rounded-xl border border-input bg-transparent p-3 text-sm outline-none focus:border-primary disabled:opacity-50 resize-none"
      />
      <button
        onClick={save}
        disabled={saving || !enabled}
        className="mt-2 w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 transition-colors"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} {t('save')}
      </button>
    </SettingsSection>
  );
}