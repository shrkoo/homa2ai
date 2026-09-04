import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import ReminderForm from '@/components/alarms/ReminderForm';
import { useI18n } from '@/i18n/I18nContext';

export default function QuickReminderButton({ conversationId }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={t('new_reminder') || 'یادآور'}
        className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-chatControl text-chatControl-foreground hover:opacity-80 transition-opacity"
      >
        <Bell size={18} />
      </button>
      <ReminderForm open={open} onClose={() => setOpen(false)} conversationId={conversationId} />
    </>
  );
}